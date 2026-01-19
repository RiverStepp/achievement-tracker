using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;
using System.Linq;

namespace AchievementTracker.Services;

public class ScraperService : IScraperService
{
    private readonly IConfiguration _configuration;
    private readonly string _scriptsDirectory;
    private readonly ConcurrentDictionary<string, Process> _runningProcesses = new();
    private readonly ILogger<ScraperService> _logger;

    public ScraperService(IConfiguration configuration, ILogger<ScraperService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        // Get scripts directory path (relative to backend directory)
        // Try multiple path patterns to find the scripts directory
        var backendDirectory = AppContext.BaseDirectory;

        // Try different path patterns
        var possiblePaths = new[]
        {
            // Pattern 1: From bin\Debug\net8.0, go up 5 levels (achievement-tracker\scripts)
            Path.GetFullPath(Path.Combine(backendDirectory, "..", "..", "..", "..", "..", "scripts")),
            // Pattern 2: From bin\Debug\net8.0, go up 4 levels then into achievement-tracker\scripts
            Path.GetFullPath(Path.Combine(backendDirectory, "..", "..", "..", "..", "achievement-tracker", "scripts")),
            // Pattern 3: Direct from solution root (if running from project root)
            Path.Combine(Path.GetDirectoryName(backendDirectory) ?? "", "..", "..", "..", "achievement-tracker", "scripts"),
        };

        // Find the first path that actually exists
        _scriptsDirectory = possiblePaths.FirstOrDefault(Directory.Exists)
            ?? possiblePaths[0]; // Fallback to first pattern if none exist (will error later with better message)
    }

    public async Task<ScrapeResult> ScrapeUserAsync(string steamIdOrUsername)
    {
        try
        {
            var nodeExe = FindNodeExecutable();
            if (nodeExe == null)
            {
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = "Node.js not found. Please ensure Node.js is installed and in PATH."
                };
            }

            if (!Directory.Exists(_scriptsDirectory))
            {
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = $"Scripts directory not found: {_scriptsDirectory}. Please ensure the scripts folder exists at: achievement-tracker/scripts"
                };
            }

            // Find npx or ts-node executable
            var (executable, arguments) = FindTsNodeExecutable(_scriptsDirectory, nodeExe, steamIdOrUsername);

            if (executable == null)
            {
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = "ts-node not found. Please ensure dependencies are installed (npm install) in the scripts directory."
                };
            }

            // ProcessStartInfo can execute .cmd files directly when UseShellExecute = false
            // It also handles paths with spaces automatically, so no need to quote
            string finalExecutable = executable;
            string finalArguments = arguments;

            // Use npx or ts-node to run the script
            var processStartInfo = new ProcessStartInfo
            {
                FileName = finalExecutable,
                Arguments = finalArguments,
                WorkingDirectory = _scriptsDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // Set environment variables (must be done before setting the environment collection)
            processStartInfo.Environment["KEY_VAULT_URI"] = Environment.GetEnvironmentVariable("KEY_VAULT_URI")
                ?? _configuration["KeyVault:VaultUri"]
                ?? throw new InvalidOperationException("Key Vault URI not configured");

            // Set tracking API URL if configured
            var trackingApiUrl = _configuration["Tracking:ApiUrl"] 
                ?? Environment.GetEnvironmentVariable("TRACKING_API_URL");
            if (!string.IsNullOrWhiteSpace(trackingApiUrl))
            {
                processStartInfo.Environment["TRACKING_API_URL"] = trackingApiUrl;
            }

            var process = Process.Start(processStartInfo);
            if (process == null)
            {
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = "Failed to start scraper process"
                };
            }

            // Track the process for cancellation
            var processId = process.Id.ToString();
            _runningProcesses.TryAdd(processId, process);

            // Clean up when process exits
            process.Exited += (sender, e) =>
            {
                _runningProcesses.TryRemove(processId, out _);
            };

            var output = new StringBuilder();
            var errorOutput = new StringBuilder();

            process.OutputDataReceived += (sender, e) =>
            {
                if (e.Data != null)
                {
                    output.AppendLine(e.Data);
                }
            };

            process.ErrorDataReceived += (sender, e) =>
            {
                if (e.Data != null)
                {
                    errorOutput.AppendLine(e.Data);
                }
            };

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

            // Remove from tracking
            _runningProcesses.TryRemove(processId, out _);

            if (process.ExitCode == 0)
            {
                // Parse output to extract Steam ID and username
                // The script outputs formats like:
                //   "User: {username} ({steamId})"
                //   "Found user: {username} ({steamId})"
                var outputText = output.ToString();

                // Try to match "User: username (steamId)" pattern
                var userMatch = System.Text.RegularExpressions.Regex.Match(
                    outputText,
                    @"(?:User|Found user):\s*([^(]+?)\s*\((\d+)\)",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase
                );

                if (userMatch.Success)
                {
                    return new ScrapeResult
                    {
                        Success = true,
                        Username = userMatch.Groups[1].Value.Trim(),
                        SteamId = userMatch.Groups[2].Value
                    };
                }

                // If we can't parse the output but exit code is 0, still report success
                // The user might already be in the database or the script completed successfully
                return new ScrapeResult
                {
                    Success = true,
                    Username = null,
                    SteamId = null
                };
            }
            else
            {
                var errorText = errorOutput.ToString();
                var outputText = output.ToString();

                // Try to extract a more user-friendly error message
                string userFriendlyError = errorText;
                if (errorText.Contains("Login failed"))
                {
                    userFriendlyError = "Database connection failed. Please verify the connection string in Azure Key Vault (ConnectionStrings--DefaultConnection) uses SQL Authentication (not Windows Authentication) and has the correct password.";
                }
                else if (errorText.Contains("Cannot find module"))
                {
                    userFriendlyError = "Missing dependencies. Please run 'npm install' in the scripts directory.";
                }
                else if (errorText.Contains("Cannot compile TypeScript"))
                {
                    userFriendlyError = "TypeScript compilation failed. Please check the scripts for errors or run 'npm install' in the scripts directory.";
                }

                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = userFriendlyError
                };
            }
        }
        catch (Exception ex)
        {
            return new ScrapeResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private string? FindNodeExecutable()
    {
        var nodeExe = "node";
        var nodePath = Environment.GetEnvironmentVariable("PATH");

        if (nodePath != null)
        {
            var paths = nodePath.Split(Path.PathSeparator);
            foreach (var path in paths)
            {
                var fullPath = Path.Combine(path, nodeExe + ".exe");
                if (File.Exists(fullPath))
                {
                    return fullPath;
                }
            }
        }

        // Try common locations
        var commonLocations = new[]
        {
            @"C:\Program Files\nodejs\node.exe",
            @"C:\Program Files (x86)\nodejs\node.exe"
        };

        foreach (var location in commonLocations)
        {
            if (File.Exists(location))
            {
                return location;
            }
        }

        return null;
    }

    private (string? executable, string arguments) FindTsNodeExecutable(string scriptsDirectory, string nodeExe, string steamIdOrUsername)
    {
        var scriptArgs = $@"src\testScraper.ts ""{steamIdOrUsername}""";

        // Try to find npx first (most reliable)
        var nodeDir = Path.GetDirectoryName(nodeExe);
        if (nodeDir != null)
        {
            var npxPath = Path.Combine(nodeDir, "npx.cmd");
            if (File.Exists(npxPath))
            {
                return (npxPath, $"ts-node {scriptArgs}");
            }

            npxPath = Path.Combine(nodeDir, "npx.exe");
            if (File.Exists(npxPath))
            {
                return (npxPath, $"ts-node {scriptArgs}");
            }
        }

        // Check PATH for npx
        var pathEnv = Environment.GetEnvironmentVariable("PATH");
        if (pathEnv != null)
        {
            var paths = pathEnv.Split(Path.PathSeparator);
            foreach (var path in paths)
            {
                var npxCmd = Path.Combine(path, "npx.cmd");
                if (File.Exists(npxCmd))
                {
                    return (npxCmd, $"ts-node {scriptArgs}");
                }

                var npxExePath = Path.Combine(path, "npx.exe");
                if (File.Exists(npxExePath))
                {
                    return (npxExePath, $"ts-node {scriptArgs}");
                }
            }
        }

        // Try to find ts-node in node_modules
        var tsNodeCmd = Path.Combine(scriptsDirectory, "node_modules", ".bin", "ts-node.cmd");
        if (File.Exists(tsNodeCmd))
        {
            return (tsNodeCmd, scriptArgs);
        }

        var tsNodeExe = Path.Combine(scriptsDirectory, "node_modules", ".bin", "ts-node.exe");
        if (File.Exists(tsNodeExe))
        {
            return (tsNodeExe, scriptArgs);
        }

        // Try using node to run ts-node directly from node_modules
        var tsNodeJs = Path.Combine(scriptsDirectory, "node_modules", "ts-node", "dist", "bin.js");
        if (File.Exists(tsNodeJs))
        {
            return (nodeExe, $@"""{tsNodeJs}"" {scriptArgs}");
        }

        return (null, string.Empty);
    }

    public bool CancelScraping(string? processId = null)
    {
        if (string.IsNullOrWhiteSpace(processId))
        {
            // Cancel all running processes
            var cancelled = false;
            foreach (var kvp in _runningProcesses.ToArray())
            {
                try
                {
                    if (!kvp.Value.HasExited)
                    {
                        kvp.Value.Kill();
                        cancelled = true;
                        _logger.LogInformation("Cancelled scraping process {ProcessId}", kvp.Key);
                    }
                    _runningProcesses.TryRemove(kvp.Key, out _);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error cancelling process {ProcessId}", kvp.Key);
                }
            }
            return cancelled;
        }
        else
        {
            // Cancel specific process
            if (_runningProcesses.TryGetValue(processId, out var process))
            {
                try
                {
                    if (!process.HasExited)
                    {
                        process.Kill();
                        _logger.LogInformation("Cancelled scraping process {ProcessId}", processId);
                        return true;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error cancelling process {ProcessId}", processId);
                }
                finally
                {
                    _runningProcesses.TryRemove(processId, out _);
                }
            }
            return false;
        }
    }

    public int GetRunningProcessCount()
    {
        // Clean up exited processes
        var toRemove = _runningProcesses
            .Where(kvp => kvp.Value.HasExited)
            .Select(kvp => kvp.Key)
            .ToList();
        
        foreach (var key in toRemove)
        {
            _runningProcesses.TryRemove(key, out _);
        }

        return _runningProcesses.Count;
    }
}

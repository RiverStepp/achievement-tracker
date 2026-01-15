using System.Diagnostics;
using System.Text;
using System.Linq;

namespace AchievementTracker.Services;

public class ScraperService : IScraperService
{
    private readonly ILogger<ScraperService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _scriptsDirectory;

    public ScraperService(ILogger<ScraperService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

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
            _logger.LogInformation("Starting scraper for user: {SteamIdOrUsername}", steamIdOrUsername);
            _logger.LogInformation("Scripts directory: {ScriptsDirectory}", _scriptsDirectory);

            var nodeExe = FindNodeExecutable();
            if (nodeExe == null)
            {
                _logger.LogError("Node.js executable not found");
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = "Node.js not found. Please ensure Node.js is installed and in PATH."
                };
            }
            _logger.LogInformation("Found Node.js at: {NodeExe}", nodeExe);

            if (!Directory.Exists(_scriptsDirectory))
            {
                _logger.LogError("Scripts directory not found: {ScriptsDirectory}", _scriptsDirectory);
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
                _logger.LogError("ts-node executable not found in scripts directory: {ScriptsDirectory}", _scriptsDirectory);
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = "ts-node not found. Please ensure dependencies are installed (npm install) in the scripts directory."
                };
            }

            _logger.LogInformation("Using executable: {Executable} with arguments: {Arguments}", executable, arguments);

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

            using var process = Process.Start(processStartInfo);
            if (process == null)
            {
                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = "Failed to start scraper process"
                };
            }

            var output = new StringBuilder();
            var errorOutput = new StringBuilder();

            process.OutputDataReceived += (sender, e) =>
            {
                if (e.Data != null)
                {
                    output.AppendLine(e.Data);
                    _logger.LogInformation("Scraper output: {Output}", e.Data);
                }
            };

            process.ErrorDataReceived += (sender, e) =>
            {
                if (e.Data != null)
                {
                    errorOutput.AppendLine(e.Data);
                    _logger.LogWarning("Scraper error: {Error}", e.Data);
                }
            };

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

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
                _logger.LogWarning("Could not parse user information from scraper output, but process exited successfully");
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
                _logger.LogError("Scraper process failed with exit code {ExitCode}. Error output: {ErrorOutput}. Standard output: {Output}",
                    process.ExitCode, errorText, outputText);

                return new ScrapeResult
                {
                    Success = false,
                    ErrorMessage = $"Scraper process exited with code {process.ExitCode}. {errorText}"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running scraper");
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
}

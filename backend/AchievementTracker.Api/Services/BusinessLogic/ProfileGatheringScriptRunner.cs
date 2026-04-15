using System.Diagnostics;
using System.Text.RegularExpressions;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Models.Results;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class ProfileGatheringScriptRunner(
     IConfiguration configuration,
     IHostEnvironment hostEnvironment,
     IOptions<ProfileGatheringScriptOptions> options,
     ILogger<ProfileGatheringScriptRunner> logger
): IProfileGatheringScriptRunner
{
     private readonly IConfiguration _configuration = configuration;
     private readonly IHostEnvironment _hostEnvironment = hostEnvironment;
     private readonly IOptions<ProfileGatheringScriptOptions> _options = options;
     private readonly ILogger<ProfileGatheringScriptRunner> _logger = logger;

     private static readonly Regex s_steamId17 = new(
          "^[0-9]{17}$",
          RegexOptions.CultureInvariant | RegexOptions.Compiled
     );

     public void ScheduleFirstTimeProfileGather(string canonicalSteamId)
     {
          _ = RunFirstTimeSafelyAsync(canonicalSteamId);
     }

     public async Task RunUpdatesOnlyAsync(string canonicalSteamId, CancellationToken ct)
     {
          ValidateSteamId17(canonicalSteamId);
          using var timeoutCts = new CancellationTokenSource(
               TimeSpan.FromMinutes(_options.Value.ProcessTimeoutMinutes)
          );
          using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(
               ct,
               timeoutCts.Token
          );
          await RunScriptCoreAsync(canonicalSteamId, incrementalAchievementsOnly: true, linked.Token);
     }

     public async Task<ScraperInvokeResult> RunDevelopmentScrapeAsync(
          string steamIdOrUsername,
          CancellationToken ct
     )
     {
          if (string.IsNullOrWhiteSpace(steamIdOrUsername) || steamIdOrUsername.Length > 128)
               return new ScraperInvokeResult(false, "Invalid steamIdOrUsername.", null);

          string trimmed = steamIdOrUsername.Trim();
          try
          {
               using var timeoutCts = new CancellationTokenSource(
                    TimeSpan.FromMinutes(_options.Value.ProcessTimeoutMinutes)
               );
               using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(
                    ct,
                    timeoutCts.Token
               );
               await RunScriptCoreAsync(trimmed, incrementalAchievementsOnly: false, linked.Token);
               return new ScraperInvokeResult(true, null, trimmed);
          }
          catch (Exception ex)
          {
               _logger.LogError(ex, "Development scrape failed for {Target}", trimmed);
               return new ScraperInvokeResult(false, ex.Message, trimmed);
          }
     }

     private async Task RunFirstTimeSafelyAsync(string canonicalSteamId)
     {
          try
          {
               ValidateSteamId17(canonicalSteamId);
               using var cts = new CancellationTokenSource(
                    TimeSpan.FromMinutes(_options.Value.ProcessTimeoutMinutes)
               );
               await RunScriptCoreAsync(canonicalSteamId, incrementalAchievementsOnly: false, cts.Token);
          }
          catch (Exception ex)
          {
               _logger.LogError(ex, "First-time profile script failed for SteamId={SteamId}", canonicalSteamId);
          }
     }

     private static void ValidateSteamId17(string canonicalSteamId)
     {
          if (string.IsNullOrWhiteSpace(canonicalSteamId) || !s_steamId17.IsMatch(canonicalSteamId))
               throw new ArgumentException("Invalid Steam ID.", nameof(canonicalSteamId));
     }

     private async Task RunScriptCoreAsync(
          string steamIdOrUsernameArgument,
          bool incrementalAchievementsOnly,
          CancellationToken ct
     )
     {
          ProfileGatheringScriptOptions opt = _options.Value;
          string scriptsRoot = Path.GetFullPath(
               Path.Combine(_hostEnvironment.ContentRootPath, opt.ScriptsDirectoryRelativePath)
          );
          string entryRelative = opt.EntryScriptRelativePath.Replace('\\', '/');

          if (!Directory.Exists(scriptsRoot))
          {
               _logger.LogError("Scripts directory not found at {Path}", scriptsRoot);
               throw new DirectoryNotFoundException($"Scripts directory not found: {scriptsRoot}");
          }

          string entryPath = Path.Combine(scriptsRoot, opt.EntryScriptRelativePath);
          if (!File.Exists(entryPath))
          {
               _logger.LogError("Profile script entry missing at {Path}", entryPath);
               throw new FileNotFoundException("Profile gathering script entry is missing.");
          }

          string? dbUser = _configuration["DbConnection:DbUser"];
          string? dbPassword = _configuration["DbConnection:DbPassword"];
          string? dbHost = _configuration["DbConnection:DbHost"];
          string? dbName = _configuration["DbConnection:DbName"];
          string? steamApiKey = _configuration["Authentication:Steam:ApiKey"];

          if (string.IsNullOrWhiteSpace(dbUser)
              || string.IsNullOrWhiteSpace(dbPassword)
              || string.IsNullOrWhiteSpace(dbHost)
              || string.IsNullOrWhiteSpace(dbName)
              || string.IsNullOrWhiteSpace(steamApiKey))
          {
               throw new InvalidOperationException(
                    "Profile script requires DbConnection and Authentication:Steam:ApiKey configuration."
               );
          }

          var psi = new ProcessStartInfo
          {
               FileName = opt.NodeExecutable,
               WorkingDirectory = scriptsRoot,
               RedirectStandardOutput = true,
               RedirectStandardError = true,
               UseShellExecute = false,
               CreateNoWindow = true,
          };

          psi.ArgumentList.Add(opt.TsNodeRegisterFlag);
          psi.ArgumentList.Add(opt.TsNodeRegisterModule);
          psi.ArgumentList.Add(entryRelative);
          psi.ArgumentList.Add(steamIdOrUsernameArgument);

          psi.Environment["STEAM_API_KEY"] = steamApiKey;
          psi.Environment["DB_USER"] = dbUser;
          psi.Environment["DB_PASSWORD"] = dbPassword;
          psi.Environment["DB_HOST"] = dbHost;
          psi.Environment["DB_SERVER"] = dbHost;
          psi.Environment["DB_NAME"] = dbName;
          psi.Environment["STEAM_SCRAPER_INVOKED_THROUGH_API"] = "1";

          if (incrementalAchievementsOnly)
               psi.Environment["STEAM_INCREMENTAL_ACHIEVEMENTS_ONLY"] = "1";
          else
               psi.Environment.Remove("STEAM_INCREMENTAL_ACHIEVEMENTS_ONLY");

          using var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
          process.Start();

          Task<string> readOut = process.StandardOutput.ReadToEndAsync(ct);
          Task<string> readErr = process.StandardError.ReadToEndAsync(ct);

          await process.WaitForExitAsync(ct);

          string stdout = await readOut;
          string stderr = await readErr;

          if (process.ExitCode != 0)
          {
               _logger.LogError(
                    "Profile script exited with code {Code}. StdOut={StdOut} StdErr={StdErr}",
                    process.ExitCode,
                    stdout,
                    stderr
               );
               throw new InvalidOperationException(
                    $"Profile gathering script failed with exit code {process.ExitCode}."
               );
          }

          if (_logger.IsEnabled(LogLevel.Debug))
               _logger.LogDebug("Profile script output: {Out}", stdout);
     }
}

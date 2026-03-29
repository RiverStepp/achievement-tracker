namespace AchievementTracker.Api.Models.Options;

public sealed class ProfileGatheringScriptOptions
{
     public const string SectionName = "ProfileGatheringScript";

     public string ScriptsDirectoryRelativePath { get; set; } = "../../scripts";

     public string EntryScriptRelativePath { get; set; } = "src/testScraper.ts";

     public string NodeExecutable { get; set; } = "node";

     public string TsNodeRegisterFlag { get; set; } = "-r";

     public string TsNodeRegisterModule { get; set; } = "ts-node/register";

     public int ProcessTimeoutMinutes { get; set; } = 120;
}

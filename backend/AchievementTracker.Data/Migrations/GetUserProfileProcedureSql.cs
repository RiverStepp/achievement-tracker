namespace AchievementTracker.Data.Migrations;

internal static class GetUserProfileProcedureSql
{
    internal static string Load()
    {
        var assembly = typeof(GetUserProfileProcedureSql).Assembly;
        const string suffix = "GetUserProfile.sql";
        var name = Array.Find(
            assembly.GetManifestResourceNames(),
            n => n.EndsWith(suffix, StringComparison.Ordinal));
        if (name is null)
            throw new InvalidOperationException(
                $"Embedded resource ending with '{suffix}' not found. Ensure StoredProcedures/GetUserProfile.sql is included as EmbeddedResource.");

        using var stream = assembly.GetManifestResourceStream(name);
        if (stream is null)
            throw new InvalidOperationException($"Could not open embedded resource '{name}'.");

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

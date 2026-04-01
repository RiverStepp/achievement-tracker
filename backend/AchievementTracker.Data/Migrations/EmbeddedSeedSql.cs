namespace AchievementTracker.Data.Migrations;

internal static class EmbeddedSeedSql
{
    internal static string Load(string fileName)
    {
        var assembly = typeof(EmbeddedSeedSql).Assembly;
        var name = Array.Find(
            assembly.GetManifestResourceNames(),
            n => n.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));
        if (name is null)
            throw new InvalidOperationException(
                $"Embedded resource ending with '{fileName}' not found. Ensure SeedData/{fileName} is included as EmbeddedResource.");

        using var stream = assembly.GetManifestResourceStream(name);
        if (stream is null)
            throw new InvalidOperationException($"Could not open embedded resource '{name}'.");

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

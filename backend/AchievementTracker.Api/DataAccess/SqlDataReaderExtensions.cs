using System.Data.Common;

namespace AchievementTracker.Api.DataAccess;

internal static class SqlDataReaderExtensions
{
    internal static int GetInt32FromNumericColumn(this DbDataReader reader, int ordinal)
    {
        return Convert.ToInt32(reader.GetValue(ordinal));
    }
}

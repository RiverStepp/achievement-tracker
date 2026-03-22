using System.Data;
using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Data.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace AchievementTracker.Api.DataAccess.Repositories;

public sealed class UserProfileRepository(AppDbContext db) : IUserProfileRepository
{
    private readonly AppDbContext _db = db;

    public async Task<UserProfileResponse?> GetProfileAsync(long steamId, GetUserProfileRequest request, CancellationToken ct = default)
    {
        await using var connection = (SqlConnection)_db.Database.GetDbConnection();
        await connection.OpenAsync(ct);

        await using var cmd = new SqlCommand("dbo.GetUserProfile", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        cmd.Parameters.Add(new SqlParameter("@SteamId", SqlDbType.BigInt) { Value = steamId });
        cmd.Parameters.Add(new SqlParameter("@GamesPageNumber", SqlDbType.Int) { Value = request.GamesPageNumber });
        cmd.Parameters.Add(new SqlParameter("@GamesPageSize", SqlDbType.Int) { Value = request.GamesPageSize });
        cmd.Parameters.Add(new SqlParameter("@AchievementsPageNumber", SqlDbType.Int) { Value = request.AchievementsPageNumber });
        cmd.Parameters.Add(new SqlParameter("@AchievementsPageSize", SqlDbType.Int) { Value = request.AchievementsPageSize });
        cmd.Parameters.Add(new SqlParameter("@AchievementsByPointsPageNumber", SqlDbType.Int) { Value = request.AchievementsByPointsPageNumber });
        cmd.Parameters.Add(new SqlParameter("@AchievementsByPointsPageSize", SqlDbType.Int) { Value = request.AchievementsByPointsPageSize });

        var pGamesRecentTotal = new SqlParameter("@GamesRecentTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        var pAchievementsTotal = new SqlParameter("@AchievementsTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        var pAchievementsByPointsTotal = new SqlParameter("@AchievementsByPointsTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pGamesRecentTotal);
        cmd.Parameters.Add(pAchievementsTotal);
        cmd.Parameters.Add(pAchievementsByPointsTotal);

        await using var reader = await cmd.ExecuteReaderAsync(ct);

        SteamProfileMetadataDto? steamProfile = null;
        if (await reader.ReadAsync(ct))
        {
            steamProfile = new SteamProfileMetadataDto(
                reader.IsDBNull(0) ? null : reader.GetString(0),
                reader.IsDBNull(1) ? null : reader.GetString(1),
                reader.IsDBNull(2) ? null : reader.GetDateTime(2),
                reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                reader.GetBoolean(4)
            );
        }

        UserTotalsDto totals;
        if (await reader.NextResultAsync(ct) && await reader.ReadAsync(ct))
        {
            totals = new UserTotalsDto(
                reader.GetInt32(0),
                reader.GetInt32(1),
                reader.GetInt32(2),
                reader.GetInt32(3),
                reader.GetInt32(4),
                reader.GetInt32(5),
                reader.IsDBNull(6) ? null : reader.GetDecimal(6)
            );
        }
        else
        {
            totals = new UserTotalsDto(0, 0, 0, 0, 0, 0, null);
        }

        var gamesRecent = new List<ProfileGameItemDto>();
        if (await reader.NextResultAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                gamesRecent.Add(ReadProfileGameRow(reader));
            }
        }

        var achievements = new List<ProfileAchievementItemDto>();
        if (await reader.NextResultAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                achievements.Add(ReadProfileAchievementRow(reader));
            }
        }

        var achievementsByPoints = new List<ProfileAchievementItemDto>();
        if (await reader.NextResultAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                achievementsByPoints.Add(ReadProfileAchievementRow(reader));
            }
        }

        await reader.CloseAsync();

        var gamesRecentTotal = pGamesRecentTotal.Value != DBNull.Value && pGamesRecentTotal.Value != null ? Convert.ToInt32(pGamesRecentTotal.Value) : 0;
        var achievementsTotal = pAchievementsTotal.Value != DBNull.Value && pAchievementsTotal.Value != null ? Convert.ToInt32(pAchievementsTotal.Value) : 0;
        var achievementsByPointsTotal = pAchievementsByPointsTotal.Value != DBNull.Value && pAchievementsByPointsTotal.Value != null ? Convert.ToInt32(pAchievementsByPointsTotal.Value) : 0;

        return new UserProfileResponse(
            steamProfile,
            totals,
            new PagedResultDto<ProfileGameItemDto>(request.GamesPageNumber, request.GamesPageSize, gamesRecentTotal, gamesRecent),
            new PagedResultDto<ProfileAchievementItemDto>(request.AchievementsPageNumber, request.AchievementsPageSize, achievementsTotal, achievements),
            new PagedResultDto<ProfileAchievementItemDto>(request.AchievementsByPointsPageNumber, request.AchievementsByPointsPageSize, achievementsByPointsTotal, achievementsByPoints)
        );
    }

    private static ProfileGameItemDto ReadProfileGameRow(System.Data.Common.DbDataReader reader)
    {
        return new ProfileGameItemDto(
            reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetInt32(2),
            reader.GetInt32(3),
            reader.GetInt32(4),
            reader.IsDBNull(5) ? null : reader.GetDecimal(5),
            Convert.ToBoolean(reader.GetValue(6)),
            reader.GetInt32(7),
            reader.GetInt32(8),
            reader.GetDateTime(9),
            reader.IsDBNull(10) ? null : reader.GetInt32(10)
        );
    }

    private static ProfileAchievementItemDto ReadProfileAchievementRow(System.Data.Common.DbDataReader reader)
    {
        return new ProfileAchievementItemDto(
            reader.GetInt32(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.IsDBNull(5) ? null : reader.GetDecimal(5),
            reader.GetDateTime(6),
            reader.GetInt32(7)
        );
    }
}

using System.Data;
using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Requests;
using AchievementTracker.Api.Models.Responses.Profile;
using AchievementTracker.Data.Data;
using AchievementTracker.Api.DataAccess;
using AchievementTracker.Data.Enums;
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
        cmd.Parameters.Add(
            new SqlParameter("@AchievementsByPointsPageNumber", SqlDbType.Int)
            {
                Value = request.AchievementsByPointsPageNumber
            });
        cmd.Parameters.Add(
            new SqlParameter("@AchievementsByPointsPageSize", SqlDbType.Int)
            {
                Value = request.AchievementsByPointsPageSize
            });
        cmd.Parameters.Add(
            new SqlParameter("@LatestActivityPageNumber", SqlDbType.Int) { Value = request.LatestActivityPageNumber });
        cmd.Parameters.Add(
            new SqlParameter("@LatestActivityPageSize", SqlDbType.Int) { Value = request.LatestActivityPageSize });

        var pGamesRecentTotal = new SqlParameter("@GamesRecentTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        var pAchievementsTotal = new SqlParameter("@AchievementsTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        var pAchievementsByPointsTotal =
            new SqlParameter("@AchievementsByPointsTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        var pLatestActivityTotal =
            new SqlParameter("@LatestActivityTotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pGamesRecentTotal);
        cmd.Parameters.Add(pAchievementsTotal);
        cmd.Parameters.Add(pAchievementsByPointsTotal);
        cmd.Parameters.Add(pLatestActivityTotal);

        await using var reader = await cmd.ExecuteReaderAsync(ct);

        ProfileAppUserDto? appUser = null;
        if (await reader.ReadAsync(ct))
        {
            int ordHandle = reader.GetOrdinal("Handle");
            int ordDisplayName = reader.GetOrdinal("DisplayName");
            int ordBio = reader.GetOrdinal("Bio");
            int ordPronouns = reader.GetOrdinal("Pronouns");
            int ordLocCountryId = reader.GetOrdinal("LocationCountryId");
            int ordCountryName = reader.GetOrdinal("CountryName");
            int ordLocStateId = reader.GetOrdinal("LocationStateRegionId");
            int ordStateName = reader.GetOrdinal("StateName");
            int ordLocCityId = reader.GetOrdinal("LocationCityId");
            int ordCityName = reader.GetOrdinal("CityName");
            int ordTz = reader.GetOrdinal("TimeZoneDisplayName");
            int ordJoin = reader.GetOrdinal("JoinDate");

            ProfileUserLocationDto? location = null;
            int? countryId = reader.IsDBNull(ordLocCountryId) ? null : reader.GetInt32(ordLocCountryId);
            string? countryName = reader.IsDBNull(ordCountryName) ? null : reader.GetString(ordCountryName);
            int? stateId = reader.IsDBNull(ordLocStateId) ? null : reader.GetInt32(ordLocStateId);
            string? stateName = reader.IsDBNull(ordStateName) ? null : reader.GetString(ordStateName);
            int? cityId = reader.IsDBNull(ordLocCityId) ? null : reader.GetInt32(ordLocCityId);
            string? cityName = reader.IsDBNull(ordCityName) ? null : reader.GetString(ordCityName);
            if (countryId.HasValue || stateId.HasValue || cityId.HasValue
                || !string.IsNullOrEmpty(countryName) || !string.IsNullOrEmpty(stateName) || !string.IsNullOrEmpty(cityName))
            {
                location = new ProfileUserLocationDto(
                    countryId,
                    countryName,
                    stateId,
                    stateName,
                    cityId,
                    cityName);
            }

            appUser = new ProfileAppUserDto(
                reader.IsDBNull(ordHandle) ? null : reader.GetString(ordHandle),
                reader.IsDBNull(ordDisplayName) ? null : reader.GetString(ordDisplayName),
                reader.IsDBNull(ordBio) ? null : reader.GetString(ordBio),
                reader.IsDBNull(ordPronouns) ? null : reader.GetString(ordPronouns),
                location,
                reader.IsDBNull(ordTz) ? null : reader.GetString(ordTz),
                reader.IsDBNull(ordJoin) ? null : reader.GetDateTime(ordJoin));
        }

        var visibleSocialLinks = new List<ProfileSocialLinkItemDto>();
        if (await reader.NextResultAsync(ct))
        {
            int ordPlatform = reader.GetOrdinal("Platform");
            int ordLinkValue = reader.GetOrdinal("LinkValue");
            while (await reader.ReadAsync(ct))
            {
                visibleSocialLinks.Add(
                    new ProfileSocialLinkItemDto(
                        (eSocialPlatform)reader.GetInt32FromNumericColumn(ordPlatform),
                        reader.GetString(ordLinkValue)));
            }
        }

        SteamProfileMetadataDto? steamProfile = null;
        if (await reader.NextResultAsync(ct) && await reader.ReadAsync(ct))
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

        var pinnedAchievements = new List<ProfilePinnedAchievementDto>();
        if (await reader.NextResultAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                pinnedAchievements.Add(ReadPinnedAchievementRow(reader));
            }
        }

        var latestActivity = new List<ProfileLatestActivityItemDto>();
        if (await reader.NextResultAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                latestActivity.Add(ReadLatestActivityRow(reader));
            }
        }

        await reader.CloseAsync();

        var gamesRecentTotal = ReadOutputInt(pGamesRecentTotal);
        var achievementsTotal = ReadOutputInt(pAchievementsTotal);
        var achievementsByPointsTotal = ReadOutputInt(pAchievementsByPointsTotal);
        var latestActivityTotal = ReadOutputInt(pLatestActivityTotal);

        return new UserProfileResponse(
            appUser,
            visibleSocialLinks,
            steamProfile,
            totals,
            new PagedResultDto<ProfileGameItemDto>(request.GamesPageNumber, request.GamesPageSize, gamesRecentTotal, gamesRecent),
            new PagedResultDto<ProfileAchievementItemDto>(
                request.AchievementsPageNumber,
                request.AchievementsPageSize,
                achievementsTotal,
                achievements),
            new PagedResultDto<ProfileAchievementItemDto>(
                request.AchievementsByPointsPageNumber,
                request.AchievementsByPointsPageSize,
                achievementsByPointsTotal,
                achievementsByPoints),
            pinnedAchievements,
            new PagedResultDto<ProfileLatestActivityItemDto>(
                request.LatestActivityPageNumber,
                request.LatestActivityPageSize,
                latestActivityTotal,
                latestActivity)
        );
    }

    private static int ReadOutputInt(SqlParameter parameter)
    {
        return parameter.Value != DBNull.Value && parameter.Value != null ? Convert.ToInt32(parameter.Value) : 0;
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

    private static ProfilePinnedAchievementDto ReadPinnedAchievementRow(System.Data.Common.DbDataReader reader)
    {
        return new ProfilePinnedAchievementDto(
            reader.GetInt32(0),
            reader.GetInt32(1),
            (eAchievementPlatform)reader.GetByte(2),
            reader.GetInt32(3),
            reader.GetInt32(4),
            reader.GetString(5),
            reader.GetString(6),
            reader.IsDBNull(7) ? null : reader.GetString(7),
            reader.IsDBNull(8) ? null : reader.GetString(8),
            reader.IsDBNull(9) ? null : reader.GetDecimal(9),
            reader.GetDateTime(10),
            reader.GetInt32(11)
        );
    }

    private static ProfileLatestActivityItemDto ReadLatestActivityRow(System.Data.Common.DbDataReader reader)
    {
        var activityType = (eProfileActivityType)reader.GetInt16(0);
        return new ProfileLatestActivityItemDto(
            activityType,
            reader.GetDateTime(1),
            reader.IsDBNull(2) ? null : reader.GetInt32(2),
            reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.IsDBNull(5) ? null : reader.GetString(5),
            reader.IsDBNull(6) ? null : reader.GetString(6),
            reader.IsDBNull(7) ? null : reader.GetDecimal(7),
            reader.IsDBNull(8) ? null : reader.GetInt32(8),
            reader.IsDBNull(9) ? null : reader.GetInt32(9),
            reader.IsDBNull(10) ? null : reader.GetGuid(10),
            reader.IsDBNull(11) ? null : reader.GetString(11),
            reader.IsDBNull(12) ? null : reader.GetGuid(12),
            reader.IsDBNull(13) ? null : reader.GetGuid(13),
            reader.IsDBNull(14) ? null : reader.GetString(14)
        );
    }
}

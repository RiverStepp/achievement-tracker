using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixAppUserLocationConstraintIfMissing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AppUsers_UserLocationDepth' AND parent_object_id = OBJECT_ID(N'dbo.AppUsers'))
                    ALTER TABLE dbo.AppUsers DROP CONSTRAINT CK_AppUsers_UserLocationDepth;

                UPDATE u
                SET
                    u.LocationStateRegionId = ISNULL(u.LocationStateRegionId, ct.LocationStateRegionId),
                    u.LocationCountryId = ISNULL(u.LocationCountryId, sr_from_city.LocationCountryId)
                FROM dbo.AppUsers u
                INNER JOIN dbo.LocationCities ct ON ct.LocationCityId = u.LocationCityId
                INNER JOIN dbo.LocationStateRegions sr_from_city ON sr_from_city.LocationStateRegionId = ct.LocationStateRegionId
                WHERE u.LocationCityId IS NOT NULL
                  AND (u.LocationStateRegionId IS NULL OR u.LocationCountryId IS NULL);

                UPDATE u
                SET u.LocationCountryId = sr.LocationCountryId
                FROM dbo.AppUsers u
                INNER JOIN dbo.LocationStateRegions sr ON sr.LocationStateRegionId = u.LocationStateRegionId
                WHERE u.LocationStateRegionId IS NOT NULL AND u.LocationCountryId IS NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AppUsers_UserLocationHierarchy' AND parent_object_id = OBJECT_ID(N'dbo.AppUsers'))
                    ALTER TABLE dbo.AppUsers ADD CONSTRAINT CK_AppUsers_UserLocationHierarchy CHECK (
                        NOT (LocationCityId IS NOT NULL AND (LocationStateRegionId IS NULL OR LocationCountryId IS NULL))
                        AND NOT (LocationStateRegionId IS NOT NULL AND LocationCountryId IS NULL));

                UPDATE dbo.LocationCountries SET Name = N'Côte d''Ivoire' WHERE IsoAlpha2 = N'CI';
                UPDATE dbo.LocationCountries SET Name = N'Curaçao' WHERE IsoAlpha2 = N'CW';
                UPDATE dbo.LocationCountries SET Name = N'Réunion' WHERE IsoAlpha2 = N'RE';
                UPDATE dbo.LocationCountries SET Name = N'Saint Barthélemy' WHERE IsoAlpha2 = N'BL';
                UPDATE dbo.LocationCountries SET Name = N'Türkiye' WHERE IsoAlpha2 = N'TR';
                """);

            migrationBuilder.Sql(GetUserProfileProcedureSql.Load());
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}

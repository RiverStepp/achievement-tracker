using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class UserSettingsLocationAndSocial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "AppUsers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IanaTimeZoneId",
                table: "AppUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LocationCityId",
                table: "AppUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LocationCountryId",
                table: "AppUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LocationStateRegionId",
                table: "AppUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PronounOptionId",
                table: "AppUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppUserSocialLinks",
                columns: table => new
                {
                    AppUserSocialLinkId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    Platform = table.Column<byte>(type: "tinyint", nullable: false),
                    LinkValue = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    IsVisible = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserSocialLinks", x => x.AppUserSocialLinkId);
                    table.ForeignKey(
                        name: "FK_AppUserSocialLinks_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IanaTimeZones",
                columns: table => new
                {
                    IanaTimeZoneId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IanaIdentifier = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IanaTimeZones", x => x.IanaTimeZoneId);
                });

            migrationBuilder.CreateTable(
                name: "LocationCountries",
                columns: table => new
                {
                    LocationCountryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsoAlpha2 = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationCountries", x => x.LocationCountryId);
                });

            migrationBuilder.CreateTable(
                name: "PronounOptions",
                columns: table => new
                {
                    PronounOptionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DisplayLabel = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PronounOptions", x => x.PronounOptionId);
                });

            migrationBuilder.CreateTable(
                name: "LocationStateRegions",
                columns: table => new
                {
                    LocationStateRegionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LocationCountryId = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationStateRegions", x => x.LocationStateRegionId);
                    table.ForeignKey(
                        name: "FK_LocationStateRegions_LocationCountries_LocationCountryId",
                        column: x => x.LocationCountryId,
                        principalTable: "LocationCountries",
                        principalColumn: "LocationCountryId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LocationCities",
                columns: table => new
                {
                    LocationCityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LocationStateRegionId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationCities", x => x.LocationCityId);
                    table.ForeignKey(
                        name: "FK_LocationCities_LocationStateRegions_LocationStateRegionId",
                        column: x => x.LocationStateRegionId,
                        principalTable: "LocationStateRegions",
                        principalColumn: "LocationStateRegionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_IanaTimeZoneId",
                table: "AppUsers",
                column: "IanaTimeZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_LocationCityId",
                table: "AppUsers",
                column: "LocationCityId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_LocationCountryId",
                table: "AppUsers",
                column: "LocationCountryId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_LocationStateRegionId",
                table: "AppUsers",
                column: "LocationStateRegionId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_PronounOptionId",
                table: "AppUsers",
                column: "PronounOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserSocialLinks_AppUserId_Platform",
                table: "AppUserSocialLinks",
                columns: new[] { "AppUserId", "Platform" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IanaTimeZones_IanaIdentifier",
                table: "IanaTimeZones",
                column: "IanaIdentifier",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LocationCities_LocationStateRegionId_Name",
                table: "LocationCities",
                columns: new[] { "LocationStateRegionId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LocationCountries_IsoAlpha2",
                table: "LocationCountries",
                column: "IsoAlpha2",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LocationStateRegions_LocationCountryId_Code",
                table: "LocationStateRegions",
                columns: new[] { "LocationCountryId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PronounOptions_Code",
                table: "PronounOptions",
                column: "Code",
                unique: true);

            migrationBuilder.Sql(EmbeddedSeedSql.Load("Countries.sql"));
            migrationBuilder.Sql(EmbeddedSeedSql.Load("LocationStateRegions.sql"));
            migrationBuilder.Sql(EmbeddedSeedSql.Load("LocationCities.sql"));
            migrationBuilder.Sql(EmbeddedSeedSql.Load("IanaTimeZones.sql"));
            migrationBuilder.Sql(
                """
                INSERT INTO PronounOptions (Code, DisplayLabel) VALUES
                (N'he_him', N'He/Him'),
                (N'she_her', N'She/Her'),
                (N'they_them', N'They/Them'),
                (N'other', N'Other'),
                (N'prefer_not_to_say', N'Prefer not to say'),
                (N'ask_me', N'Ask me my pronouns');
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_IanaTimeZones_IanaTimeZoneId",
                table: "AppUsers",
                column: "IanaTimeZoneId",
                principalTable: "IanaTimeZones",
                principalColumn: "IanaTimeZoneId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_LocationCities_LocationCityId",
                table: "AppUsers",
                column: "LocationCityId",
                principalTable: "LocationCities",
                principalColumn: "LocationCityId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_LocationCountries_LocationCountryId",
                table: "AppUsers",
                column: "LocationCountryId",
                principalTable: "LocationCountries",
                principalColumn: "LocationCountryId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_LocationStateRegions_LocationStateRegionId",
                table: "AppUsers",
                column: "LocationStateRegionId",
                principalTable: "LocationStateRegions",
                principalColumn: "LocationStateRegionId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_PronounOptions_PronounOptionId",
                table: "AppUsers",
                column: "PronounOptionId",
                principalTable: "PronounOptions",
                principalColumn: "PronounOptionId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql(
                """
                ALTER TABLE AppUsers ADD CONSTRAINT CK_AppUsers_UserLocationDepth CHECK (
                (
                    CASE WHEN LocationCityId IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN LocationStateRegionId IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN LocationCountryId IS NOT NULL THEN 1 ELSE 0 END
                ) <= 1);
                """);

            migrationBuilder.Sql(GetUserProfileProcedureSql.Load());
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AppUsers_UserLocationDepth' AND parent_object_id = OBJECT_ID(N'dbo.AppUsers'))
                    ALTER TABLE dbo.AppUsers DROP CONSTRAINT CK_AppUsers_UserLocationDepth;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_IanaTimeZones_IanaTimeZoneId",
                table: "AppUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_LocationCities_LocationCityId",
                table: "AppUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_LocationCountries_LocationCountryId",
                table: "AppUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_LocationStateRegions_LocationStateRegionId",
                table: "AppUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_PronounOptions_PronounOptionId",
                table: "AppUsers");

            migrationBuilder.DropTable(
                name: "AppUserSocialLinks");

            migrationBuilder.DropTable(
                name: "IanaTimeZones");

            migrationBuilder.DropTable(
                name: "LocationCities");

            migrationBuilder.DropTable(
                name: "PronounOptions");

            migrationBuilder.DropTable(
                name: "LocationStateRegions");

            migrationBuilder.DropTable(
                name: "LocationCountries");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_IanaTimeZoneId",
                table: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_LocationCityId",
                table: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_LocationCountryId",
                table: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_LocationStateRegionId",
                table: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_PronounOptionId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "IanaTimeZoneId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "LocationCityId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "LocationCountryId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "LocationStateRegionId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "PronounOptionId",
                table: "AppUsers");
        }
    }
}

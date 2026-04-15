using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AchievementsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SteamProfiles_UserExternalLogins_UserExternalLoginId",
                table: "SteamProfiles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SteamProfiles",
                table: "SteamProfiles");

            migrationBuilder.RenameTable(
                name: "SteamProfiles",
                newName: "UserSteamProfiles");

            migrationBuilder.RenameIndex(
                name: "IX_SteamProfiles_UserExternalLoginId",
                table: "UserSteamProfiles",
                newName: "IX_UserSteamProfiles_UserExternalLoginId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserSteamProfiles",
                table: "UserSteamProfiles",
                column: "SteamId");

            migrationBuilder.CreateTable(
                name: "SteamCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamDevelopers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamDevelopers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SteamAppId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ReleaseDate = table.Column<DateTime>(type: "date", nullable: true),
                    HeaderImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ShortDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsUnlisted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsRemoved = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Alias = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGames", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGenres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamLanguages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamLanguages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamPublishers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamPublishers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamTags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SteamAchievements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    SteamApiName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IconUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Points = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsHidden = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DescriptionSource = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsUnobtainable = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsBuggy = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsConditionallyObtainable = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsMultiplayer = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsMissable = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsGrind = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsRandom = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsDateSpecific = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsViral = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsDLC = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsWorldRecord = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SteamAchievements_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGameCategories",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGameCategories", x => new { x.GameId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_SteamGameCategories_SteamCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "SteamCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamGameCategories_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGameDevelopers",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    DeveloperId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGameDevelopers", x => new { x.GameId, x.DeveloperId });
                    table.ForeignKey(
                        name: "FK_SteamGameDevelopers_SteamDevelopers_DeveloperId",
                        column: x => x.DeveloperId,
                        principalTable: "SteamDevelopers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamGameDevelopers_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGamePlatforms",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    Platform = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGamePlatforms", x => new { x.GameId, x.Platform });
                    table.CheckConstraint("CK_SteamGamePlatforms_Platform", "[Platform] IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "FK_SteamGamePlatforms_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGamePrices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    OriginalPrice = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    OriginalCurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGamePrices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SteamGamePrices_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGameReviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    SteamRating = table.Column<int>(type: "int", nullable: false),
                    MetacriticScore = table.Column<int>(type: "int", nullable: true),
                    Recommendations = table.Column<int>(type: "int", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGameReviews", x => x.Id);
                    table.CheckConstraint("CK_SteamGameReviews_Metacritic", "[MetacriticScore] IS NULL OR ([MetacriticScore] BETWEEN 0 AND 100)");
                    table.ForeignKey(
                        name: "FK_SteamGameReviews_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamUserGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SteamId = table.Column<long>(type: "bigint", nullable: false),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    PlaytimeForever = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    LastPlayedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamUserGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SteamUserGames_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamUserGames_UserSteamProfiles_SteamId",
                        column: x => x.SteamId,
                        principalTable: "UserSteamProfiles",
                        principalColumn: "SteamId");
                });

            migrationBuilder.CreateTable(
                name: "SteamGameGenres",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    GenreId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGameGenres", x => new { x.GameId, x.GenreId });
                    table.ForeignKey(
                        name: "FK_SteamGameGenres_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamGameGenres_SteamGenres_GenreId",
                        column: x => x.GenreId,
                        principalTable: "SteamGenres",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGameLanguages",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    LanguageId = table.Column<int>(type: "int", nullable: false),
                    HasInterface = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    HasFullAudio = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    HasSubtitles = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGameLanguages", x => new { x.GameId, x.LanguageId });
                    table.ForeignKey(
                        name: "FK_SteamGameLanguages_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamGameLanguages_SteamLanguages_LanguageId",
                        column: x => x.LanguageId,
                        principalTable: "SteamLanguages",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGamePublishers",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    PublisherId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGamePublishers", x => new { x.GameId, x.PublisherId });
                    table.ForeignKey(
                        name: "FK_SteamGamePublishers_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamGamePublishers_SteamPublishers_PublisherId",
                        column: x => x.PublisherId,
                        principalTable: "SteamPublishers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamGameTags",
                columns: table => new
                {
                    GameId = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamGameTags", x => new { x.GameId, x.TagId });
                    table.ForeignKey(
                        name: "FK_SteamGameTags_SteamGames_GameId",
                        column: x => x.GameId,
                        principalTable: "SteamGames",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamGameTags_SteamTags_TagId",
                        column: x => x.TagId,
                        principalTable: "SteamTags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamAchievementStats",
                columns: table => new
                {
                    AchievementId = table.Column<int>(type: "int", nullable: false),
                    GlobalPercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamAchievementStats", x => x.AchievementId);
                    table.CheckConstraint("CK_SteamAchievementStats_Percentage", "[GlobalPercentage] BETWEEN 0 AND 100");
                    table.ForeignKey(
                        name: "FK_SteamAchievementStats_SteamAchievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "SteamAchievements",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SteamUserAchievements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SteamId = table.Column<long>(type: "bigint", nullable: false),
                    AchievementId = table.Column<int>(type: "int", nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SteamUserAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SteamUserAchievements_SteamAchievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "SteamAchievements",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SteamUserAchievements_UserSteamProfiles_SteamId",
                        column: x => x.SteamId,
                        principalTable: "UserSteamProfiles",
                        principalColumn: "SteamId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSteamProfiles_IsActive",
                table: "UserSteamProfiles",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SteamAchievements_GameId",
                table: "SteamAchievements",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamAchievements_GameId_SteamApiName",
                table: "SteamAchievements",
                columns: new[] { "GameId", "SteamApiName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamAchievements_IsHidden",
                table: "SteamAchievements",
                column: "IsHidden");

            migrationBuilder.CreateIndex(
                name: "IX_SteamCategories_Name",
                table: "SteamCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamDevelopers_Name",
                table: "SteamDevelopers",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamGameCategories_CategoryId",
                table: "SteamGameCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGameDevelopers_DeveloperId",
                table: "SteamGameDevelopers",
                column: "DeveloperId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGameGenres_GenreId",
                table: "SteamGameGenres",
                column: "GenreId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGameLanguages_LanguageId",
                table: "SteamGameLanguages",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGamePrices_GameId_RecordedAt",
                table: "SteamGamePrices",
                columns: new[] { "GameId", "RecordedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_SteamGamePublishers_PublisherId",
                table: "SteamGamePublishers",
                column: "PublisherId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGameReviews_GameId",
                table: "SteamGameReviews",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGames_Name",
                table: "SteamGames",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGames_SteamAppId",
                table: "SteamGames",
                column: "SteamAppId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamGameTags_TagId",
                table: "SteamGameTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamGenres_Name",
                table: "SteamGenres",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamLanguages_Code",
                table: "SteamLanguages",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamPublishers_Name",
                table: "SteamPublishers",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamTags_Name",
                table: "SteamTags",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamUserAchievements_AchievementId",
                table: "SteamUserAchievements",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamUserAchievements_SteamId_AchievementId",
                table: "SteamUserAchievements",
                columns: new[] { "SteamId", "AchievementId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SteamUserAchievements_SteamId_UnlockedAt",
                table: "SteamUserAchievements",
                columns: new[] { "SteamId", "UnlockedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_SteamUserGames_GameId",
                table: "SteamUserGames",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamUserGames_SteamId",
                table: "SteamUserGames",
                column: "SteamId");

            migrationBuilder.CreateIndex(
                name: "IX_SteamUserGames_SteamId_GameId",
                table: "SteamUserGames",
                columns: new[] { "SteamId", "GameId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UserSteamProfiles_UserExternalLogins_UserExternalLoginId",
                table: "UserSteamProfiles",
                column: "UserExternalLoginId",
                principalTable: "UserExternalLogins",
                principalColumn: "UserExternalLoginId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserSteamProfiles_UserExternalLogins_UserExternalLoginId",
                table: "UserSteamProfiles");

            migrationBuilder.DropTable(
                name: "SteamAchievementStats");

            migrationBuilder.DropTable(
                name: "SteamGameCategories");

            migrationBuilder.DropTable(
                name: "SteamGameDevelopers");

            migrationBuilder.DropTable(
                name: "SteamGameGenres");

            migrationBuilder.DropTable(
                name: "SteamGameLanguages");

            migrationBuilder.DropTable(
                name: "SteamGamePlatforms");

            migrationBuilder.DropTable(
                name: "SteamGamePrices");

            migrationBuilder.DropTable(
                name: "SteamGamePublishers");

            migrationBuilder.DropTable(
                name: "SteamGameReviews");

            migrationBuilder.DropTable(
                name: "SteamGameTags");

            migrationBuilder.DropTable(
                name: "SteamUserAchievements");

            migrationBuilder.DropTable(
                name: "SteamUserGames");

            migrationBuilder.DropTable(
                name: "SteamCategories");

            migrationBuilder.DropTable(
                name: "SteamDevelopers");

            migrationBuilder.DropTable(
                name: "SteamGenres");

            migrationBuilder.DropTable(
                name: "SteamLanguages");

            migrationBuilder.DropTable(
                name: "SteamPublishers");

            migrationBuilder.DropTable(
                name: "SteamTags");

            migrationBuilder.DropTable(
                name: "SteamAchievements");

            migrationBuilder.DropTable(
                name: "SteamGames");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserSteamProfiles",
                table: "UserSteamProfiles");

            migrationBuilder.DropIndex(
                name: "IX_UserSteamProfiles_IsActive",
                table: "UserSteamProfiles");

            migrationBuilder.RenameTable(
                name: "UserSteamProfiles",
                newName: "SteamProfiles");

            migrationBuilder.RenameIndex(
                name: "IX_UserSteamProfiles_UserExternalLoginId",
                table: "SteamProfiles",
                newName: "IX_SteamProfiles_UserExternalLoginId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SteamProfiles",
                table: "SteamProfiles",
                column: "SteamId");

            migrationBuilder.AddForeignKey(
                name: "FK_SteamProfiles_UserExternalLogins_UserExternalLoginId",
                table: "SteamProfiles",
                column: "UserExternalLoginId",
                principalTable: "UserExternalLogins",
                principalColumn: "UserExternalLoginId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
 
#nullable disable
 
namespace AchievementTracker.Data.Migrations
{
    public partial class AddUserAchievementSummary : Migration
    {
        // creates the table when migration is applied
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserAchievementSummaries",
                columns: table => new
                {
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    TotalAchievementsUnlocked = table.Column<int>(type: "int", nullable: false),
                    TotalGamesTracked = table.Column<int>(type: "int", nullable: false),
                    PerfectGamesCount = table.Column<int>(type: "int", nullable: false),
                    LastSyncedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAchievementSummaries", x => x.AppUserId);
                    table.ForeignKey(
                        name: "FK_UserAchievementSummaries_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Cascade);
                });
        }
 
        // Drops the table when migration is rolled back
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserAchievementSummaries");
        }
    }
}

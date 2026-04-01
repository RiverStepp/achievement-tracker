using Microsoft.EntityFrameworkCore.Migrations;
 
#nullable disable
 
namespace AchievementTracker.Data.Migrations
{
    public partial class AddTotalPointsToAchievementSummary : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalPoints",
                table: "UserAchievementSummaries",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
 
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalPoints",
                table: "UserAchievementSummaries");
        }
    }
}

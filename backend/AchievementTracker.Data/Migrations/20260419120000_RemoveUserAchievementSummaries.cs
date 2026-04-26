using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
     /// <inheritdoc />
     public partial class RemoveUserAchievementSummaries : Migration
     {
          /// <inheritdoc />
          protected override void Up(MigrationBuilder migrationBuilder)
          {
               migrationBuilder.Sql(
                    """
                    IF OBJECT_ID(N'[dbo].[UserAchievementSummaries]', 'U') IS NOT NULL
                         DROP TABLE [dbo].[UserAchievementSummaries];
                    """);
          }

          /// <inheritdoc />
          protected override void Down(MigrationBuilder migrationBuilder)
          {
          }
     }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAppUserHandleAndDisplayName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "AppUsers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Handle",
                table: "AppUsers",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Handle",
                table: "AppUsers",
                column: "Handle",
                unique: true,
                filter: "[Handle] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppUsers_Handle",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "Handle",
                table: "AppUsers");
        }
    }
}

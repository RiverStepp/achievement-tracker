using System;
using Microsoft.EntityFrameworkCore.Migrations;
 
#nullable disable
 
namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecipientAppUserId = table.Column<int>(type: "int", nullable: false),
                    ActorAppUserId = table.Column<int>(type: "int", nullable: false),
                    NotificationType = table.Column<short>(type: "smallint", nullable: false),
                    ReferenceId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ReadDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_Notifications_AppUsers_ActorAppUserId",
                        column: x => x.ActorAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK_Notifications_AppUsers_RecipientAppUserId",
                        column: x => x.RecipientAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });
 
            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientAppUserId_CreateDate",
                table: "Notifications",
                columns: new[] { "RecipientAppUserId", "CreateDate" });
 
            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientAppUserId_ReadDate",
                table: "Notifications",
                columns: new[] { "RecipientAppUserId", "ReadDate" });
 
            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ActorAppUserId",
                table: "Notifications",
                column: "ActorAppUserId");
        }
 
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Notifications");
        }
    }
}

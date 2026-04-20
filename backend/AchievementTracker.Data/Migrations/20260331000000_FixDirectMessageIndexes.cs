using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixDirectMessageIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DirectMessages_ConversationId_SentDate",
                table: "DirectMessages");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_ConversationId_DirectMessageId",
                table: "DirectMessages",
                columns: new[] { "ConversationId", "DirectMessageId" });

            migrationBuilder.CreateIndex(
                name: "IX_ConversationParticipants_AppUserId_ConversationId",
                table: "ConversationParticipants",
                columns: new[] { "AppUserId", "ConversationId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DirectMessages_ConversationId_DirectMessageId",
                table: "DirectMessages");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_ConversationId_SentDate",
                table: "DirectMessages",
                columns: new[] { "ConversationId", "SentDate" });

            migrationBuilder.DropIndex(
                name: "IX_ConversationParticipants_AppUserId_ConversationId",
                table: "ConversationParticipants");
        }
    }
}

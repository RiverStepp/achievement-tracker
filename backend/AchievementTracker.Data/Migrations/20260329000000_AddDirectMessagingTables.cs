using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDirectMessagingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    ConversationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationType = table.Column<short>(type: "smallint", nullable: false),
                    ConversationTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ConversationImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedByAppUserId = table.Column<int>(type: "int", nullable: false),
                    LastMessageDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.ConversationId);
                    table.ForeignKey(
                        name: "FK_Conversations_AppUsers_CreatedByAppUserId",
                        column: x => x.CreatedByAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "DirectMessages",
                columns: table => new
                {
                    DirectMessageId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationId = table.Column<int>(type: "int", nullable: false),
                    SenderAppUserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    SentDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DirectMessages", x => x.DirectMessageId);
                    table.ForeignKey(
                        name: "FK_DirectMessages_AppUsers_SenderAppUserId",
                        column: x => x.SenderAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK_DirectMessages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "ConversationId");
                });

            migrationBuilder.CreateTable(
                name: "ConversationParticipants",
                columns: table => new
                {
                    ConversationId = table.Column<int>(type: "int", nullable: false),
                    AppUserPublicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationParticipantId = table.Column<int>(type: "int", nullable: false),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    JoinedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    LeftDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsMuted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    LastReadMessageId = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversationParticipants", x => new { x.ConversationId, x.AppUserPublicId });
                    table.ForeignKey(
                        name: "FK_ConversationParticipants_AppUsers_AppUserPublicId",
                        column: x => x.AppUserPublicId,
                        principalTable: "AppUsers",
                        principalColumn: "PublicId");
                    table.ForeignKey(
                        name: "FK_ConversationParticipants_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "ConversationId");
                    table.ForeignKey(
                        name: "FK_ConversationParticipants_DirectMessages_LastReadMessageId",
                        column: x => x.LastReadMessageId,
                        principalTable: "DirectMessages",
                        principalColumn: "DirectMessageId");
                });

            migrationBuilder.CreateTable(
                name: "MessageEmbeds",
                columns: table => new
                {
                    MessageEmbedId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DirectMessageId = table.Column<long>(type: "bigint", nullable: false),
                    EmbedType = table.Column<short>(type: "smallint", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageEmbeds", x => x.MessageEmbedId);
                    table.ForeignKey(
                        name: "FK_MessageEmbeds_DirectMessages_DirectMessageId",
                        column: x => x.DirectMessageId,
                        principalTable: "DirectMessages",
                        principalColumn: "DirectMessageId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_CreatedByAppUserId_LastMessageDate",
                table: "Conversations",
                columns: new[] { "CreatedByAppUserId", "LastMessageDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ConversationParticipants_ConversationId_AppUserId",
                table: "ConversationParticipants",
                columns: new[] { "ConversationId", "AppUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConversationParticipants_LastReadMessageId",
                table: "ConversationParticipants",
                column: "LastReadMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_ConversationId_SentDate",
                table: "DirectMessages",
                columns: new[] { "ConversationId", "SentDate" });

            migrationBuilder.CreateIndex(
                name: "IX_DirectMessages_SenderAppUserId",
                table: "DirectMessages",
                column: "SenderAppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MessageEmbeds_DirectMessageId",
                table: "MessageEmbeds",
                column: "DirectMessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "MessageEmbeds");

            migrationBuilder.DropTable(name: "ConversationParticipants");

            migrationBuilder.DropTable(name: "DirectMessages");

            migrationBuilder.DropTable(name: "Conversations");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class SocialFeedInitial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SocialPost",
                columns: table => new
                {
                    SocialPostId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PublicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    AuthorAppUserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPost", x => x.SocialPostId);
                    table.ForeignKey(
                        name: "FK_SocialPost_AppUsers_AuthorAppUserId",
                        column: x => x.AuthorAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SocialPostAttachment",
                columns: table => new
                {
                    SocialPostAttachmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SocialPostId = table.Column<int>(type: "int", nullable: false),
                    AttachmentType = table.Column<short>(type: "smallint", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    Caption = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    DisplayOrder = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPostAttachment", x => x.SocialPostAttachmentId);
                    table.ForeignKey(
                        name: "FK_SocialPostAttachment_SocialPost_SocialPostId",
                        column: x => x.SocialPostId,
                        principalTable: "SocialPost",
                        principalColumn: "SocialPostId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialPostComment",
                columns: table => new
                {
                    SocialPostCommentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SocialPostId = table.Column<int>(type: "int", nullable: false),
                    AuthorAppUserId = table.Column<int>(type: "int", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    ParentCommentId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPostComment", x => x.SocialPostCommentId);
                    table.ForeignKey(
                        name: "FK_SocialPostComment_AppUsers_AuthorAppUserId",
                        column: x => x.AuthorAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SocialPostComment_SocialPostComment_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "SocialPostComment",
                        principalColumn: "SocialPostCommentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SocialPostComment_SocialPost_SocialPostId",
                        column: x => x.SocialPostId,
                        principalTable: "SocialPost",
                        principalColumn: "SocialPostId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialPostReaction",
                columns: table => new
                {
                    SocialPostId = table.Column<int>(type: "int", nullable: false),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    ReactionType = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPostReaction", x => new { x.SocialPostId, x.AppUserId });
                    table.ForeignKey(
                        name: "FK_SocialPostReaction_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SocialPostReaction_SocialPost_SocialPostId",
                        column: x => x.SocialPostId,
                        principalTable: "SocialPost",
                        principalColumn: "SocialPostId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SocialPost_AuthorAppUserId_CreateDate_SocialPostId",
                table: "SocialPost",
                columns: new[] { "AuthorAppUserId", "CreateDate", "SocialPostId" });

            migrationBuilder.CreateIndex(
                name: "IX_SocialPost_CreateDate_SocialPostId",
                table: "SocialPost",
                columns: new[] { "CreateDate", "SocialPostId" });

            migrationBuilder.CreateIndex(
                name: "IX_SocialPost_PublicId",
                table: "SocialPost",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostAttachment_SocialPostId_DisplayOrder",
                table: "SocialPostAttachment",
                columns: new[] { "SocialPostId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostComment_AuthorAppUserId",
                table: "SocialPostComment",
                column: "AuthorAppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostComment_ParentCommentId",
                table: "SocialPostComment",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostComment_SocialPostId_CreateDate_SocialPostCommentId",
                table: "SocialPostComment",
                columns: new[] { "SocialPostId", "CreateDate", "SocialPostCommentId" });

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostReaction_AppUserId",
                table: "SocialPostReaction",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostReaction_SocialPostId",
                table: "SocialPostReaction",
                column: "SocialPostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SocialPostAttachment");

            migrationBuilder.DropTable(
                name: "SocialPostComment");

            migrationBuilder.DropTable(
                name: "SocialPostReaction");

            migrationBuilder.DropTable(
                name: "SocialPost");
        }
    }
}

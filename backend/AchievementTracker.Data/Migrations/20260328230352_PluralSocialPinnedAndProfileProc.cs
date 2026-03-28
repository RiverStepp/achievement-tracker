using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class PluralSocialPinnedAndProfileProc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppUserPinnedAchievement_AppUsers_AppUserId",
                table: "AppUserPinnedAchievement");

            migrationBuilder.DropForeignKey(
                name: "FK_AppUserPinnedAchievement_SteamAchievements_AchievementId",
                table: "AppUserPinnedAchievement");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPost_AppUsers_AuthorAppUserId",
                table: "SocialPost");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostAttachment_SocialPost_SocialPostId",
                table: "SocialPostAttachment");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComment_AppUsers_AuthorAppUserId",
                table: "SocialPostComment");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComment_SocialPostComment_ParentCommentId",
                table: "SocialPostComment");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComment_SocialPost_SocialPostId",
                table: "SocialPostComment");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostReaction_AppUsers_AppUserId",
                table: "SocialPostReaction");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostReaction_SocialPost_SocialPostId",
                table: "SocialPostReaction");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostReaction",
                table: "SocialPostReaction");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostComment",
                table: "SocialPostComment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostAttachment",
                table: "SocialPostAttachment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPost",
                table: "SocialPost");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AppUserPinnedAchievement",
                table: "AppUserPinnedAchievement");

            migrationBuilder.DropIndex(
                name: "IX_AppUserPinnedAchievement_AppUserId_AchievementId",
                table: "AppUserPinnedAchievement");

            migrationBuilder.RenameTable(
                name: "SocialPostReaction",
                newName: "SocialPostReactions");

            migrationBuilder.RenameTable(
                name: "SocialPostComment",
                newName: "SocialPostComments");

            migrationBuilder.RenameTable(
                name: "SocialPostAttachment",
                newName: "SocialPostAttachments");

            migrationBuilder.RenameTable(
                name: "SocialPost",
                newName: "SocialPosts");

            migrationBuilder.RenameTable(
                name: "AppUserPinnedAchievement",
                newName: "AppUserPinnedAchievements");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostReaction_SocialPostId",
                table: "SocialPostReactions",
                newName: "IX_SocialPostReactions_SocialPostId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostReaction_AppUserId",
                table: "SocialPostReactions",
                newName: "IX_SocialPostReactions_AppUserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComment_SocialPostId_CreateDate_SocialPostCommentId",
                table: "SocialPostComments",
                newName: "IX_SocialPostComments_SocialPostId_CreateDate_SocialPostCommentId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComment_PublicId",
                table: "SocialPostComments",
                newName: "IX_SocialPostComments_PublicId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComment_ParentCommentId",
                table: "SocialPostComments",
                newName: "IX_SocialPostComments_ParentCommentId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComment_AuthorAppUserId",
                table: "SocialPostComments",
                newName: "IX_SocialPostComments_AuthorAppUserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostAttachment_SocialPostId_DisplayOrder",
                table: "SocialPostAttachments",
                newName: "IX_SocialPostAttachments_SocialPostId_DisplayOrder");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPost_PublicId",
                table: "SocialPosts",
                newName: "IX_SocialPosts_PublicId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPost_CreateDate_SocialPostId",
                table: "SocialPosts",
                newName: "IX_SocialPosts_CreateDate_SocialPostId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPost_AuthorAppUserId_CreateDate_SocialPostId",
                table: "SocialPosts",
                newName: "IX_SocialPosts_AuthorAppUserId_CreateDate_SocialPostId");

            migrationBuilder.RenameColumn(
                name: "AchievementId",
                table: "AppUserPinnedAchievements",
                newName: "SteamAchievementId");

            migrationBuilder.RenameIndex(
                name: "IX_AppUserPinnedAchievement_AchievementId",
                table: "AppUserPinnedAchievements",
                newName: "IX_AppUserPinnedAchievements_SteamAchievementId");

            migrationBuilder.AddColumn<byte>(
                name: "PlatformId",
                table: "AppUserPinnedAchievements",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)1);

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostReactions",
                table: "SocialPostReactions",
                columns: new[] { "SocialPostId", "AppUserId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostComments",
                table: "SocialPostComments",
                column: "SocialPostCommentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostAttachments",
                table: "SocialPostAttachments",
                column: "SocialPostAttachmentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPosts",
                table: "SocialPosts",
                column: "SocialPostId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AppUserPinnedAchievements",
                table: "AppUserPinnedAchievements",
                column: "AppUserPinnedAchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserPinnedAchievements_AppUserId_PlatformId_SteamAchievementId",
                table: "AppUserPinnedAchievements",
                columns: new[] { "AppUserId", "PlatformId", "SteamAchievementId" },
                unique: true,
                filter: "[IsActive] = 1");

            migrationBuilder.AddForeignKey(
                name: "FK_AppUserPinnedAchievements_AppUsers_AppUserId",
                table: "AppUserPinnedAchievements",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUserPinnedAchievements_SteamAchievements_SteamAchievementId",
                table: "AppUserPinnedAchievements",
                column: "SteamAchievementId",
                principalTable: "SteamAchievements",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostAttachments_SocialPosts_SocialPostId",
                table: "SocialPostAttachments",
                column: "SocialPostId",
                principalTable: "SocialPosts",
                principalColumn: "SocialPostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComments_AppUsers_AuthorAppUserId",
                table: "SocialPostComments",
                column: "AuthorAppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComments_SocialPostComments_ParentCommentId",
                table: "SocialPostComments",
                column: "ParentCommentId",
                principalTable: "SocialPostComments",
                principalColumn: "SocialPostCommentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComments_SocialPosts_SocialPostId",
                table: "SocialPostComments",
                column: "SocialPostId",
                principalTable: "SocialPosts",
                principalColumn: "SocialPostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostReactions_AppUsers_AppUserId",
                table: "SocialPostReactions",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostReactions_SocialPosts_SocialPostId",
                table: "SocialPostReactions",
                column: "SocialPostId",
                principalTable: "SocialPosts",
                principalColumn: "SocialPostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPosts_AppUsers_AuthorAppUserId",
                table: "SocialPosts",
                column: "AuthorAppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql(GetUserProfileProcedureSql.UpSql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppUserPinnedAchievements_AppUsers_AppUserId",
                table: "AppUserPinnedAchievements");

            migrationBuilder.DropForeignKey(
                name: "FK_AppUserPinnedAchievements_SteamAchievements_SteamAchievementId",
                table: "AppUserPinnedAchievements");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostAttachments_SocialPosts_SocialPostId",
                table: "SocialPostAttachments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_AppUsers_AuthorAppUserId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_SocialPostComments_ParentCommentId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_SocialPosts_SocialPostId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostReactions_AppUsers_AppUserId",
                table: "SocialPostReactions");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostReactions_SocialPosts_SocialPostId",
                table: "SocialPostReactions");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPosts_AppUsers_AuthorAppUserId",
                table: "SocialPosts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPosts",
                table: "SocialPosts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostReactions",
                table: "SocialPostReactions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostComments",
                table: "SocialPostComments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostAttachments",
                table: "SocialPostAttachments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AppUserPinnedAchievements",
                table: "AppUserPinnedAchievements");

            migrationBuilder.DropIndex(
                name: "IX_AppUserPinnedAchievements_AppUserId_PlatformId_SteamAchievementId",
                table: "AppUserPinnedAchievements");

            migrationBuilder.DropColumn(
                name: "PlatformId",
                table: "AppUserPinnedAchievements");

            migrationBuilder.RenameTable(
                name: "SocialPosts",
                newName: "SocialPost");

            migrationBuilder.RenameTable(
                name: "SocialPostReactions",
                newName: "SocialPostReaction");

            migrationBuilder.RenameTable(
                name: "SocialPostComments",
                newName: "SocialPostComment");

            migrationBuilder.RenameTable(
                name: "SocialPostAttachments",
                newName: "SocialPostAttachment");

            migrationBuilder.RenameTable(
                name: "AppUserPinnedAchievements",
                newName: "AppUserPinnedAchievement");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPosts_PublicId",
                table: "SocialPost",
                newName: "IX_SocialPost_PublicId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPosts_CreateDate_SocialPostId",
                table: "SocialPost",
                newName: "IX_SocialPost_CreateDate_SocialPostId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPosts_AuthorAppUserId_CreateDate_SocialPostId",
                table: "SocialPost",
                newName: "IX_SocialPost_AuthorAppUserId_CreateDate_SocialPostId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostReactions_SocialPostId",
                table: "SocialPostReaction",
                newName: "IX_SocialPostReaction_SocialPostId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostReactions_AppUserId",
                table: "SocialPostReaction",
                newName: "IX_SocialPostReaction_AppUserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComments_SocialPostId_CreateDate_SocialPostCommentId",
                table: "SocialPostComment",
                newName: "IX_SocialPostComment_SocialPostId_CreateDate_SocialPostCommentId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComments_PublicId",
                table: "SocialPostComment",
                newName: "IX_SocialPostComment_PublicId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComments_ParentCommentId",
                table: "SocialPostComment",
                newName: "IX_SocialPostComment_ParentCommentId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComments_AuthorAppUserId",
                table: "SocialPostComment",
                newName: "IX_SocialPostComment_AuthorAppUserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostAttachments_SocialPostId_DisplayOrder",
                table: "SocialPostAttachment",
                newName: "IX_SocialPostAttachment_SocialPostId_DisplayOrder");

            migrationBuilder.RenameColumn(
                name: "SteamAchievementId",
                table: "AppUserPinnedAchievement",
                newName: "AchievementId");

            migrationBuilder.RenameIndex(
                name: "IX_AppUserPinnedAchievements_SteamAchievementId",
                table: "AppUserPinnedAchievement",
                newName: "IX_AppUserPinnedAchievement_AchievementId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPost",
                table: "SocialPost",
                column: "SocialPostId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostReaction",
                table: "SocialPostReaction",
                columns: new[] { "SocialPostId", "AppUserId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostComment",
                table: "SocialPostComment",
                column: "SocialPostCommentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostAttachment",
                table: "SocialPostAttachment",
                column: "SocialPostAttachmentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AppUserPinnedAchievement",
                table: "AppUserPinnedAchievement",
                column: "AppUserPinnedAchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUserPinnedAchievement_AppUserId_AchievementId",
                table: "AppUserPinnedAchievement",
                columns: new[] { "AppUserId", "AchievementId" },
                unique: true,
                filter: "[IsActive] = 1");

            migrationBuilder.AddForeignKey(
                name: "FK_AppUserPinnedAchievement_AppUsers_AppUserId",
                table: "AppUserPinnedAchievement",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AppUserPinnedAchievement_SteamAchievements_AchievementId",
                table: "AppUserPinnedAchievement",
                column: "AchievementId",
                principalTable: "SteamAchievements",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPost_AppUsers_AuthorAppUserId",
                table: "SocialPost",
                column: "AuthorAppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostAttachment_SocialPost_SocialPostId",
                table: "SocialPostAttachment",
                column: "SocialPostId",
                principalTable: "SocialPost",
                principalColumn: "SocialPostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComment_AppUsers_AuthorAppUserId",
                table: "SocialPostComment",
                column: "AuthorAppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComment_SocialPostComment_ParentCommentId",
                table: "SocialPostComment",
                column: "ParentCommentId",
                principalTable: "SocialPostComment",
                principalColumn: "SocialPostCommentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComment_SocialPost_SocialPostId",
                table: "SocialPostComment",
                column: "SocialPostId",
                principalTable: "SocialPost",
                principalColumn: "SocialPostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostReaction_AppUsers_AppUserId",
                table: "SocialPostReaction",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "AppUserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostReaction_SocialPost_SocialPostId",
                table: "SocialPostReaction",
                column: "SocialPostId",
                principalTable: "SocialPost",
                principalColumn: "SocialPostId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class UsersAndRolesInitial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    AppUserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PublicId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    IsListedOnLeaderboards = table.Column<bool>(type: "bit", nullable: false),
                    LastLoginOnUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.AppUserId);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "UserExternalLogins",
                columns: table => new
                {
                    UserExternalLoginId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    AuthProvider = table.Column<short>(type: "smallint", nullable: false),
                    ProviderUserId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserExternalLogins", x => x.UserExternalLoginId);
                    table.CheckConstraint("CK_UserExternalLogins_AuthProvider", "[AuthProvider] IN (1)");
                    table.ForeignKey(
                        name: "FK_UserExternalLogins_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.AppUserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSteamProfiles",
                columns: table => new
                {
                    UserExternalLoginId = table.Column<int>(type: "int", nullable: false),
                    SteamId = table.Column<long>(type: "bigint", nullable: false),
                    PersonaName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ProfileUrl = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AvatarSmallUrl = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AvatarMediumUrl = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AvatarFullUrl = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsPrivate = table.Column<bool>(type: "bit", nullable: false),
                    LastCheckedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastSyncedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSteamProfiles", x => x.UserExternalLoginId);
                    table.ForeignKey(
                        name: "FK_UserSteamProfiles_UserExternalLogins_UserExternalLoginId",
                        column: x => x.UserExternalLoginId,
                        principalTable: "UserExternalLogins",
                        principalColumn: "UserExternalLoginId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_PublicId",
                table: "AppUsers",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserExternalLogins_AppUserId_AuthProvider",
                table: "UserExternalLogins",
                columns: new[] { "AppUserId", "AuthProvider" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserExternalLogins_AuthProvider_ProviderUserId",
                table: "UserExternalLogins",
                columns: new[] { "AuthProvider", "ProviderUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSteamProfiles_SteamId",
                table: "UserSteamProfiles",
                column: "SteamId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "UserSteamProfiles");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "UserExternalLogins");

            migrationBuilder.DropTable(
                name: "AppUsers");
        }
    }
}

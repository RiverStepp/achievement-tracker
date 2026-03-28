using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AchievementTracker.Data.Migrations
{
    /// <inheritdoc />
    public partial class SocialPostAttachmentDisplayOrderDefault100 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DECLARE @df sysname;
                SELECT @df = dc.name
                FROM sys.default_constraints dc
                INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
                WHERE dc.parent_object_id = OBJECT_ID(N'SocialPostAttachment') AND c.name = N'DisplayOrder';

                IF @df IS NOT NULL
                BEGIN
                    DECLARE @drop nvarchar(max) = N'ALTER TABLE SocialPostAttachment DROP CONSTRAINT ' + QUOTENAME(@df);
                    EXEC sp_executesql @drop;
                END

                ALTER TABLE SocialPostAttachment ADD CONSTRAINT DF_SocialPostAttachment_DisplayOrder DEFAULT ((100)) FOR DisplayOrder;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DECLARE @df sysname;
                SELECT @df = dc.name
                FROM sys.default_constraints dc
                INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
                WHERE dc.parent_object_id = OBJECT_ID(N'SocialPostAttachment') AND c.name = N'DisplayOrder';

                IF @df IS NOT NULL
                BEGIN
                    DECLARE @drop nvarchar(max) = N'ALTER TABLE SocialPostAttachment DROP CONSTRAINT ' + QUOTENAME(@df);
                    EXEC sp_executesql @drop;
                END

                ALTER TABLE SocialPostAttachment ADD CONSTRAINT DF_SocialPostAttachment_DisplayOrder DEFAULT ((0)) FOR DisplayOrder;
                """);
        }
    }
}

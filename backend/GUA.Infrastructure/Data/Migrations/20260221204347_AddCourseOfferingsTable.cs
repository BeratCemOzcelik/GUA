using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GUA.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseOfferingsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseOfferings_FacultyProfiles_FacultyId",
                table: "CourseOfferings");

            migrationBuilder.RenameColumn(
                name: "FacultyId",
                table: "CourseOfferings",
                newName: "FacultyProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_CourseOfferings_FacultyId",
                table: "CourseOfferings",
                newName: "IX_CourseOfferings_FacultyProfileId");

            migrationBuilder.AddColumn<string>(
                name: "Section",
                table: "CourseOfferings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseOfferings_FacultyProfiles_FacultyProfileId",
                table: "CourseOfferings",
                column: "FacultyProfileId",
                principalTable: "FacultyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseOfferings_FacultyProfiles_FacultyProfileId",
                table: "CourseOfferings");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "CourseOfferings");

            migrationBuilder.RenameColumn(
                name: "FacultyProfileId",
                table: "CourseOfferings",
                newName: "FacultyId");

            migrationBuilder.RenameIndex(
                name: "IX_CourseOfferings_FacultyProfileId",
                table: "CourseOfferings",
                newName: "IX_CourseOfferings_FacultyId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseOfferings_FacultyProfiles_FacultyId",
                table: "CourseOfferings",
                column: "FacultyId",
                principalTable: "FacultyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

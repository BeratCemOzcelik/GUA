using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GUA.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentInstallments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "InstallmentNumber",
                table: "Payments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalInstallments",
                table: "Payments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "InstallmentNumber",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "TotalInstallments",
                table: "Payments");
        }
    }
}

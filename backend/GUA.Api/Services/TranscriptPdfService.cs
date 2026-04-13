using System.Globalization;
using GUA.Shared.DTOs.Transcript;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace GUA.Api.Services;

public class TranscriptPdfService
{
    public byte[] GeneratePdf(TranscriptDataDto data, string? verificationCode, bool isOfficial)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(30);
                page.MarginBottom(30);
                page.MarginHorizontal(40);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                page.Header().Element(c => ComposeHeader(c, isOfficial));
                page.Content().Element(c => ComposeContent(c, data, verificationCode, isOfficial));
                page.Footer().Element(c => ComposeFooter(c, verificationCode));
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container, bool isOfficial)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("GLOBAL UNIVERSITY AMERICA")
                        .Bold().FontSize(18).FontColor("#8B1A1A");
                    c.Item().Text("21 Overlook Ridge Terrace no:332, Revere/Massachusetts, U.S.A 02151")
                        .FontSize(8).FontColor("#666666");
                    c.Item().Text("www.gua.edu.pl  |  edu@gua.edu.pl")
                        .FontSize(8).FontColor("#666666");
                });

                row.ConstantItem(80).AlignRight().AlignMiddle().Column(c =>
                {
                    if (isOfficial)
                    {
                        c.Item().Border(1).BorderColor("#8B1A1A").Padding(4)
                            .Text("OFFICIAL").Bold().FontSize(10).FontColor("#8B1A1A").AlignCenter();
                    }
                    else
                    {
                        c.Item().Border(1).BorderColor("#999999").Padding(4)
                            .Text("UNOFFICIAL").Bold().FontSize(10).FontColor("#999999").AlignCenter();
                    }
                });
            });

            col.Item().PaddingTop(5).LineHorizontal(2).LineColor("#8B1A1A");

            col.Item().PaddingTop(8).AlignCenter()
                .Text("ACADEMIC TRANSCRIPT").Bold().FontSize(14).FontColor("#1B2A4A");

            col.Item().PaddingBottom(10);
        });
    }

    private void ComposeContent(IContainer container, TranscriptDataDto data, string? verificationCode, bool isOfficial)
    {
        container.Column(col =>
        {
            // Student Information
            col.Item().Element(c => ComposeStudentInfo(c, data.Student));

            // Term Records
            foreach (var term in data.TermRecords)
            {
                col.Item().Element(c => ComposeTermRecord(c, term));
            }

            // GPA Summary
            col.Item().PaddingTop(10).Element(c => ComposeGPASummary(c, data.GPASummary));

            // Grading Scale
            col.Item().PaddingTop(15).Element(ComposeGradingScale);

            // Official stamp
            if (isOfficial && !string.IsNullOrEmpty(verificationCode))
            {
                col.Item().PaddingTop(15).Element(c => ComposeOfficialStamp(c, verificationCode, data.GeneratedAt));
            }
        });
    }

    private void ComposeStudentInfo(IContainer container, StudentInfo student)
    {
        container.Background("#F8F8F8").Border(1).BorderColor("#E0E0E0").Padding(10).Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(t =>
                    {
                        t.Span("Student Name: ").FontColor("#666666");
                        t.Span(student.FullName).Bold();
                    });
                    c.Item().PaddingTop(3).Text(t =>
                    {
                        t.Span("Student ID: ").FontColor("#666666");
                        t.Span(student.StudentNumber).Bold();
                    });
                    c.Item().PaddingTop(3).Text(t =>
                    {
                        t.Span("Email: ").FontColor("#666666");
                        t.Span(student.Email);
                    });
                });

                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(t =>
                    {
                        t.Span("Program: ").FontColor("#666666");
                        t.Span(student.ProgramName).Bold();
                    });
                    c.Item().PaddingTop(3).Text(t =>
                    {
                        t.Span("Department: ").FontColor("#666666");
                        t.Span(student.DepartmentName);
                    });
                    c.Item().PaddingTop(3).Text(t =>
                    {
                        t.Span("Enrollment Date: ").FontColor("#666666");
                        t.Span(student.EnrollmentDate.ToString("MMMM dd, yyyy", CultureInfo.InvariantCulture));
                    });
                    if (student.ExpectedGraduationDate.HasValue)
                    {
                        c.Item().PaddingTop(3).Text(t =>
                        {
                            t.Span("Graduation Date: ").FontColor("#666666");
                            t.Span(student.ExpectedGraduationDate.Value.ToString("MMMM dd, yyyy", CultureInfo.InvariantCulture));
                        });
                    }
                    c.Item().PaddingTop(3).Text(t =>
                    {
                        t.Span("Status: ").FontColor("#666666");
                        t.Span(student.AcademicStatus).Bold();
                    });
                });
            });
        });
    }

    private void ComposeTermRecord(IContainer container, TermRecord term)
    {
        container.PaddingTop(12).Column(col =>
        {
            // Term header
            col.Item().Background("#1B2A4A").Padding(6).Row(row =>
            {
                row.RelativeItem().Text(term.TermName).Bold().FontSize(10).FontColor(Colors.White);
                if (!string.IsNullOrEmpty(term.TermCode))
                {
                    row.ConstantItem(100).AlignRight()
                        .Text(term.TermCode).FontSize(9).FontColor("#D4AF37");
                }
            });

            // Courses table header
            col.Item().Border(1).BorderColor("#E0E0E0").Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(70);  // Code
                    columns.RelativeColumn();     // Name
                    columns.ConstantColumn(50);   // Credits
                    columns.ConstantColumn(50);   // Grade
                    columns.ConstantColumn(60);   // Points
                });

                // Header row
                table.Header(header =>
                {
                    header.Cell().Background("#F0F0F0").BorderBottom(1).BorderColor("#E0E0E0").Padding(4)
                        .Text("Code").Bold().FontSize(8);
                    header.Cell().Background("#F0F0F0").BorderBottom(1).BorderColor("#E0E0E0").Padding(4)
                        .Text("Course Name").Bold().FontSize(8);
                    header.Cell().Background("#F0F0F0").BorderBottom(1).BorderColor("#E0E0E0").Padding(4).AlignCenter()
                        .Text("Credits").Bold().FontSize(8);
                    header.Cell().Background("#F0F0F0").BorderBottom(1).BorderColor("#E0E0E0").Padding(4).AlignCenter()
                        .Text("Grade").Bold().FontSize(8);
                    header.Cell().Background("#F0F0F0").BorderBottom(1).BorderColor("#E0E0E0").Padding(4).AlignCenter()
                        .Text("Points").Bold().FontSize(8);
                });

                // Course rows
                foreach (var course in term.Courses)
                {
                    string bgColor = term.Courses.IndexOf(course) % 2 == 0 ? "#FFFFFF" : "#FAFAFA";

                    table.Cell().Background(bgColor).Padding(4)
                        .Text(course.CourseCode).FontSize(8);
                    table.Cell().Background(bgColor).Padding(4)
                        .Text(course.CourseName).FontSize(8);
                    table.Cell().Background(bgColor).Padding(4).AlignCenter()
                        .Text(course.Credits.ToString()).FontSize(8);
                    table.Cell().Background(bgColor).Padding(4).AlignCenter()
                        .Text(course.LetterGrade).Bold().FontSize(8);
                    table.Cell().Background(bgColor).Padding(4).AlignCenter()
                        .Text(course.GradePoints.ToString("F2", CultureInfo.InvariantCulture)).FontSize(8);
                }
            });

            // Term summary
            col.Item().Background("#F8F8F8").Border(1).BorderColor("#E0E0E0").BorderTop(0).Padding(6).Row(row =>
            {
                row.RelativeItem().Text(t =>
                {
                    t.Span("Term Credits: ").FontSize(8).FontColor("#666666");
                    t.Span(term.TermCredits.ToString()).Bold().FontSize(8);
                });
                row.RelativeItem().Text(t =>
                {
                    t.Span("Term GPA: ").FontSize(8).FontColor("#666666");
                    t.Span(term.TermGPA.ToString("F2", CultureInfo.InvariantCulture)).Bold().FontSize(8);
                });
                row.RelativeItem().Text(t =>
                {
                    t.Span("Cumulative Credits: ").FontSize(8).FontColor("#666666");
                    t.Span(term.CumulativeCredits.ToString()).Bold().FontSize(8);
                });
                row.RelativeItem().Text(t =>
                {
                    t.Span("Cumulative GPA: ").FontSize(8).FontColor("#666666");
                    t.Span(term.CumulativeGPA.ToString("F2", CultureInfo.InvariantCulture)).Bold().FontSize(8).FontColor("#8B1A1A");
                });
            });
        });
    }

    private void ComposeGPASummary(IContainer container, GPASummary gpa)
    {
        container.Background("#8B1A1A").Padding(12).Column(col =>
        {
            col.Item().Text("ACADEMIC SUMMARY").Bold().FontSize(11).FontColor(Colors.White);
            col.Item().PaddingTop(8).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Cumulative GPA").FontSize(8).FontColor("#D4AF37");
                    c.Item().Text(gpa.OverallGPA.ToString("F2", CultureInfo.InvariantCulture)).Bold().FontSize(18).FontColor(Colors.White);
                });
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Credits Earned").FontSize(8).FontColor("#D4AF37");
                    c.Item().Text(gpa.TotalCreditsEarned.ToString()).Bold().FontSize(18).FontColor(Colors.White);
                });
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Credits Attempted").FontSize(8).FontColor("#D4AF37");
                    c.Item().Text(gpa.TotalCreditsAttempted.ToString()).Bold().FontSize(18).FontColor(Colors.White);
                });
            });
        });
    }

    private void ComposeGradingScale(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Text("GRADING SCALE").Bold().FontSize(9).FontColor("#1B2A4A");
            col.Item().PaddingTop(4).Border(1).BorderColor("#E0E0E0").Padding(8).Row(row =>
            {
                row.RelativeItem().Text(t =>
                {
                    t.Span("A (4.0) = 93-100%\n").FontSize(7);
                    t.Span("A- (3.7) = 90-92%\n").FontSize(7);
                    t.Span("B+ (3.3) = 87-89%\n").FontSize(7);
                    t.Span("B (3.0) = 83-86%").FontSize(7);
                });
                row.RelativeItem().Text(t =>
                {
                    t.Span("B- (2.7) = 80-82%\n").FontSize(7);
                    t.Span("C+ (2.3) = 77-79%\n").FontSize(7);
                    t.Span("C (2.0) = 73-76%\n").FontSize(7);
                    t.Span("C- (1.7) = 70-72%").FontSize(7);
                });
                row.RelativeItem().Text(t =>
                {
                    t.Span("D+ (1.3) = 67-69%\n").FontSize(7);
                    t.Span("D (1.0) = 60-66%\n").FontSize(7);
                    t.Span("F (0.0) = Below 60%").FontSize(7);
                });
            });
        });
    }

    private void ComposeOfficialStamp(IContainer container, string verificationCode, DateTime generatedAt)
    {
        container.Border(2).BorderColor("#8B1A1A").Padding(10).Column(col =>
        {
            col.Item().AlignCenter().Text("OFFICIAL DOCUMENT").Bold().FontSize(10).FontColor("#8B1A1A");
            col.Item().PaddingTop(5).AlignCenter().Text(t =>
            {
                t.Span("This is an official academic transcript issued by Global University America.").FontSize(8);
            });
            col.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().AlignCenter().Text(t =>
                {
                    t.Span("Verification Code: ").FontSize(8).FontColor("#666666");
                    t.Span(verificationCode).Bold().FontSize(9);
                });
                row.RelativeItem().AlignCenter().Text(t =>
                {
                    t.Span("Date Issued: ").FontSize(8).FontColor("#666666");
                    t.Span(generatedAt.ToString("MMMM dd, yyyy", CultureInfo.InvariantCulture)).FontSize(8);
                });
            });
            col.Item().PaddingTop(5).AlignCenter()
                .Text("Verify at: www.gua.edu.pl/diploma-inquiry").FontSize(7).FontColor("#666666");
        });
    }

    private void ComposeFooter(IContainer container, string? verificationCode)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(1).LineColor("#E0E0E0");
            col.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().Text(t =>
                {
                    t.Span("Global University America").FontSize(7).FontColor("#999999");
                    if (!string.IsNullOrEmpty(verificationCode))
                    {
                        t.Span($"  |  Verification: {verificationCode}").FontSize(7).FontColor("#999999");
                    }
                });
                row.RelativeItem().AlignRight().Text(t =>
                {
                    t.Span("Page ").FontSize(7).FontColor("#999999");
                    t.CurrentPageNumber().FontSize(7).FontColor("#999999");
                    t.Span(" of ").FontSize(7).FontColor("#999999");
                    t.TotalPages().FontSize(7).FontColor("#999999");
                });
            });
        });
    }
}

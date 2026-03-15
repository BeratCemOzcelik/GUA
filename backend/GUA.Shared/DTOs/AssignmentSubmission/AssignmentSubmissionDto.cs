using GUA.Shared.Enums;

namespace GUA.Shared.DTOs.AssignmentSubmission;

public class AssignmentSubmissionDto
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int GradeComponentId { get; set; }

    public string GradeComponentName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public decimal MaxScore { get; set; }
    public decimal Weight { get; set; }

    public DateTime SubmittedAt { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }

    public string? StudentComments { get; set; }
    public SubmissionStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;

    // Grade info (if graded)
    public decimal? Score { get; set; }
    public string? FacultyComments { get; set; }
    public DateTime? GradedAt { get; set; }
}

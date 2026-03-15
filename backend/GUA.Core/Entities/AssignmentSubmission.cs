using GUA.Shared.Enums;

namespace GUA.Core.Entities;

/// <summary>
/// Represents a student's submission for an assignment/project
/// </summary>
public class AssignmentSubmission : BaseEntity
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int GradeComponentId { get; set; }

    public DateTime SubmittedAt { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; } // in bytes

    public string? StudentComments { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Pending;

    // Navigation properties
    public virtual Enrollment Enrollment { get; set; } = null!;
    public virtual GradeComponent GradeComponent { get; set; } = null!;
}

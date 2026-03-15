namespace GUA.Shared.DTOs.AssignmentSubmission;

public class CreateAssignmentSubmissionDto
{
    public int GradeComponentId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? StudentComments { get; set; }
}

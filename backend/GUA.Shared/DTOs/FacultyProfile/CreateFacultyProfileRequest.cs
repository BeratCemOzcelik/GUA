namespace GUA.Shared.DTOs.FacultyProfile;

public class CreateFacultyProfileRequest
{
    public Guid UserId { get; set; }
    public string? Title { get; set; }
    public string? Bio { get; set; }
    public string? ResearchInterests { get; set; }
    public string? OfficeLocation { get; set; }
    public string? OfficeHours { get; set; }
    public string? PhotoUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GoogleScholarUrl { get; set; }
}

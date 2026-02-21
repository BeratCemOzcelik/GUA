namespace GUA.Shared.DTOs.FacultyProfile;

public class FacultyProfileDto
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Bio { get; set; }
    public string? ResearchInterests { get; set; }
    public string? OfficeLocation { get; set; }
    public string? OfficeHours { get; set; }
    public string? PhotoUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GoogleScholarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

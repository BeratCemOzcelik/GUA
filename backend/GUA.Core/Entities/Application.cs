using GUA.Shared.Enums;

namespace GUA.Core.Entities;

public class Application : BaseEntity
{
    public int Id { get; set; }
    public string ApplicantEmail { get; set; } = string.Empty;
    public string ApplicantFirstName { get; set; } = string.Empty;
    public string ApplicantLastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int ProgramId { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }

    // Navigation properties
    public virtual Program Program { get; set; } = null!;
    public virtual User? ReviewedBy { get; set; }
    public virtual ICollection<ApplicationDocument> Documents { get; set; } = new List<ApplicationDocument>();
}

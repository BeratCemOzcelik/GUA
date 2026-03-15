using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ApplicationEntity = GUA.Core.Entities.Application;
using ProgramEntity = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IRepository<ApplicationEntity> _applicationRepository;
    private readonly IRepository<ProgramEntity> _programRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<ApplicationsController> _logger;

    public ApplicationsController(
        IRepository<ApplicationEntity> applicationRepository,
        IRepository<ProgramEntity> programRepository,
        IEmailService emailService,
        ILogger<ApplicationsController> logger)
    {
        _applicationRepository = applicationRepository;
        _programRepository = programRepository;
        _emailService = emailService;
        _logger = logger;
    }

    // POST api/Applications - Public: submit new application
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> Create([FromBody] CreateApplicationRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
                return BadRequest(ApiResponse<ApplicationResponseDto>.FailureResult("First name and last name are required"));

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(ApiResponse<ApplicationResponseDto>.FailureResult("Email is required"));

            if (request.ProgramId <= 0)
                return BadRequest(ApiResponse<ApplicationResponseDto>.FailureResult("Please select a program"));

            var program = await _programRepository.GetByIdAsync(request.ProgramId);
            if (program == null)
                return BadRequest(ApiResponse<ApplicationResponseDto>.FailureResult("Selected program not found"));

            var application = new ApplicationEntity
            {
                ApplicantFirstName = request.FirstName,
                ApplicantLastName = request.LastName,
                ApplicantEmail = request.Email.ToLower(),
                PhoneNumber = request.Phone,
                ProgramId = request.ProgramId,
                Notes = request.Notes,
                Status = ApplicationStatus.Submitted,
                SubmittedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _applicationRepository.AddAsync(application);

            // Send confirmation email (fire and forget)
            _ = _emailService.SendApplicationConfirmationAsync(
                created.ApplicantEmail,
                $"{created.ApplicantFirstName} {created.ApplicantLastName}",
                program.Name);

            var dto = new ApplicationResponseDto
            {
                Id = created.Id,
                Status = created.Status.ToString(),
                Message = "Your application has been submitted successfully. You will receive a confirmation email shortly."
            };

            return Ok(ApiResponse<ApplicationResponseDto>.SuccessResult(dto, "Application submitted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating application");
            return StatusCode(500, ApiResponse<ApplicationResponseDto>.FailureResult(
                "An error occurred while submitting your application. Please try again."));
        }
    }

    // GET api/Applications - Admin: list all applications
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ApplicationListDto>>>> GetAll()
    {
        try
        {
            var applications = await _applicationRepository.GetAllAsync();
            var programIds = applications.Select(a => a.ProgramId).Distinct().ToList();
            var programs = await _programRepository.FindAsync(p => programIds.Contains(p.Id));
            var programDict = programs.ToDictionary(p => p.Id);

            var dtos = applications
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new ApplicationListDto
                {
                    Id = a.Id,
                    ApplicantName = $"{a.ApplicantFirstName} {a.ApplicantLastName}",
                    ApplicantEmail = a.ApplicantEmail,
                    PhoneNumber = a.PhoneNumber,
                    ProgramName = programDict.GetValueOrDefault(a.ProgramId)?.Name ?? "Unknown",
                    Status = a.Status.ToString(),
                    SubmittedAt = a.SubmittedAt,
                    ReviewedAt = a.ReviewedAt,
                    Notes = a.Notes,
                    RejectionReason = a.RejectionReason,
                    CreatedAt = a.CreatedAt
                });

            return Ok(ApiResponse<IEnumerable<ApplicationListDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving applications");
            return StatusCode(500, ApiResponse<IEnumerable<ApplicationListDto>>.FailureResult(
                "An error occurred while retrieving applications"));
        }
    }

    // PUT api/Applications/{id}/status - Admin: update application status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(int id, [FromBody] UpdateApplicationStatusRequest request)
    {
        try
        {
            var application = await _applicationRepository.GetByIdAsync(id);
            if (application == null)
                return NotFound(ApiResponse<bool>.FailureResult("Application not found"));

            if (!Enum.TryParse<ApplicationStatus>(request.Status, out var status))
                return BadRequest(ApiResponse<bool>.FailureResult("Invalid status"));

            application.Status = status;
            application.ReviewedAt = DateTime.UtcNow;
            application.RejectionReason = request.RejectionReason;
            application.UpdatedAt = DateTime.UtcNow;

            var userIdClaim = User.FindFirst("userId")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                application.ReviewedByUserId = userId;

            await _applicationRepository.UpdateAsync(application);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Application status updated"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult("An error occurred"));
        }
    }
}

// DTOs
public class CreateApplicationRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int ProgramId { get; set; }
    public string? Notes { get; set; }
}

public class ApplicationResponseDto
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class ApplicationListDto
{
    public int Id { get; set; }
    public string ApplicantName { get; set; } = string.Empty;
    public string ApplicantEmail { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateApplicationStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
}

using GUA.Core.Entities;
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
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<ApplicationsController> _logger;

    public ApplicationsController(
        IRepository<ApplicationEntity> applicationRepository,
        IRepository<ProgramEntity> programRepository,
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<StudentProfile> studentRepository,
        IRepository<Payment> paymentRepository,
        IEmailService emailService,
        ILogger<ApplicationsController> logger)
    {
        _applicationRepository = applicationRepository;
        _programRepository = programRepository;
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _studentRepository = studentRepository;
        _paymentRepository = paymentRepository;
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
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationListDto>>>> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] int? programId = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 1000) pageSize = 1000;

            var applications = (await _applicationRepository.GetAllAsync()).ToList();

            if (!string.IsNullOrWhiteSpace(status)
                && Enum.TryParse<ApplicationStatus>(status, true, out var statusEnum))
            {
                applications = applications.Where(a => a.Status == statusEnum).ToList();
            }

            if (programId.HasValue)
                applications = applications.Where(a => a.ProgramId == programId.Value).ToList();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                applications = applications.Where(a =>
                    a.ApplicantFirstName.ToLowerInvariant().Contains(term)
                    || a.ApplicantLastName.ToLowerInvariant().Contains(term)
                    || a.ApplicantEmail.ToLowerInvariant().Contains(term)
                    || (a.PhoneNumber ?? "").ToLowerInvariant().Contains(term)).ToList();
            }

            var totalCount = applications.Count;

            var pagedApplications = applications
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var programIds = pagedApplications.Select(a => a.ProgramId).Distinct().ToList();
            var programs = await _programRepository.FindAsync(p => programIds.Contains(p.Id));
            var programDict = programs.ToDictionary(p => p.Id);

            var dtos = pagedApplications.Select(a => new ApplicationListDto
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
            }).ToList();

            var result = PagedResult<ApplicationListDto>.Create(dtos, totalCount, page, pageSize);
            return Ok(ApiResponse<PagedResult<ApplicationListDto>>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving applications");
            return StatusCode(500, ApiResponse<PagedResult<ApplicationListDto>>.FailureResult(
                "An error occurred while retrieving applications"));
        }
    }

    // PUT api/Applications/{id}/status - Admin: update application status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<ApplicationApprovalResult>>> UpdateStatus(int id, [FromBody] UpdateApplicationStatusRequest request)
    {
        try
        {
            var application = await _applicationRepository.GetByIdAsync(id);
            if (application == null)
                return NotFound(ApiResponse<ApplicationApprovalResult>.FailureResult("Application not found"));

            if (!Enum.TryParse<ApplicationStatus>(request.Status, out var status))
                return BadRequest(ApiResponse<ApplicationApprovalResult>.FailureResult("Invalid status"));

            application.Status = status;
            application.ReviewedAt = DateTime.UtcNow;
            application.RejectionReason = request.RejectionReason;
            application.UpdatedAt = DateTime.UtcNow;

            var userIdClaim = User.FindFirst("userId")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                application.ReviewedByUserId = userId;

            await _applicationRepository.UpdateAsync(application);

            var result = new ApplicationApprovalResult { StatusUpdated = true };

            // If approved, auto-create user + student profile + payment plan
            if (status == ApplicationStatus.Approved)
            {
                try
                {
                    // Check if user already exists with this email
                    var existingUsers = await _userRepository.FindAsync(u => u.Email == application.ApplicantEmail);
                    if (existingUsers.Any())
                    {
                        result.Message = "Status updated. User already exists with this email, skipped auto-creation.";
                        return Ok(ApiResponse<ApplicationApprovalResult>.SuccessResult(result));
                    }

                    // 1. Generate password
                    var password = GeneratePassword();

                    // 2. Create User
                    var newUser = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = application.ApplicantEmail,
                        FirstName = application.ApplicantFirstName,
                        LastName = application.ApplicantLastName,
                        PhoneNumber = application.PhoneNumber,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _userRepository.AddAsync(newUser);

                    // 3. Assign Student role (RoleId = 4)
                    var userRole = new UserRole
                    {
                        UserId = newUser.Id,
                        RoleId = 4, // Student
                        AssignedAt = DateTime.UtcNow
                    };
                    await _userRoleRepository.AddAsync(userRole);

                    // 4. Create Student Profile
                    var studentNumber = await GenerateStudentNumber();
                    var program = await _programRepository.GetByIdAsync(application.ProgramId);

                    var studentProfile = new StudentProfile
                    {
                        UserId = newUser.Id,
                        StudentNumber = studentNumber,
                        ProgramId = application.ProgramId,
                        EnrollmentDate = DateTime.UtcNow,
                        ExpectedGraduationDate = DateTime.UtcNow.AddYears(program?.DurationYears ?? 4),
                        CurrentGPA = 0.0m,
                        TotalCreditsEarned = 0,
                        AcademicStatus = AcademicStatus.Active,
                        CreatedAt = DateTime.UtcNow
                    };
                    var createdStudent = await _studentRepository.AddAsync(studentProfile);

                    // 5. Create 6 installment payments if program has tuition fee
                    if (program?.TuitionFee != null && program.TuitionFee > 0)
                    {
                        var totalAmount = program.TuitionFee.Value;
                        var installmentAmount = Math.Round(totalAmount / 6, 2);
                        var lastInstallmentAmount = totalAmount - (installmentAmount * 5);

                        for (int i = 1; i <= 6; i++)
                        {
                            var payment = new Payment
                            {
                                StudentId = createdStudent.Id,
                                Amount = i == 6 ? lastInstallmentAmount : installmentAmount,
                                Currency = "USD",
                                Description = $"Tuition Payment - Installment {i}/6",
                                Type = (int)PaymentType.Tuition,
                                Status = (int)PaymentStatus.Pending,
                                InstallmentNumber = i,
                                TotalInstallments = 6,
                                DueDate = DateTime.UtcNow.AddMonths(i - 1)
                            };
                            await _paymentRepository.AddAsync(payment);
                        }
                    }

                    // 6. Send welcome email with credentials
                    _ = _emailService.SendWelcomeEmailAsync(
                        application.ApplicantEmail,
                        $"{application.ApplicantFirstName} {application.ApplicantLastName}",
                        password,
                        studentNumber);

                    result.StudentCreated = true;
                    result.StudentNumber = studentNumber;
                    result.GeneratedPassword = password;
                    result.PaymentPlanCreated = program?.TuitionFee > 0;
                    result.Message = $"Application approved. Student account created: {studentNumber}";

                    _logger.LogInformation("Auto-created student {StudentNumber} for application {AppId}", studentNumber, id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error auto-creating student for application {AppId}", id);
                    result.Message = $"Status updated but auto-creation failed: {ex.Message}";
                }
            }
            else
            {
                result.Message = "Application status updated";
            }

            return Ok(ApiResponse<ApplicationApprovalResult>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application {Id}", id);
            return StatusCode(500, ApiResponse<ApplicationApprovalResult>.FailureResult("An error occurred"));
        }
    }

    private async Task<string> GenerateStudentNumber()
    {
        var year = DateTime.UtcNow.Year;
        var students = await _studentRepository.GetAllAsync();
        var yearStudents = students
            .Where(s => s.StudentNumber.StartsWith($"GUA-{year}"))
            .OrderByDescending(s => s.StudentNumber)
            .ToList();

        int nextNumber = 1;
        if (yearStudents.Any())
        {
            var lastNumber = yearStudents.First().StudentNumber;
            var numberPart = lastNumber.Substring(lastNumber.Length - 4);
            if (int.TryParse(numberPart, out var num))
                nextNumber = num + 1;
        }

        return $"GUA-{year}{nextNumber:D4}";
    }

    private static string GeneratePassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        var random = new Random();
        var password = new char[10];
        for (int i = 0; i < password.Length; i++)
            password[i] = chars[random.Next(chars.Length)];
        return new string(password);
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

public class ApplicationApprovalResult
{
    public bool StatusUpdated { get; set; }
    public bool StudentCreated { get; set; }
    public string? StudentNumber { get; set; }
    public string? GeneratedPassword { get; set; }
    public bool PaymentPlanCreated { get; set; }
    public string? Message { get; set; }
}

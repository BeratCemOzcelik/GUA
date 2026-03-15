using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.AssignmentSubmission;
using GUA.Shared.DTOs.Common;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentSubmissionsController : ControllerBase
{
    private readonly IRepository<AssignmentSubmission> _repository;
    private readonly IRepository<GradeComponent> _componentRepository;
    private readonly IRepository<Enrollment> _enrollmentRepository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<Grade> _gradeRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly ILogger<AssignmentSubmissionsController> _logger;

    public AssignmentSubmissionsController(
        IRepository<AssignmentSubmission> repository,
        IRepository<GradeComponent> componentRepository,
        IRepository<Enrollment> enrollmentRepository,
        IRepository<StudentProfile> studentRepository,
        IRepository<Grade> gradeRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        ILogger<AssignmentSubmissionsController> logger)
    {
        _repository = repository;
        _componentRepository = componentRepository;
        _enrollmentRepository = enrollmentRepository;
        _studentRepository = studentRepository;
        _gradeRepository = gradeRepository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<AssignmentSubmissionDto>>> Submit([FromBody] CreateAssignmentSubmissionDto request)
    {
        try
        {
            // Get current user ID from JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<AssignmentSubmissionDto>.FailureResult("Invalid user token"));
            }

            // Find student profile
            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<AssignmentSubmissionDto>.FailureResult("Student profile not found"));
            }

            // Get grade component to check due date
            var component = await _componentRepository.GetByIdAsync(request.GradeComponentId);
            if (component == null)
            {
                return NotFound(ApiResponse<AssignmentSubmissionDto>.FailureResult("Assignment not found"));
            }

            // Find enrollment
            var enrollments = await _enrollmentRepository.FindAsync(e =>
                e.StudentId == student.Id &&
                e.CourseOfferingId == component.CourseOfferingId);
            var enrollment = enrollments.FirstOrDefault();

            if (enrollment == null)
            {
                return BadRequest(ApiResponse<AssignmentSubmissionDto>.FailureResult("You are not enrolled in this course"));
            }

            // Check if already submitted
            var existingSubmissions = await _repository.FindAsync(s =>
                s.EnrollmentId == enrollment.Id &&
                s.GradeComponentId == request.GradeComponentId);

            if (existingSubmissions.Any())
            {
                return BadRequest(ApiResponse<AssignmentSubmissionDto>.FailureResult("Assignment already submitted. Resubmission is not allowed."));
            }

            // Validate file size (10MB = 10485760 bytes)
            if (request.FileSize > 10485760)
            {
                return BadRequest(ApiResponse<AssignmentSubmissionDto>.FailureResult("File size exceeds 10MB limit"));
            }

            // Determine status based on due date
            var now = DateTime.UtcNow;
            var status = component.DueDate.HasValue && now > component.DueDate.Value
                ? SubmissionStatus.Late
                : SubmissionStatus.Submitted;

            // Create submission
            var submission = new AssignmentSubmission
            {
                EnrollmentId = enrollment.Id,
                GradeComponentId = request.GradeComponentId,
                SubmittedAt = now,
                FileUrl = request.FileUrl,
                FileName = request.FileName,
                FileSize = request.FileSize,
                StudentComments = request.StudentComments,
                Status = status
            };

            await _repository.AddAsync(submission);

            var dto = await MapToDto(submission);
            return Ok(ApiResponse<AssignmentSubmissionDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting assignment");
            return StatusCode(500, ApiResponse<AssignmentSubmissionDto>.FailureResult(
                "An error occurred while submitting the assignment"));
        }
    }

    [HttpGet("my-submissions")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AssignmentSubmissionDto>>>> GetMySubmissions([FromQuery] int? courseOfferingId = null)
    {
        try
        {
            // Get current user ID
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<IEnumerable<AssignmentSubmissionDto>>.FailureResult("Invalid user token"));
            }

            // Find student profile
            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<AssignmentSubmissionDto>>.FailureResult("Student profile not found"));
            }

            // Get enrollments
            var enrollments = await _enrollmentRepository.FindAsync(e => e.StudentId == student.Id);

            if (courseOfferingId.HasValue)
            {
                enrollments = enrollments.Where(e => e.CourseOfferingId == courseOfferingId.Value).ToList();
            }

            var enrollmentIds = enrollments.Select(e => e.Id).ToList();

            // Get submissions
            var submissions = await _repository.FindAsync(s => enrollmentIds.Contains(s.EnrollmentId));

            var dtos = new List<AssignmentSubmissionDto>();
            foreach (var submission in submissions)
            {
                dtos.Add(await MapToDto(submission));
            }

            return Ok(ApiResponse<IEnumerable<AssignmentSubmissionDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions");
            return StatusCode(500, ApiResponse<IEnumerable<AssignmentSubmissionDto>>.FailureResult(
                "An error occurred while retrieving submissions"));
        }
    }

    [HttpGet("grade-component/{gradeComponentId}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AssignmentSubmissionDto>>>> GetSubmissionsByComponent(int gradeComponentId)
    {
        try
        {
            var submissions = await _repository.FindAsync(s => s.GradeComponentId == gradeComponentId);

            var dtos = new List<AssignmentSubmissionDto>();
            foreach (var submission in submissions)
            {
                dtos.Add(await MapToDto(submission));
            }

            return Ok(ApiResponse<IEnumerable<AssignmentSubmissionDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for component {ComponentId}", gradeComponentId);
            return StatusCode(500, ApiResponse<IEnumerable<AssignmentSubmissionDto>>.FailureResult(
                "An error occurred while retrieving submissions"));
        }
    }

    private async Task<AssignmentSubmissionDto> MapToDto(AssignmentSubmission submission)
    {
        var component = await _componentRepository.GetByIdAsync(submission.GradeComponentId);
        var enrollment = await _enrollmentRepository.GetByIdAsync(submission.EnrollmentId);
        var offering = enrollment != null ? await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId) : null;
        var course = offering != null ? await _courseRepository.GetByIdAsync(offering.CourseId) : null;

        // Get grade if exists
        var grades = await _gradeRepository.FindAsync(g =>
            g.EnrollmentId == submission.EnrollmentId &&
            g.GradeComponentId == submission.GradeComponentId);
        var grade = grades.FirstOrDefault();

        var dto = new AssignmentSubmissionDto
        {
            Id = submission.Id,
            EnrollmentId = submission.EnrollmentId,
            GradeComponentId = submission.GradeComponentId,
            GradeComponentName = component?.Name ?? "",
            CourseCode = course?.Code ?? "",
            CourseName = course?.Name ?? "",
            DueDate = component?.DueDate != null
                ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc)
                : null,
            MaxScore = component?.MaxScore ?? 0,
            Weight = component?.Weight ?? 0,
            SubmittedAt = DateTime.SpecifyKind(submission.SubmittedAt, DateTimeKind.Utc),
            FileUrl = submission.FileUrl,
            FileName = submission.FileName,
            FileSize = submission.FileSize,
            StudentComments = submission.StudentComments,
            Status = submission.Status,
            StatusText = submission.Status.ToString(),
            Score = grade?.Score,
            FacultyComments = grade?.Comments,
            GradedAt = grade != null
                ? DateTime.SpecifyKind(grade.GradedAt, DateTimeKind.Utc)
                : null
        };

        // Update status to Graded if grade exists
        if (grade != null)
        {
            dto.Status = SubmissionStatus.Graded;
            dto.StatusText = "Graded";
        }

        return dto;
    }
}

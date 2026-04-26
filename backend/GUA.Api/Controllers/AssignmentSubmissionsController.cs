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
    private readonly IRepository<FacultyProfile> _facultyRepository;
    private readonly IRepository<Grade> _gradeRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<User> _userRepository;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AssignmentSubmissionsController> _logger;

    public AssignmentSubmissionsController(
        IRepository<AssignmentSubmission> repository,
        IRepository<GradeComponent> componentRepository,
        IRepository<Enrollment> enrollmentRepository,
        IRepository<StudentProfile> studentRepository,
        IRepository<FacultyProfile> facultyRepository,
        IRepository<Grade> gradeRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        IRepository<User> userRepository,
        INotificationService notificationService,
        ILogger<AssignmentSubmissionsController> logger)
    {
        _repository = repository;
        _componentRepository = componentRepository;
        _enrollmentRepository = enrollmentRepository;
        _studentRepository = studentRepository;
        _facultyRepository = facultyRepository;
        _gradeRepository = gradeRepository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _logger = logger;
    }

    private async Task NotifyFacultySubmissionAsync(AssignmentSubmission submission, GradeComponent component, StudentProfile student)
    {
        try
        {
            var offering = await _offeringRepository.GetByIdAsync(component.CourseOfferingId);
            if (offering == null) return;

            var faculty = await _facultyRepository.GetByIdAsync(offering.FacultyProfileId);
            if (faculty == null) return;

            var course = await _courseRepository.GetByIdAsync(offering.CourseId);
            var courseLabel = course != null ? $"{course.Code} - {course.Name}" : "your course";

            var studentUser = await _userRepository.GetByIdAsync(student.UserId);
            var studentName = studentUser != null ? $"{studentUser.FirstName} {studentUser.LastName}" : student.StudentNumber;

            var title = "New assignment submission";
            var lateNote = submission.Status == SubmissionStatus.Late ? " (late)" : "";
            var message = $"{studentName} submitted \"{component.Name}\" for {courseLabel}{lateNote}. Please review and grade.";
            var actionUrl = $"/grades/submissions/{component.Id}";

            await _notificationService.NotifyAsync(
                faculty.UserId,
                title,
                message,
                NotificationType.SubmissionReceived,
                relatedEntityType: "AssignmentSubmission",
                relatedEntityId: submission.Id,
                actionUrl: actionUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send submission notification for submission {SubmissionId}", submission.Id);
        }
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

            _ = NotifyFacultySubmissionAsync(submission, component, student);

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
    public async Task<ActionResult<ApiResponse<PagedResult<AssignmentSubmissionDto>>>> GetSubmissionsByComponent(
        int gradeComponentId,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 1000) pageSize = 1000;

            var submissions = (await _repository.FindAsync(s => s.GradeComponentId == gradeComponentId)).ToList();

            // Batch-load related data once (prevents N+1)
            var enrollmentIds = submissions.Select(s => s.EnrollmentId).Distinct().ToList();
            var enrollments = (await _enrollmentRepository.FindAsync(e => enrollmentIds.Contains(e.Id))).ToList();
            var enrollmentDict = enrollments.ToDictionary(e => e.Id);

            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();
            var students = (await _studentRepository.FindAsync(s => studentIds.Contains(s.Id))).ToList();
            var studentDict = students.ToDictionary(s => s.Id);

            var userIds = students.Select(s => s.UserId).Distinct().ToList();
            var users = (await _userRepository.FindAsync(u => userIds.Contains(u.Id))).ToList();
            var userDict = users.ToDictionary(u => u.Id);

            var component = await _componentRepository.GetByIdAsync(gradeComponentId);
            var offering = component != null ? await _offeringRepository.GetByIdAsync(component.CourseOfferingId) : null;
            var course = offering != null ? await _courseRepository.GetByIdAsync(offering.CourseId) : null;

            var grades = (await _gradeRepository.FindAsync(g =>
                g.GradeComponentId == gradeComponentId && enrollmentIds.Contains(g.EnrollmentId))).ToList();
            var gradeDict = grades.ToDictionary(g => g.EnrollmentId);

            // Resolve per-submission student info for filtering
            var submissionInfo = submissions.Select(s =>
            {
                var enrollment = enrollmentDict.GetValueOrDefault(s.EnrollmentId);
                var student = enrollment != null ? studentDict.GetValueOrDefault(enrollment.StudentId) : null;
                var user = student != null ? userDict.GetValueOrDefault(student.UserId) : null;
                var studentName = user != null ? $"{user.FirstName} {user.LastName}" : "";
                var studentNumber = student?.StudentNumber ?? "";
                var grade = gradeDict.GetValueOrDefault(s.EnrollmentId);
                var effectiveStatus = grade != null ? SubmissionStatus.Graded : s.Status;
                return new { Submission = s, StudentName = studentName, StudentNumber = studentNumber, Grade = grade, EffectiveStatus = effectiveStatus };
            }).ToList();

            // Filters
            if (!string.IsNullOrWhiteSpace(status)
                && Enum.TryParse<SubmissionStatus>(status, true, out var statusEnum))
            {
                submissionInfo = submissionInfo.Where(x => x.EffectiveStatus == statusEnum).ToList();
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                submissionInfo = submissionInfo.Where(x =>
                    x.StudentName.ToLowerInvariant().Contains(term)
                    || x.StudentNumber.ToLowerInvariant().Contains(term)).ToList();
            }

            var totalCount = submissionInfo.Count;

            var paged = submissionInfo
                .OrderByDescending(x => x.Submission.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var dtos = paged.Select(x =>
            {
                var s = x.Submission;
                var dto = new AssignmentSubmissionDto
                {
                    Id = s.Id,
                    EnrollmentId = s.EnrollmentId,
                    GradeComponentId = s.GradeComponentId,
                    StudentName = x.StudentName,
                    StudentNumber = x.StudentNumber,
                    GradeComponentName = component?.Name ?? "",
                    CourseCode = course?.Code ?? "",
                    CourseName = course?.Name ?? "",
                    DueDate = component?.DueDate != null
                        ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc)
                        : null,
                    MaxScore = component?.MaxScore ?? 0,
                    Weight = component?.Weight ?? 0,
                    SubmittedAt = DateTime.SpecifyKind(s.SubmittedAt, DateTimeKind.Utc),
                    FileUrl = s.FileUrl,
                    FileName = s.FileName,
                    FileSize = s.FileSize,
                    StudentComments = s.StudentComments,
                    Status = x.EffectiveStatus,
                    StatusText = x.EffectiveStatus.ToString(),
                    Score = x.Grade?.Score,
                    FacultyComments = x.Grade?.Comments,
                    GradedAt = x.Grade != null
                        ? DateTime.SpecifyKind(x.Grade.GradedAt, DateTimeKind.Utc)
                        : null
                };
                return dto;
            }).ToList();

            var result = PagedResult<AssignmentSubmissionDto>.Create(dtos, totalCount, page, pageSize);
            return Ok(ApiResponse<PagedResult<AssignmentSubmissionDto>>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for component {ComponentId}", gradeComponentId);
            return StatusCode(500, ApiResponse<PagedResult<AssignmentSubmissionDto>>.FailureResult(
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

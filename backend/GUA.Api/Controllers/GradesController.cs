using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Grade;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GradesController : ControllerBase
{
    private readonly IRepository<Grade> _repository;
    private readonly IRepository<GradeComponent> _componentRepository;
    private readonly IRepository<Enrollment> _enrollmentRepository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<FacultyProfile> _facultyRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<FinalGrade> _finalGradeRepository;
    private readonly INotificationService _notificationService;
    private readonly ILogger<GradesController> _logger;

    public GradesController(
        IRepository<Grade> repository,
        IRepository<GradeComponent> componentRepository,
        IRepository<Enrollment> enrollmentRepository,
        IRepository<StudentProfile> studentRepository,
        IRepository<FacultyProfile> facultyRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<User> userRepository,
        IRepository<Course> courseRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<FinalGrade> finalGradeRepository,
        INotificationService notificationService,
        ILogger<GradesController> logger)
    {
        _repository = repository;
        _componentRepository = componentRepository;
        _enrollmentRepository = enrollmentRepository;
        _studentRepository = studentRepository;
        _facultyRepository = facultyRepository;
        _offeringRepository = offeringRepository;
        _userRepository = userRepository;
        _courseRepository = courseRepository;
        _termRepository = termRepository;
        _finalGradeRepository = finalGradeRepository;
        _notificationService = notificationService;
        _logger = logger;
    }

    private async Task NotifyStudentGradeAsync(Grade grade, GradeComponent component, NotificationType type)
    {
        try
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(grade.EnrollmentId);
            if (enrollment == null) return;

            var student = await _studentRepository.GetByIdAsync(enrollment.StudentId);
            if (student == null) return;

            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            var course = offering != null ? await _courseRepository.GetByIdAsync(offering.CourseId) : null;
            var courseLabel = course != null ? $"{course.Code} - {course.Name}" : "your course";

            var verb = type == NotificationType.GradeUpdated ? "updated" : "posted";
            var title = type == NotificationType.GradeUpdated ? "Grade updated" : "New grade posted";
            var message = $"Your grade for \"{component.Name}\" in {courseLabel} has been {verb}: {grade.Score}/{component.MaxScore}.";
            var actionUrl = $"/grades/{enrollment.Id}";

            await _notificationService.NotifyAsync(
                student.UserId,
                title,
                message,
                type,
                relatedEntityType: "Grade",
                relatedEntityId: grade.Id,
                actionUrl: actionUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send grade notification for grade {GradeId}", grade.Id);
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GradeDto>>>> GetAll(
        [FromQuery] int? enrollmentId = null,
        [FromQuery] int? componentId = null,
        [FromQuery] int? courseOfferingId = null)
    {
        try
        {
            // Ownership scope for Faculty: may only see grades for offerings they teach.
            // Admin/SuperAdmin unrestricted.
            HashSet<int>? facultyOfferingIds = null;
            var isFacultyOnly = User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin");
            if (isFacultyOnly)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(ApiResponse<IEnumerable<GradeDto>>.FailureResult("Invalid user token"));
                }
                var faculties = await _facultyRepository.FindAsync(f => f.UserId == userId);
                var facultyProfile = faculties.FirstOrDefault();
                if (facultyProfile == null)
                {
                    return Forbid();
                }
                var myOfferings = await _offeringRepository.FindAsync(o => o.FacultyProfileId == facultyProfile.Id);
                facultyOfferingIds = myOfferings.Select(o => o.Id).ToHashSet();

                // If a specific offering is requested, it must be one they teach.
                if (courseOfferingId.HasValue && !facultyOfferingIds.Contains(courseOfferingId.Value))
                {
                    return Forbid();
                }
            }

            var grades = await _repository.GetAllAsync();

            // Apply filters
            if (enrollmentId.HasValue)
            {
                grades = grades.Where(g => g.EnrollmentId == enrollmentId.Value).ToList();
            }

            if (componentId.HasValue)
            {
                grades = grades.Where(g => g.GradeComponentId == componentId.Value).ToList();
            }

            if (courseOfferingId.HasValue)
            {
                var enrollments = await _enrollmentRepository.FindAsync(e => e.CourseOfferingId == courseOfferingId.Value);
                var enrollmentIds = enrollments.Select(e => e.Id).ToList();
                grades = grades.Where(g => enrollmentIds.Contains(g.EnrollmentId)).ToList();
            }

            // For faculty without explicit courseOfferingId, restrict results to their own courses
            // (also closes the gap for enrollmentId or componentId filters that could otherwise
            // reveal grades from other courses).
            if (isFacultyOnly && facultyOfferingIds != null)
            {
                var gradeEnrollmentIds = grades.Select(g => g.EnrollmentId).Distinct().ToList();
                var enrollmentsForGrades = await _enrollmentRepository.FindAsync(e => gradeEnrollmentIds.Contains(e.Id));
                var allowedEnrollmentIds = enrollmentsForGrades
                    .Where(e => facultyOfferingIds.Contains(e.CourseOfferingId))
                    .Select(e => e.Id)
                    .ToHashSet();
                grades = grades.Where(g => allowedEnrollmentIds.Contains(g.EnrollmentId)).ToList();
            }

            var dtos = await MapToGradeDtos(grades);
            return Ok(ApiResponse<IEnumerable<GradeDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grades");
            return StatusCode(500, ApiResponse<IEnumerable<GradeDto>>.FailureResult(
                "An error occurred while retrieving grades"));
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeDto>>> GetById(int id)
    {
        try
        {
            var grade = await _repository.GetByIdAsync(id);
            if (grade == null)
            {
                return NotFound(ApiResponse<GradeDto>.FailureResult("Grade not found"));
            }

            var dto = await MapToGradeDto(grade);
            return Ok(ApiResponse<GradeDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grade {Id}", id);
            return StatusCode(500, ApiResponse<GradeDto>.FailureResult(
                "An error occurred while retrieving the grade"));
        }
    }

    [HttpGet("my-grades")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<StudentGradesSummaryDto>>>> GetMyGrades([FromQuery] int? termId = null)
    {
        try
        {
            // Extract user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<IEnumerable<StudentGradesSummaryDto>>.FailureResult("Invalid user token"));
            }

            // Find student profile for this user
            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<StudentGradesSummaryDto>>.FailureResult("Student profile not found for this user"));
            }

            // Get enrollments for this student (filter by term if provided)
            var enrollments = await _enrollmentRepository.FindAsync(e => e.StudentId == student.Id);

            if (termId.HasValue)
            {
                var courseOfferings = await _offeringRepository.GetAllAsync();
                var courseOfferingIdsInTerm = courseOfferings
                    .Where(co => co.TermId == termId.Value)
                    .Select(co => co.Id)
                    .ToList();

                enrollments = enrollments
                    .Where(e => courseOfferingIdsInTerm.Contains(e.CourseOfferingId))
                    .ToList();
            }

            var result = new List<StudentGradesSummaryDto>();

            // Get student user info
            var studentUser = await _userRepository.GetByIdAsync(student.UserId);

            foreach (var enrollment in enrollments)
            {
                var courseOffering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
                if (courseOffering == null) continue;

                var course = await _courseRepository.GetByIdAsync(courseOffering.CourseId);
                if (course == null) continue;

                var term = await _termRepository.GetByIdAsync(courseOffering.TermId);
                var facultyProfile = await _facultyRepository.GetByIdAsync(courseOffering.FacultyProfileId);
                var faculty = facultyProfile != null
                    ? await _userRepository.GetByIdAsync(facultyProfile.UserId)
                    : null;

                // Get grade components for this course offering
                var components = await _componentRepository.FindAsync(c => c.CourseOfferingId == courseOffering.Id);

                var componentGrades = new List<ComponentGradeDto>();
                decimal totalWeightedScore = 0;
                decimal totalWeight = 0;

                foreach (var component in components)
                {
                    // Only show published components to students
                    if (!component.IsPublished)
                        continue;

                    var grades = await _repository.FindAsync(g =>
                        g.EnrollmentId == enrollment.Id &&
                        g.GradeComponentId == component.Id);
                    var grade = grades.FirstOrDefault();

                    var componentGrade = new ComponentGradeDto
                    {
                        ComponentId = component.Id,
                        ComponentName = component.Name,
                        ComponentType = component.Type.ToString(),
                        Weight = component.Weight,
                        MaxScore = component.MaxScore,
                        DueDate = component.DueDate.HasValue ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc) : null,
                        IsPublished = component.IsPublished,
                        Grade = grade != null ? await MapToGradeDto(grade) : null
                    };

                    componentGrades.Add(componentGrade);

                    if (grade != null)
                    {
                        var percentage = component.MaxScore > 0 ? (grade.Score / component.MaxScore) * 100 : 0;
                        totalWeightedScore += percentage * component.Weight;
                        totalWeight += component.Weight;
                    }
                }

                // Calculate weighted average
                decimal? weightedAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : null;

                // Get final grade if exists
                var finalGrades = await _finalGradeRepository.FindAsync(fg => fg.EnrollmentId == enrollment.Id);
                var finalGrade = finalGrades.FirstOrDefault();

                var summary = new StudentGradesSummaryDto
                {
                    EnrollmentId = enrollment.Id,
                    StudentId = student.Id,
                    StudentNumber = student.StudentNumber,
                    StudentName = studentUser != null ? $"{studentUser.FirstName} {studentUser.LastName}" : "",
                    CourseOfferingId = courseOffering.Id,
                    CourseCode = course.Code,
                    CourseName = course.Name,
                    Credits = course.Credits,
                    Section = courseOffering.Section,
                    TermName = term?.Name ?? "",
                    FacultyName = faculty != null ? $"{faculty.FirstName} {faculty.LastName}" : "",
                    EnrollmentStatus = enrollment.Status.ToString(),
                    ComponentGrades = componentGrades,
                    CurrentWeightedAverage = weightedAverage,
                    FinalGrade = finalGrade != null ? new FinalGradeDto
                    {
                        Id = finalGrade.Id,
                        EnrollmentId = finalGrade.EnrollmentId,
                        LetterGrade = finalGrade.LetterGrade,
                        NumericGrade = finalGrade.NumericGrade,
                        GradePoints = finalGrade.GradePoints,
                        PublishedAt = DateTime.SpecifyKind(finalGrade.PublishedAt, DateTimeKind.Utc),
                        PublishedByFacultyId = finalGrade.PublishedByFacultyId
                    } : null
                };

                result.Add(summary);
            }

            return Ok(ApiResponse<IEnumerable<StudentGradesSummaryDto>>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's grades");
            return StatusCode(500, ApiResponse<IEnumerable<StudentGradesSummaryDto>>.FailureResult(
                "An error occurred while retrieving your grades"));
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GradeDto>>>> GetByStudent(int studentId)
    {
        try
        {
            // Verify authorization - students can only see their own grades
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var student = await _studentRepository.GetByIdAsync(studentId);

            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<GradeDto>>.FailureResult("Student not found"));
            }

            if (!User.IsInRole("Admin") && !User.IsInRole("SuperAdmin") && student.UserId != userId)
            {
                return Forbid();
            }

            var enrollments = await _enrollmentRepository.FindAsync(e => e.StudentId == studentId);
            var enrollmentIds = enrollments.Select(e => e.Id).ToList();
            var grades = await _repository.FindAsync(g => enrollmentIds.Contains(g.EnrollmentId));

            // Only show grades for published components to students
            if (!User.IsInRole("Admin") && !User.IsInRole("SuperAdmin") && !User.IsInRole("Faculty"))
            {
                var componentIds = grades.Select(g => g.GradeComponentId).Distinct();
                var components = await _componentRepository.GetAllAsync();
                var publishedComponentIds = components
                    .Where(c => componentIds.Contains(c.Id) && c.IsPublished)
                    .Select(c => c.Id)
                    .ToList();

                grades = grades.Where(g => publishedComponentIds.Contains(g.GradeComponentId)).ToList();
            }

            var dtos = await MapToGradeDtos(grades);
            return Ok(ApiResponse<IEnumerable<GradeDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grades for student {StudentId}", studentId);
            return StatusCode(500, ApiResponse<IEnumerable<GradeDto>>.FailureResult(
                "An error occurred while retrieving student grades"));
        }
    }

    [HttpGet("enrollment/{enrollmentId}")]
    public async Task<ActionResult<ApiResponse<StudentGradesSummaryDto>>> GetByEnrollment(int enrollmentId)
    {
        try
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
            if (enrollment == null)
            {
                return NotFound(ApiResponse<StudentGradesSummaryDto>.FailureResult("Enrollment not found"));
            }

            // Verify authorization
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var student = await _studentRepository.GetByIdAsync(enrollment.StudentId);

            if (!User.IsInRole("Admin") && !User.IsInRole("SuperAdmin") && !User.IsInRole("Faculty"))
            {
                if (student == null || student.UserId != userId)
                {
                    return Forbid();
                }
            }

            // Get course offering details
            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            if (offering == null)
            {
                return NotFound(ApiResponse<StudentGradesSummaryDto>.FailureResult("Course offering not found"));
            }

            // Get all components and grades for this enrollment
            var components = await _componentRepository.FindAsync(c => c.CourseOfferingId == offering.Id);
            var grades = await _repository.FindAsync(g => g.EnrollmentId == enrollmentId);

            // Load related data
            var studentUser = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;
            var faculty = await _facultyRepository.GetByIdAsync(offering.FacultyProfileId);
            var facultyUser = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            // Get course and term info
            var courseRepository = _offeringRepository as IRepository<Course>;
            var termRepository = _offeringRepository as IRepository<AcademicTerm>;

            var summary = new StudentGradesSummaryDto
            {
                EnrollmentId = enrollment.Id,
                StudentId = enrollment.StudentId,
                StudentNumber = student?.StudentNumber ?? "",
                StudentName = studentUser != null ? $"{studentUser.FirstName} {studentUser.LastName}" : "",
                CourseOfferingId = offering.Id,
                FacultyName = facultyUser != null ? $"{facultyUser.FirstName} {facultyUser.LastName}" : "",
                ComponentGrades = new List<ComponentGradeDto>()
            };

            // Calculate weighted average if all components are graded
            decimal totalWeightGraded = 0;
            decimal weightedSum = 0;

            foreach (var component in components.OrderBy(c => c.DueDate ?? DateTime.MaxValue))
            {
                var grade = grades.FirstOrDefault(g => g.GradeComponentId == component.Id);
                var componentGrade = new ComponentGradeDto
                {
                    ComponentId = component.Id,
                    ComponentName = component.Name,
                    ComponentType = component.Type.ToString(),
                    Weight = component.Weight,
                    MaxScore = component.MaxScore,
                    DueDate = component.DueDate.HasValue ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc) : null,
                    IsPublished = component.IsPublished,
                    Grade = grade != null ? await MapToGradeDto(grade) : null
                };

                // Only show if published (for students) or if admin/faculty
                if (component.IsPublished || User.IsInRole("Admin") || User.IsInRole("SuperAdmin") || User.IsInRole("Faculty"))
                {
                    summary.ComponentGrades.Add(componentGrade);
                }

                if (grade != null && component.IsPublished)
                {
                    var percentage = component.MaxScore > 0 ? (grade.Score / component.MaxScore) * 100 : 0;
                    weightedSum += percentage * (component.Weight / 100);
                    totalWeightGraded += component.Weight;
                }
            }

            if (totalWeightGraded > 0)
            {
                summary.CurrentWeightedAverage = Math.Round(weightedSum, 2);
            }

            return Ok(ApiResponse<StudentGradesSummaryDto>.SuccessResult(summary));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grades for enrollment {EnrollmentId}", enrollmentId);
            return StatusCode(500, ApiResponse<StudentGradesSummaryDto>.FailureResult(
                "An error occurred while retrieving enrollment grades"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeDto>>> Create([FromBody] CreateGradeDto request)
    {
        try
        {
            // Validate enrollment exists
            var enrollment = await _enrollmentRepository.GetByIdAsync(request.EnrollmentId);
            if (enrollment == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Enrollment not found"));
            }

            // Validate grade component exists
            var component = await _componentRepository.GetByIdAsync(request.GradeComponentId);
            if (component == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Grade component not found"));
            }

            // Validate score doesn't exceed max score
            if (request.Score > component.MaxScore)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult(
                    $"Score cannot exceed maximum score of {component.MaxScore}"));
            }

            // Get course offering
            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Course offering not found"));
            }

            // Verify component belongs to the same course offering
            if (component.CourseOfferingId != offering.Id)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult(
                    "Grade component does not belong to this course offering"));
            }

            // If user is faculty, verify they are teaching this course
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var faculties = await _facultyRepository.GetAllAsync();
            var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

            if (faculty == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Faculty profile not found"));
            }

            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                if (offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            // Check if grade already exists for this enrollment and component
            var grades = await _repository.GetAllAsync();
            var existingGrade = grades.FirstOrDefault(g =>
                g.EnrollmentId == request.EnrollmentId && g.GradeComponentId == request.GradeComponentId);

            if (existingGrade != null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult(
                    "Grade already exists for this student and component. Use PUT to update."));
            }

            var grade = new Grade
            {
                EnrollmentId = request.EnrollmentId,
                GradeComponentId = request.GradeComponentId,
                Score = request.Score,
                GradedAt = DateTime.UtcNow,
                GradedByFacultyId = faculty.Id,
                Comments = request.Comments,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(grade);

            // Fire-and-forget notification (logged on failure inside helper)
            _ = NotifyStudentGradeAsync(created, component, NotificationType.GradePosted);

            var dto = await MapToGradeDto(created);

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<GradeDto>.SuccessResult(dto, "Grade created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating grade");
            return StatusCode(500, ApiResponse<GradeDto>.FailureResult(
                "An error occurred while creating the grade"));
        }
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GradeDto>>>> CreateBulk([FromBody] BulkCreateGradeDto request)
    {
        try
        {
            // Validate grade component exists
            var component = await _componentRepository.GetByIdAsync(request.GradeComponentId);
            if (component == null)
            {
                return BadRequest(ApiResponse<IEnumerable<GradeDto>>.FailureResult("Grade component not found"));
            }

            // Get course offering
            var offering = await _offeringRepository.GetByIdAsync(component.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<IEnumerable<GradeDto>>.FailureResult("Course offering not found"));
            }

            // If user is faculty, verify they are teaching this course
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var faculties = await _facultyRepository.GetAllAsync();
            var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

            if (faculty == null)
            {
                return BadRequest(ApiResponse<IEnumerable<GradeDto>>.FailureResult("Faculty profile not found"));
            }

            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                if (offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            var createdGrades = new List<Grade>();
            var errors = new List<string>();
            var allGrades = await _repository.GetAllAsync();

            foreach (var studentGrade in request.StudentGrades)
            {
                try
                {
                    // Validate enrollment exists
                    var enrollment = await _enrollmentRepository.GetByIdAsync(studentGrade.EnrollmentId);
                    if (enrollment == null)
                    {
                        errors.Add($"Enrollment {studentGrade.EnrollmentId} not found");
                        continue;
                    }

                    // Validate score doesn't exceed max score
                    if (studentGrade.Score > component.MaxScore)
                    {
                        errors.Add($"Score for enrollment {studentGrade.EnrollmentId} exceeds maximum of {component.MaxScore}");
                        continue;
                    }

                    // Check if grade already exists
                    var existingGrade = allGrades.FirstOrDefault(g =>
                        g.EnrollmentId == studentGrade.EnrollmentId && g.GradeComponentId == request.GradeComponentId);

                    if (existingGrade != null)
                    {
                        // Update existing grade
                        existingGrade.Score = studentGrade.Score;
                        existingGrade.Comments = studentGrade.Comments;
                        existingGrade.GradedAt = DateTime.UtcNow;
                        existingGrade.GradedByFacultyId = faculty.Id;
                        existingGrade.UpdatedAt = DateTime.UtcNow;

                        await _repository.UpdateAsync(existingGrade);
                        createdGrades.Add(existingGrade);
                        _ = NotifyStudentGradeAsync(existingGrade, component, NotificationType.GradeUpdated);
                    }
                    else
                    {
                        // Create new grade
                        var grade = new Grade
                        {
                            EnrollmentId = studentGrade.EnrollmentId,
                            GradeComponentId = request.GradeComponentId,
                            Score = studentGrade.Score,
                            GradedAt = DateTime.UtcNow,
                            GradedByFacultyId = faculty.Id,
                            Comments = studentGrade.Comments,
                            CreatedAt = DateTime.UtcNow
                        };

                        var created = await _repository.AddAsync(grade);
                        createdGrades.Add(created);
                        _ = NotifyStudentGradeAsync(created, component, NotificationType.GradePosted);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating grade for enrollment {EnrollmentId}", studentGrade.EnrollmentId);
                    errors.Add($"Error processing enrollment {studentGrade.EnrollmentId}: {ex.Message}");
                }
            }

            var dtos = await MapToGradeDtos(createdGrades);

            if (errors.Any())
            {
                return Ok(ApiResponse<IEnumerable<GradeDto>>.SuccessResult(dtos,
                    $"Bulk grade operation completed with {errors.Count} errors. Errors: {string.Join("; ", errors)}"));
            }

            return Ok(ApiResponse<IEnumerable<GradeDto>>.SuccessResult(dtos,
                $"Successfully created/updated {createdGrades.Count} grades"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating bulk grades");
            return StatusCode(500, ApiResponse<IEnumerable<GradeDto>>.FailureResult(
                "An error occurred while creating bulk grades"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeDto>>> Update(int id, [FromBody] UpdateGradeDto request)
    {
        try
        {
            var grade = await _repository.GetByIdAsync(id);
            if (grade == null)
            {
                return NotFound(ApiResponse<GradeDto>.FailureResult("Grade not found"));
            }

            var component = await _componentRepository.GetByIdAsync(grade.GradeComponentId);
            if (component == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Grade component not found"));
            }

            // Validate score doesn't exceed max score
            if (request.Score > component.MaxScore)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult(
                    $"Score cannot exceed maximum score of {component.MaxScore}"));
            }

            var enrollment = await _enrollmentRepository.GetByIdAsync(grade.EnrollmentId);
            if (enrollment == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Enrollment not found"));
            }

            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Course offering not found"));
            }

            // If user is faculty, verify they are teaching this course
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var faculties = await _facultyRepository.GetAllAsync();
            var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

            if (faculty == null)
            {
                return BadRequest(ApiResponse<GradeDto>.FailureResult("Faculty profile not found"));
            }

            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                if (offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            grade.Score = request.Score;
            grade.Comments = request.Comments;
            grade.GradedAt = DateTime.UtcNow;
            grade.GradedByFacultyId = faculty.Id;
            grade.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(grade);

            _ = NotifyStudentGradeAsync(grade, component, NotificationType.GradeUpdated);

            var dto = await MapToGradeDto(grade);

            return Ok(ApiResponse<GradeDto>.SuccessResult(dto, "Grade updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating grade {Id}", id);
            return StatusCode(500, ApiResponse<GradeDto>.FailureResult(
                "An error occurred while updating the grade"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var grade = await _repository.GetByIdAsync(id);
            if (grade == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Grade not found"));
            }

            await _repository.DeleteAsync(grade);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Grade deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting grade {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the grade"));
        }
    }

    private async Task<GradeDto> MapToGradeDto(Grade grade)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(grade.EnrollmentId);
        var student = enrollment != null ? await _studentRepository.GetByIdAsync(enrollment.StudentId) : null;
        var studentUser = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;
        var component = await _componentRepository.GetByIdAsync(grade.GradeComponentId);
        var faculty = await _facultyRepository.GetByIdAsync(grade.GradedByFacultyId);
        var facultyUser = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

        var percentage = component != null && component.MaxScore > 0
            ? Math.Round((grade.Score / component.MaxScore) * 100, 2)
            : 0;

        return new GradeDto
        {
            Id = grade.Id,
            EnrollmentId = grade.EnrollmentId,
            StudentId = student?.Id ?? 0,
            StudentNumber = student?.StudentNumber ?? "",
            StudentName = studentUser != null ? $"{studentUser.FirstName} {studentUser.LastName}" : "",
            GradeComponentId = grade.GradeComponentId,
            ComponentName = component?.Name ?? "",
            ComponentType = component?.Type.ToString() ?? "",
            ComponentWeight = component?.Weight ?? 0,
            ComponentMaxScore = component?.MaxScore ?? 0,
            Score = grade.Score,
            Percentage = percentage,
            GradedAt = DateTime.SpecifyKind(grade.GradedAt, DateTimeKind.Utc),
            GradedByFacultyId = grade.GradedByFacultyId,
            GradedByFacultyName = facultyUser != null ? $"{facultyUser.FirstName} {facultyUser.LastName}" : "",
            Comments = grade.Comments,
            CreatedAt = DateTime.SpecifyKind(grade.CreatedAt, DateTimeKind.Utc),
            UpdatedAt = grade.UpdatedAt.HasValue ? DateTime.SpecifyKind(grade.UpdatedAt.Value, DateTimeKind.Utc) : null
        };
    }

    private async Task<List<GradeDto>> MapToGradeDtos(IEnumerable<Grade> grades)
    {
        var dtos = new List<GradeDto>();
        foreach (var grade in grades)
        {
            dtos.Add(await MapToGradeDto(grade));
        }
        return dtos;
    }
}

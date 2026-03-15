using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Enrollment;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AcademicProgram = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly IRepository<Enrollment> _repository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<FacultyProfile> _facultyRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<FinalGrade> _finalGradeRepository;
    private readonly IRepository<AcademicProgram> _programRepository;
    private readonly ILogger<EnrollmentsController> _logger;

    public EnrollmentsController(
        IRepository<Enrollment> repository,
        IRepository<StudentProfile> studentRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<FacultyProfile> facultyRepository,
        IRepository<User> userRepository,
        IRepository<FinalGrade> finalGradeRepository,
        IRepository<AcademicProgram> programRepository,
        ILogger<EnrollmentsController> logger)
    {
        _repository = repository;
        _studentRepository = studentRepository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _termRepository = termRepository;
        _facultyRepository = facultyRepository;
        _userRepository = userRepository;
        _finalGradeRepository = finalGradeRepository;
        _programRepository = programRepository;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EnrollmentDto>>>> GetAll(
        [FromQuery] int? studentId = null,
        [FromQuery] int? courseOfferingId = null,
        [FromQuery] EnrollmentStatus? status = null)
    {
        try
        {
            var enrollments = await _repository.GetAllAsync();

            if (studentId.HasValue)
                enrollments = enrollments.Where(e => e.StudentId == studentId.Value).ToList();

            if (courseOfferingId.HasValue)
                enrollments = enrollments.Where(e => e.CourseOfferingId == courseOfferingId.Value).ToList();

            if (status.HasValue)
                enrollments = enrollments.Where(e => e.Status == status.Value).ToList();

            var dtos = await MapToEnrollmentDtos(enrollments);

            return Ok(ApiResponse<IEnumerable<EnrollmentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving enrollments");
            return StatusCode(500, ApiResponse<IEnumerable<EnrollmentDto>>.FailureResult(
                "An error occurred while retrieving enrollments"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> GetById(int id)
    {
        try
        {
            var enrollment = await _repository.GetByIdAsync(id);
            if (enrollment == null)
            {
                return NotFound(ApiResponse<EnrollmentDto>.FailureResult("Enrollment not found"));
            }

            var dtos = await MapToEnrollmentDtos(new[] { enrollment });
            return Ok(ApiResponse<EnrollmentDto>.SuccessResult(dtos.First()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving enrollment {Id}", id);
            return StatusCode(500, ApiResponse<EnrollmentDto>.FailureResult(
                "An error occurred while retrieving the enrollment"));
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EnrollmentDto>>>> GetByStudentId(int studentId)
    {
        try
        {
            var enrollments = await _repository.GetAllAsync();
            enrollments = enrollments.Where(e => e.StudentId == studentId).ToList();

            var dtos = await MapToEnrollmentDtos(enrollments);

            return Ok(ApiResponse<IEnumerable<EnrollmentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving enrollments for student {StudentId}", studentId);
            return StatusCode(500, ApiResponse<IEnumerable<EnrollmentDto>>.FailureResult(
                "An error occurred while retrieving student enrollments"));
        }
    }

    [HttpGet("my-enrollments")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EnrollmentDto>>>> GetMyEnrollments(
        [FromQuery] string? status = null)
    {
        try
        {
            // Extract user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<IEnumerable<EnrollmentDto>>.FailureResult("Invalid user token"));
            }

            // Find student profile for this user
            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<EnrollmentDto>>.FailureResult("Student profile not found for this user"));
            }

            // Get enrollments for this student
            var enrollments = await _repository.GetAllAsync();
            enrollments = enrollments.Where(e => e.StudentId == student.Id).ToList();

            // Filter by status if provided
            if (!string.IsNullOrWhiteSpace(status))
            {
                if (Enum.TryParse<EnrollmentStatus>(status, true, out var statusEnum))
                {
                    enrollments = enrollments.Where(e => e.Status == statusEnum).ToList();
                }
            }

            var dtos = await MapToEnrollmentDtos(enrollments);

            return Ok(ApiResponse<IEnumerable<EnrollmentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's enrollments");
            return StatusCode(500, ApiResponse<IEnumerable<EnrollmentDto>>.FailureResult(
                "An error occurred while retrieving your enrollments"));
        }
    }

    [HttpGet("my-available-courses")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AvailableCourseOfferingDto>>>> GetMyAvailableCourses(
        [FromQuery] int? termId = null,
        [FromQuery] bool allDepartments = false)
    {
        try
        {
            // Extract user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<IEnumerable<AvailableCourseOfferingDto>>.FailureResult("Invalid user token"));
            }

            // Find student profile for this user
            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<AvailableCourseOfferingDto>>.FailureResult("Student profile not found for this user"));
            }

            // Use the existing logic with the student's ID
            return await GetAvailableCourseOfferings(student.Id, termId, allDepartments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available courses for current user");
            return StatusCode(500, ApiResponse<IEnumerable<AvailableCourseOfferingDto>>.FailureResult(
                "An error occurred while retrieving available courses"));
        }
    }

    [HttpGet("available")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AvailableCourseOfferingDto>>>> GetAvailableCourseOfferings(
        [FromQuery] int studentId,
        [FromQuery] int? termId = null,
        [FromQuery] bool allDepartments = false)
    {
        try
        {
            // Get student
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<AvailableCourseOfferingDto>>.FailureResult("Student not found"));
            }

            // Get student's program to determine department
            var program = await _programRepository.GetByIdAsync(student.ProgramId);
            var studentDepartmentId = program?.DepartmentId;

            // Get active course offerings
            var offerings = await _offeringRepository.GetAllAsync();
            offerings = offerings.Where(o => o.IsActive).ToList();

            // Filter by term: if termId provided use it, otherwise show only active registration terms
            if (termId.HasValue)
            {
                offerings = offerings.Where(o => o.TermId == termId.Value).ToList();
            }
            else
            {
                // Only show offerings from active terms (current registration period)
                var activeTerms = await _termRepository.GetAllAsync();
                var activeTermIds = activeTerms.Where(t => t.IsActive).Select(t => t.Id).ToHashSet();
                offerings = offerings.Where(o => activeTermIds.Contains(o.TermId)).ToList();
            }

            // Get student's enrollments and completed courses
            var allEnrollments = await _repository.GetAllAsync();
            var studentEnrollments = allEnrollments.Where(e => e.StudentId == studentId).ToList();
            var enrolledOfferingIds = studentEnrollments
                .Where(e => e.Status == EnrollmentStatus.Enrolled)
                .Select(e => e.CourseOfferingId)
                .ToList();

            // Load related data
            var courses = await _courseRepository.GetAllAsync();

            // Filter offerings by student's department (only courses from their program's department)
            if (!allDepartments && studentDepartmentId.HasValue)
            {
                var departmentCourseIds = courses
                    .Where(c => c.DepartmentId == studentDepartmentId.Value)
                    .Select(c => c.Id)
                    .ToHashSet();
                offerings = offerings.Where(o => departmentCourseIds.Contains(o.CourseId)).ToList();
            }

            var allTerms = await _termRepository.GetAllAsync();
            var faculties = await _facultyRepository.GetAllAsync();
            var users = await _userRepository.GetAllAsync();
            var finalGrades = await _finalGradeRepository.GetAllAsync();

            var courseDict = courses.ToDictionary(c => c.Id);
            var termDict = allTerms.ToDictionary(t => t.Id);
            var facultyDict = faculties.ToDictionary(f => f.Id);
            var userDict = users.ToDictionary(u => u.Id, u => $"{u.FirstName} {u.LastName}");

            // Get completed courses (for prerequisite check)
            var completedCourseIds = studentEnrollments
                .Where(e => e.Status == EnrollmentStatus.Completed)
                .Join(finalGrades, e => e.Id, fg => fg.EnrollmentId, (e, fg) => new { e.CourseOfferingId, fg.LetterGrade })
                .Join(offerings, x => x.CourseOfferingId, o => o.Id, (x, o) => new { o.CourseId, x.LetterGrade })
                .Where(x => x.LetterGrade != "F") // Passing grades only
                .Select(x => x.CourseId)
                .ToList();

            var dtos = offerings.Select(o =>
            {
                var course = courseDict.GetValueOrDefault(o.CourseId);
                var term = termDict.GetValueOrDefault(o.TermId);
                var faculty = facultyDict.GetValueOrDefault(o.FacultyProfileId);
                var facultyName = faculty != null ? userDict.GetValueOrDefault(faculty.UserId, "Unknown") : "Unknown";

                var canEnroll = true;
                var blockReason = string.Empty;
                var prerequisites = new List<string>();

                if (course != null)
                {
                    // Check if already enrolled
                    if (enrolledOfferingIds.Contains(o.Id))
                    {
                        canEnroll = false;
                        blockReason = "Already enrolled";
                    }
                    // Check capacity
                    else if (o.EnrolledCount >= o.Capacity)
                    {
                        canEnroll = false;
                        blockReason = "Course is full";
                    }
                    // Check prerequisites (simplified - just checking if prerequisite courses were completed)
                    else if (course.PrerequisiteCourses?.Any() == true)
                    {
                        foreach (var prereq in course.PrerequisiteCourses)
                        {
                            var prereqCourse = courseDict.GetValueOrDefault(prereq.PrerequisiteCourseId);
                            if (prereqCourse != null)
                            {
                                prerequisites.Add($"{prereqCourse.Code} - {prereqCourse.Name}");

                                if (!completedCourseIds.Contains(prereq.PrerequisiteCourseId))
                                {
                                    canEnroll = false;
                                    blockReason = $"Missing prerequisite: {prereqCourse.Code}";
                                }
                            }
                        }
                    }
                }

                return new AvailableCourseOfferingDto
                {
                    Id = o.Id,
                    CourseCode = course?.Code ?? "",
                    CourseName = course?.Name ?? "",
                    Credits = course?.Credits ?? 0,
                    Section = o.Section,
                    TermName = term?.Name ?? "",
                    FacultyName = facultyName,
                    Schedule = o.Schedule,
                    Location = o.Location,
                    Capacity = o.Capacity,
                    EnrolledCount = o.EnrolledCount,
                    AvailableSeats = o.Capacity - o.EnrolledCount,
                    IsFull = o.EnrolledCount >= o.Capacity,
                    IsActive = o.IsActive,
                    CanEnroll = canEnroll,
                    EnrollmentBlockReason = blockReason,
                    Prerequisites = prerequisites
                };
            }).ToList();

            return Ok(ApiResponse<IEnumerable<AvailableCourseOfferingDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available course offerings for student {StudentId}", studentId);
            return StatusCode(500, ApiResponse<IEnumerable<AvailableCourseOfferingDto>>.FailureResult(
                "An error occurred while retrieving available course offerings"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> Create([FromBody] CreateEnrollmentDto request)
    {
        try
        {
            int studentId;

            // If Student role, get studentId from JWT token
            if (User.IsInRole("Student"))
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(ApiResponse<EnrollmentDto>.FailureResult("Invalid user token"));
                }

                // Find student profile for this user
                var students = await _studentRepository.GetAllAsync();
                var studentProfile = students.FirstOrDefault(s => s.UserId == userId);

                if (studentProfile == null)
                {
                    return NotFound(ApiResponse<EnrollmentDto>.FailureResult("Student profile not found for this user"));
                }

                studentId = studentProfile.Id;
            }
            else
            {
                // For Admin/Faculty, use the studentId from request
                studentId = request.StudentId;
            }

            // Validate student
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
            {
                return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Student not found"));
            }

            // Validate course offering
            var offering = await _offeringRepository.GetByIdAsync(request.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Course offering not found"));
            }

            if (!offering.IsActive)
            {
                return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Course offering is not active"));
            }

            // Check capacity
            if (offering.EnrolledCount >= offering.Capacity)
            {
                return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Course is full"));
            }

            // Check if already enrolled or has existing record
            var enrollments = await _repository.GetAllAsync();
            var existingEnrollment = enrollments.FirstOrDefault(e => e.StudentId == studentId &&
                                    e.CourseOfferingId == request.CourseOfferingId);

            if (existingEnrollment != null)
            {
                if (existingEnrollment.Status == EnrollmentStatus.Enrolled)
                {
                    return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Student is already enrolled in this course"));
                }

                if (existingEnrollment.Status == EnrollmentStatus.Completed)
                {
                    return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Student has already completed this course"));
                }

                // Re-enroll if previously dropped/withdrawn
                existingEnrollment.Status = EnrollmentStatus.Enrolled;
                existingEnrollment.EnrollmentDate = DateTime.UtcNow;
                existingEnrollment.DropDate = null;
                existingEnrollment.UpdatedAt = DateTime.UtcNow;
                await _repository.UpdateAsync(existingEnrollment);

                // Update enrolled count
                offering.EnrolledCount++;
                await _offeringRepository.UpdateAsync(offering);

                return await GetById(existingEnrollment.Id);
            }

            // Create enrollment
            var enrollment = new Enrollment
            {
                StudentId = studentId,
                CourseOfferingId = request.CourseOfferingId,
                EnrollmentDate = DateTime.UtcNow,
                Status = EnrollmentStatus.Enrolled,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(enrollment);

            // Update enrolled count
            offering.EnrolledCount++;
            await _offeringRepository.UpdateAsync(offering);

            return await GetById(created.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating enrollment");
            return StatusCode(500, ApiResponse<EnrollmentDto>.FailureResult(
                "An error occurred while creating the enrollment"));
        }
    }

    [HttpPost("{id}/drop")]
    public async Task<ActionResult<ApiResponse<EnrollmentDto>>> DropCourse(int id)
    {
        try
        {
            var enrollment = await _repository.GetByIdAsync(id);
            if (enrollment == null)
            {
                return NotFound(ApiResponse<EnrollmentDto>.FailureResult("Enrollment not found"));
            }

            if (enrollment.Status != EnrollmentStatus.Enrolled)
            {
                return BadRequest(ApiResponse<EnrollmentDto>.FailureResult("Can only drop enrolled courses"));
            }

            enrollment.Status = EnrollmentStatus.Dropped;
            enrollment.DropDate = DateTime.UtcNow;
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(enrollment);

            // Update enrolled count
            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            if (offering != null)
            {
                offering.EnrolledCount = Math.Max(0, offering.EnrolledCount - 1);
                await _offeringRepository.UpdateAsync(offering);
            }

            return await GetById(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dropping course for enrollment {Id}", id);
            return StatusCode(500, ApiResponse<EnrollmentDto>.FailureResult(
                "An error occurred while dropping the course"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var enrollment = await _repository.GetByIdAsync(id);
            if (enrollment == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Enrollment not found"));
            }

            // Check if has grades
            var enrollments = await _repository.GetAllAsync();
            var enrollmentWithGrades = enrollments.FirstOrDefault(e => e.Id == id);
            if (enrollmentWithGrades?.Grades?.Any() == true)
            {
                return BadRequest(ApiResponse<bool>.FailureResult(
                    "Cannot delete enrollment with existing grades"));
            }

            // Update enrolled count if status was Enrolled
            if (enrollment.Status == EnrollmentStatus.Enrolled)
            {
                var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
                if (offering != null)
                {
                    offering.EnrolledCount = Math.Max(0, offering.EnrolledCount - 1);
                    await _offeringRepository.UpdateAsync(offering);
                }
            }

            await _repository.DeleteAsync(enrollment);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Enrollment deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting enrollment {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the enrollment"));
        }
    }

    private async Task<List<EnrollmentDto>> MapToEnrollmentDtos(IEnumerable<Enrollment> enrollments)
    {
        var enrollmentList = enrollments.ToList();
        if (!enrollmentList.Any())
            return new List<EnrollmentDto>();

        var studentIds = enrollmentList.Select(e => e.StudentId).Distinct();
        var offeringIds = enrollmentList.Select(e => e.CourseOfferingId).Distinct();

        var students = await _studentRepository.GetAllAsync();
        var offerings = await _offeringRepository.GetAllAsync();
        var courses = await _courseRepository.GetAllAsync();
        var terms = await _termRepository.GetAllAsync();
        var faculties = await _facultyRepository.GetAllAsync();
        var users = await _userRepository.GetAllAsync();
        var finalGrades = await _finalGradeRepository.GetAllAsync();

        var studentDict = students.Where(s => studentIds.Contains(s.Id)).ToDictionary(s => s.Id);
        var offeringDict = offerings.Where(o => offeringIds.Contains(o.Id)).ToDictionary(o => o.Id);
        var courseDict = courses.ToDictionary(c => c.Id);
        var termDict = terms.ToDictionary(t => t.Id);
        var facultyDict = faculties.ToDictionary(f => f.Id);
        var userDict = users.ToDictionary(u => u.Id, u => $"{u.FirstName} {u.LastName}");
        var finalGradeDict = finalGrades.ToDictionary(fg => fg.EnrollmentId);

        return enrollmentList.Select(e =>
        {
            var student = studentDict.GetValueOrDefault(e.StudentId);
            var offering = offeringDict.GetValueOrDefault(e.CourseOfferingId);
            var course = offering != null ? courseDict.GetValueOrDefault(offering.CourseId) : null;
            var term = offering != null ? termDict.GetValueOrDefault(offering.TermId) : null;
            var faculty = offering != null ? facultyDict.GetValueOrDefault(offering.FacultyProfileId) : null;
            var facultyName = faculty != null ? userDict.GetValueOrDefault(faculty.UserId, "Unknown") : "Unknown";
            var studentName = student != null && userDict.TryGetValue(student.UserId, out var name) ? name : "Unknown";
            var finalGrade = finalGradeDict.GetValueOrDefault(e.Id);

            return new EnrollmentDto
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentNumber = student?.StudentNumber ?? "",
                StudentName = studentName,
                CourseOfferingId = e.CourseOfferingId,
                CourseCode = course?.Code ?? "",
                CourseName = course?.Name ?? "",
                Credits = course?.Credits ?? 0,
                Section = offering?.Section ?? "",
                TermName = term?.Name ?? "",
                FacultyName = facultyName,
                Schedule = offering?.Schedule,
                Location = offering?.Location,
                EnrollmentDate = e.EnrollmentDate,
                Status = e.Status,
                StatusText = e.Status.ToString(),
                DropDate = e.DropDate,
                CompletionDate = e.CompletionDate,
                HasFinalGrade = finalGrade != null,
                FinalLetterGrade = finalGrade?.LetterGrade,
                FinalNumericGrade = finalGrade?.NumericGrade
            };
        }).ToList();
    }

    [HttpGet("by-course-offering/{courseOfferingId}/students")]
    [Authorize(Roles = "Faculty,Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EnrolledStudentDto>>>> GetEnrolledStudents(
        int courseOfferingId,
        [FromQuery] EnrollmentStatus? status = null)
    {
        try
        {
            // Verify course offering exists
            var offering = await _offeringRepository.GetByIdAsync(courseOfferingId);
            if (offering == null)
            {
                return NotFound(ApiResponse<IEnumerable<EnrolledStudentDto>>.FailureResult("Course offering not found"));
            }

            // Get enrollments for this course offering
            var enrollments = (await _repository.GetAllAsync())
                .Where(e => e.CourseOfferingId == courseOfferingId)
                .ToList();

            // Filter by status if provided (no filter = show all)
            if (status.HasValue)
            {
                enrollments = enrollments.Where(e => e.Status == status.Value).ToList();
            }

            // Load student profiles and users
            var studentIds = enrollments.Select(e => e.StudentId).Distinct();
            var students = (await _studentRepository.GetAllAsync())
                .Where(s => studentIds.Contains(s.Id))
                .ToList();

            var userIds = students.Select(s => s.UserId).Distinct();
            var users = (await _userRepository.GetAllAsync())
                .Where(u => userIds.Contains(u.Id))
                .ToList();

            var studentDict = students.ToDictionary(s => s.Id);
            var userDict = users.ToDictionary(u => u.Id);

            // Get final grades for these enrollments
            var enrollmentIds = enrollments.Select(e => e.Id).Distinct();
            var finalGrades = (await _finalGradeRepository.GetAllAsync())
                .Where(fg => enrollmentIds.Contains(fg.EnrollmentId))
                .ToList();
            var finalGradeDict = finalGrades.ToDictionary(fg => fg.EnrollmentId);

            var dtos = enrollments.Select(e =>
            {
                var student = studentDict.GetValueOrDefault(e.StudentId);
                var user = student != null ? userDict.GetValueOrDefault(student.UserId) : null;
                var finalGrade = finalGradeDict.GetValueOrDefault(e.Id);

                return new EnrolledStudentDto
                {
                    EnrollmentId = e.Id,
                    StudentId = e.StudentId,
                    StudentNumber = student?.StudentNumber ?? "",
                    FirstName = user?.FirstName ?? "",
                    LastName = user?.LastName ?? "",
                    Email = user?.Email ?? "",
                    EnrollmentDate = e.EnrollmentDate,
                    Status = e.Status,
                    StatusText = e.Status.ToString(),
                    HasFinalGrade = finalGrade != null,
                    FinalLetterGrade = finalGrade?.LetterGrade,
                    FinalNumericGrade = finalGrade?.NumericGrade
                };
            }).OrderBy(s => s.LastName).ThenBy(s => s.FirstName).ToList();

            return Ok(ApiResponse<IEnumerable<EnrolledStudentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving enrolled students for course offering {CourseOfferingId}", courseOfferingId);
            return StatusCode(500, ApiResponse<IEnumerable<EnrolledStudentDto>>.FailureResult(
                "An error occurred while retrieving enrolled students"));
        }
    }
}

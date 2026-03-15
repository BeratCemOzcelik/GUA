using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.CourseOffering;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseOfferingsController : ControllerBase
{
    private readonly IRepository<CourseOffering> _repository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<FacultyProfile> _facultyRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ILogger<CourseOfferingsController> _logger;

    public CourseOfferingsController(
        IRepository<CourseOffering> repository,
        IRepository<Course> courseRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<FacultyProfile> facultyRepository,
        IRepository<User> userRepository,
        ILogger<CourseOfferingsController> logger)
    {
        _repository = repository;
        _courseRepository = courseRepository;
        _termRepository = termRepository;
        _facultyRepository = facultyRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<CourseOfferingDto>>>> GetAll(
        [FromQuery] int? termId = null,
        [FromQuery] int? courseId = null)
    {
        try
        {
            var offerings = await _repository.GetAllAsync();

            // Filter by term if provided
            if (termId.HasValue)
            {
                offerings = offerings.Where(o => o.TermId == termId.Value).ToList();
            }

            // Filter by course if provided
            if (courseId.HasValue)
            {
                offerings = offerings.Where(o => o.CourseId == courseId.Value).ToList();
            }

            // Load related entities
            var courseIds = offerings.Select(o => o.CourseId).Distinct();
            var termIds = offerings.Select(o => o.TermId).Distinct();
            var facultyIds = offerings.Select(o => o.FacultyProfileId).Distinct();

            var courses = await _courseRepository.GetAllAsync();
            var terms = await _termRepository.GetAllAsync();
            var faculties = await _facultyRepository.GetAllAsync();

            var courseDict = courses.Where(c => courseIds.Contains(c.Id))
                .ToDictionary(c => c.Id, c => (c.Name, c.Code));
            var termDict = terms.Where(t => termIds.Contains(t.Id))
                .ToDictionary(t => t.Id, t => (t.Name, t.Code));
            var facultyDict = faculties.Where(f => facultyIds.Contains(f.Id))
                .ToDictionary(f => f.Id);

            // Get user info for faculty
            var facultyUserIds = facultyDict.Values.Select(f => f.UserId).Distinct();
            var users = await _userRepository.GetAllAsync();
            var userDict = users.Where(u => facultyUserIds.Contains(u.Id))
                .ToDictionary(u => u.Id, u => $"{u.FirstName} {u.LastName}");

            var dtos = offerings.Select(o =>
            {
                var (courseName, courseCode) = courseDict.GetValueOrDefault(o.CourseId, ("Unknown", ""));
                var (termName, termCode) = termDict.GetValueOrDefault(o.TermId, ("Unknown", ""));
                var faculty = facultyDict.GetValueOrDefault(o.FacultyProfileId);
                var facultyName = faculty != null ? userDict.GetValueOrDefault(faculty.UserId, "Unknown") : "Unknown";

                return new CourseOfferingDto
                {
                    Id = o.Id,
                    CourseId = o.CourseId,
                    CourseName = courseName,
                    CourseCode = courseCode,
                    TermId = o.TermId,
                    TermName = termName,
                    TermCode = termCode,
                    FacultyProfileId = o.FacultyProfileId,
                    FacultyName = facultyName,
                    Section = o.Section,
                    Capacity = o.Capacity,
                    EnrolledCount = o.EnrolledCount,
                    AvailableSeats = o.Capacity - o.EnrolledCount,
                    Schedule = o.Schedule,
                    Location = o.Location,
                    IsActive = o.IsActive,
                    IsFull = o.EnrolledCount >= o.Capacity,
                    CreatedAt = o.CreatedAt
                };
            });

            return Ok(ApiResponse<IEnumerable<CourseOfferingDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course offerings");
            return StatusCode(500, ApiResponse<IEnumerable<CourseOfferingDto>>.FailureResult(
                "An error occurred while retrieving course offerings"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<CourseOfferingDto>>> GetById(int id)
    {
        try
        {
            var offering = await _repository.GetByIdAsync(id);
            if (offering == null)
            {
                return NotFound(ApiResponse<CourseOfferingDto>.FailureResult("Course offering not found"));
            }

            var course = await _courseRepository.GetByIdAsync(offering.CourseId);
            var term = await _termRepository.GetByIdAsync(offering.TermId);
            var faculty = await _facultyRepository.GetByIdAsync(offering.FacultyProfileId);
            var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            var dto = new CourseOfferingDto
            {
                Id = offering.Id,
                CourseId = offering.CourseId,
                CourseName = course?.Name ?? "Unknown",
                CourseCode = course?.Code ?? "",
                TermId = offering.TermId,
                TermName = term?.Name ?? "Unknown",
                TermCode = term?.Code ?? "",
                FacultyProfileId = offering.FacultyProfileId,
                FacultyName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                Section = offering.Section,
                Capacity = offering.Capacity,
                EnrolledCount = offering.EnrolledCount,
                AvailableSeats = offering.Capacity - offering.EnrolledCount,
                Schedule = offering.Schedule,
                Location = offering.Location,
                IsActive = offering.IsActive,
                IsFull = offering.EnrolledCount >= offering.Capacity,
                CreatedAt = offering.CreatedAt
            };

            return Ok(ApiResponse<CourseOfferingDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course offering {Id}", id);
            return StatusCode(500, ApiResponse<CourseOfferingDto>.FailureResult(
                "An error occurred while retrieving the course offering"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<CourseOfferingDto>>> Create([FromBody] CreateCourseOfferingDto request)
    {
        try
        {
            // Validate course exists
            if (!await _courseRepository.ExistsAsync(c => c.Id == request.CourseId))
            {
                return BadRequest(ApiResponse<CourseOfferingDto>.FailureResult("Course not found"));
            }

            // Validate term exists
            if (!await _termRepository.ExistsAsync(t => t.Id == request.TermId))
            {
                return BadRequest(ApiResponse<CourseOfferingDto>.FailureResult("Academic term not found"));
            }

            // Validate faculty exists
            if (!await _facultyRepository.ExistsAsync(f => f.Id == request.FacultyProfileId))
            {
                return BadRequest(ApiResponse<CourseOfferingDto>.FailureResult("Faculty profile not found"));
            }

            // Check if exact same offering already exists (same course, term, section, AND faculty)
            var exists = await _repository.ExistsAsync(o =>
                o.CourseId == request.CourseId &&
                o.TermId == request.TermId &&
                o.Section == request.Section &&
                o.FacultyProfileId == request.FacultyProfileId);

            if (exists)
            {
                return BadRequest(ApiResponse<CourseOfferingDto>.FailureResult(
                    $"This course offering already exists with the same faculty member"));
            }

            var offering = new CourseOffering
            {
                CourseId = request.CourseId,
                TermId = request.TermId,
                FacultyProfileId = request.FacultyProfileId,
                Section = request.Section,
                Capacity = request.Capacity,
                EnrolledCount = 0,
                Schedule = request.Schedule,
                Location = request.Location,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(offering);

            // Load related entities for response
            var course = await _courseRepository.GetByIdAsync(created.CourseId);
            var term = await _termRepository.GetByIdAsync(created.TermId);
            var faculty = await _facultyRepository.GetByIdAsync(created.FacultyProfileId);
            var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            var dto = new CourseOfferingDto
            {
                Id = created.Id,
                CourseId = created.CourseId,
                CourseName = course?.Name ?? "",
                CourseCode = course?.Code ?? "",
                TermId = created.TermId,
                TermName = term?.Name ?? "",
                TermCode = term?.Code ?? "",
                FacultyProfileId = created.FacultyProfileId,
                FacultyName = user != null ? $"{user.FirstName} {user.LastName}" : "",
                Section = created.Section,
                Capacity = created.Capacity,
                EnrolledCount = created.EnrolledCount,
                AvailableSeats = created.Capacity - created.EnrolledCount,
                Schedule = created.Schedule,
                Location = created.Location,
                IsActive = created.IsActive,
                IsFull = created.EnrolledCount >= created.Capacity,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<CourseOfferingDto>.SuccessResult(dto, "Course offering created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course offering");
            return StatusCode(500, ApiResponse<CourseOfferingDto>.FailureResult(
                "An error occurred while creating the course offering"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<CourseOfferingDto>>> Update(int id, [FromBody] UpdateCourseOfferingDto request)
    {
        try
        {
            var offering = await _repository.GetByIdAsync(id);
            if (offering == null)
            {
                return NotFound(ApiResponse<CourseOfferingDto>.FailureResult("Course offering not found"));
            }

            // Validate faculty exists
            if (!await _facultyRepository.ExistsAsync(f => f.Id == request.FacultyProfileId))
            {
                return BadRequest(ApiResponse<CourseOfferingDto>.FailureResult("Faculty profile not found"));
            }

            offering.FacultyProfileId = request.FacultyProfileId;
            offering.Section = request.Section;
            offering.Capacity = request.Capacity;
            offering.Schedule = request.Schedule;
            offering.Location = request.Location;
            offering.IsActive = request.IsActive;
            offering.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(offering);

            // Load related entities for response
            var course = await _courseRepository.GetByIdAsync(offering.CourseId);
            var term = await _termRepository.GetByIdAsync(offering.TermId);
            var faculty = await _facultyRepository.GetByIdAsync(offering.FacultyProfileId);
            var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            var dto = new CourseOfferingDto
            {
                Id = offering.Id,
                CourseId = offering.CourseId,
                CourseName = course?.Name ?? "",
                CourseCode = course?.Code ?? "",
                TermId = offering.TermId,
                TermName = term?.Name ?? "",
                TermCode = term?.Code ?? "",
                FacultyProfileId = offering.FacultyProfileId,
                FacultyName = user != null ? $"{user.FirstName} {user.LastName}" : "",
                Section = offering.Section,
                Capacity = offering.Capacity,
                EnrolledCount = offering.EnrolledCount,
                AvailableSeats = offering.Capacity - offering.EnrolledCount,
                Schedule = offering.Schedule,
                Location = offering.Location,
                IsActive = offering.IsActive,
                IsFull = offering.EnrolledCount >= offering.Capacity,
                CreatedAt = offering.CreatedAt
            };

            return Ok(ApiResponse<CourseOfferingDto>.SuccessResult(dto, "Course offering updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course offering {Id}", id);
            return StatusCode(500, ApiResponse<CourseOfferingDto>.FailureResult(
                "An error occurred while updating the course offering"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var offering = await _repository.GetByIdAsync(id);
            if (offering == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Course offering not found"));
            }

            // Check if there are enrolled students
            if (offering.EnrolledCount > 0)
            {
                return BadRequest(ApiResponse<bool>.FailureResult(
                    "Cannot delete course offering with enrolled students"));
            }

            await _repository.DeleteAsync(offering);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Course offering deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course offering {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the course offering"));
        }
    }

    [HttpGet("my-courses")]
    [Authorize(Roles = "Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CourseOfferingDto>>>> GetMyCourses(
        [FromQuery] int? termId = null)
    {
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<IEnumerable<CourseOfferingDto>>.FailureResult("Invalid user"));
            }

            // Find faculty profile for this user
            var faculties = await _facultyRepository.GetAllAsync();
            var facultyProfile = faculties.FirstOrDefault(f => f.UserId == userId);

            if (facultyProfile == null)
            {
                return NotFound(ApiResponse<IEnumerable<CourseOfferingDto>>.FailureResult("Faculty profile not found. Please contact administrator."));
            }

            // Get course offerings for this faculty
            var offerings = (await _repository.GetAllAsync())
                .Where(o => o.FacultyProfileId == facultyProfile.Id)
                .ToList();

            // Filter by term if provided (default to active terms)
            if (termId.HasValue)
            {
                offerings = offerings.Where(o => o.TermId == termId.Value).ToList();
            }

            // Load related entities
            var courseIds = offerings.Select(o => o.CourseId).Distinct();
            var termIds = offerings.Select(o => o.TermId).Distinct();

            var courses = await _courseRepository.GetAllAsync();
            var terms = await _termRepository.GetAllAsync();

            var courseDict = courses.Where(c => courseIds.Contains(c.Id))
                .ToDictionary(c => c.Id, c => (c.Name, c.Code, c.Credits));
            var termDict = terms.Where(t => termIds.Contains(t.Id))
                .ToDictionary(t => t.Id, t => (t.Name, t.Code));

            var user = await _userRepository.GetByIdAsync(facultyProfile.UserId);
            var facultyName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown";

            var dtos = offerings.Select(o =>
            {
                var (courseName, courseCode, credits) = courseDict.GetValueOrDefault(o.CourseId, ("Unknown", "", 0));
                var (termName, termCode) = termDict.GetValueOrDefault(o.TermId, ("Unknown", ""));

                return new CourseOfferingDto
                {
                    Id = o.Id,
                    CourseId = o.CourseId,
                    CourseName = courseName,
                    CourseCode = courseCode,
                    TermId = o.TermId,
                    TermName = termName,
                    TermCode = termCode,
                    FacultyProfileId = o.FacultyProfileId,
                    FacultyName = facultyName,
                    Section = o.Section,
                    Capacity = o.Capacity,
                    EnrolledCount = o.EnrolledCount,
                    AvailableSeats = o.Capacity - o.EnrolledCount,
                    Schedule = o.Schedule,
                    Location = o.Location,
                    IsActive = o.IsActive,
                    IsFull = o.EnrolledCount >= o.Capacity,
                    CreatedAt = o.CreatedAt
                };
            }).OrderByDescending(o => o.TermName).ThenBy(o => o.CourseCode);

            return Ok(ApiResponse<IEnumerable<CourseOfferingDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving faculty courses");
            return StatusCode(500, ApiResponse<IEnumerable<CourseOfferingDto>>.FailureResult(
                "An error occurred while retrieving your courses"));
        }
    }
}

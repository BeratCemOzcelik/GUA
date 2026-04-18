using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Grade;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GradeComponentsController : ControllerBase
{
    private readonly IRepository<GradeComponent> _repository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<FacultyProfile> _facultyRepository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<Enrollment> _enrollmentRepository;
    private readonly ILogger<GradeComponentsController> _logger;

    public GradeComponentsController(
        IRepository<GradeComponent> repository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<FacultyProfile> facultyRepository,
        IRepository<StudentProfile> studentRepository,
        IRepository<Enrollment> enrollmentRepository,
        ILogger<GradeComponentsController> logger)
    {
        _repository = repository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _termRepository = termRepository;
        _facultyRepository = facultyRepository;
        _studentRepository = studentRepository;
        _enrollmentRepository = enrollmentRepository;
        _logger = logger;
    }

    private async Task<bool> CanAccessCourseOfferingAsync(int courseOfferingId)
    {
        // Admin/SuperAdmin: always allowed
        if (User.IsInRole("Admin") || User.IsInRole("SuperAdmin"))
            return true;

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return false;

        // A user may hold multiple roles (e.g., Faculty + Student). Any single role that
        // grants access is sufficient — checks are independent, not exclusive.

        if (User.IsInRole("Faculty"))
        {
            var offering = await _offeringRepository.GetByIdAsync(courseOfferingId);
            if (offering != null)
            {
                var faculties = await _facultyRepository.FindAsync(f => f.UserId == userId);
                var faculty = faculties.FirstOrDefault();
                if (faculty != null && offering.FacultyProfileId == faculty.Id)
                {
                    return true;
                }
            }
        }

        if (User.IsInRole("Student"))
        {
            var students = await _studentRepository.FindAsync(s => s.UserId == userId);
            var student = students.FirstOrDefault();
            if (student != null)
            {
                var enrollments = await _enrollmentRepository.FindAsync(e =>
                    e.StudentId == student.Id && e.CourseOfferingId == courseOfferingId);
                if (enrollments.Any())
                {
                    return true;
                }
            }
        }

        return false;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GradeComponentDto>>>> GetAll(
        [FromQuery] int? courseOfferingId = null)
    {
        try
        {
            var components = await _repository.GetAllAsync();

            // Filter by course offering if provided
            if (courseOfferingId.HasValue)
            {
                components = components.Where(c => c.CourseOfferingId == courseOfferingId.Value).ToList();
            }

            // Load related entities
            var offeringIds = components.Select(c => c.CourseOfferingId).Distinct();
            var offerings = await _offeringRepository.GetAllAsync();
            var offeringDict = offerings.Where(o => offeringIds.Contains(o.Id))
                .ToDictionary(o => o.Id);

            var courseIds = offeringDict.Values.Select(o => o.CourseId).Distinct();
            var termIds = offeringDict.Values.Select(o => o.TermId).Distinct();

            var courses = await _courseRepository.GetAllAsync();
            var terms = await _termRepository.GetAllAsync();

            var courseDict = courses.Where(c => courseIds.Contains(c.Id))
                .ToDictionary(c => c.Id);
            var termDict = terms.Where(t => termIds.Contains(t.Id))
                .ToDictionary(t => t.Id);

            var dtos = components.Select(c =>
            {
                var offering = offeringDict.GetValueOrDefault(c.CourseOfferingId);
                var course = offering != null ? courseDict.GetValueOrDefault(offering.CourseId) : null;
                var term = offering != null ? termDict.GetValueOrDefault(offering.TermId) : null;

                return new GradeComponentDto
                {
                    Id = c.Id,
                    CourseOfferingId = c.CourseOfferingId,
                    CourseCode = course?.Code ?? "",
                    CourseName = course?.Name ?? "",
                    Section = offering?.Section ?? "",
                    TermName = term?.Name ?? "",
                    Name = c.Name,
                    Type = c.Type,
                    TypeText = c.Type.ToString(),
                    Weight = c.Weight,
                    MaxScore = c.MaxScore,
                    DueDate = c.DueDate.HasValue ? DateTime.SpecifyKind(c.DueDate.Value, DateTimeKind.Utc) : null,
                    IsPublished = c.IsPublished,
                    CreatedAt = DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                    UpdatedAt = c.UpdatedAt.HasValue ? DateTime.SpecifyKind(c.UpdatedAt.Value, DateTimeKind.Utc) : null
                };
            }).OrderBy(c => c.DueDate ?? DateTime.MaxValue);

            return Ok(ApiResponse<IEnumerable<GradeComponentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grade components");
            return StatusCode(500, ApiResponse<IEnumerable<GradeComponentDto>>.FailureResult(
                "An error occurred while retrieving grade components"));
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeComponentDto>>> GetById(int id)
    {
        try
        {
            var component = await _repository.GetByIdAsync(id);
            if (component == null)
            {
                return NotFound(ApiResponse<GradeComponentDto>.FailureResult("Grade component not found"));
            }

            var offering = await _offeringRepository.GetByIdAsync(component.CourseOfferingId);
            var course = offering != null ? await _courseRepository.GetByIdAsync(offering.CourseId) : null;
            var term = offering != null ? await _termRepository.GetByIdAsync(offering.TermId) : null;

            var dto = new GradeComponentDto
            {
                Id = component.Id,
                CourseOfferingId = component.CourseOfferingId,
                CourseCode = course?.Code ?? "",
                CourseName = course?.Name ?? "",
                Section = offering?.Section ?? "",
                TermName = term?.Name ?? "",
                Name = component.Name,
                Type = component.Type,
                TypeText = component.Type.ToString(),
                Weight = component.Weight,
                MaxScore = component.MaxScore,
                DueDate = component.DueDate.HasValue ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc) : null,
                IsPublished = component.IsPublished,
                CreatedAt = DateTime.SpecifyKind(component.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = component.UpdatedAt.HasValue ? DateTime.SpecifyKind(component.UpdatedAt.Value, DateTimeKind.Utc) : null
            };

            return Ok(ApiResponse<GradeComponentDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grade component {Id}", id);
            return StatusCode(500, ApiResponse<GradeComponentDto>.FailureResult(
                "An error occurred while retrieving the grade component"));
        }
    }

    [HttpGet("by-course-offering/{courseOfferingId}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty,Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GradeComponentDto>>>> GetByCourseOffering(int courseOfferingId)
    {
        try
        {
            // Ownership/enrollment check: only admins, the teaching faculty, or an enrolled student may view
            if (!await CanAccessCourseOfferingAsync(courseOfferingId))
            {
                return Forbid();
            }

            var components = await _repository.FindAsync(gc => gc.CourseOfferingId == courseOfferingId);

            // Students only see published components (faculty may still be drafting weights)
            var isStudent = User.IsInRole("Student") && !User.IsInRole("Faculty")
                && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin");
            if (isStudent)
            {
                components = components.Where(gc => gc.IsPublished);
            }

            var dtos = components.Select(gc => new GradeComponentDto
            {
                Id = gc.Id,
                CourseOfferingId = gc.CourseOfferingId,
                Name = gc.Name,
                Type = gc.Type,
                TypeText = gc.Type.ToString(),
                Weight = gc.Weight,
                MaxScore = gc.MaxScore,
                DueDate = gc.DueDate,
                IsPublished = gc.IsPublished,
                CreatedAt = gc.CreatedAt
            }).OrderBy(gc => gc.CreatedAt);

            return Ok(ApiResponse<IEnumerable<GradeComponentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving grade components for course offering {CourseOfferingId}", courseOfferingId);
            return StatusCode(500, ApiResponse<IEnumerable<GradeComponentDto>>.FailureResult(
                "An error occurred while retrieving grade components"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeComponentDto>>> Create([FromBody] CreateGradeComponentDto request)
    {
        try
        {
            // Validate course offering exists
            var offering = await _offeringRepository.GetByIdAsync(request.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<GradeComponentDto>.FailureResult("Course offering not found"));
            }

            // If user is faculty, verify they are teaching this course
            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var faculties = await _facultyRepository.GetAllAsync();
                var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

                if (faculty == null || offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            // Validate that total weight doesn't exceed 100%
            var existingComponents = await _repository.FindAsync(c => c.CourseOfferingId == request.CourseOfferingId);
            var totalWeight = existingComponents.Sum(c => c.Weight) + request.Weight;

            if (totalWeight > 100)
            {
                return BadRequest(ApiResponse<GradeComponentDto>.FailureResult(
                    $"Total weight cannot exceed 100%. Current total: {existingComponents.Sum(c => c.Weight)}%, Adding: {request.Weight}%"));
            }

            var component = new GradeComponent
            {
                CourseOfferingId = request.CourseOfferingId,
                Name = request.Name,
                Type = request.Type,
                Weight = request.Weight,
                MaxScore = request.MaxScore,
                DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null,
                IsPublished = request.IsPublished,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(component);

            var course = await _courseRepository.GetByIdAsync(offering.CourseId);
            var term = await _termRepository.GetByIdAsync(offering.TermId);

            var dto = new GradeComponentDto
            {
                Id = created.Id,
                CourseOfferingId = created.CourseOfferingId,
                CourseCode = course?.Code ?? "",
                CourseName = course?.Name ?? "",
                Section = offering.Section,
                TermName = term?.Name ?? "",
                Name = created.Name,
                Type = created.Type,
                TypeText = created.Type.ToString(),
                Weight = created.Weight,
                MaxScore = created.MaxScore,
                DueDate = created.DueDate.HasValue ? DateTime.SpecifyKind(created.DueDate.Value, DateTimeKind.Utc) : null,
                IsPublished = created.IsPublished,
                CreatedAt = DateTime.SpecifyKind(created.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = created.UpdatedAt.HasValue ? DateTime.SpecifyKind(created.UpdatedAt.Value, DateTimeKind.Utc) : null
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<GradeComponentDto>.SuccessResult(dto, "Grade component created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating grade component");
            return StatusCode(500, ApiResponse<GradeComponentDto>.FailureResult(
                "An error occurred while creating the grade component"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeComponentDto>>> Update(int id, [FromBody] UpdateGradeComponentDto request)
    {
        try
        {
            var component = await _repository.GetByIdAsync(id);
            if (component == null)
            {
                return NotFound(ApiResponse<GradeComponentDto>.FailureResult("Grade component not found"));
            }

            var offering = await _offeringRepository.GetByIdAsync(component.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<GradeComponentDto>.FailureResult("Course offering not found"));
            }

            // If user is faculty, verify they are teaching this course
            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var faculties = await _facultyRepository.GetAllAsync();
                var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

                if (faculty == null || offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            // Validate that total weight doesn't exceed 100%
            var existingComponents = await _repository.FindAsync(c =>
                c.CourseOfferingId == component.CourseOfferingId && c.Id != id);
            var totalWeight = existingComponents.Sum(c => c.Weight) + request.Weight;

            if (totalWeight > 100)
            {
                return BadRequest(ApiResponse<GradeComponentDto>.FailureResult(
                    $"Total weight cannot exceed 100%. Current total (excluding this component): {existingComponents.Sum(c => c.Weight)}%, New weight: {request.Weight}%"));
            }

            component.Name = request.Name;
            component.Type = request.Type;
            component.Weight = request.Weight;
            component.MaxScore = request.MaxScore;
            component.DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null;
            component.IsPublished = request.IsPublished;
            component.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(component);

            var course = await _courseRepository.GetByIdAsync(offering.CourseId);
            var term = await _termRepository.GetByIdAsync(offering.TermId);

            var dto = new GradeComponentDto
            {
                Id = component.Id,
                CourseOfferingId = component.CourseOfferingId,
                CourseCode = course?.Code ?? "",
                CourseName = course?.Name ?? "",
                Section = offering.Section,
                TermName = term?.Name ?? "",
                Name = component.Name,
                Type = component.Type,
                TypeText = component.Type.ToString(),
                Weight = component.Weight,
                MaxScore = component.MaxScore,
                DueDate = component.DueDate.HasValue ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc) : null,
                IsPublished = component.IsPublished,
                CreatedAt = DateTime.SpecifyKind(component.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = component.UpdatedAt.HasValue ? DateTime.SpecifyKind(component.UpdatedAt.Value, DateTimeKind.Utc) : null
            };

            return Ok(ApiResponse<GradeComponentDto>.SuccessResult(dto, "Grade component updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating grade component {Id}", id);
            return StatusCode(500, ApiResponse<GradeComponentDto>.FailureResult(
                "An error occurred while updating the grade component"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var component = await _repository.GetByIdAsync(id);
            if (component == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Grade component not found"));
            }

            var offering = await _offeringRepository.GetByIdAsync(component.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<bool>.FailureResult("Course offering not found"));
            }

            // If user is faculty, verify they are teaching this course
            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var faculties = await _facultyRepository.GetAllAsync();
                var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

                if (faculty == null || offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            await _repository.DeleteAsync(component);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Grade component deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting grade component {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the grade component"));
        }
    }

    [HttpPost("{id}/publish")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<GradeComponentDto>>> Publish(int id)
    {
        try
        {
            var component = await _repository.GetByIdAsync(id);
            if (component == null)
            {
                return NotFound(ApiResponse<GradeComponentDto>.FailureResult("Grade component not found"));
            }

            var offering = await _offeringRepository.GetByIdAsync(component.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<GradeComponentDto>.FailureResult("Course offering not found"));
            }

            // If user is faculty, verify they are teaching this course
            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var faculties = await _facultyRepository.GetAllAsync();
                var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

                if (faculty == null || offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            component.IsPublished = !component.IsPublished;
            component.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(component);

            var course = await _courseRepository.GetByIdAsync(offering.CourseId);
            var term = await _termRepository.GetByIdAsync(offering.TermId);

            var dto = new GradeComponentDto
            {
                Id = component.Id,
                CourseOfferingId = component.CourseOfferingId,
                CourseCode = course?.Code ?? "",
                CourseName = course?.Name ?? "",
                Section = offering.Section,
                TermName = term?.Name ?? "",
                Name = component.Name,
                Type = component.Type,
                TypeText = component.Type.ToString(),
                Weight = component.Weight,
                MaxScore = component.MaxScore,
                DueDate = component.DueDate.HasValue ? DateTime.SpecifyKind(component.DueDate.Value, DateTimeKind.Utc) : null,
                IsPublished = component.IsPublished,
                CreatedAt = DateTime.SpecifyKind(component.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = component.UpdatedAt.HasValue ? DateTime.SpecifyKind(component.UpdatedAt.Value, DateTimeKind.Utc) : null
            };

            var message = component.IsPublished ? "Grade component published successfully" : "Grade component unpublished successfully";
            return Ok(ApiResponse<GradeComponentDto>.SuccessResult(dto, message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing grade component {Id}", id);
            return StatusCode(500, ApiResponse<GradeComponentDto>.FailureResult(
                "An error occurred while publishing the grade component"));
        }
    }
}

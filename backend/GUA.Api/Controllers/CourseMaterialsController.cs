using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs;
using GUA.Shared.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseMaterialsController : ControllerBase
{
    private readonly IRepository<CourseMaterial> _repository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<CourseOffering> _courseOfferingRepository;
    private readonly IRepository<FacultyProfile> _facultyProfileRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ILogger<CourseMaterialsController> _logger;

    public CourseMaterialsController(
        IRepository<CourseMaterial> repository,
        IRepository<Course> courseRepository,
        IRepository<CourseOffering> courseOfferingRepository,
        IRepository<FacultyProfile> facultyProfileRepository,
        IRepository<User> userRepository,
        ILogger<CourseMaterialsController> logger)
    {
        _repository = repository;
        _courseRepository = courseRepository;
        _courseOfferingRepository = courseOfferingRepository;
        _facultyProfileRepository = facultyProfileRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResult<CourseMaterialDto>>>> GetAll(
        [FromQuery] int? courseId = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 1000) pageSize = 1000;

            var materials = (await _repository.GetAllAsync()).ToList();

            if (courseId.HasValue)
                materials = materials.Where(m => m.CourseId == courseId.Value).ToList();

            var courses = await _courseRepository.GetAllAsync();
            var courseDictionary = courses.ToDictionary(c => c.Id);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                materials = materials.Where(m =>
                {
                    var course = courseDictionary.GetValueOrDefault(m.CourseId);
                    return m.Title.ToLowerInvariant().Contains(term)
                        || (m.Description ?? "").ToLowerInvariant().Contains(term)
                        || (course?.Name ?? "").ToLowerInvariant().Contains(term)
                        || (course?.Code ?? "").ToLowerInvariant().Contains(term);
                }).ToList();
            }

            var totalCount = materials.Count;

            var pagedMaterials = materials
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var facultyIds = pagedMaterials.Select(m => m.UploadedByFacultyId).Distinct().ToList();
            var faculties = await _facultyProfileRepository.FindAsync(f => facultyIds.Contains(f.Id));
            var facultyDictionary = faculties.ToDictionary(f => f.Id);

            var userIds = faculties.Select(f => f.UserId).Distinct().ToList();
            var users = await _userRepository.FindAsync(u => userIds.Contains(u.Id));
            var userDictionary = users.ToDictionary(u => u.Id);

            var dtos = pagedMaterials.Select(material =>
            {
                var course = courseDictionary.GetValueOrDefault(material.CourseId);
                var faculty = facultyDictionary.GetValueOrDefault(material.UploadedByFacultyId);
                var user = faculty != null ? userDictionary.GetValueOrDefault(faculty.UserId) : null;

                return new CourseMaterialDto
                {
                    Id = material.Id,
                    CourseId = material.CourseId,
                    CourseName = course?.Name ?? string.Empty,
                    CourseCode = course?.Code ?? string.Empty,
                    CourseOfferingId = material.CourseOfferingId,
                    Title = material.Title,
                    Description = material.Description ?? string.Empty,
                    FileUrl = material.FileUrl,
                    FileType = material.FileType,
                    Version = material.Version,
                    UploadedByUserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : string.Empty,
                    IsActive = material.IsActive,
                    CreatedAt = material.CreatedAt
                };
            });

            var result = PagedResult<CourseMaterialDto>.Create(dtos, totalCount, page, pageSize);
            return Ok(ApiResponse<PagedResult<CourseMaterialDto>>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course materials");
            return StatusCode(500, ApiResponse<PagedResult<CourseMaterialDto>>.FailureResult(
                "An error occurred while retrieving course materials"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<CourseMaterialDto>>> GetById(int id)
    {
        try
        {
            var material = await _repository.GetByIdAsync(id);

            if (material == null)
            {
                return NotFound(ApiResponse<CourseMaterialDto>.FailureResult("Course material not found"));
            }

            var course = await _courseRepository.GetByIdAsync(material.CourseId);
            var faculty = await _facultyProfileRepository.GetByIdAsync(material.UploadedByFacultyId);
            var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            var dto = new CourseMaterialDto
            {
                Id = material.Id,
                CourseId = material.CourseId,
                CourseName = course?.Name ?? string.Empty,
                CourseCode = course?.Code ?? string.Empty,
                CourseOfferingId = material.CourseOfferingId,
                Title = material.Title,
                Description = material.Description ?? string.Empty,
                FileUrl = material.FileUrl,
                FileType = material.FileType,
                Version = material.Version,
                UploadedByUserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : string.Empty,
                IsActive = material.IsActive,
                CreatedAt = material.CreatedAt
            };

            return Ok(ApiResponse<CourseMaterialDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course material {Id}", id);
            return StatusCode(500, ApiResponse<CourseMaterialDto>.FailureResult(
                "An error occurred while retrieving the course material"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<CourseMaterialDto>>> Create([FromBody] CreateCourseMaterialDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("Title is required"));
            }

            if (string.IsNullOrWhiteSpace(request.FileUrl))
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("File URL is required"));
            }

            if (string.IsNullOrWhiteSpace(request.FileType))
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("File type is required"));
            }

            // Get course offering to derive courseId
            var courseOffering = await _courseOfferingRepository.GetByIdAsync(request.CourseOfferingId);
            if (courseOffering == null)
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("Course offering not found"));
            }

            var course = await _courseRepository.GetByIdAsync(courseOffering.CourseId);
            if (course == null)
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("Course not found"));
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<CourseMaterialDto>.FailureResult("Invalid user"));
            }

            var facultyProfiles = await _facultyProfileRepository.FindAsync(f => f.UserId == userId);
            var facultyProfile = facultyProfiles.FirstOrDefault();

            if (facultyProfile == null)
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult(
                    "Faculty profile not found for current user"));
            }

            var material = new CourseMaterial
            {
                CourseId = courseOffering.CourseId,
                CourseOfferingId = request.CourseOfferingId,
                Title = request.Title,
                Description = request.Description,
                FileUrl = request.FileUrl,
                FileType = request.FileType,
                UploadedByFacultyId = facultyProfile.Id,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(material);

            var faculty = await _facultyProfileRepository.GetByIdAsync(created.UploadedByFacultyId);
            var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            var dto = new CourseMaterialDto
            {
                Id = created.Id,
                CourseId = created.CourseId,
                CourseName = course.Name,
                CourseCode = course.Code,
                CourseOfferingId = created.CourseOfferingId,
                Title = created.Title,
                Description = created.Description ?? string.Empty,
                FileUrl = created.FileUrl,
                FileType = created.FileType,
                Version = created.Version,
                UploadedByUserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : string.Empty,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<CourseMaterialDto>.SuccessResult(dto, "Course material created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course material");
            return StatusCode(500, ApiResponse<CourseMaterialDto>.FailureResult(
                "An error occurred while creating the course material"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<CourseMaterialDto>>> Update(int id, [FromBody] UpdateCourseMaterialDto request)
    {
        try
        {
            var material = await _repository.GetByIdAsync(id);

            if (material == null)
            {
                return NotFound(ApiResponse<CourseMaterialDto>.FailureResult("Course material not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("Title is required"));
            }

            if (string.IsNullOrWhiteSpace(request.FileUrl))
            {
                return BadRequest(ApiResponse<CourseMaterialDto>.FailureResult("File URL is required"));
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<CourseMaterialDto>.FailureResult("Invalid user"));
            }

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
            if (!isAdmin)
            {
                var facultyProfiles = await _facultyProfileRepository.FindAsync(f => f.UserId == userId);
                var facultyProfile = facultyProfiles.FirstOrDefault();

                if (facultyProfile == null || facultyProfile.Id != material.UploadedByFacultyId)
                {
                    return Forbid();
                }
            }

            material.CourseOfferingId = request.CourseOfferingId;
            material.Title = request.Title;
            material.Description = request.Description;
            material.FileUrl = request.FileUrl;
            material.IsActive = request.IsActive;
            material.Version += 1;
            material.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(material);

            var course = await _courseRepository.GetByIdAsync(material.CourseId);
            var faculty = await _facultyProfileRepository.GetByIdAsync(material.UploadedByFacultyId);
            var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

            var dto = new CourseMaterialDto
            {
                Id = material.Id,
                CourseId = material.CourseId,
                CourseName = course?.Name ?? string.Empty,
                CourseCode = course?.Code ?? string.Empty,
                CourseOfferingId = material.CourseOfferingId,
                Title = material.Title,
                Description = material.Description ?? string.Empty,
                FileUrl = material.FileUrl,
                FileType = material.FileType,
                Version = material.Version,
                UploadedByUserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : string.Empty,
                IsActive = material.IsActive,
                CreatedAt = material.CreatedAt
            };

            return Ok(ApiResponse<CourseMaterialDto>.SuccessResult(dto, "Course material updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course material {Id}", id);
            return StatusCode(500, ApiResponse<CourseMaterialDto>.FailureResult(
                "An error occurred while updating the course material"));
        }
    }

    [HttpGet("course-offering/{courseOfferingId}")]
    [Authorize(Roles = "Student,Faculty,Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CourseMaterialDto>>>> GetByCourseOffering(int courseOfferingId)
    {
        try
        {
            var materials = await _repository.FindAsync(m =>
                m.CourseOfferingId == courseOfferingId &&
                m.IsActive);

            var dtos = new List<CourseMaterialDto>();

            foreach (var material in materials)
            {
                var course = await _courseRepository.GetByIdAsync(material.CourseId);
                var faculty = await _facultyProfileRepository.GetByIdAsync(material.UploadedByFacultyId);
                var user = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

                dtos.Add(new CourseMaterialDto
                {
                    Id = material.Id,
                    CourseId = material.CourseId,
                    CourseName = course?.Name ?? "",
                    CourseCode = course?.Code ?? "",
                    CourseOfferingId = material.CourseOfferingId,
                    Title = material.Title,
                    Description = material.Description ?? "",
                    FileUrl = material.FileUrl,
                    FileType = material.FileType,
                    Version = material.Version,
                    UploadedByUserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "",
                    IsActive = material.IsActive,
                    CreatedAt = material.CreatedAt
                });
            }

            return Ok(ApiResponse<IEnumerable<CourseMaterialDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course materials for offering {OfferingId}", courseOfferingId);
            return StatusCode(500, ApiResponse<IEnumerable<CourseMaterialDto>>.FailureResult(
                "An error occurred while retrieving course materials"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var material = await _repository.GetByIdAsync(id);

            if (material == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Course material not found"));
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<bool>.FailureResult("Invalid user"));
            }

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
            if (!isAdmin)
            {
                var facultyProfiles = await _facultyProfileRepository.FindAsync(f => f.UserId == userId);
                var facultyProfile = facultyProfiles.FirstOrDefault();

                if (facultyProfile == null || facultyProfile.Id != material.UploadedByFacultyId)
                {
                    return Forbid();
                }
            }

            await _repository.DeleteAsync(material);

            return Ok(ApiResponse<bool>.SuccessResult(true, "Course material deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course material {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the course material"));
        }
    }
}

using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Course;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly IRepository<Course> _repository;
    private readonly IRepository<Department> _departmentRepository;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(
        IRepository<Course> repository,
        IRepository<Department> departmentRepository,
        ILogger<CoursesController> logger)
    {
        _repository = repository;
        _departmentRepository = departmentRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<CourseDto>>>> GetAll()
    {
        try
        {
            var courses = await _repository.GetAllAsync();
            var dtos = new List<CourseDto>();

            foreach (var course in courses)
            {
                var department = await _departmentRepository.GetByIdAsync(course.DepartmentId);
                dtos.Add(new CourseDto
                {
                    Id = course.Id,
                    Code = course.Code,
                    Name = course.Name,
                    Credits = course.Credits,
                    Description = course.Description,
                    Syllabus = course.Syllabus,
                    DepartmentId = course.DepartmentId,
                    DepartmentName = department?.Name ?? string.Empty,
                    IsActive = course.IsActive,
                    CreatedAt = course.CreatedAt
                });
            }

            return Ok(ApiResponse<IEnumerable<CourseDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving courses");
            return StatusCode(500, ApiResponse<IEnumerable<CourseDto>>.FailureResult(
                "An error occurred while retrieving courses"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<CourseDto>>> GetById(int id)
    {
        try
        {
            var course = await _repository.GetByIdAsync(id);

            if (course == null)
            {
                return NotFound(ApiResponse<CourseDto>.FailureResult("Course not found"));
            }

            var department = await _departmentRepository.GetByIdAsync(course.DepartmentId);
            var dto = new CourseDto
            {
                Id = course.Id,
                Code = course.Code,
                Name = course.Name,
                Credits = course.Credits,
                Description = course.Description,
                Syllabus = course.Syllabus,
                DepartmentId = course.DepartmentId,
                DepartmentName = department?.Name ?? string.Empty,
                IsActive = course.IsActive,
                CreatedAt = course.CreatedAt
            };

            return Ok(ApiResponse<CourseDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course {Id}", id);
            return StatusCode(500, ApiResponse<CourseDto>.FailureResult(
                "An error occurred while retrieving the course"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<CourseDto>>> Create([FromBody] CreateCourseRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "Name and code are required"));
            }

            if (request.Credits <= 0)
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "Credits must be greater than 0"));
            }

            // Check if department exists
            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "Department not found"));
            }

            // Check if code already exists
            if (await _repository.ExistsAsync(c => c.Code == request.Code))
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "A course with this code already exists"));
            }

            var course = new Course
            {
                DepartmentId = request.DepartmentId,
                Code = request.Code,
                Name = request.Name,
                Credits = request.Credits,
                Description = request.Description,
                Syllabus = request.Syllabus,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(course);

            var dto = new CourseDto
            {
                Id = created.Id,
                Code = created.Code,
                Name = created.Name,
                Credits = created.Credits,
                Description = created.Description,
                Syllabus = created.Syllabus,
                DepartmentId = created.DepartmentId,
                DepartmentName = department.Name,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<CourseDto>.SuccessResult(dto, "Course created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course");
            return StatusCode(500, ApiResponse<CourseDto>.FailureResult(
                "An error occurred while creating the course"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<CourseDto>>> Update(int id, [FromBody] UpdateCourseRequest request)
    {
        try
        {
            var course = await _repository.GetByIdAsync(id);

            if (course == null)
            {
                return NotFound(ApiResponse<CourseDto>.FailureResult("Course not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "Name and code are required"));
            }

            if (request.Credits <= 0)
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "Credits must be greater than 0"));
            }

            // Check if department exists
            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
            if (department == null)
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "Department not found"));
            }

            // Check if code already exists for another course
            if (await _repository.ExistsAsync(c => c.Code == request.Code && c.Id != id))
            {
                return BadRequest(ApiResponse<CourseDto>.FailureResult(
                    "A course with this code already exists"));
            }

            course.DepartmentId = request.DepartmentId;
            course.Code = request.Code;
            course.Name = request.Name;
            course.Credits = request.Credits;
            course.Description = request.Description;
            course.Syllabus = request.Syllabus;
            course.IsActive = request.IsActive;
            course.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(course);

            var dto = new CourseDto
            {
                Id = course.Id,
                Code = course.Code,
                Name = course.Name,
                Credits = course.Credits,
                Description = course.Description,
                Syllabus = course.Syllabus,
                DepartmentId = course.DepartmentId,
                DepartmentName = department.Name,
                IsActive = course.IsActive,
                CreatedAt = course.CreatedAt
            };

            return Ok(ApiResponse<CourseDto>.SuccessResult(dto, "Course updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course {Id}", id);
            return StatusCode(500, ApiResponse<CourseDto>.FailureResult(
                "An error occurred while updating the course"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var course = await _repository.GetByIdAsync(id);

            if (course == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Course not found"));
            }

            await _repository.DeleteAsync(course);

            return Ok(ApiResponse<bool>.SuccessResult(true, "Course deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the course"));
        }
    }
}

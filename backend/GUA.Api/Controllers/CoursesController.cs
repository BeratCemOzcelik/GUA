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
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(
        IRepository<Course> repository,
        ILogger<CoursesController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    private static CourseDto ToDto(Course course) => new()
    {
        Id = course.Id,
        Code = course.Code,
        Name = course.Name,
        Credits = course.Credits,
        Description = course.Description,
        Syllabus = course.Syllabus,
        IsActive = course.IsActive,
        CreatedAt = course.CreatedAt
    };

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<CourseDto>>>> GetAll()
    {
        try
        {
            var courses = await _repository.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<CourseDto>>.SuccessResult(courses.Select(ToDto)));
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
                return NotFound(ApiResponse<CourseDto>.FailureResult("Course not found"));

            return Ok(ApiResponse<CourseDto>.SuccessResult(ToDto(course)));
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
                return BadRequest(ApiResponse<CourseDto>.FailureResult("Name and code are required"));

            if (request.Credits <= 0)
                return BadRequest(ApiResponse<CourseDto>.FailureResult("Credits must be greater than 0"));

            if (await _repository.ExistsAsync(c => c.Code == request.Code))
                return BadRequest(ApiResponse<CourseDto>.FailureResult("A course with this code already exists"));

            var course = new Course
            {
                Code = request.Code,
                Name = request.Name,
                Credits = request.Credits,
                Description = request.Description,
                Syllabus = request.Syllabus,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(course);
            return CreatedAtAction(nameof(GetById), new { id = created.Id },
                ApiResponse<CourseDto>.SuccessResult(ToDto(created), "Course created successfully"));
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
                return NotFound(ApiResponse<CourseDto>.FailureResult("Course not found"));

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(ApiResponse<CourseDto>.FailureResult("Name and code are required"));

            if (request.Credits <= 0)
                return BadRequest(ApiResponse<CourseDto>.FailureResult("Credits must be greater than 0"));

            if (await _repository.ExistsAsync(c => c.Code == request.Code && c.Id != id))
                return BadRequest(ApiResponse<CourseDto>.FailureResult("A course with this code already exists"));

            course.Code = request.Code;
            course.Name = request.Name;
            course.Credits = request.Credits;
            course.Description = request.Description;
            course.Syllabus = request.Syllabus;
            course.IsActive = request.IsActive;
            course.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(course);
            return Ok(ApiResponse<CourseDto>.SuccessResult(ToDto(course), "Course updated successfully"));
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
                return NotFound(ApiResponse<bool>.FailureResult("Course not found"));

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

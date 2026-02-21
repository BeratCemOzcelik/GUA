using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Department;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IRepository<Department> _repository;
    private readonly ILogger<DepartmentsController> _logger;

    public DepartmentsController(IRepository<Department> repository, ILogger<DepartmentsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<DepartmentDto>>>> GetAll()
    {
        try
        {
            var departments = await _repository.GetAllAsync();
            var dtos = departments.Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Code = d.Code,
                Description = d.Description,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt
            });

            return Ok(ApiResponse<IEnumerable<DepartmentDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving departments");
            return StatusCode(500, ApiResponse<IEnumerable<DepartmentDto>>.FailureResult(
                "An error occurred while retrieving departments"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> GetById(int id)
    {
        try
        {
            var department = await _repository.GetByIdAsync(id);

            if (department == null)
            {
                return NotFound(ApiResponse<DepartmentDto>.FailureResult("Department not found"));
            }

            var dto = new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name,
                Code = department.Code,
                Description = department.Description,
                IsActive = department.IsActive,
                CreatedAt = department.CreatedAt
            };

            return Ok(ApiResponse<DepartmentDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving department {Id}", id);
            return StatusCode(500, ApiResponse<DepartmentDto>.FailureResult(
                "An error occurred while retrieving the department"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Create([FromBody] CreateDepartmentRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<DepartmentDto>.FailureResult(
                    "Name and code are required"));
            }

            // Check if code already exists
            if (await _repository.ExistsAsync(d => d.Code == request.Code))
            {
                return BadRequest(ApiResponse<DepartmentDto>.FailureResult(
                    "A department with this code already exists"));
            }

            var department = new Department
            {
                Name = request.Name,
                Code = request.Code,
                Description = request.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(department);

            var dto = new DepartmentDto
            {
                Id = created.Id,
                Name = created.Name,
                Code = created.Code,
                Description = created.Description,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<DepartmentDto>.SuccessResult(dto, "Department created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating department");
            return StatusCode(500, ApiResponse<DepartmentDto>.FailureResult(
                "An error occurred while creating the department"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Update(int id, [FromBody] UpdateDepartmentRequest request)
    {
        try
        {
            var department = await _repository.GetByIdAsync(id);

            if (department == null)
            {
                return NotFound(ApiResponse<DepartmentDto>.FailureResult("Department not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<DepartmentDto>.FailureResult(
                    "Name and code are required"));
            }

            // Check if code already exists for another department
            if (await _repository.ExistsAsync(d => d.Code == request.Code && d.Id != id))
            {
                return BadRequest(ApiResponse<DepartmentDto>.FailureResult(
                    "A department with this code already exists"));
            }

            department.Name = request.Name;
            department.Code = request.Code;
            department.Description = request.Description;
            department.IsActive = request.IsActive;
            department.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(department);

            var dto = new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name,
                Code = department.Code,
                Description = department.Description,
                IsActive = department.IsActive,
                CreatedAt = department.CreatedAt
            };

            return Ok(ApiResponse<DepartmentDto>.SuccessResult(dto, "Department updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating department {Id}", id);
            return StatusCode(500, ApiResponse<DepartmentDto>.FailureResult(
                "An error occurred while updating the department"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var department = await _repository.GetByIdAsync(id);

            if (department == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Department not found"));
            }

            await _repository.DeleteAsync(department);

            return Ok(ApiResponse<bool>.SuccessResult(true, "Department deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting department {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the department"));
        }
    }
}

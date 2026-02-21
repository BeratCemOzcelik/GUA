using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Program;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramEntity = GUA.Core.Entities.Program;
using DepartmentEntity = GUA.Core.Entities.Department;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgramsController : ControllerBase
{
    private readonly IRepository<ProgramEntity> _programRepository;
    private readonly IRepository<DepartmentEntity> _departmentRepository;
    private readonly ILogger<ProgramsController> _logger;

    public ProgramsController(
        IRepository<ProgramEntity> programRepository,
        IRepository<DepartmentEntity> departmentRepository,
        ILogger<ProgramsController> logger)
    {
        _programRepository = programRepository;
        _departmentRepository = departmentRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProgramDto>>>> GetAll()
    {
        try
        {
            var programs = await _programRepository.GetAllAsync();
            var departments = await _departmentRepository.GetAllAsync();
            var departmentDict = departments.ToDictionary(d => d.Id, d => d.Name);

            var dtos = programs.Select(p => new ProgramDto
            {
                Id = p.Id,
                DepartmentId = p.DepartmentId,
                DepartmentName = departmentDict.GetValueOrDefault(p.DepartmentId, string.Empty),
                Name = p.Name,
                DegreeType = p.DegreeType,
                TotalCreditsRequired = p.TotalCreditsRequired,
                DurationYears = p.DurationYears,
                Description = p.Description,
                Requirements = p.Requirements,
                TuitionFee = p.TuitionFee,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            });

            return Ok(ApiResponse<IEnumerable<ProgramDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving programs");
            return StatusCode(500, ApiResponse<IEnumerable<ProgramDto>>.FailureResult(
                "An error occurred while retrieving programs"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<ProgramDto>>> GetById(int id)
    {
        try
        {
            var program = await _programRepository.GetByIdAsync(id);
            if (program == null)
            {
                return NotFound(ApiResponse<ProgramDto>.FailureResult("Program not found"));
            }

            var department = await _departmentRepository.GetByIdAsync(program.DepartmentId);

            var dto = new ProgramDto
            {
                Id = program.Id,
                DepartmentId = program.DepartmentId,
                DepartmentName = department?.Name ?? string.Empty,
                Name = program.Name,
                DegreeType = program.DegreeType,
                TotalCreditsRequired = program.TotalCreditsRequired,
                DurationYears = program.DurationYears,
                Description = program.Description,
                Requirements = program.Requirements,
                TuitionFee = program.TuitionFee,
                IsActive = program.IsActive,
                CreatedAt = program.CreatedAt
            };

            return Ok(ApiResponse<ProgramDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving program {Id}", id);
            return StatusCode(500, ApiResponse<ProgramDto>.FailureResult(
                "An error occurred while retrieving the program"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<ProgramDto>>> Create([FromBody] CreateProgramRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name) || request.TotalCreditsRequired <= 0 || request.DurationYears <= 0)
            {
                return BadRequest(ApiResponse<ProgramDto>.FailureResult(
                    "Name, credits, and duration are required and must be valid"));
            }

            if (!await _departmentRepository.ExistsAsync(d => d.Id == request.DepartmentId))
            {
                return BadRequest(ApiResponse<ProgramDto>.FailureResult("Department does not exist"));
            }

            var program = new ProgramEntity
            {
                DepartmentId = request.DepartmentId,
                Name = request.Name,
                DegreeType = request.DegreeType,
                TotalCreditsRequired = request.TotalCreditsRequired,
                DurationYears = request.DurationYears,
                Description = request.Description,
                Requirements = request.Requirements,
                TuitionFee = request.TuitionFee,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _programRepository.AddAsync(program);
            var department = await _departmentRepository.GetByIdAsync(created.DepartmentId);

            var dto = new ProgramDto
            {
                Id = created.Id,
                DepartmentId = created.DepartmentId,
                DepartmentName = department?.Name ?? string.Empty,
                Name = created.Name,
                DegreeType = created.DegreeType,
                TotalCreditsRequired = created.TotalCreditsRequired,
                DurationYears = created.DurationYears,
                Description = created.Description,
                Requirements = created.Requirements,
                TuitionFee = created.TuitionFee,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<ProgramDto>.SuccessResult(dto, "Program created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating program");
            return StatusCode(500, ApiResponse<ProgramDto>.FailureResult(
                "An error occurred while creating the program"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<ProgramDto>>> Update(int id, [FromBody] UpdateProgramRequest request)
    {
        try
        {
            var program = await _programRepository.GetByIdAsync(id);
            if (program == null)
            {
                return NotFound(ApiResponse<ProgramDto>.FailureResult("Program not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Name) || request.TotalCreditsRequired <= 0 || request.DurationYears <= 0)
            {
                return BadRequest(ApiResponse<ProgramDto>.FailureResult("Invalid input"));
            }

            if (!await _departmentRepository.ExistsAsync(d => d.Id == request.DepartmentId))
            {
                return BadRequest(ApiResponse<ProgramDto>.FailureResult("Department does not exist"));
            }

            program.DepartmentId = request.DepartmentId;
            program.Name = request.Name;
            program.DegreeType = request.DegreeType;
            program.TotalCreditsRequired = request.TotalCreditsRequired;
            program.DurationYears = request.DurationYears;
            program.Description = request.Description;
            program.Requirements = request.Requirements;
            program.TuitionFee = request.TuitionFee;
            program.IsActive = request.IsActive;
            program.UpdatedAt = DateTime.UtcNow;

            await _programRepository.UpdateAsync(program);
            var department = await _departmentRepository.GetByIdAsync(program.DepartmentId);

            var dto = new ProgramDto
            {
                Id = program.Id,
                DepartmentId = program.DepartmentId,
                DepartmentName = department?.Name ?? string.Empty,
                Name = program.Name,
                DegreeType = program.DegreeType,
                TotalCreditsRequired = program.TotalCreditsRequired,
                DurationYears = program.DurationYears,
                Description = program.Description,
                Requirements = program.Requirements,
                TuitionFee = program.TuitionFee,
                IsActive = program.IsActive,
                CreatedAt = program.CreatedAt
            };

            return Ok(ApiResponse<ProgramDto>.SuccessResult(dto, "Program updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating program {Id}", id);
            return StatusCode(500, ApiResponse<ProgramDto>.FailureResult(
                "An error occurred while updating the program"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var program = await _programRepository.GetByIdAsync(id);
            if (program == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Program not found"));
            }

            await _programRepository.DeleteAsync(program);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Program deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting program {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the program"));
        }
    }
}

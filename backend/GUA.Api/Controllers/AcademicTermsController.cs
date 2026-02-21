using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.AcademicTerm;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AcademicTermsController : ControllerBase
{
    private readonly IRepository<AcademicTerm> _repository;
    private readonly ILogger<AcademicTermsController> _logger;

    public AcademicTermsController(IRepository<AcademicTerm> repository, ILogger<AcademicTermsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<AcademicTermDto>>>> GetAll()
    {
        try
        {
            var academicTerms = await _repository.GetAllAsync();
            var dtos = academicTerms.Select(t => new AcademicTermDto
            {
                Id = t.Id,
                Name = t.Name,
                Code = t.Code,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                IsActive = t.IsActive,
                EnrollmentStartDate = t.EnrollmentStartDate,
                EnrollmentEndDate = t.EnrollmentEndDate,
                CreatedAt = t.CreatedAt
            });

            return Ok(ApiResponse<IEnumerable<AcademicTermDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving academic terms");
            return StatusCode(500, ApiResponse<IEnumerable<AcademicTermDto>>.FailureResult(
                "An error occurred while retrieving academic terms"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AcademicTermDto>>> GetById(int id)
    {
        try
        {
            var academicTerm = await _repository.GetByIdAsync(id);

            if (academicTerm == null)
            {
                return NotFound(ApiResponse<AcademicTermDto>.FailureResult("Academic term not found"));
            }

            var dto = new AcademicTermDto
            {
                Id = academicTerm.Id,
                Name = academicTerm.Name,
                Code = academicTerm.Code,
                StartDate = academicTerm.StartDate,
                EndDate = academicTerm.EndDate,
                IsActive = academicTerm.IsActive,
                EnrollmentStartDate = academicTerm.EnrollmentStartDate,
                EnrollmentEndDate = academicTerm.EnrollmentEndDate,
                CreatedAt = academicTerm.CreatedAt
            };

            return Ok(ApiResponse<AcademicTermDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving academic term {Id}", id);
            return StatusCode(500, ApiResponse<AcademicTermDto>.FailureResult(
                "An error occurred while retrieving the academic term"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<AcademicTermDto>>> Create([FromBody] CreateAcademicTermRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Name and code are required"));
            }

            // Validate dates
            if (request.StartDate >= request.EndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Start date must be before end date"));
            }

            if (request.EnrollmentStartDate >= request.EnrollmentEndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Enrollment start date must be before enrollment end date"));
            }

            if (request.EnrollmentStartDate < request.StartDate || request.EnrollmentEndDate > request.EndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Enrollment dates must be within the term dates"));
            }

            // Check if code already exists
            if (await _repository.ExistsAsync(t => t.Code == request.Code))
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "An academic term with this code already exists"));
            }

            var academicTerm = new AcademicTerm
            {
                Name = request.Name,
                Code = request.Code,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                IsActive = false,
                EnrollmentStartDate = request.EnrollmentStartDate,
                EnrollmentEndDate = request.EnrollmentEndDate,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(academicTerm);

            var dto = new AcademicTermDto
            {
                Id = created.Id,
                Name = created.Name,
                Code = created.Code,
                StartDate = created.StartDate,
                EndDate = created.EndDate,
                IsActive = created.IsActive,
                EnrollmentStartDate = created.EnrollmentStartDate,
                EnrollmentEndDate = created.EnrollmentEndDate,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<AcademicTermDto>.SuccessResult(dto, "Academic term created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating academic term");
            return StatusCode(500, ApiResponse<AcademicTermDto>.FailureResult(
                "An error occurred while creating the academic term"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<AcademicTermDto>>> Update(int id, [FromBody] UpdateAcademicTermRequest request)
    {
        try
        {
            var academicTerm = await _repository.GetByIdAsync(id);

            if (academicTerm == null)
            {
                return NotFound(ApiResponse<AcademicTermDto>.FailureResult("Academic term not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Name and code are required"));
            }

            // Validate dates
            if (request.StartDate >= request.EndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Start date must be before end date"));
            }

            if (request.EnrollmentStartDate >= request.EnrollmentEndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Enrollment start date must be before enrollment end date"));
            }

            if (request.EnrollmentStartDate < request.StartDate || request.EnrollmentEndDate > request.EndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Enrollment dates must be within the term dates"));
            }

            // Check if code already exists for another academic term
            if (await _repository.ExistsAsync(t => t.Code == request.Code && t.Id != id))
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "An academic term with this code already exists"));
            }

            academicTerm.Name = request.Name;
            academicTerm.Code = request.Code;
            academicTerm.StartDate = request.StartDate;
            academicTerm.EndDate = request.EndDate;
            academicTerm.IsActive = request.IsActive;
            academicTerm.EnrollmentStartDate = request.EnrollmentStartDate;
            academicTerm.EnrollmentEndDate = request.EnrollmentEndDate;
            academicTerm.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(academicTerm);

            var dto = new AcademicTermDto
            {
                Id = academicTerm.Id,
                Name = academicTerm.Name,
                Code = academicTerm.Code,
                StartDate = academicTerm.StartDate,
                EndDate = academicTerm.EndDate,
                IsActive = academicTerm.IsActive,
                EnrollmentStartDate = academicTerm.EnrollmentStartDate,
                EnrollmentEndDate = academicTerm.EnrollmentEndDate,
                CreatedAt = academicTerm.CreatedAt
            };

            return Ok(ApiResponse<AcademicTermDto>.SuccessResult(dto, "Academic term updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating academic term {Id}", id);
            return StatusCode(500, ApiResponse<AcademicTermDto>.FailureResult(
                "An error occurred while updating the academic term"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var academicTerm = await _repository.GetByIdAsync(id);

            if (academicTerm == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Academic term not found"));
            }

            await _repository.DeleteAsync(academicTerm);

            return Ok(ApiResponse<bool>.SuccessResult(true, "Academic term deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting academic term {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the academic term"));
        }
    }
}

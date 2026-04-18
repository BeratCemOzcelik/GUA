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

    // All DateTime values in DB are stored as UTC; explicitly tag the Kind so
    // System.Text.Json serializes them with a "Z" suffix. Without this, browsers
    // interpret the serialized string as local time and dates may shift by a day.
    private static DateTime AsUtc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);
    private static AcademicTermDto ToDto(AcademicTerm t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Code = t.Code,
        StartDate = AsUtc(t.StartDate),
        EndDate = AsUtc(t.EndDate),
        IsActive = t.IsActive,
        EnrollmentStartDate = AsUtc(t.EnrollmentStartDate),
        EnrollmentEndDate = AsUtc(t.EnrollmentEndDate),
        CreatedAt = AsUtc(t.CreatedAt)
    };

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<AcademicTermDto>>>> GetAll()
    {
        try
        {
            var academicTerms = await _repository.GetAllAsync();
            var dtos = academicTerms.Select(ToDto);

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

            return Ok(ApiResponse<AcademicTermDto>.SuccessResult(ToDto(academicTerm)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving academic term {Id}", id);
            return StatusCode(500, ApiResponse<AcademicTermDto>.FailureResult(
                "An error occurred while retrieving the academic term"));
        }
    }

    [HttpGet("current")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AcademicTermDto>>> GetCurrent()
    {
        try
        {
            var terms = await _repository.GetAllAsync();
            var activeTerm = terms
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.StartDate)
                .FirstOrDefault();

            if (activeTerm == null)
            {
                return NotFound(ApiResponse<AcademicTermDto>.FailureResult("No active academic term found"));
            }

            return Ok(ApiResponse<AcademicTermDto>.SuccessResult(ToDto(activeTerm)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current academic term");
            return StatusCode(500, ApiResponse<AcademicTermDto>.FailureResult(
                "An error occurred while retrieving the current academic term"));
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

            // Enrollment end date must not exceed term end date
            if (request.EnrollmentEndDate > request.EndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Enrollment end date cannot be after the term end date"));
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
                StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
                EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
                IsActive = false,
                EnrollmentStartDate = DateTime.SpecifyKind(request.EnrollmentStartDate, DateTimeKind.Utc),
                EnrollmentEndDate = DateTime.SpecifyKind(request.EnrollmentEndDate, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(academicTerm);
            var dto = ToDto(created);

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<AcademicTermDto>.SuccessResult(dto, "Academic term created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating academic term");
            var errorMessage = ex.InnerException != null
                ? $"{ex.Message} | Inner: {ex.InnerException.Message}"
                : ex.Message;
            return StatusCode(500, ApiResponse<AcademicTermDto>.FailureResult(
                $"An error occurred while creating the academic term: {errorMessage}"));
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

            // Enrollment end date must not exceed term end date
            if (request.EnrollmentEndDate > request.EndDate)
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "Enrollment end date cannot be after the term end date"));
            }

            // Check if code already exists for another academic term
            if (await _repository.ExistsAsync(t => t.Code == request.Code && t.Id != id))
            {
                return BadRequest(ApiResponse<AcademicTermDto>.FailureResult(
                    "An academic term with this code already exists"));
            }

            academicTerm.Name = request.Name;
            academicTerm.Code = request.Code;
            academicTerm.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
            academicTerm.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);
            academicTerm.IsActive = request.IsActive;
            academicTerm.EnrollmentStartDate = DateTime.SpecifyKind(request.EnrollmentStartDate, DateTimeKind.Utc);
            academicTerm.EnrollmentEndDate = DateTime.SpecifyKind(request.EnrollmentEndDate, DateTimeKind.Utc);
            academicTerm.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(academicTerm);

            return Ok(ApiResponse<AcademicTermDto>.SuccessResult(ToDto(academicTerm), "Academic term updated successfully"));
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

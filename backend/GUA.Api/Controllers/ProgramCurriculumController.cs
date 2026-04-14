using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Program;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GUA.Infrastructure.Data;
using ProgramEntity = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/programs/{programId}/curriculum")]
[Authorize]
public class ProgramCurriculumController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRepository<ProgramCourse> _repo;
    private readonly IRepository<ProgramEntity> _programRepo;
    private readonly IRepository<Course> _courseRepo;
    private readonly ILogger<ProgramCurriculumController> _logger;

    public ProgramCurriculumController(
        ApplicationDbContext context,
        IRepository<ProgramCourse> repo,
        IRepository<ProgramEntity> programRepo,
        IRepository<Course> courseRepo,
        ILogger<ProgramCurriculumController> logger)
    {
        _context = context;
        _repo = repo;
        _programRepo = programRepo;
        _courseRepo = courseRepo;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<CurriculumDto>>> Get(int programId)
    {
        try
        {
            var program = await _programRepo.GetByIdAsync(programId);
            if (program == null)
                return NotFound(ApiResponse<CurriculumDto>.FailureResult("Program not found"));

            var items = await _context.ProgramCourses
                .Where(pc => pc.ProgramId == programId)
                .Include(pc => pc.Course)
                .OrderBy(pc => pc.YearLevel)
                .ThenBy(pc => pc.SortOrder)
                .ThenBy(pc => pc.Course.Code)
                .ToListAsync();

            var dtos = items.Select(pc => new ProgramCourseDto
            {
                Id = pc.Id,
                ProgramId = pc.ProgramId,
                CourseId = pc.CourseId,
                CourseCode = pc.Course.Code,
                CourseName = pc.Course.Name,
                CourseCredits = pc.Course.Credits,
                CourseDescription = pc.Course.Description,
                YearLevel = pc.YearLevel,
                IsRequired = pc.IsRequired,
                SortOrder = pc.SortOrder
            }).ToList();

            var years = Enumerable.Range(1, Math.Max(program.DurationYears, 1))
                .Select(y => new CurriculumYearDto
                {
                    YearLevel = y,
                    Courses = dtos.Where(d => d.YearLevel == y).ToList(),
                    TotalCredits = dtos.Where(d => d.YearLevel == y).Sum(d => d.CourseCredits)
                }).ToList();

            var curriculum = new CurriculumDto
            {
                ProgramId = program.Id,
                ProgramName = program.Name,
                DurationYears = program.DurationYears,
                TotalCreditsRequired = program.TotalCreditsRequired,
                AssignedCredits = dtos.Sum(d => d.CourseCredits),
                Years = years
            };

            return Ok(ApiResponse<CurriculumDto>.SuccessResult(curriculum));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving curriculum for program {Id}", programId);
            return StatusCode(500, ApiResponse<CurriculumDto>.FailureResult("Error retrieving curriculum"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<ProgramCourseDto>>> Add(int programId, [FromBody] AddProgramCourseRequest request)
    {
        try
        {
            if (!await _programRepo.ExistsAsync(p => p.Id == programId))
                return NotFound(ApiResponse<ProgramCourseDto>.FailureResult("Program not found"));

            var course = await _courseRepo.GetByIdAsync(request.CourseId);
            if (course == null)
                return BadRequest(ApiResponse<ProgramCourseDto>.FailureResult("Course not found"));

            if (await _repo.ExistsAsync(pc => pc.ProgramId == programId && pc.CourseId == request.CourseId))
                return BadRequest(ApiResponse<ProgramCourseDto>.FailureResult("Course already in curriculum"));

            var entity = new ProgramCourse
            {
                ProgramId = programId,
                CourseId = request.CourseId,
                YearLevel = request.YearLevel,
                IsRequired = request.IsRequired,
                SortOrder = request.SortOrder,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repo.AddAsync(entity);

            var dto = new ProgramCourseDto
            {
                Id = created.Id,
                ProgramId = created.ProgramId,
                CourseId = created.CourseId,
                CourseCode = course.Code,
                CourseName = course.Name,
                CourseCredits = course.Credits,
                CourseDescription = course.Description,
                YearLevel = created.YearLevel,
                IsRequired = created.IsRequired,
                SortOrder = created.SortOrder
            };

            return Ok(ApiResponse<ProgramCourseDto>.SuccessResult(dto, "Course added to curriculum"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding course to program {Id}", programId);
            return StatusCode(500, ApiResponse<ProgramCourseDto>.FailureResult("Error adding course"));
        }
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<int>>> BulkAdd(int programId, [FromBody] BulkAddProgramCoursesRequest request)
    {
        try
        {
            if (!await _programRepo.ExistsAsync(p => p.Id == programId))
                return NotFound(ApiResponse<int>.FailureResult("Program not found"));

            var existing = await _context.ProgramCourses
                .Where(pc => pc.ProgramId == programId)
                .Select(pc => pc.CourseId)
                .ToListAsync();

            var toAdd = request.Courses
                .Where(c => !existing.Contains(c.CourseId))
                .Select(c => new ProgramCourse
                {
                    ProgramId = programId,
                    CourseId = c.CourseId,
                    YearLevel = c.YearLevel,
                    IsRequired = c.IsRequired,
                    SortOrder = c.SortOrder,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

            if (toAdd.Any())
            {
                _context.ProgramCourses.AddRange(toAdd);
                await _context.SaveChangesAsync();
            }

            return Ok(ApiResponse<int>.SuccessResult(toAdd.Count, $"Added {toAdd.Count} courses to curriculum"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk-adding courses to program {Id}", programId);
            return StatusCode(500, ApiResponse<int>.FailureResult("Error bulk-adding courses"));
        }
    }

    [HttpPut("{programCourseId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(int programId, int programCourseId, [FromBody] UpdateProgramCourseRequest request)
    {
        try
        {
            var entity = await _repo.GetByIdAsync(programCourseId);
            if (entity == null || entity.ProgramId != programId)
                return NotFound(ApiResponse<bool>.FailureResult("Curriculum entry not found"));

            entity.YearLevel = request.YearLevel;
            entity.IsRequired = request.IsRequired;
            entity.SortOrder = request.SortOrder;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.UpdateAsync(entity);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Curriculum entry updated"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating curriculum {Id}", programCourseId);
            return StatusCode(500, ApiResponse<bool>.FailureResult("Error updating curriculum entry"));
        }
    }

    [HttpDelete("{programCourseId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Remove(int programId, int programCourseId)
    {
        try
        {
            var entity = await _repo.GetByIdAsync(programCourseId);
            if (entity == null || entity.ProgramId != programId)
                return NotFound(ApiResponse<bool>.FailureResult("Curriculum entry not found"));

            await _repo.DeleteAsync(entity);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Course removed from curriculum"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing curriculum {Id}", programCourseId);
            return StatusCode(500, ApiResponse<bool>.FailureResult("Error removing curriculum entry"));
        }
    }
}

using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Grade;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GPARecordsController : ControllerBase
{
    private readonly IRepository<GPARecord> _repository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Enrollment> _enrollmentRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<FinalGrade> _finalGradeRepository;
    private readonly ILogger<GPARecordsController> _logger;

    public GPARecordsController(
        IRepository<GPARecord> repository,
        IRepository<StudentProfile> studentRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<User> userRepository,
        IRepository<Enrollment> enrollmentRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        IRepository<FinalGrade> finalGradeRepository,
        ILogger<GPARecordsController> logger)
    {
        _repository = repository;
        _studentRepository = studentRepository;
        _termRepository = termRepository;
        _userRepository = userRepository;
        _enrollmentRepository = enrollmentRepository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _finalGradeRepository = finalGradeRepository;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GPARecordDto>>>> GetAll(
        [FromQuery] int? studentId = null,
        [FromQuery] int? termId = null)
    {
        try
        {
            var records = await _repository.GetAllAsync();

            // Apply filters
            if (studentId.HasValue)
            {
                records = records.Where(r => r.StudentId == studentId.Value).ToList();
            }

            if (termId.HasValue)
            {
                records = records.Where(r => r.TermId == termId.Value).ToList();
            }

            var dtos = await MapToGPARecordDtos(records);
            return Ok(ApiResponse<IEnumerable<GPARecordDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving GPA records");
            return StatusCode(500, ApiResponse<IEnumerable<GPARecordDto>>.FailureResult(
                "An error occurred while retrieving GPA records"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<GPARecordDto>>> GetById(int id)
    {
        try
        {
            var record = await _repository.GetByIdAsync(id);
            if (record == null)
            {
                return NotFound(ApiResponse<GPARecordDto>.FailureResult("GPA record not found"));
            }

            // Verify authorization for students
            if (User.IsInRole("Student") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var student = await _studentRepository.GetByIdAsync(record.StudentId);
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                if (student == null || student.UserId != userId)
                {
                    return Forbid();
                }
            }

            var dto = await MapToGPARecordDto(record);
            return Ok(ApiResponse<GPARecordDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving GPA record {Id}", id);
            return StatusCode(500, ApiResponse<GPARecordDto>.FailureResult(
                "An error occurred while retrieving the GPA record"));
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<GPARecordDto>>>> GetByStudent(int studentId)
    {
        try
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<GPARecordDto>>.FailureResult("Student not found"));
            }

            // Verify authorization - students can only see their own GPA records
            if (User.IsInRole("Student") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                if (student.UserId != userId)
                {
                    return Forbid();
                }
            }

            var records = await _repository.FindAsync(r => r.StudentId == studentId);
            var dtos = await MapToGPARecordDtos(records.OrderByDescending(r => r.CalculatedAt));

            return Ok(ApiResponse<IEnumerable<GPARecordDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving GPA records for student {StudentId}", studentId);
            return StatusCode(500, ApiResponse<IEnumerable<GPARecordDto>>.FailureResult(
                "An error occurred while retrieving student GPA records"));
        }
    }

    [HttpGet("student/{studentId}/term/{termId}")]
    public async Task<ActionResult<ApiResponse<GPARecordDto>>> GetByStudentAndTerm(int studentId, int termId)
    {
        try
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
            {
                return NotFound(ApiResponse<GPARecordDto>.FailureResult("Student not found"));
            }

            // Verify authorization - students can only see their own GPA records
            if (User.IsInRole("Student") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                if (student.UserId != userId)
                {
                    return Forbid();
                }
            }

            var records = await _repository.GetAllAsync();
            var record = records.FirstOrDefault(r =>
                r.StudentId == studentId && r.TermId == termId);

            if (record == null)
            {
                return NotFound(ApiResponse<GPARecordDto>.FailureResult(
                    "GPA record not found for this student and term"));
            }

            var dto = await MapToGPARecordDto(record);
            return Ok(ApiResponse<GPARecordDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving GPA record for student {StudentId}, term {TermId}", studentId, termId);
            return StatusCode(500, ApiResponse<GPARecordDto>.FailureResult(
                "An error occurred while retrieving the GPA record"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var record = await _repository.GetByIdAsync(id);
            if (record == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("GPA record not found"));
            }

            await _repository.DeleteAsync(record);
            return Ok(ApiResponse<bool>.SuccessResult(true, "GPA record deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting GPA record {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the GPA record"));
        }
    }

    private async Task<GPARecordDto> MapToGPARecordDto(GPARecord record)
    {
        var student = await _studentRepository.GetByIdAsync(record.StudentId);
        var studentUser = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;
        var term = await _termRepository.GetByIdAsync(record.TermId);

        // Calculate term credits earned
        int termCreditsEarned = 0;

        try
        {
            var termOfferings = await _offeringRepository.FindAsync(o => o.TermId == record.TermId);
            var termOfferingIds = termOfferings.Select(o => o.Id).ToList();
            var termEnrollments = await _enrollmentRepository.FindAsync(e =>
                e.StudentId == record.StudentId &&
                termOfferingIds.Contains(e.CourseOfferingId) &&
                e.Status == EnrollmentStatus.Completed);

            foreach (var enrollment in termEnrollments)
            {
                var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
                if (offering != null)
                {
                    var course = await _courseRepository.GetByIdAsync(offering.CourseId);
                    if (course != null)
                    {
                        termCreditsEarned += course.Credits;
                    }
                }
            }
        }
        catch
        {
            // Fallback to 0 if calculation fails
        }

        return new GPARecordDto
        {
            Id = record.Id,
            StudentId = record.StudentId,
            StudentNumber = student?.StudentNumber ?? "",
            StudentName = studentUser != null ? $"{studentUser.FirstName} {studentUser.LastName}" : "",
            TermId = record.TermId,
            TermName = term?.Name ?? "",
            TermCode = term?.Code ?? "",
            TermGPA = record.TermGPA,
            CumulativeGPA = record.CumulativeGPA,
            TermCreditsEarned = termCreditsEarned,
            TotalCreditsEarned = student?.TotalCreditsEarned ?? 0,
            CalculatedAt = DateTime.SpecifyKind(record.CalculatedAt, DateTimeKind.Utc)
        };
    }

    private async Task<List<GPARecordDto>> MapToGPARecordDtos(IEnumerable<GPARecord> records)
    {
        var dtos = new List<GPARecordDto>();
        foreach (var record in records)
        {
            dtos.Add(await MapToGPARecordDto(record));
        }
        return dtos;
    }
}

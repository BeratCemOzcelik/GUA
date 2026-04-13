using GUA.Api.Services;
using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Transcript;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AcademicProgram = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TranscriptsController : ControllerBase
{
    private readonly IRepository<Transcript> _repository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<Enrollment> _enrollmentRepository;
    private readonly IRepository<FinalGrade> _finalGradeRepository;
    private readonly IRepository<GPARecord> _gpaRecordRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<AcademicProgram> _programRepository;
    private readonly IRepository<Department> _departmentRepository;
    private readonly IRepository<User> _userRepository;
    private readonly TranscriptPdfService _pdfService;
    private readonly ILogger<TranscriptsController> _logger;

    public TranscriptsController(
        IRepository<Transcript> repository,
        IRepository<StudentProfile> studentRepository,
        IRepository<Enrollment> enrollmentRepository,
        IRepository<FinalGrade> finalGradeRepository,
        IRepository<GPARecord> gpaRecordRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<AcademicProgram> programRepository,
        IRepository<Department> departmentRepository,
        IRepository<User> userRepository,
        TranscriptPdfService pdfService,
        ILogger<TranscriptsController> logger)
    {
        _repository = repository;
        _studentRepository = studentRepository;
        _enrollmentRepository = enrollmentRepository;
        _finalGradeRepository = finalGradeRepository;
        _gpaRecordRepository = gpaRecordRepository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _termRepository = termRepository;
        _programRepository = programRepository;
        _departmentRepository = departmentRepository;
        _userRepository = userRepository;
        _pdfService = pdfService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TranscriptDto>>>> GetAll(
        [FromQuery] int? studentId = null)
    {
        try
        {
            var transcripts = await _repository.GetAllAsync();

            if (studentId.HasValue)
                transcripts = transcripts.Where(t => t.StudentId == studentId.Value).ToList();

            var dtos = await MapToTranscriptDtos(transcripts);

            return Ok(ApiResponse<IEnumerable<TranscriptDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving transcripts");
            return StatusCode(500, ApiResponse<IEnumerable<TranscriptDto>>.FailureResult(
                "An error occurred while retrieving transcripts"));
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<TranscriptDto>>> GetById(int id)
    {
        try
        {
            var transcript = await _repository.GetByIdAsync(id);
            if (transcript == null)
            {
                return NotFound(ApiResponse<TranscriptDto>.FailureResult("Transcript not found"));
            }

            var dtos = await MapToTranscriptDtos(new[] { transcript });
            return Ok(ApiResponse<TranscriptDto>.SuccessResult(dtos.First()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving transcript {Id}", id);
            return StatusCode(500, ApiResponse<TranscriptDto>.FailureResult(
                "An error occurred while retrieving the transcript"));
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TranscriptDto>>>> GetByStudentId(int studentId)
    {
        try
        {
            var transcripts = await _repository.GetAllAsync();
            transcripts = transcripts.Where(t => t.StudentId == studentId).ToList();

            var dtos = await MapToTranscriptDtos(transcripts);

            return Ok(ApiResponse<IEnumerable<TranscriptDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving transcripts for student {StudentId}", studentId);
            return StatusCode(500, ApiResponse<IEnumerable<TranscriptDto>>.FailureResult(
                "An error occurred while retrieving student transcripts"));
        }
    }

    [HttpGet("my-transcript")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<TranscriptDataDto>>> GetMyTranscript()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<TranscriptDataDto>.FailureResult("Invalid user token"));
            }

            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<TranscriptDataDto>.FailureResult("Student profile not found for this user"));
            }

            return await GetTranscriptData(student.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's transcript");
            return StatusCode(500, ApiResponse<TranscriptDataDto>.FailureResult(
                "An error occurred while retrieving your transcript"));
        }
    }

    [HttpGet("history")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TranscriptDto>>>> GetMyHistory()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<IEnumerable<TranscriptDto>>.FailureResult("Invalid user token"));
            }

            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<IEnumerable<TranscriptDto>>.FailureResult("Student profile not found"));
            }

            var transcripts = await _repository.GetAllAsync();
            transcripts = transcripts
                .Where(t => t.StudentId == student.Id)
                .OrderByDescending(t => t.GeneratedAt)
                .ToList();

            var dtos = await MapToTranscriptDtos(transcripts);
            return Ok(ApiResponse<IEnumerable<TranscriptDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving transcript history");
            return StatusCode(500, ApiResponse<IEnumerable<TranscriptDto>>.FailureResult(
                "An error occurred while retrieving transcript history"));
        }
    }

    [HttpGet("student/{studentId}/data")]
    public async Task<ActionResult<ApiResponse<TranscriptDataDto>>> GetTranscriptData(int studentId)
    {
        try
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
            {
                return NotFound(ApiResponse<TranscriptDataDto>.FailureResult("Student not found"));
            }

            var user = await _userRepository.GetByIdAsync(student.UserId);
            var program = await _programRepository.GetByIdAsync(student.ProgramId);
            var department = program != null ? await _departmentRepository.GetByIdAsync(program.DepartmentId) : null;

            var allEnrollments = await _enrollmentRepository.GetAllAsync();
            var studentEnrollments = allEnrollments
                .Where(e => e.StudentId == studentId)
                .OrderBy(e => e.EnrollmentDate)
                .ToList();

            var enrollmentIds = studentEnrollments.Select(e => e.Id).ToList();
            var offeringIds = studentEnrollments.Select(e => e.CourseOfferingId).ToList();

            var finalGrades = await _finalGradeRepository.GetAllAsync();
            var offerings = await _offeringRepository.GetAllAsync();
            var courses = await _courseRepository.GetAllAsync();
            var terms = await _termRepository.GetAllAsync();

            var finalGradeDict = finalGrades.Where(fg => enrollmentIds.Contains(fg.EnrollmentId))
                .ToDictionary(fg => fg.EnrollmentId);
            var offeringDict = offerings.Where(o => offeringIds.Contains(o.Id))
                .ToDictionary(o => o.Id);
            var courseDict = courses.ToDictionary(c => c.Id);
            var termDict = terms.ToDictionary(t => t.Id);

            var gpaRecords = await _gpaRecordRepository.GetAllAsync();
            var studentGPARecords = gpaRecords
                .Where(g => g.StudentId == studentId)
                .OrderBy(g => g.CalculatedAt)
                .ToDictionary(g => g.TermId);

            var termGroups = studentEnrollments
                .Where(e => finalGradeDict.ContainsKey(e.Id))
                .GroupBy(e =>
                {
                    var offering = offeringDict.GetValueOrDefault(e.CourseOfferingId);
                    return offering?.TermId ?? 0;
                })
                .Where(g => g.Key != 0)
                .OrderBy(g => g.Key)
                .ToList();

            var termRecords = new List<TermRecord>();
            var totalCreditsAttempted = 0;

            foreach (var termGroup in termGroups)
            {
                var term = termDict.GetValueOrDefault(termGroup.Key);
                if (term == null) continue;

                var courseRecords = new List<CourseRecord>();
                var termCredits = 0;

                foreach (var enrollment in termGroup)
                {
                    var finalGrade = finalGradeDict.GetValueOrDefault(enrollment.Id);
                    if (finalGrade == null) continue;

                    var offering = offeringDict.GetValueOrDefault(enrollment.CourseOfferingId);
                    if (offering == null) continue;

                    var course = courseDict.GetValueOrDefault(offering.CourseId);
                    if (course == null) continue;

                    courseRecords.Add(new CourseRecord
                    {
                        CourseCode = course.Code,
                        CourseName = course.Name,
                        Credits = course.Credits,
                        LetterGrade = finalGrade.LetterGrade,
                        GradePoints = finalGrade.GradePoints,
                        Status = enrollment.Status.ToString()
                    });

                    termCredits += course.Credits;
                    totalCreditsAttempted += course.Credits;
                }

                var gpaRecord = studentGPARecords.GetValueOrDefault(termGroup.Key);

                termRecords.Add(new TermRecord
                {
                    TermName = term.Name,
                    TermCode = term.Code,
                    Courses = courseRecords,
                    TermGPA = gpaRecord?.TermGPA ?? 0,
                    TermCredits = termCredits,
                    CumulativeGPA = gpaRecord?.CumulativeGPA ?? 0,
                    CumulativeCredits = gpaRecord != null ? student.TotalCreditsEarned : 0
                });
            }

            var transcriptData = new TranscriptDataDto
            {
                Student = new StudentInfo
                {
                    StudentNumber = student.StudentNumber,
                    FullName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                    Email = user?.Email ?? "",
                    ProgramName = program?.Name ?? "Unknown",
                    DepartmentName = department?.Name ?? "Unknown",
                    EnrollmentDate = student.EnrollmentDate,
                    ExpectedGraduationDate = student.ExpectedGraduationDate,
                    AcademicStatus = student.AcademicStatus.ToString()
                },
                TermRecords = termRecords,
                GPASummary = new GPASummary
                {
                    CurrentGPA = student.CurrentGPA,
                    TotalCreditsEarned = student.TotalCreditsEarned,
                    TotalCreditsAttempted = totalCreditsAttempted,
                    OverallGPA = student.CurrentGPA
                },
                GeneratedAt = DateTime.UtcNow
            };

            return Ok(ApiResponse<TranscriptDataDto>.SuccessResult(transcriptData));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating transcript data for student {StudentId}", studentId);
            return StatusCode(500, ApiResponse<TranscriptDataDto>.FailureResult(
                "An error occurred while generating transcript data"));
        }
    }

    [HttpPost("generate")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<TranscriptDto>>> Generate()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized(ApiResponse<TranscriptDto>.FailureResult("Invalid user"));
            }

            // Find the student profile for the current user
            var students = await _studentRepository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == currentUserId);

            if (student == null)
            {
                return BadRequest(ApiResponse<TranscriptDto>.FailureResult("Student profile not found"));
            }

            // Only graduated students can generate official transcripts
            if (student.AcademicStatus != GUA.Shared.Enums.AcademicStatus.Graduated)
            {
                return BadRequest(ApiResponse<TranscriptDto>.FailureResult(
                    "Only graduated students can generate official transcripts. Your current status: " + student.AcademicStatus));
            }

            // Generate verification code: GUA-YYYY-XXXXX
            var verificationCode = GenerateVerificationCode(student.Id);

            var transcript = new Transcript
            {
                StudentId = student.Id,
                GeneratedAt = DateTime.UtcNow,
                GeneratedByUserId = currentUserId,
                IsOfficial = true,
                PdfUrl = null,
                Hash = verificationCode,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(transcript);

            return await GetById(created.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating transcript");
            return StatusCode(500, ApiResponse<TranscriptDto>.FailureResult(
                "An error occurred while generating the transcript"));
        }
    }

    [HttpPost("admin-generate")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<TranscriptDto>>> AdminGenerate([FromBody] GenerateTranscriptDto request)
    {
        try
        {
            var student = await _studentRepository.GetByIdAsync(request.StudentId);
            if (student == null)
            {
                return BadRequest(ApiResponse<TranscriptDto>.FailureResult("Student not found"));
            }

            if (student.AcademicStatus != GUA.Shared.Enums.AcademicStatus.Graduated)
            {
                return BadRequest(ApiResponse<TranscriptDto>.FailureResult(
                    $"Only graduated students can generate official transcripts. Current status: {student.AcademicStatus}"));
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                return Unauthorized(ApiResponse<TranscriptDto>.FailureResult("Invalid user"));
            }

            var verificationCode = GenerateVerificationCode(student.Id);

            var transcript = new Transcript
            {
                StudentId = request.StudentId,
                GeneratedAt = DateTime.UtcNow,
                GeneratedByUserId = currentUserId,
                IsOfficial = request.IsOfficial,
                PdfUrl = null,
                Hash = verificationCode,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(transcript);

            return await GetById(created.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating transcript");
            return StatusCode(500, ApiResponse<TranscriptDto>.FailureResult(
                "An error occurred while generating the transcript"));
        }
    }

    /// <summary>
    /// Public endpoint - verify a diploma/transcript by its verification code.
    /// No authentication required.
    /// </summary>
    [HttpGet("verify/{code}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DiplomaVerificationResult>>> VerifyDiploma(string code)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(ApiResponse<DiplomaVerificationResult>.FailureResult("Verification code is required"));
            }

            var transcripts = await _repository.GetAllAsync();
            var transcript = transcripts.FirstOrDefault(t =>
                t.Hash != null && t.Hash.Equals(code.Trim(), StringComparison.OrdinalIgnoreCase));

            if (transcript == null)
            {
                return NotFound(ApiResponse<DiplomaVerificationResult>.FailureResult(
                    "No document found with this verification code. Please check the code and try again."));
            }

            var student = await _studentRepository.GetByIdAsync(transcript.StudentId);
            var user = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;
            var program = student != null ? await _programRepository.GetByIdAsync(student.ProgramId) : null;
            var department = program != null ? await _departmentRepository.GetByIdAsync(program.DepartmentId) : null;

            var result = new DiplomaVerificationResult
            {
                IsValid = true,
                StudentName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                StudentNumber = student?.StudentNumber ?? "",
                ProgramName = program?.Name ?? "Unknown",
                DepartmentName = department?.Name ?? "Unknown",
                GPA = student?.CurrentGPA ?? 0,
                TotalCreditsEarned = student?.TotalCreditsEarned ?? 0,
                GeneratedAt = transcript.GeneratedAt,
                IsOfficial = transcript.IsOfficial,
                VerificationCode = transcript.Hash!
            };

            return Ok(ApiResponse<DiplomaVerificationResult>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying diploma with code {Code}", code);
            return StatusCode(500, ApiResponse<DiplomaVerificationResult>.FailureResult(
                "An error occurred while verifying the document"));
        }
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        try
        {
            var transcript = await _repository.GetByIdAsync(id);
            if (transcript == null)
            {
                return NotFound("Transcript not found");
            }

            // Students can only download their own transcripts
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
                if (!isAdmin)
                {
                    var students = await _studentRepository.GetAllAsync();
                    var student = students.FirstOrDefault(s => s.UserId == userId);
                    if (student == null || student.Id != transcript.StudentId)
                    {
                        return Forbid();
                    }
                }
            }

            var transcriptDataResult = await GetTranscriptData(transcript.StudentId);
            var okResult = transcriptDataResult.Result as OkObjectResult;
            if (okResult == null)
            {
                return StatusCode(500, "Failed to generate transcript data");
            }

            var apiResponse = okResult.Value as ApiResponse<TranscriptDataDto>;
            if (apiResponse?.Data == null)
            {
                return StatusCode(500, "Failed to generate transcript data");
            }

            var pdfBytes = _pdfService.GeneratePdf(apiResponse.Data, transcript.Hash, transcript.IsOfficial);

            var student2 = await _studentRepository.GetByIdAsync(transcript.StudentId);
            var fileName = $"Transcript_{student2?.StudentNumber ?? transcript.StudentId.ToString()}_{transcript.GeneratedAt:yyyyMMdd}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading transcript PDF {Id}", id);
            return StatusCode(500, "An error occurred while generating the PDF");
        }
    }

    [HttpGet("student/{studentId}/preview-pdf")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> PreviewPdf(int studentId)
    {
        try
        {
            var transcriptDataResult = await GetTranscriptData(studentId);
            var okResult = transcriptDataResult.Result as OkObjectResult;
            if (okResult == null)
            {
                return StatusCode(500, "Failed to generate transcript data");
            }

            var apiResponse = okResult.Value as ApiResponse<TranscriptDataDto>;
            if (apiResponse?.Data == null)
            {
                return StatusCode(500, "Failed to generate transcript data");
            }

            var pdfBytes = _pdfService.GeneratePdf(apiResponse.Data, null, false);

            var student = await _studentRepository.GetByIdAsync(studentId);
            var fileName = $"Transcript_Preview_{student?.StudentNumber ?? studentId.ToString()}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating preview PDF for student {StudentId}", studentId);
            return StatusCode(500, "An error occurred while generating the PDF");
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var transcript = await _repository.GetByIdAsync(id);
            if (transcript == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Transcript not found"));
            }

            await _repository.DeleteAsync(transcript);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Transcript deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting transcript {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the transcript"));
        }
    }

    private static string GenerateVerificationCode(int studentId)
    {
        var year = DateTime.UtcNow.Year;
        var randomBytes = new byte[4];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var randomPart = BitConverter.ToUInt32(randomBytes, 0) % 100000;
        return $"GUA-{year}-{randomPart:D5}";
    }

    private async Task<List<TranscriptDto>> MapToTranscriptDtos(IEnumerable<Transcript> transcripts)
    {
        var transcriptList = transcripts.ToList();
        if (!transcriptList.Any())
            return new List<TranscriptDto>();

        var studentIds = transcriptList.Select(t => t.StudentId).Distinct();

        var students = await _studentRepository.GetAllAsync();
        var users = await _userRepository.GetAllAsync();
        var programs = await _programRepository.GetAllAsync();
        var departments = await _departmentRepository.GetAllAsync();

        var studentDict = students.Where(s => studentIds.Contains(s.Id)).ToDictionary(s => s.Id);
        var userDict = users.ToDictionary(u => u.Id, u => $"{u.FirstName} {u.LastName}");
        var programDict = programs.ToDictionary(p => p.Id);
        var departmentDict = departments.ToDictionary(d => d.Id, d => d.Name);

        return transcriptList.Select(t =>
        {
            var student = studentDict.GetValueOrDefault(t.StudentId);
            var studentName = student != null && userDict.TryGetValue(student.UserId, out var name) ? name : "Unknown";
            var program = student != null ? programDict.GetValueOrDefault(student.ProgramId) : null;
            var departmentName = program != null ? departmentDict.GetValueOrDefault(program.DepartmentId, "Unknown") : "Unknown";
            var generatedByName = userDict.GetValueOrDefault(t.GeneratedByUserId, "Unknown");

            return new TranscriptDto
            {
                Id = t.Id,
                StudentId = t.StudentId,
                StudentNumber = student?.StudentNumber ?? "",
                StudentName = studentName,
                ProgramName = program?.Name ?? "Unknown",
                DepartmentName = departmentName,
                GeneratedAt = t.GeneratedAt,
                GeneratedByName = generatedByName,
                PdfUrl = t.PdfUrl,
                Hash = t.Hash,
                IsOfficial = t.IsOfficial
            };
        }).ToList();
    }
}

using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Grade;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AcademicProgram = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinalGradesController : ControllerBase
{
    private readonly IRepository<FinalGrade> _repository;
    private readonly IRepository<Enrollment> _enrollmentRepository;
    private readonly IRepository<Grade> _gradeRepository;
    private readonly IRepository<GradeComponent> _componentRepository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<CourseOffering> _offeringRepository;
    private readonly IRepository<Course> _courseRepository;
    private readonly IRepository<AcademicTerm> _termRepository;
    private readonly IRepository<FacultyProfile> _facultyRepository;
    private readonly IRepository<GPARecord> _gpaRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ILogger<FinalGradesController> _logger;

    public FinalGradesController(
        IRepository<FinalGrade> repository,
        IRepository<Enrollment> enrollmentRepository,
        IRepository<Grade> gradeRepository,
        IRepository<GradeComponent> componentRepository,
        IRepository<StudentProfile> studentRepository,
        IRepository<CourseOffering> offeringRepository,
        IRepository<Course> courseRepository,
        IRepository<AcademicTerm> termRepository,
        IRepository<FacultyProfile> facultyRepository,
        IRepository<GPARecord> gpaRepository,
        IRepository<User> userRepository,
        ILogger<FinalGradesController> logger)
    {
        _repository = repository;
        _enrollmentRepository = enrollmentRepository;
        _gradeRepository = gradeRepository;
        _componentRepository = componentRepository;
        _studentRepository = studentRepository;
        _offeringRepository = offeringRepository;
        _courseRepository = courseRepository;
        _termRepository = termRepository;
        _facultyRepository = facultyRepository;
        _gpaRepository = gpaRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<FinalGradeDto>>>> GetAll(
        [FromQuery] int? studentId = null,
        [FromQuery] int? termId = null,
        [FromQuery] int? courseOfferingId = null)
    {
        try
        {
            var finalGrades = await _repository.GetAllAsync();

            // Apply filters
            if (courseOfferingId.HasValue)
            {
                var enrollments = await _enrollmentRepository.FindAsync(e => e.CourseOfferingId == courseOfferingId.Value);
                var enrollmentIds = enrollments.Select(e => e.Id).ToList();
                finalGrades = finalGrades.Where(fg => enrollmentIds.Contains(fg.EnrollmentId)).ToList();
            }

            if (studentId.HasValue)
            {
                var enrollments = await _enrollmentRepository.FindAsync(e => e.StudentId == studentId.Value);
                var enrollmentIds = enrollments.Select(e => e.Id).ToList();
                finalGrades = finalGrades.Where(fg => enrollmentIds.Contains(fg.EnrollmentId)).ToList();
            }

            if (termId.HasValue)
            {
                var offerings = await _offeringRepository.FindAsync(o => o.TermId == termId.Value);
                var offeringIds = offerings.Select(o => o.Id).ToList();
                var enrollments = await _enrollmentRepository.FindAsync(e => offeringIds.Contains(e.CourseOfferingId));
                var enrollmentIds = enrollments.Select(e => e.Id).ToList();
                finalGrades = finalGrades.Where(fg => enrollmentIds.Contains(fg.EnrollmentId)).ToList();
            }

            var dtos = await MapToFinalGradeDtos(finalGrades);
            return Ok(ApiResponse<IEnumerable<FinalGradeDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving final grades");
            return StatusCode(500, ApiResponse<IEnumerable<FinalGradeDto>>.FailureResult(
                "An error occurred while retrieving final grades"));
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty,Student")]
    public async Task<ActionResult<ApiResponse<FinalGradeDto>>> GetById(int id)
    {
        try
        {
            var finalGrade = await _repository.GetByIdAsync(id);
            if (finalGrade == null)
            {
                return NotFound(ApiResponse<FinalGradeDto>.FailureResult("Final grade not found"));
            }

            // Verify authorization for students
            if (User.IsInRole("Student") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var enrollment = await _enrollmentRepository.GetByIdAsync(finalGrade.EnrollmentId);
                if (enrollment != null)
                {
                    var student = await _studentRepository.GetByIdAsync(enrollment.StudentId);
                    var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                    if (student == null || student.UserId != userId)
                    {
                        return Forbid();
                    }
                }
            }

            var dto = await MapToFinalGradeDto(finalGrade);
            return Ok(ApiResponse<FinalGradeDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving final grade {Id}", id);
            return StatusCode(500, ApiResponse<FinalGradeDto>.FailureResult(
                "An error occurred while retrieving the final grade"));
        }
    }

    [HttpGet("enrollment/{enrollmentId}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty,Student")]
    public async Task<ActionResult<ApiResponse<FinalGradeDto>>> GetByEnrollment(int enrollmentId)
    {
        try
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
            if (enrollment == null)
            {
                return NotFound(ApiResponse<FinalGradeDto>.FailureResult("Enrollment not found"));
            }

            // Verify authorization for students
            if (User.IsInRole("Student") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                var student = await _studentRepository.GetByIdAsync(enrollment.StudentId);
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                if (student == null || student.UserId != userId)
                {
                    return Forbid();
                }
            }

            var finalGrades = await _repository.GetAllAsync();
            var finalGrade = finalGrades.FirstOrDefault(fg => fg.EnrollmentId == enrollmentId);
            if (finalGrade == null)
            {
                return NotFound(ApiResponse<FinalGradeDto>.FailureResult("Final grade not found for this enrollment"));
            }

            var dto = await MapToFinalGradeDto(finalGrade);
            return Ok(ApiResponse<FinalGradeDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving final grade for enrollment {EnrollmentId}", enrollmentId);
            return StatusCode(500, ApiResponse<FinalGradeDto>.FailureResult(
                "An error occurred while retrieving the final grade"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<FinalGradeDto>>> Create([FromBody] PublishFinalGradeDto request)
    {
        try
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(request.EnrollmentId);
            if (enrollment == null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult("Enrollment not found"));
            }

            // Check if final grade already exists
            var existingFinalGrades = await _repository.GetAllAsync();
            var existingFinalGrade = existingFinalGrades.FirstOrDefault(fg => fg.EnrollmentId == request.EnrollmentId);
            if (existingFinalGrade != null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult(
                    "Final grade already exists for this enrollment. Use PUT to update."));
            }

            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult("Course offering not found"));
            }

            // Verify authorization - faculty can only publish grades for their courses
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var faculties = await _facultyRepository.GetAllAsync();
            var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

            if (faculty == null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult("Faculty profile not found"));
            }

            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                if (offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            // Calculate final grade from component grades
            var components = await _componentRepository.FindAsync(c => c.CourseOfferingId == offering.Id);
            var grades = await _gradeRepository.FindAsync(g => g.EnrollmentId == request.EnrollmentId);

            if (!components.Any())
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult(
                    "No grade components defined for this course offering"));
            }

            // Verify all components have grades
            var componentIds = components.Select(c => c.Id).ToList();
            var gradedComponentIds = grades.Select(g => g.GradeComponentId).ToList();
            var missingComponents = components.Where(c => !gradedComponentIds.Contains(c.Id)).ToList();

            if (missingComponents.Any())
            {
                var missingNames = string.Join(", ", missingComponents.Select(c => c.Name));
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult(
                    $"Cannot publish final grade. Missing grades for: {missingNames}"));
            }

            // Verify total weight is 100%
            var totalWeight = components.Sum(c => c.Weight);
            if (totalWeight != 100)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult(
                    $"Cannot publish final grade. Total component weight is {totalWeight}%, must be 100%"));
            }

            // Calculate weighted average
            decimal weightedSum = 0;
            foreach (var component in components)
            {
                var grade = grades.First(g => g.GradeComponentId == component.Id);
                var percentage = component.MaxScore > 0 ? (grade.Score / component.MaxScore) * 100 : 0;
                weightedSum += percentage * (component.Weight / 100);
            }

            var numericGrade = Math.Round(weightedSum, 2);
            var letterGrade = ConvertToLetterGrade(numericGrade);
            var gradePoints = ConvertToGradePoints(letterGrade);

            // Create final grade
            var finalGrade = new FinalGrade
            {
                EnrollmentId = request.EnrollmentId,
                LetterGrade = letterGrade,
                NumericGrade = numericGrade,
                GradePoints = gradePoints,
                PublishedAt = DateTime.UtcNow,
                PublishedByFacultyId = faculty.Id,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(finalGrade);

            // Update enrollment status
            enrollment.Status = gradePoints > 0 ? EnrollmentStatus.Completed : EnrollmentStatus.Failed;
            enrollment.CompletionDate = DateTime.UtcNow;
            await _enrollmentRepository.UpdateAsync(enrollment);

            // Recalculate GPA
            await RecalculateGPA(enrollment.StudentId, offering.TermId);

            var dto = await MapToFinalGradeDto(created);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<FinalGradeDto>.SuccessResult(dto, "Final grade published successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating final grade");
            return StatusCode(500, ApiResponse<FinalGradeDto>.FailureResult(
                "An error occurred while creating the final grade"));
        }
    }

    [HttpPost("courseoffering/{offeringId}/publish")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<FinalGradeDto>>>> PublishAllForCourse(int offeringId)
    {
        try
        {
            var offering = await _offeringRepository.GetByIdAsync(offeringId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<IEnumerable<FinalGradeDto>>.FailureResult("Course offering not found"));
            }

            // Verify authorization
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var faculties = await _facultyRepository.GetAllAsync();
            var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

            if (faculty == null)
            {
                return BadRequest(ApiResponse<IEnumerable<FinalGradeDto>>.FailureResult("Faculty profile not found"));
            }

            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                if (offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            var enrollments = await _enrollmentRepository.FindAsync(e =>
                e.CourseOfferingId == offeringId &&
                e.Status == EnrollmentStatus.Enrolled);

            var createdFinalGrades = new List<FinalGrade>();
            var errors = new List<string>();

            foreach (var enrollment in enrollments)
            {
                try
                {
                    // Check if final grade already exists
                    var existingFinalGrades = await _repository.GetAllAsync();
                    var existingFinalGrade = existingFinalGrades.FirstOrDefault(fg => fg.EnrollmentId == enrollment.Id);
                    if (existingFinalGrade != null)
                    {
                        errors.Add($"Final grade already exists for enrollment {enrollment.Id}");
                        continue;
                    }

                    // Calculate final grade
                    var components = await _componentRepository.FindAsync(c => c.CourseOfferingId == offering.Id);
                    var grades = await _gradeRepository.FindAsync(g => g.EnrollmentId == enrollment.Id);

                    // Verify all components have grades
                    var componentIds = components.Select(c => c.Id).ToList();
                    var gradedComponentIds = grades.Select(g => g.GradeComponentId).ToList();
                    var missingComponents = components.Where(c => !gradedComponentIds.Contains(c.Id)).ToList();

                    if (missingComponents.Any())
                    {
                        var student = await _studentRepository.GetByIdAsync(enrollment.StudentId);
                        var missingNames = string.Join(", ", missingComponents.Select(c => c.Name));
                        errors.Add($"Student {student?.StudentNumber}: Missing grades for {missingNames}");
                        continue;
                    }

                    // Calculate weighted average
                    decimal weightedSum = 0;
                    foreach (var component in components)
                    {
                        var grade = grades.First(g => g.GradeComponentId == component.Id);
                        var percentage = component.MaxScore > 0 ? (grade.Score / component.MaxScore) * 100 : 0;
                        weightedSum += percentage * (component.Weight / 100);
                    }

                    var numericGrade = Math.Round(weightedSum, 2);
                    var letterGrade = ConvertToLetterGrade(numericGrade);
                    var gradePoints = ConvertToGradePoints(letterGrade);

                    var finalGrade = new FinalGrade
                    {
                        EnrollmentId = enrollment.Id,
                        LetterGrade = letterGrade,
                        NumericGrade = numericGrade,
                        GradePoints = gradePoints,
                        PublishedAt = DateTime.UtcNow,
                        PublishedByFacultyId = faculty.Id,
                        CreatedAt = DateTime.UtcNow
                    };

                    var created = await _repository.AddAsync(finalGrade);
                    createdFinalGrades.Add(created);

                    // Update enrollment status
                    enrollment.Status = gradePoints > 0 ? EnrollmentStatus.Completed : EnrollmentStatus.Failed;
                    enrollment.CompletionDate = DateTime.UtcNow;
                    await _enrollmentRepository.UpdateAsync(enrollment);

                    // Recalculate GPA
                    await RecalculateGPA(enrollment.StudentId, offering.TermId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error publishing final grade for enrollment {EnrollmentId}", enrollment.Id);
                    errors.Add($"Error processing enrollment {enrollment.Id}: {ex.Message}");
                }
            }

            var dtos = await MapToFinalGradeDtos(createdFinalGrades);

            if (errors.Any())
            {
                return Ok(ApiResponse<IEnumerable<FinalGradeDto>>.SuccessResult(dtos,
                    $"Published {createdFinalGrades.Count} final grades with {errors.Count} errors. Errors: {string.Join("; ", errors)}"));
            }

            return Ok(ApiResponse<IEnumerable<FinalGradeDto>>.SuccessResult(dtos,
                $"Successfully published {createdFinalGrades.Count} final grades"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing final grades for course offering {OfferingId}", offeringId);
            return StatusCode(500, ApiResponse<IEnumerable<FinalGradeDto>>.FailureResult(
                "An error occurred while publishing final grades"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<FinalGradeDto>>> Update(int id, [FromBody] PublishFinalGradeDto request)
    {
        try
        {
            var finalGrade = await _repository.GetByIdAsync(id);
            if (finalGrade == null)
            {
                return NotFound(ApiResponse<FinalGradeDto>.FailureResult("Final grade not found"));
            }

            var enrollment = await _enrollmentRepository.GetByIdAsync(finalGrade.EnrollmentId);
            if (enrollment == null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult("Enrollment not found"));
            }

            var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
            if (offering == null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult("Course offering not found"));
            }

            // Verify authorization
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var faculties = await _facultyRepository.GetAllAsync();
            var faculty = faculties.FirstOrDefault(f => f.UserId == userId);

            if (faculty == null)
            {
                return BadRequest(ApiResponse<FinalGradeDto>.FailureResult("Faculty profile not found"));
            }

            if (User.IsInRole("Faculty") && !User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                if (offering.FacultyProfileId != faculty.Id)
                {
                    return Forbid();
                }
            }

            // Recalculate final grade from component grades
            var components = await _componentRepository.FindAsync(c => c.CourseOfferingId == offering.Id);
            var grades = await _gradeRepository.FindAsync(g => g.EnrollmentId == finalGrade.EnrollmentId);

            decimal weightedSum = 0;
            foreach (var component in components)
            {
                var grade = grades.FirstOrDefault(g => g.GradeComponentId == component.Id);
                if (grade != null)
                {
                    var percentage = component.MaxScore > 0 ? (grade.Score / component.MaxScore) * 100 : 0;
                    weightedSum += percentage * (component.Weight / 100);
                }
            }

            var numericGrade = Math.Round(weightedSum, 2);
            var letterGrade = ConvertToLetterGrade(numericGrade);
            var gradePoints = ConvertToGradePoints(letterGrade);

            finalGrade.LetterGrade = letterGrade;
            finalGrade.NumericGrade = numericGrade;
            finalGrade.GradePoints = gradePoints;
            finalGrade.PublishedAt = DateTime.UtcNow;
            finalGrade.PublishedByFacultyId = faculty.Id;
            finalGrade.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(finalGrade);

            // Update enrollment status
            enrollment.Status = gradePoints > 0 ? EnrollmentStatus.Completed : EnrollmentStatus.Failed;
            enrollment.CompletionDate = DateTime.UtcNow;
            await _enrollmentRepository.UpdateAsync(enrollment);

            // Recalculate GPA
            await RecalculateGPA(enrollment.StudentId, offering.TermId);

            var dto = await MapToFinalGradeDto(finalGrade);
            return Ok(ApiResponse<FinalGradeDto>.SuccessResult(dto, "Final grade updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating final grade {Id}", id);
            return StatusCode(500, ApiResponse<FinalGradeDto>.FailureResult(
                "An error occurred while updating the final grade"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var finalGrade = await _repository.GetByIdAsync(id);
            if (finalGrade == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Final grade not found"));
            }

            var enrollment = await _enrollmentRepository.GetByIdAsync(finalGrade.EnrollmentId);
            if (enrollment != null)
            {
                // Update enrollment status back to enrolled
                enrollment.Status = EnrollmentStatus.Enrolled;
                enrollment.CompletionDate = null;
                await _enrollmentRepository.UpdateAsync(enrollment);

                var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
                if (offering != null)
                {
                    // Recalculate GPA after deletion
                    await RecalculateGPA(enrollment.StudentId, offering.TermId);
                }
            }

            await _repository.DeleteAsync(finalGrade);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Final grade deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting final grade {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the final grade"));
        }
    }

    private string ConvertToLetterGrade(decimal numericGrade)
    {
        return numericGrade switch
        {
            >= 93 => "A",
            >= 90 => "A-",
            >= 87 => "B+",
            >= 83 => "B",
            >= 80 => "B-",
            >= 77 => "C+",
            >= 73 => "C",
            >= 70 => "C-",
            >= 67 => "D+",
            >= 60 => "D",
            _ => "F"
        };
    }

    private decimal ConvertToGradePoints(string letterGrade)
    {
        return letterGrade switch
        {
            "A" => 4.0m,
            "A-" => 3.7m,
            "B+" => 3.3m,
            "B" => 3.0m,
            "B-" => 2.7m,
            "C+" => 2.3m,
            "C" => 2.0m,
            "C-" => 1.7m,
            "D+" => 1.3m,
            "D" => 1.0m,
            "F" => 0.0m,
            _ => 0.0m
        };
    }

    private async Task RecalculateGPA(int studentId, int termId)
    {
        try
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null) return;

            // Get all completed enrollments for this term
            var termOfferings = await _offeringRepository.FindAsync(o => o.TermId == termId);
            var termOfferingIds = termOfferings.Select(o => o.Id).ToList();
            var termEnrollments = await _enrollmentRepository.FindAsync(e =>
                e.StudentId == studentId &&
                termOfferingIds.Contains(e.CourseOfferingId) &&
                e.Status == EnrollmentStatus.Completed);

            // Calculate term GPA
            decimal termTotalPoints = 0;
            int termTotalCredits = 0;

            foreach (var enrollment in termEnrollments)
            {
                var finalGrades = await _repository.GetAllAsync();
                var finalGrade = finalGrades.FirstOrDefault(fg => fg.EnrollmentId == enrollment.Id);
                if (finalGrade != null)
                {
                    var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
                    if (offering != null)
                    {
                        var course = await _courseRepository.GetByIdAsync(offering.CourseId);
                        if (course != null)
                        {
                            termTotalPoints += finalGrade.GradePoints * course.Credits;
                            termTotalCredits += course.Credits;
                        }
                    }
                }
            }

            var termGPA = termTotalCredits > 0 ? Math.Round(termTotalPoints / termTotalCredits, 2) : 0;

            // Get all completed enrollments for cumulative GPA
            var allEnrollments = await _enrollmentRepository.FindAsync(e =>
                e.StudentId == studentId &&
                e.Status == EnrollmentStatus.Completed);

            decimal cumulativeTotalPoints = 0;
            int cumulativeTotalCredits = 0;

            foreach (var enrollment in allEnrollments)
            {
                var finalGrades = await _repository.GetAllAsync();
                var finalGrade = finalGrades.FirstOrDefault(fg => fg.EnrollmentId == enrollment.Id);
                if (finalGrade != null)
                {
                    var offering = await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId);
                    if (offering != null)
                    {
                        var course = await _courseRepository.GetByIdAsync(offering.CourseId);
                        if (course != null)
                        {
                            cumulativeTotalPoints += finalGrade.GradePoints * course.Credits;
                            cumulativeTotalCredits += course.Credits;
                        }
                    }
                }
            }

            var cumulativeGPA = cumulativeTotalCredits > 0 ? Math.Round(cumulativeTotalPoints / cumulativeTotalCredits, 2) : 0;

            // Update or create GPA record for this term
            var gpaRecords = await _gpaRepository.GetAllAsync();
            var gpaRecord = gpaRecords.FirstOrDefault(g =>
                g.StudentId == studentId && g.TermId == termId);

            if (gpaRecord != null)
            {
                gpaRecord.TermGPA = termGPA;
                gpaRecord.CumulativeGPA = cumulativeGPA;
                gpaRecord.CalculatedAt = DateTime.UtcNow;
                await _gpaRepository.UpdateAsync(gpaRecord);
            }
            else
            {
                gpaRecord = new GPARecord
                {
                    StudentId = studentId,
                    TermId = termId,
                    TermGPA = termGPA,
                    CumulativeGPA = cumulativeGPA,
                    CalculatedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                await _gpaRepository.AddAsync(gpaRecord);
            }

            // Update student profile
            student.CurrentGPA = cumulativeGPA;
            student.TotalCreditsEarned = cumulativeTotalCredits;
            await _studentRepository.UpdateAsync(student);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recalculating GPA for student {StudentId}, term {TermId}", studentId, termId);
        }
    }

    private async Task<FinalGradeDto> MapToFinalGradeDto(FinalGrade finalGrade)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(finalGrade.EnrollmentId);
        var student = enrollment != null ? await _studentRepository.GetByIdAsync(enrollment.StudentId) : null;
        var studentUser = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;
        var offering = enrollment != null ? await _offeringRepository.GetByIdAsync(enrollment.CourseOfferingId) : null;
        var course = offering != null ? await _courseRepository.GetByIdAsync(offering.CourseId) : null;
        var term = offering != null ? await _termRepository.GetByIdAsync(offering.TermId) : null;
        var faculty = await _facultyRepository.GetByIdAsync(finalGrade.PublishedByFacultyId);
        var facultyUser = faculty != null ? await _userRepository.GetByIdAsync(faculty.UserId) : null;

        return new FinalGradeDto
        {
            Id = finalGrade.Id,
            EnrollmentId = finalGrade.EnrollmentId,
            StudentId = student?.Id ?? 0,
            StudentNumber = student?.StudentNumber ?? "",
            StudentName = studentUser != null ? $"{studentUser.FirstName} {studentUser.LastName}" : "",
            CourseOfferingId = offering?.Id ?? 0,
            CourseCode = course?.Code ?? "",
            CourseName = course?.Name ?? "",
            Credits = course?.Credits ?? 0,
            Section = offering?.Section ?? "",
            TermName = term?.Name ?? "",
            LetterGrade = finalGrade.LetterGrade,
            NumericGrade = finalGrade.NumericGrade,
            GradePoints = finalGrade.GradePoints,
            PublishedAt = DateTime.SpecifyKind(finalGrade.PublishedAt, DateTimeKind.Utc),
            PublishedByFacultyId = finalGrade.PublishedByFacultyId,
            PublishedByFacultyName = facultyUser != null ? $"{facultyUser.FirstName} {facultyUser.LastName}" : "",
            CreatedAt = DateTime.SpecifyKind(finalGrade.CreatedAt, DateTimeKind.Utc),
            UpdatedAt = finalGrade.UpdatedAt.HasValue ? DateTime.SpecifyKind(finalGrade.UpdatedAt.Value, DateTimeKind.Utc) : null
        };
    }

    private async Task<List<FinalGradeDto>> MapToFinalGradeDtos(IEnumerable<FinalGrade> finalGrades)
    {
        var dtos = new List<FinalGradeDto>();
        foreach (var finalGrade in finalGrades)
        {
            dtos.Add(await MapToFinalGradeDto(finalGrade));
        }
        return dtos;
    }
}

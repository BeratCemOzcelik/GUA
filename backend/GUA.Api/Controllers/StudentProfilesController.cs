using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.StudentProfile;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AcademicProgram = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentProfilesController : ControllerBase
{
    private readonly IRepository<StudentProfile> _repository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<AcademicProgram> _programRepository;
    private readonly IRepository<Department> _departmentRepository;
    private readonly ILogger<StudentProfilesController> _logger;

    public StudentProfilesController(
        IRepository<StudentProfile> repository,
        IRepository<User> userRepository,
        IRepository<AcademicProgram> programRepository,
        IRepository<Department> departmentRepository,
        ILogger<StudentProfilesController> logger)
    {
        _repository = repository;
        _userRepository = userRepository;
        _programRepository = programRepository;
        _departmentRepository = departmentRepository;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Faculty")]
    public async Task<ActionResult<ApiResponse<IEnumerable<StudentProfileDto>>>> GetAll(
        [FromQuery] int? programId = null,
        [FromQuery] AcademicStatus? status = null)
    {
        try
        {
            var students = await _repository.GetAllAsync();

            // Filter by program if provided
            if (programId.HasValue)
            {
                students = students.Where(s => s.ProgramId == programId.Value).ToList();
            }

            // Filter by status if provided
            if (status.HasValue)
            {
                students = students.Where(s => s.AcademicStatus == status.Value).ToList();
            }

            // Load related entities
            var userIds = students.Select(s => s.UserId).Distinct();
            var programIds = students.Select(s => s.ProgramId).Distinct();

            var users = await _userRepository.GetAllAsync();
            var programs = await _programRepository.GetAllAsync();
            var departments = await _departmentRepository.GetAllAsync();

            var userDict = users.Where(u => userIds.Contains(u.Id))
                .ToDictionary(u => u.Id, u => new { u.FirstName, u.LastName, u.Email, u.PhoneNumber });
            var programDict = programs.Where(p => programIds.Contains(p.Id))
                .ToDictionary(p => p.Id);
            var departmentDict = departments.ToDictionary(d => d.Id, d => d.Name);

            var dtos = students.Select(s =>
            {
                var user = userDict.GetValueOrDefault(s.UserId);
                var program = programDict.GetValueOrDefault(s.ProgramId);
                var departmentName = program != null ? departmentDict.GetValueOrDefault(program.DepartmentId, "Unknown") : "Unknown";

                var age = s.DateOfBirth.HasValue
                    ? DateTime.UtcNow.Year - s.DateOfBirth.Value.Year
                    : 0;

                return new StudentProfileDto
                {
                    Id = s.Id,
                    UserId = s.UserId,
                    UserFullName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                    FirstName = user?.FirstName ?? "",
                    LastName = user?.LastName ?? "",
                    UserEmail = user?.Email ?? "",
                    Email = user?.Email ?? "",
                    PhoneNumber = user?.PhoneNumber,
                    StudentNumber = s.StudentNumber,
                    ProgramId = s.ProgramId,
                    ProgramName = program?.Name ?? "Unknown",
                    DepartmentName = departmentName,
                    EnrollmentDate = s.EnrollmentDate,
                    ExpectedGraduationDate = s.ExpectedGraduationDate,
                    CurrentGPA = s.CurrentGPA,
                    TotalCreditsEarned = s.TotalCreditsEarned,
                    AcademicStatus = s.AcademicStatus,
                    AcademicStatusText = s.AcademicStatus.ToString(),
                    Address = s.Address,
                    City = s.City,
                    Country = s.Country,
                    DateOfBirth = s.DateOfBirth,
                    Age = age,
                    CreatedAt = s.CreatedAt
                };
            });

            return Ok(ApiResponse<IEnumerable<StudentProfileDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving student profiles");
            return StatusCode(500, ApiResponse<IEnumerable<StudentProfileDto>>.FailureResult(
                "An error occurred while retrieving student profiles"));
        }
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<StudentProfileDto>>> GetMyProfile()
    {
        try
        {
            // Extract user ID from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<StudentProfileDto>.FailureResult("Invalid user token"));
            }

            var students = await _repository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<StudentProfileDto>.FailureResult("Student profile not found for this user"));
            }

            return await GetById(student.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's student profile");
            return StatusCode(500, ApiResponse<StudentProfileDto>.FailureResult(
                "An error occurred while retrieving your student profile"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StudentProfileDto>>> GetById(int id)
    {
        try
        {
            var student = await _repository.GetByIdAsync(id);
            if (student == null)
            {
                return NotFound(ApiResponse<StudentProfileDto>.FailureResult("Student profile not found"));
            }

            var user = await _userRepository.GetByIdAsync(student.UserId);
            var program = await _programRepository.GetByIdAsync(student.ProgramId);
            var department = program != null ? await _departmentRepository.GetByIdAsync(program.DepartmentId) : null;

            var age = student.DateOfBirth.HasValue
                ? DateTime.UtcNow.Year - student.DateOfBirth.Value.Year
                : 0;

            var dto = new StudentProfileDto
            {
                Id = student.Id,
                UserId = student.UserId,
                UserFullName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                FirstName = user?.FirstName ?? "",
                LastName = user?.LastName ?? "",
                UserEmail = user?.Email ?? "",
                Email = user?.Email ?? "",
                PhoneNumber = user?.PhoneNumber,
                StudentNumber = student.StudentNumber,
                ProgramId = student.ProgramId,
                ProgramName = program?.Name ?? "Unknown",
                DepartmentName = department?.Name ?? "Unknown",
                EnrollmentDate = student.EnrollmentDate,
                ExpectedGraduationDate = student.ExpectedGraduationDate,
                CurrentGPA = student.CurrentGPA,
                TotalCreditsEarned = student.TotalCreditsEarned,
                AcademicStatus = student.AcademicStatus,
                AcademicStatusText = student.AcademicStatus.ToString(),
                Address = student.Address,
                City = student.City,
                Country = student.Country,
                DateOfBirth = student.DateOfBirth,
                Age = age,
                CreatedAt = student.CreatedAt
            };

            return Ok(ApiResponse<StudentProfileDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving student profile {Id}", id);
            return StatusCode(500, ApiResponse<StudentProfileDto>.FailureResult(
                "An error occurred while retrieving the student profile"));
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<StudentProfileDto>>> GetByUserId(Guid userId)
    {
        try
        {
            var students = await _repository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound(ApiResponse<StudentProfileDto>.FailureResult("Student profile not found for this user"));
            }

            return await GetById(student.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving student profile for user {UserId}", userId);
            return StatusCode(500, ApiResponse<StudentProfileDto>.FailureResult(
                "An error occurred while retrieving the student profile"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<StudentProfileDto>>> Create([FromBody] CreateStudentProfileDto request)
    {
        try
        {
            // Validate user exists
            if (!await _userRepository.ExistsAsync(u => u.Id == request.UserId))
            {
                return BadRequest(ApiResponse<StudentProfileDto>.FailureResult("User not found"));
            }

            // Validate program exists
            if (!await _programRepository.ExistsAsync(p => p.Id == request.ProgramId))
            {
                return BadRequest(ApiResponse<StudentProfileDto>.FailureResult("Program not found"));
            }

            // Check if student profile already exists for this user
            var students = await _repository.GetAllAsync();
            if (students.Any(s => s.UserId == request.UserId))
            {
                return BadRequest(ApiResponse<StudentProfileDto>.FailureResult(
                    "Student profile already exists for this user"));
            }

            // Generate student number (GUA-YYYYNNNN format)
            var studentNumber = await GenerateStudentNumber();

            var student = new StudentProfile
            {
                UserId = request.UserId,
                StudentNumber = studentNumber,
                ProgramId = request.ProgramId,
                EnrollmentDate = DateTime.SpecifyKind(request.EnrollmentDate, DateTimeKind.Utc),
                ExpectedGraduationDate = request.ExpectedGraduationDate.HasValue
                    ? DateTime.SpecifyKind(request.ExpectedGraduationDate.Value, DateTimeKind.Utc)
                    : null,
                CurrentGPA = 0.0m,
                TotalCreditsEarned = 0,
                AcademicStatus = AcademicStatus.Active,
                Address = request.Address,
                City = request.City,
                Country = request.Country,
                DateOfBirth = request.DateOfBirth.HasValue
                    ? DateTime.SpecifyKind(request.DateOfBirth.Value, DateTimeKind.Utc)
                    : null,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(student);

            // Assign Student role to user
            // Note: This would require UserRole management - skipping for now

            return await GetById(created.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating student profile");
            return StatusCode(500, ApiResponse<StudentProfileDto>.FailureResult(
                "An error occurred while creating the student profile"));
        }
    }

    [HttpPut("me")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<StudentProfileDto>>> UpdateMyProfile([FromBody] UpdateMyStudentProfileDto request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<StudentProfileDto>.FailureResult("Invalid user token"));
            }

            var students = await _repository.GetAllAsync();
            var student = students.FirstOrDefault(s => s.UserId == userId);
            if (student == null)
            {
                return NotFound(ApiResponse<StudentProfileDto>.FailureResult("Student profile not found"));
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<StudentProfileDto>.FailureResult("User not found"));
            }

            // Allow clearing fields by sending empty string (not null which means "no change")
            if (request.Address != null) student.Address = request.Address;
            if (request.City != null) student.City = request.City;
            if (request.Country != null) student.Country = request.Country;
            student.UpdatedAt = DateTime.UtcNow;

            if (request.PhoneNumber != null)
            {
                user.PhoneNumber = request.PhoneNumber;
                user.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user);
            }

            await _repository.UpdateAsync(student);

            return await GetById(student.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current user's student profile");
            return StatusCode(500, ApiResponse<StudentProfileDto>.FailureResult(
                "An error occurred while updating your profile"));
        }
    }

    [HttpPost("me/change-password")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangeMyPassword([FromBody] StudentChangePasswordRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(ApiResponse<bool>.FailureResult("Invalid user token"));
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                return BadRequest(ApiResponse<bool>.FailureResult("Current password is required"));
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return BadRequest(ApiResponse<bool>.FailureResult("New password must be at least 6 characters long"));
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("User not found"));
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(ApiResponse<bool>.FailureResult("Current password is incorrect"));
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            return Ok(ApiResponse<bool>.SuccessResult(true, "Password changed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing current user's password");
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while changing your password"));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<StudentProfileDto>>> Update(int id, [FromBody] UpdateStudentProfileDto request)
    {
        try
        {
            var student = await _repository.GetByIdAsync(id);
            if (student == null)
            {
                return NotFound(ApiResponse<StudentProfileDto>.FailureResult("Student profile not found"));
            }

            // Update fields
            if (!string.IsNullOrWhiteSpace(request.Address))
                student.Address = request.Address;

            if (!string.IsNullOrWhiteSpace(request.City))
                student.City = request.City;

            if (!string.IsNullOrWhiteSpace(request.Country))
                student.Country = request.Country;

            if (request.DateOfBirth.HasValue)
                student.DateOfBirth = DateTime.SpecifyKind(request.DateOfBirth.Value, DateTimeKind.Utc);

            if (request.ExpectedGraduationDate.HasValue)
                student.ExpectedGraduationDate = DateTime.SpecifyKind(request.ExpectedGraduationDate.Value, DateTimeKind.Utc);

            if (request.AcademicStatus.HasValue)
                student.AcademicStatus = request.AcademicStatus.Value;

            student.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(student);

            return await GetById(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating student profile {Id}", id);
            return StatusCode(500, ApiResponse<StudentProfileDto>.FailureResult(
                "An error occurred while updating the student profile"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var student = await _repository.GetByIdAsync(id);
            if (student == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Student profile not found"));
            }

            // Check if student has enrollments
            var students = await _repository.GetAllAsync();
            var studentWithEnrollments = students.FirstOrDefault(s => s.Id == id);
            if (studentWithEnrollments?.Enrollments?.Any() == true)
            {
                return BadRequest(ApiResponse<bool>.FailureResult(
                    "Cannot delete student profile with existing enrollments"));
            }

            await _repository.DeleteAsync(student);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Student profile deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting student profile {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the student profile"));
        }
    }

    private async Task<string> GenerateStudentNumber()
    {
        var year = DateTime.UtcNow.Year;
        var students = await _repository.GetAllAsync();

        // Get students from current year
        var yearStudents = students
            .Where(s => s.StudentNumber.StartsWith($"GUA-{year}"))
            .OrderByDescending(s => s.StudentNumber)
            .ToList();

        int nextNumber = 1;
        if (yearStudents.Any())
        {
            var lastNumber = yearStudents.First().StudentNumber;
            var numberPart = lastNumber.Substring(lastNumber.Length - 4);
            if (int.TryParse(numberPart, out var num))
            {
                nextNumber = num + 1;
            }
        }

        return $"GUA-{year}{nextNumber:D4}";
    }
}

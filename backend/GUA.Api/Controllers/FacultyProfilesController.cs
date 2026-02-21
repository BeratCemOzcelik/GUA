using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.FacultyProfile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FacultyProfileEntity = GUA.Core.Entities.FacultyProfile;
using UserEntity = GUA.Core.Entities.User;
using UserRoleEntity = GUA.Core.Entities.UserRole;
using RoleEntity = GUA.Core.Entities.Role;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacultyProfilesController : ControllerBase
{
    private readonly IRepository<FacultyProfileEntity> _facultyProfileRepository;
    private readonly IRepository<UserEntity> _userRepository;
    private readonly IRepository<UserRoleEntity> _userRoleRepository;
    private readonly IRepository<RoleEntity> _roleRepository;
    private readonly ILogger<FacultyProfilesController> _logger;

    public FacultyProfilesController(
        IRepository<FacultyProfileEntity> facultyProfileRepository,
        IRepository<UserEntity> userRepository,
        IRepository<UserRoleEntity> userRoleRepository,
        IRepository<RoleEntity> roleRepository,
        ILogger<FacultyProfilesController> logger)
    {
        _facultyProfileRepository = facultyProfileRepository;
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<FacultyProfileDto>>>> GetAll()
    {
        try
        {
            var profiles = await _facultyProfileRepository.GetAllAsync();
            var userIds = profiles.Select(p => p.UserId).Distinct().ToList();
            var users = await _userRepository.FindAsync(u => userIds.Contains(u.Id));
            var userDict = users.ToDictionary(u => u.Id);

            var dtos = profiles.Select(p =>
            {
                var user = userDict.GetValueOrDefault(p.UserId);
                return new FacultyProfileDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    UserEmail = user?.Email ?? string.Empty,
                    FirstName = user?.FirstName ?? string.Empty,
                    LastName = user?.LastName ?? string.Empty,
                    Title = p.Title,
                    Bio = p.Bio,
                    ResearchInterests = p.ResearchInterests,
                    OfficeLocation = p.OfficeLocation,
                    OfficeHours = p.OfficeHours,
                    PhotoUrl = p.PhotoUrl,
                    LinkedInUrl = p.LinkedInUrl,
                    GoogleScholarUrl = p.GoogleScholarUrl,
                    CreatedAt = p.CreatedAt
                };
            });

            return Ok(ApiResponse<IEnumerable<FacultyProfileDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving faculty profiles");
            return StatusCode(500, ApiResponse<IEnumerable<FacultyProfileDto>>.FailureResult(
                "An error occurred while retrieving faculty profiles"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<FacultyProfileDto>>> GetById(int id)
    {
        try
        {
            var profile = await _facultyProfileRepository.GetByIdAsync(id);
            if (profile == null)
            {
                return NotFound(ApiResponse<FacultyProfileDto>.FailureResult("Faculty profile not found"));
            }

            var user = await _userRepository.GetByIdAsync(profile.UserId);

            var dto = new FacultyProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                UserEmail = user?.Email ?? string.Empty,
                FirstName = user?.FirstName ?? string.Empty,
                LastName = user?.LastName ?? string.Empty,
                Title = profile.Title,
                Bio = profile.Bio,
                ResearchInterests = profile.ResearchInterests,
                OfficeLocation = profile.OfficeLocation,
                OfficeHours = profile.OfficeHours,
                PhotoUrl = profile.PhotoUrl,
                LinkedInUrl = profile.LinkedInUrl,
                GoogleScholarUrl = profile.GoogleScholarUrl,
                CreatedAt = profile.CreatedAt
            };

            return Ok(ApiResponse<FacultyProfileDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving faculty profile {Id}", id);
            return StatusCode(500, ApiResponse<FacultyProfileDto>.FailureResult(
                "An error occurred while retrieving the faculty profile"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<FacultyProfileDto>>> Create([FromBody] CreateFacultyProfileRequest request)
    {
        try
        {
            // Verify user exists
            var user = await _userRepository.GetByIdAsync(request.UserId);
            if (user == null)
            {
                return BadRequest(ApiResponse<FacultyProfileDto>.FailureResult("User does not exist"));
            }

            // Verify user has Faculty role
            var userRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == request.UserId);
            var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
            var roles = await _roleRepository.FindAsync(r => roleIds.Contains(r.Id));

            if (!roles.Any(r => r.Name.Equals("Faculty", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(ApiResponse<FacultyProfileDto>.FailureResult(
                    "User must have Faculty role to create a faculty profile"));
            }

            // Check if profile already exists for this user
            if (await _facultyProfileRepository.ExistsAsync(fp => fp.UserId == request.UserId))
            {
                return BadRequest(ApiResponse<FacultyProfileDto>.FailureResult(
                    "Faculty profile already exists for this user"));
            }

            var profile = new FacultyProfileEntity
            {
                UserId = request.UserId,
                Title = request.Title,
                Bio = request.Bio,
                ResearchInterests = request.ResearchInterests,
                OfficeLocation = request.OfficeLocation,
                OfficeHours = request.OfficeHours,
                PhotoUrl = request.PhotoUrl,
                LinkedInUrl = request.LinkedInUrl,
                GoogleScholarUrl = request.GoogleScholarUrl,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _facultyProfileRepository.AddAsync(profile);

            var dto = new FacultyProfileDto
            {
                Id = created.Id,
                UserId = created.UserId,
                UserEmail = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Title = created.Title,
                Bio = created.Bio,
                ResearchInterests = created.ResearchInterests,
                OfficeLocation = created.OfficeLocation,
                OfficeHours = created.OfficeHours,
                PhotoUrl = created.PhotoUrl,
                LinkedInUrl = created.LinkedInUrl,
                GoogleScholarUrl = created.GoogleScholarUrl,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<FacultyProfileDto>.SuccessResult(dto, "Faculty profile created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating faculty profile");
            return StatusCode(500, ApiResponse<FacultyProfileDto>.FailureResult(
                "An error occurred while creating the faculty profile"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<FacultyProfileDto>>> Update(int id, [FromBody] UpdateFacultyProfileRequest request)
    {
        try
        {
            var profile = await _facultyProfileRepository.GetByIdAsync(id);
            if (profile == null)
            {
                return NotFound(ApiResponse<FacultyProfileDto>.FailureResult("Faculty profile not found"));
            }

            // Verify user exists
            var user = await _userRepository.GetByIdAsync(request.UserId);
            if (user == null)
            {
                return BadRequest(ApiResponse<FacultyProfileDto>.FailureResult("User does not exist"));
            }

            // Verify user has Faculty role
            var userRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == request.UserId);
            var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
            var roles = await _roleRepository.FindAsync(r => roleIds.Contains(r.Id));

            if (!roles.Any(r => r.Name.Equals("Faculty", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(ApiResponse<FacultyProfileDto>.FailureResult(
                    "User must have Faculty role"));
            }

            // If changing UserId, check if new user already has a profile
            if (profile.UserId != request.UserId)
            {
                if (await _facultyProfileRepository.ExistsAsync(fp => fp.UserId == request.UserId && fp.Id != id))
                {
                    return BadRequest(ApiResponse<FacultyProfileDto>.FailureResult(
                        "Faculty profile already exists for this user"));
                }
            }

            profile.UserId = request.UserId;
            profile.Title = request.Title;
            profile.Bio = request.Bio;
            profile.ResearchInterests = request.ResearchInterests;
            profile.OfficeLocation = request.OfficeLocation;
            profile.OfficeHours = request.OfficeHours;
            profile.PhotoUrl = request.PhotoUrl;
            profile.LinkedInUrl = request.LinkedInUrl;
            profile.GoogleScholarUrl = request.GoogleScholarUrl;
            profile.UpdatedAt = DateTime.UtcNow;

            await _facultyProfileRepository.UpdateAsync(profile);

            var dto = new FacultyProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                UserEmail = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Title = profile.Title,
                Bio = profile.Bio,
                ResearchInterests = profile.ResearchInterests,
                OfficeLocation = profile.OfficeLocation,
                OfficeHours = profile.OfficeHours,
                PhotoUrl = profile.PhotoUrl,
                LinkedInUrl = profile.LinkedInUrl,
                GoogleScholarUrl = profile.GoogleScholarUrl,
                CreatedAt = profile.CreatedAt
            };

            return Ok(ApiResponse<FacultyProfileDto>.SuccessResult(dto, "Faculty profile updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating faculty profile {Id}", id);
            return StatusCode(500, ApiResponse<FacultyProfileDto>.FailureResult(
                "An error occurred while updating the faculty profile"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var profile = await _facultyProfileRepository.GetByIdAsync(id);
            if (profile == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Faculty profile not found"));
            }

            await _facultyProfileRepository.DeleteAsync(profile);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Faculty profile deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting faculty profile {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the faculty profile"));
        }
    }
}

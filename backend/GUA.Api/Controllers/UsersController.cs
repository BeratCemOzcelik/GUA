using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class UsersController : ControllerBase
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IRepository<User> userRepository,
        IRepository<Role> roleRepository,
        IRepository<UserRole> userRoleRepository,
        ILogger<UsersController> logger)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<UserManagementDto>>>> GetAllUsers(
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 1000) pageSize = 1000;

            var users = (await _userRepository.GetAllAsync()).ToList();

            if (isActive.HasValue)
                users = users.Where(u => u.IsActive == isActive.Value).ToList();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                users = users.Where(u =>
                    u.Email.ToLowerInvariant().Contains(term)
                    || u.FirstName.ToLowerInvariant().Contains(term)
                    || u.LastName.ToLowerInvariant().Contains(term)).ToList();
            }

            // Load role data once (needed for filter + response)
            var allUserRoles = (await _userRoleRepository.GetAllAsync()).ToList();
            var allRoles = (await _roleRepository.GetAllAsync()).ToList();
            var roleDict = allRoles.ToDictionary(r => r.Id, r => r.Name);
            var userRolesLookup = allUserRoles
                .GroupBy(ur => ur.UserId)
                .ToDictionary(g => g.Key, g => g.Select(ur => roleDict.GetValueOrDefault(ur.RoleId) ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList());

            if (!string.IsNullOrWhiteSpace(role))
            {
                users = users.Where(u =>
                    userRolesLookup.TryGetValue(u.Id, out var roles)
                    && roles.Any(r => r.Equals(role, StringComparison.OrdinalIgnoreCase))).ToList();
            }

            var totalCount = users.Count;

            var pagedUsers = users
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var userDtos = pagedUsers.Select(user => new UserManagementDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                Roles = userRolesLookup.GetValueOrDefault(user.Id) ?? new List<string>(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            }).ToList();

            var result = PagedResult<UserManagementDto>.Create(userDtos, totalCount, page, pageSize);
            return Ok(ApiResponse<PagedResult<UserManagementDto>>.SuccessResult(result, "Users retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, ApiResponse<PagedResult<UserManagementDto>>.FailureResult(
                "An error occurred while retrieving users"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserManagementDto>>> CreateUser(
        [FromBody] CreateUserRequest request)
    {
        try
        {
            // Validate email doesn't exist
            var existingUser = await _userRepository.FindAsync(u => u.Email == request.Email);
            if (existingUser.Any())
            {
                return BadRequest(ApiResponse<UserManagementDto>.FailureResult(
                    "Email already exists"));
            }

            // Validate password
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            {
                return BadRequest(ApiResponse<UserManagementDto>.FailureResult(
                    "Password must be at least 6 characters long"));
            }

            // Create user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.AddAsync(user);

            // Assign roles
            var roles = new List<string>();
            if (request.RoleNames != null && request.RoleNames.Any())
            {
                foreach (var roleName in request.RoleNames)
                {
                    var role = (await _roleRepository.FindAsync(r => r.Name == roleName)).FirstOrDefault();
                    if (role != null)
                    {
                        var userRole = new UserRole
                        {
                            UserId = createdUser.Id,
                            RoleId = role.Id
                        };
                        await _userRoleRepository.AddAsync(userRole);
                        roles.Add(role.Name);
                    }
                }
            }

            var userDto = new UserManagementDto
            {
                Id = createdUser.Id,
                Email = createdUser.Email,
                FirstName = createdUser.FirstName,
                LastName = createdUser.LastName,
                PhoneNumber = createdUser.PhoneNumber,
                IsActive = createdUser.IsActive,
                Roles = roles,
                CreatedAt = createdUser.CreatedAt,
                UpdatedAt = createdUser.UpdatedAt
            };

            return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id },
                ApiResponse<UserManagementDto>.SuccessResult(userDto, "User created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, ApiResponse<UserManagementDto>.FailureResult(
                "An error occurred while creating the user"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<UserManagementDto>>> GetUserById(Guid id)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<UserManagementDto>.FailureResult(
                    "User not found"));
            }

            var userRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == user.Id);
            var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
            var roles = new List<string>();

            foreach (var roleId in roleIds)
            {
                var role = await _roleRepository.GetByIdAsync(roleId);
                if (role != null)
                {
                    roles.Add(role.Name);
                }
            }

            var userDto = new UserManagementDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                Roles = roles,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            return Ok(ApiResponse<UserManagementDto>.SuccessResult(
                userDto, "User retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, ApiResponse<UserManagementDto>.FailureResult(
                "An error occurred while retrieving the user"));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<UserManagementDto>>> UpdateUser(
        Guid id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<UserManagementDto>.FailureResult(
                    "User not found"));
            }

            // Check if email is being changed and if it already exists
            if (user.Email != request.Email)
            {
                var existingUser = await _userRepository.FindAsync(u => u.Email == request.Email);
                if (existingUser.Any())
                {
                    return BadRequest(ApiResponse<UserManagementDto>.FailureResult(
                        "Email already exists"));
                }
            }

            user.Email = request.Email;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);

            // Get updated user with roles
            var userRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == user.Id);
            var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
            var roles = new List<string>();

            foreach (var roleId in roleIds)
            {
                var role = await _roleRepository.GetByIdAsync(roleId);
                if (role != null)
                {
                    roles.Add(role.Name);
                }
            }

            var userDto = new UserManagementDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                Roles = roles,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            return Ok(ApiResponse<UserManagementDto>.SuccessResult(
                userDto, "User updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, ApiResponse<UserManagementDto>.FailureResult(
                "An error occurred while updating the user"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(Guid id)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult(
                    "User not found"));
            }

            // Soft delete - deactivate user
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            return Ok(ApiResponse<bool>.SuccessResult(
                true, "User deactivated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the user"));
        }
    }

    [HttpPost("{id}/roles")]
    public async Task<ActionResult<ApiResponse<UserManagementDto>>> AssignRoles(
        Guid id, [FromBody] AssignRolesRequest request)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<UserManagementDto>.FailureResult(
                    "User not found"));
            }

            // Remove existing roles
            var existingUserRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == id);
            foreach (var userRole in existingUserRoles)
            {
                await _userRoleRepository.DeleteAsync(userRole);
            }

            // Add new roles
            var roles = new List<string>();
            foreach (var roleName in request.RoleNames)
            {
                var role = (await _roleRepository.FindAsync(r => r.Name == roleName)).FirstOrDefault();
                if (role != null)
                {
                    var newUserRole = new UserRole
                    {
                        UserId = id,
                        RoleId = role.Id
                    };
                    await _userRoleRepository.AddAsync(newUserRole);
                    roles.Add(role.Name);
                }
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            var userDto = new UserManagementDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                Roles = roles,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            return Ok(ApiResponse<UserManagementDto>.SuccessResult(
                userDto, "Roles assigned successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning roles to user {UserId}", id);
            return StatusCode(500, ApiResponse<UserManagementDto>.FailureResult(
                "An error occurred while assigning roles"));
        }
    }

    [HttpPut("{id}/password")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePassword(
        Guid id, [FromBody] ChangePasswordRequest request)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult(
                    "User not found"));
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return BadRequest(ApiResponse<bool>.FailureResult(
                    "Password must be at least 6 characters long"));
            }

            // Hash the new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            return Ok(ApiResponse<bool>.SuccessResult(
                true, "Password changed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user {UserId}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while changing the password"));
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<UserManagementDto>>>> SearchUsers(
        [FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(ApiResponse<List<UserManagementDto>>.FailureResult(
                    "Search query is required"));
            }

            var queryLower = query.ToLower();
            var users = await _userRepository.FindAsync(u =>
                u.Email.ToLower().Contains(queryLower) ||
                u.FirstName.ToLower().Contains(queryLower) ||
                u.LastName.ToLower().Contains(queryLower));

            var userDtos = new List<UserManagementDto>();

            foreach (var user in users)
            {
                var userRoles = await _userRoleRepository.FindAsync(ur => ur.UserId == user.Id);
                var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
                var roles = new List<string>();

                foreach (var roleId in roleIds)
                {
                    var role = await _roleRepository.GetByIdAsync(roleId);
                    if (role != null)
                    {
                        roles.Add(role.Name);
                    }
                }

                userDtos.Add(new UserManagementDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    IsActive = user.IsActive,
                    Roles = roles,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                });
            }

            return Ok(ApiResponse<List<UserManagementDto>>.SuccessResult(
                userDtos, "Users found successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with query {Query}", query);
            return StatusCode(500, ApiResponse<List<UserManagementDto>>.FailureResult(
                "An error occurred while searching users"));
        }
    }
}

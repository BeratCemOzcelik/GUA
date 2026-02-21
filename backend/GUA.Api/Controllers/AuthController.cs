using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Auth;
using GUA.Shared.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(ApiResponse<LoginResponse>.FailureResult(
                    "Email and password are required"));
            }

            var result = await _authService.LoginAsync(request);

            if (result == null)
            {
                return Unauthorized(ApiResponse<LoginResponse>.FailureResult(
                    "Invalid email or password"));
            }

            return Ok(ApiResponse<LoginResponse>.SuccessResult(result, "Login successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, ApiResponse<LoginResponse>.FailureResult(
                "An error occurred during login"));
        }
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.FirstName) ||
                string.IsNullOrWhiteSpace(request.LastName))
            {
                return BadRequest(ApiResponse<UserDto>.FailureResult(
                    "All required fields must be provided"));
            }

            // Default role for new users (can be modified based on requirements)
            var roles = new List<string> { "Student" };

            var result = await _authService.RegisterAsync(request, roles);

            if (result == null)
            {
                return BadRequest(ApiResponse<UserDto>.FailureResult(
                    "User with this email already exists"));
            }

            return Ok(ApiResponse<UserDto>.SuccessResult(result, "User registered successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, ApiResponse<UserDto>.FailureResult(
                "An error occurred during registration"));
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(ApiResponse<LoginResponse>.FailureResult(
                    "Refresh token is required"));
            }

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);

            if (result == null)
            {
                return Unauthorized(ApiResponse<LoginResponse>.FailureResult(
                    "Invalid or expired refresh token"));
            }

            return Ok(ApiResponse<LoginResponse>.SuccessResult(result, "Token refreshed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, ApiResponse<LoginResponse>.FailureResult(
                "An error occurred during token refresh"));
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> Logout()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<bool>.FailureResult("Invalid user"));
            }

            var result = await _authService.RevokeTokenAsync(userId);

            if (!result)
            {
                return BadRequest(ApiResponse<bool>.FailureResult("Logout failed"));
            }

            return Ok(ApiResponse<bool>.SuccessResult(true, "Logout successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred during logout"));
        }
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<ApiResponse<UserDto>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var firstName = User.FindFirst("firstName")?.Value;
            var lastName = User.FindFirst("lastName")?.Value;
            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<UserDto>.FailureResult("Invalid user"));
            }

            var user = new UserDto
            {
                Id = userId,
                Email = email ?? "",
                FirstName = firstName ?? "",
                LastName = lastName ?? "",
                Roles = roles
            };

            return Ok(ApiResponse<UserDto>.SuccessResult(user, "User retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user");
            return StatusCode(500, ApiResponse<UserDto>.FailureResult(
                "An error occurred while retrieving user information"));
        }
    }
}

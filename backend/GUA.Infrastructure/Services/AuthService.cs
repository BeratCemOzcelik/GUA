using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Infrastructure.Data;
using GUA.Shared.DTOs.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GUA.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // Find user by email
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !user.IsActive)
            return null;

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        // Get roles
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        // Generate tokens
        var accessToken = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        // Update refresh token in database
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7"));

        await _context.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60")),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Roles = roles
            }
        };
    }

    public async Task<UserDto?> RegisterAsync(RegisterRequest request, List<string> roles)
    {
        // Check if user already exists
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            return null;

        // Create new user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // Assign roles
        foreach (var roleName in roles)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Roles = roles
        };
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user == null || !user.IsActive)
            return null;

        if (user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return null;

        // Get roles
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        // Generate new tokens
        var accessToken = GenerateAccessToken(user, roles);
        var newRefreshToken = GenerateRefreshToken();

        // Update refresh token
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7"));

        await _context.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60")),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Roles = roles
            }
        };
    }

    public async Task<bool> RevokeTokenAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _context.SaveChangesAsync();

        return true;
    }

    public string GenerateAccessToken(User user, List<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new("firstName", user.FirstName),
            new("lastName", user.LastName)
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured")));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}

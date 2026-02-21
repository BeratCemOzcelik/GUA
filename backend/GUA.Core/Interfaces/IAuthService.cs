using GUA.Core.Entities;
using GUA.Shared.DTOs.Auth;

namespace GUA.Core.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<UserDto?> RegisterAsync(RegisterRequest request, List<string> roles);
    Task<LoginResponse?> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(Guid userId);
    string GenerateAccessToken(User user, List<string> roles);
    string GenerateRefreshToken();
}

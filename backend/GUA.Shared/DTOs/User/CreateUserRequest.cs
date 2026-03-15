namespace GUA.Shared.DTOs.User;

public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public List<string> RoleNames { get; set; } = new List<string>();
    public bool IsActive { get; set; } = true;
}

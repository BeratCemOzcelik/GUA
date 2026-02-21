using GUA.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GUA.Infrastructure.Data;

public class DbSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(ApplicationDbContext context, ILogger<DbSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Ensure database is created
            await _context.Database.MigrateAsync();

            // Seed initial admin user if no users exist
            if (!await _context.Users.AnyAsync())
            {
                _logger.LogInformation("Seeding initial admin user...");

                var adminUser = new User
                {
                    Id = Guid.NewGuid(),
                    Email = "admin@gua.edu.pl",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    FirstName = "System",
                    LastName = "Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                // Assign SuperAdmin role
                var superAdminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "SuperAdmin");
                if (superAdminRole != null)
                {
                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = adminUser.Id,
                        RoleId = superAdminRole.Id,
                        AssignedAt = DateTime.UtcNow
                    });

                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Initial admin user created: admin@gua.edu.pl / Admin123!");
                }
            }

            _logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }
}

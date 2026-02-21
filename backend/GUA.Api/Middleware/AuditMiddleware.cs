using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GUA.Core.Entities;
using GUA.Core.Interfaces;

namespace GUA.Api.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IRepository<AuditLog> auditLogRepository)
    {
        // Only log authenticated requests with CUD operations
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            await _next(context);
            return;
        }

        var method = context.Request.Method;
        var path = context.Request.Path.ToString();

        // Only log POST (Create), PUT/PATCH (Update), DELETE operations
        if (method != "POST" && method != "PUT" && method != "PATCH" && method != "DELETE")
        {
            await _next(context);
            return;
        }

        // Skip logging for auth endpoints to avoid logging sensitive data
        if (path.Contains("/api/auth", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/api/auditlogs", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Capture request body for logging
        string? requestBody = null;
        if (method == "POST" || method == "PUT" || method == "PATCH")
        {
            context.Request.EnableBuffering();
            using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
            }
        }

        // Execute the request
        await _next(context);

        // Only log successful operations (2xx status codes)
        if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
        {
            try
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return;
                }

                // Determine action
                var action = method switch
                {
                    "POST" => "Create",
                    "PUT" => "Update",
                    "PATCH" => "Update",
                    "DELETE" => "Delete",
                    _ => "Unknown"
                };

                // Extract entity name and ID from path
                var pathParts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                var entityName = pathParts.Length > 1 ? pathParts[1] : "Unknown";
                var entityId = ExtractEntityId(pathParts);

                // Get IP address
                var ipAddress = context.Connection.RemoteIpAddress?.ToString();

                // Create audit log
                var auditLog = new AuditLog
                {
                    UserId = userId,
                    Action = action,
                    EntityName = entityName,
                    EntityId = entityId,
                    OldValue = null, // Could be enhanced to capture old values
                    NewValue = requestBody,
                    Timestamp = DateTime.UtcNow,
                    IpAddress = ipAddress
                };

                // Save asynchronously
                await auditLogRepository.AddAsync(auditLog);

                _logger.LogInformation(
                    "Audit: User {UserId} performed {Action} on {EntityName} {EntityId} from {IpAddress}",
                    userId, action, entityName, entityId, ipAddress);
            }
            catch (Exception ex)
            {
                // Don't fail the request if audit logging fails
                _logger.LogError(ex, "Error creating audit log");
            }
        }
    }

    private string ExtractEntityId(string[] pathParts)
    {
        // Try to find a GUID or numeric ID in the path
        for (int i = pathParts.Length - 1; i >= 0; i--)
        {
            var part = pathParts[i];

            // Check if it's a GUID
            if (Guid.TryParse(part, out _))
            {
                return part;
            }

            // Check if it's a number
            if (int.TryParse(part, out _))
            {
                return part;
            }
        }

        return "Unknown";
    }
}

public static class AuditMiddlewareExtensions
{
    public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<AuditMiddleware>();
    }
}

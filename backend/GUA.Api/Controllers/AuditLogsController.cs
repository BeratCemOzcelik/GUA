using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Audit;
using GUA.Shared.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AuditLogsController : ControllerBase
{
    private readonly IRepository<AuditLog> _auditLogRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        IRepository<AuditLog> auditLogRepository,
        IRepository<User> userRepository,
        ILogger<AuditLogsController> logger)
    {
        _auditLogRepository = auditLogRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetAllLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50;

            var logs = await _auditLogRepository.GetAllAsync();

            // Apply date filters
            var filteredLogs = logs.AsEnumerable();
            if (startDate.HasValue)
            {
                filteredLogs = filteredLogs.Where(l => l.Timestamp >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                filteredLogs = filteredLogs.Where(l => l.Timestamp <= endDate.Value);
            }

            // Order by timestamp descending
            var orderedLogs = filteredLogs.OrderByDescending(l => l.Timestamp);

            // Apply pagination
            var paginatedLogs = orderedLogs
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            var logDtos = new List<AuditLogDto>();

            foreach (var log in paginatedLogs)
            {
                var user = await _userRepository.GetByIdAsync(log.UserId);
                logDtos.Add(new AuditLogDto
                {
                    Id = log.Id,
                    UserId = log.UserId,
                    UserEmail = user?.Email ?? "Unknown",
                    Action = log.Action,
                    EntityName = log.EntityName,
                    EntityId = log.EntityId,
                    OldValue = log.OldValue,
                    NewValue = log.NewValue,
                    Timestamp = log.Timestamp,
                    IpAddress = log.IpAddress
                });
            }

            return Ok(ApiResponse<List<AuditLogDto>>.SuccessResult(
                logDtos, $"Retrieved {logDtos.Count} audit logs (page {page})"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return StatusCode(500, ApiResponse<List<AuditLogDto>>.FailureResult(
                "An error occurred while retrieving audit logs"));
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetLogsByUser(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50;

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<List<AuditLogDto>>.FailureResult(
                    "User not found"));
            }

            var logs = await _auditLogRepository.FindAsync(l => l.UserId == userId);

            // Order by timestamp descending and paginate
            var orderedLogs = logs.OrderByDescending(l => l.Timestamp);
            var paginatedLogs = orderedLogs
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            var logDtos = paginatedLogs.Select(log => new AuditLogDto
            {
                Id = log.Id,
                UserId = log.UserId,
                UserEmail = user.Email,
                Action = log.Action,
                EntityName = log.EntityName,
                EntityId = log.EntityId,
                OldValue = log.OldValue,
                NewValue = log.NewValue,
                Timestamp = log.Timestamp,
                IpAddress = log.IpAddress
            }).ToList();

            return Ok(ApiResponse<List<AuditLogDto>>.SuccessResult(
                logDtos, $"Retrieved {logDtos.Count} audit logs for user (page {page})"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs for user {UserId}", userId);
            return StatusCode(500, ApiResponse<List<AuditLogDto>>.FailureResult(
                "An error occurred while retrieving audit logs"));
        }
    }

    [HttpGet("entity/{entityName}/{entityId}")]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetLogsByEntity(
        string entityName,
        string entityId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50;

            var logs = await _auditLogRepository.FindAsync(l =>
                l.EntityName == entityName && l.EntityId == entityId);

            // Order by timestamp descending and paginate
            var orderedLogs = logs.OrderByDescending(l => l.Timestamp);
            var paginatedLogs = orderedLogs
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            var logDtos = new List<AuditLogDto>();

            foreach (var log in paginatedLogs)
            {
                var user = await _userRepository.GetByIdAsync(log.UserId);
                logDtos.Add(new AuditLogDto
                {
                    Id = log.Id,
                    UserId = log.UserId,
                    UserEmail = user?.Email ?? "Unknown",
                    Action = log.Action,
                    EntityName = log.EntityName,
                    EntityId = log.EntityId,
                    OldValue = log.OldValue,
                    NewValue = log.NewValue,
                    Timestamp = log.Timestamp,
                    IpAddress = log.IpAddress
                });
            }

            return Ok(ApiResponse<List<AuditLogDto>>.SuccessResult(
                logDtos, $"Retrieved {logDtos.Count} audit logs for entity (page {page})"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs for entity {EntityName}/{EntityId}",
                entityName, entityId);
            return StatusCode(500, ApiResponse<List<AuditLogDto>>.FailureResult(
                "An error occurred while retrieving audit logs"));
        }
    }
}

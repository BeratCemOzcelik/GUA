using GUA.Core.Entities;
using GUA.Infrastructure.Data;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ApplicationDbContext context, ILogger<NotificationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid? CurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetMine(
        [FromQuery] bool? unreadOnly = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = CurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<PagedResult<NotificationDto>>.FailureResult("Invalid user token"));

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId.Value);

        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                RelatedEntityType = n.RelatedEntityType,
                RelatedEntityId = n.RelatedEntityId,
                ActionUrl = n.ActionUrl,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt.HasValue ? DateTime.SpecifyKind(n.ReadAt.Value, DateTimeKind.Utc) : null,
                CreatedAt = DateTime.SpecifyKind(n.CreatedAt, DateTimeKind.Utc)
            })
            .ToListAsync();

        var result = PagedResult<NotificationDto>.Create(items, totalCount, page, pageSize);
        return Ok(ApiResponse<PagedResult<NotificationDto>>.SuccessResult(result));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        var userId = CurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<int>.FailureResult("Invalid user token"));

        var count = await _context.Notifications
            .CountAsync(n => n.RecipientUserId == userId.Value && !n.IsRead);

        return Ok(ApiResponse<int>.SuccessResult(count));
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkRead(int id)
    {
        var userId = CurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<bool>.FailureResult("Invalid user token"));

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientUserId == userId.Value);

        if (notification == null)
            return NotFound(ApiResponse<bool>.FailureResult("Notification not found"));

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(ApiResponse<bool>.SuccessResult(true));
    }

    [HttpPut("mark-all-read")]
    public async Task<ActionResult<ApiResponse<int>>> MarkAllRead()
    {
        var userId = CurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<int>.FailureResult("Invalid user token"));

        var unread = await _context.Notifications
            .Where(n => n.RecipientUserId == userId.Value && !n.IsRead)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = now;
            n.UpdatedAt = now;
        }

        if (unread.Count > 0)
            await _context.SaveChangesAsync();

        return Ok(ApiResponse<int>.SuccessResult(unread.Count, $"Marked {unread.Count} as read"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var userId = CurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<bool>.FailureResult("Invalid user token"));

        // Ownership scope: a user can only delete their own notifications.
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientUserId == userId.Value);

        if (notification == null)
            return NotFound(ApiResponse<bool>.FailureResult("Notification not found"));

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.SuccessResult(true, "Notification deleted"));
    }

    [HttpDelete]
    public async Task<ActionResult<ApiResponse<int>>> DeleteAll()
    {
        var userId = CurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<int>.FailureResult("Invalid user token"));

        // Bulk delete uses a server-side filter so other users' notifications cannot be touched.
        var deleted = await _context.Notifications
            .Where(n => n.RecipientUserId == userId.Value)
            .ExecuteDeleteAsync();

        return Ok(ApiResponse<int>.SuccessResult(deleted, $"Cleared {deleted} notifications"));
    }
}

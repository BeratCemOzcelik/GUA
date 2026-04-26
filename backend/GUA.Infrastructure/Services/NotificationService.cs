using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Infrastructure.Data;
using GUA.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GUA.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IServiceScopeFactory scopeFactory,
        IEmailService emailService,
        ILogger<NotificationService> logger)
    {
        _scopeFactory = scopeFactory;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task NotifyAsync(
        Guid recipientUserId,
        string title,
        string message,
        NotificationType type,
        string? relatedEntityType = null,
        int? relatedEntityId = null,
        string? actionUrl = null,
        bool sendEmail = true)
    {
        try
        {
            // Use an isolated DbContext scope so this method is safe to invoke as fire-and-forget
            // from controllers (avoids "second operation started on this context" race conditions).
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var notification = new Notification
            {
                RecipientUserId = recipientUserId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                ActionUrl = actionUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            context.Notifications.Add(notification);
            await context.SaveChangesAsync();

            if (sendEmail)
            {
                var recipient = await context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == recipientUserId);

                if (recipient != null && !string.IsNullOrWhiteSpace(recipient.Email))
                {
                    var recipientName = $"{recipient.FirstName} {recipient.LastName}".Trim();
                    var html = BuildEmailHtml(recipientName, title, message, actionUrl);
                    await _emailService.SendEmailAsync(recipient.Email, title, html);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create notification for user {UserId} (type {Type})", recipientUserId, type);
        }
    }

    public async Task NotifyGradePostedAsync(int gradeId, NotificationType type)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var grade = await ctx.Grades.AsNoTracking().FirstOrDefaultAsync(g => g.Id == gradeId);
            if (grade == null) return;

            var component = await ctx.GradeComponents.AsNoTracking().FirstOrDefaultAsync(c => c.Id == grade.GradeComponentId);
            if (component == null) return;

            var enrollment = await ctx.Enrollments.AsNoTracking().FirstOrDefaultAsync(e => e.Id == grade.EnrollmentId);
            if (enrollment == null) return;

            var student = await ctx.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(s => s.Id == enrollment.StudentId);
            if (student == null) return;

            var offering = await ctx.CourseOfferings.AsNoTracking().FirstOrDefaultAsync(o => o.Id == enrollment.CourseOfferingId);
            var course = offering != null
                ? await ctx.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == offering.CourseId)
                : null;
            var courseLabel = course != null ? $"{course.Code} - {course.Name}" : "your course";

            var verb = type == NotificationType.GradeUpdated ? "updated" : "posted";
            var title = type == NotificationType.GradeUpdated ? "Grade updated" : "New grade posted";
            var message = $"Your grade for \"{component.Name}\" in {courseLabel} has been {verb}: {grade.Score}/{component.MaxScore}.";
            var actionUrl = $"/grades/{enrollment.Id}";

            await PersistAndEmailAsync(ctx, student.UserId, title, message, type, "Grade", grade.Id, actionUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send grade notification for grade {GradeId}", gradeId);
        }
    }

    public async Task NotifySubmissionReceivedAsync(int submissionId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var submission = await ctx.AssignmentSubmissions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == submissionId);
            if (submission == null) return;

            var component = await ctx.GradeComponents.AsNoTracking().FirstOrDefaultAsync(c => c.Id == submission.GradeComponentId);
            if (component == null) return;

            var offering = await ctx.CourseOfferings.AsNoTracking().FirstOrDefaultAsync(o => o.Id == component.CourseOfferingId);
            if (offering == null) return;

            var faculty = await ctx.FacultyProfiles.AsNoTracking().FirstOrDefaultAsync(f => f.Id == offering.FacultyProfileId);
            if (faculty == null) return;

            var enrollment = await ctx.Enrollments.AsNoTracking().FirstOrDefaultAsync(e => e.Id == submission.EnrollmentId);
            var student = enrollment != null
                ? await ctx.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(s => s.Id == enrollment.StudentId)
                : null;
            var studentUser = student != null
                ? await ctx.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == student.UserId)
                : null;
            var studentName = studentUser != null
                ? $"{studentUser.FirstName} {studentUser.LastName}"
                : (student?.StudentNumber ?? "A student");

            var course = await ctx.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == offering.CourseId);
            var courseLabel = course != null ? $"{course.Code} - {course.Name}" : "your course";

            var lateNote = submission.Status == SubmissionStatus.Late ? " (late)" : "";
            var title = "New assignment submission";
            var message = $"{studentName} submitted \"{component.Name}\" for {courseLabel}{lateNote}. Please review and grade.";
            var actionUrl = $"/grades/submissions/{component.Id}";

            await PersistAndEmailAsync(ctx, faculty.UserId, title, message, NotificationType.SubmissionReceived, "AssignmentSubmission", submission.Id, actionUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send submission notification for submission {SubmissionId}", submissionId);
        }
    }

    private async Task PersistAndEmailAsync(
        ApplicationDbContext ctx,
        Guid recipientUserId,
        string title,
        string message,
        NotificationType type,
        string? relatedEntityType,
        int? relatedEntityId,
        string? actionUrl)
    {
        var notification = new Notification
        {
            RecipientUserId = recipientUserId,
            Title = title,
            Message = message,
            Type = type,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            ActionUrl = actionUrl,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        ctx.Notifications.Add(notification);
        await ctx.SaveChangesAsync();

        var recipient = await ctx.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == recipientUserId);
        if (recipient != null && !string.IsNullOrWhiteSpace(recipient.Email))
        {
            var recipientName = $"{recipient.FirstName} {recipient.LastName}".Trim();
            var html = BuildEmailHtml(recipientName, title, message, actionUrl);
            await _emailService.SendEmailAsync(recipient.Email, title, html);
        }
    }

    private static string BuildEmailHtml(string recipientName, string title, string message, string? actionUrl)
    {
        var ctaButton = string.IsNullOrWhiteSpace(actionUrl)
            ? string.Empty
            : $@"<div style=""text-align: center; margin: 24px 0;"">
                    <a href=""{actionUrl}"" style=""background-color: #8B1A1A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">View in Portal</a>
                 </div>";

        return $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #8B1A1A; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;"">
        <h1 style=""color: #D4AF37; margin: 0; font-size: 22px;"">Global University America</h1>
    </div>
    <div style=""background-color: #f9f9f9; padding: 28px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;"">
        <h2 style=""color: #333; margin-top: 0;"">Hello {recipientName},</h2>
        <h3 style=""color: #8B1A1A; margin-bottom: 8px;"">{title}</h3>
        <p style=""color: #555; line-height: 1.6;"">{message}</p>
        {ctaButton}
        <p style=""color: #999; font-size: 12px; margin-top: 28px; border-top: 1px solid #e0e0e0; padding-top: 12px;"">
            This is an automated notification from Global University America. Please do not reply directly.
        </p>
    </div>
</body>
</html>";
    }
}

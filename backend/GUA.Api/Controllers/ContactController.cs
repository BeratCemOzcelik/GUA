using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<ContactController> _logger;

    public ContactController(IEmailService emailService, ILogger<ContactController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<bool>>> SendMessage([FromBody] ContactFormRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
                return BadRequest(ApiResponse<bool>.FailureResult("Name is required"));

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(ApiResponse<bool>.FailureResult("Email is required"));

            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(ApiResponse<bool>.FailureResult("Message is required"));

            var fullName = $"{request.FirstName} {request.LastName}";

            await _emailService.SendContactFormNotificationAsync(
                request.Email, fullName, request.Phone ?? "", request.Message);

            _logger.LogInformation("Contact form submitted by {Name} ({Email})", fullName, request.Email);

            return Ok(ApiResponse<bool>.SuccessResult(true, "Your message has been sent successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing contact form");
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while sending your message. Please try again."));
        }
    }
}

public class ContactFormRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Message { get; set; } = string.Empty;
}

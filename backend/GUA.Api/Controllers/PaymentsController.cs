using GUA.Api.Services;
using GUA.Core.Entities;
using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Payment;
using GUA.Shared.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AcademicProgram = GUA.Core.Entities.Program;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IRepository<Payment> _repository;
    private readonly IRepository<StudentProfile> _studentRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<AcademicProgram> _programRepository;
    private readonly SquarePaymentService _squareService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IRepository<Payment> repository,
        IRepository<StudentProfile> studentRepository,
        IRepository<User> userRepository,
        IRepository<AcademicProgram> programRepository,
        SquarePaymentService squareService,
        ILogger<PaymentsController> logger)
    {
        _repository = repository;
        _studentRepository = studentRepository;
        _userRepository = userRepository;
        _programRepository = programRepository;
        _squareService = squareService;
        _logger = logger;
    }

    // GET: api/payments
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentDto>>>> GetAll(
        [FromQuery] int? studentId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 1000) pageSize = 1000;

            var allPayments = (studentId.HasValue
                ? await _repository.FindAsync(p => p.StudentId == studentId.Value)
                : await _repository.GetAllAsync()).ToList();

            if (!string.IsNullOrWhiteSpace(status)
                && Enum.TryParse<PaymentStatus>(status, true, out var statusEnum))
            {
                allPayments = allPayments.Where(p => p.Status == (int)statusEnum).ToList();
            }

            var students = (await _studentRepository.GetAllAsync()).ToList();
            var users = (await _userRepository.GetAllAsync()).ToList();
            var studentDict = students.ToDictionary(s => s.Id);
            var userDict = users.ToDictionary(u => u.Id);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                allPayments = allPayments.Where(p =>
                {
                    var student = studentDict.GetValueOrDefault(p.StudentId);
                    if (student == null) return false;
                    var user = userDict.GetValueOrDefault(student.UserId);
                    var fullName = user != null ? $"{user.FirstName} {user.LastName}".ToLowerInvariant() : "";
                    return fullName.Contains(term)
                        || (student.StudentNumber ?? "").ToLowerInvariant().Contains(term)
                        || (p.Description ?? "").ToLowerInvariant().Contains(term);
                }).ToList();
            }

            var totalCount = allPayments.Count;

            var paged = allPayments
                .OrderBy(p => p.StudentId).ThenBy(p => p.InstallmentNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var dtos = paged.Select(p =>
            {
                var student = studentDict.GetValueOrDefault(p.StudentId);
                var user = student != null ? userDict.GetValueOrDefault(student.UserId) : null;
                return MapToDto(p, student, user);
            }).ToList();

            var result = PagedResult<PaymentDto>.Create(dtos, totalCount, page, pageSize);
            return Ok(ApiResponse<PagedResult<PaymentDto>>.SuccessResult(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payments");
            return StatusCode(500, ApiResponse<PagedResult<PaymentDto>>.FailureResult("Failed to retrieve payments"));
        }
    }

    // GET: api/payments/stats — aggregated totals over filtered dataset (no pagination)
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<PaymentStatsDto>>> GetStats(
        [FromQuery] int? studentId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var allPayments = (studentId.HasValue
                ? await _repository.FindAsync(p => p.StudentId == studentId.Value)
                : await _repository.GetAllAsync()).ToList();

            if (!string.IsNullOrWhiteSpace(status)
                && Enum.TryParse<PaymentStatus>(status, true, out var statusEnum))
            {
                allPayments = allPayments.Where(p => p.Status == (int)statusEnum).ToList();
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var students = (await _studentRepository.GetAllAsync()).ToDictionary(s => s.Id);
                var users = (await _userRepository.GetAllAsync()).ToDictionary(u => u.Id);
                var term = search.Trim().ToLowerInvariant();
                allPayments = allPayments.Where(p =>
                {
                    var student = students.GetValueOrDefault(p.StudentId);
                    if (student == null) return false;
                    var user = users.GetValueOrDefault(student.UserId);
                    var fullName = user != null ? $"{user.FirstName} {user.LastName}".ToLowerInvariant() : "";
                    return fullName.Contains(term)
                        || (student.StudentNumber ?? "").ToLowerInvariant().Contains(term)
                        || (p.Description ?? "").ToLowerInvariant().Contains(term);
                }).ToList();
            }

            var stats = new PaymentStatsDto
            {
                TotalExpected = allPayments.Sum(p => p.Amount),
                TotalCollected = allPayments.Where(p => p.Status == (int)PaymentStatus.Completed).Sum(p => p.Amount),
                TotalPending = allPayments.Where(p => p.Status == (int)PaymentStatus.Pending).Sum(p => p.Amount),
                StudentsWithPlans = allPayments.Select(p => p.StudentId).Distinct().Count(),
                TotalPayments = allPayments.Count
            };

            return Ok(ApiResponse<PaymentStatsDto>.SuccessResult(stats));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment stats");
            return StatusCode(500, ApiResponse<PaymentStatsDto>.FailureResult("Failed to retrieve stats"));
        }
    }

    // GET: api/payments/eligible-students — students with no payment plan yet
    [HttpGet("eligible-students")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<List<int>>>> GetStudentsWithoutPayments()
    {
        try
        {
            var allPayments = await _repository.GetAllAsync();
            var studentIdsWithPlans = allPayments.Select(p => p.StudentId).Distinct().ToHashSet();

            var allStudents = await _studentRepository.GetAllAsync();
            var eligibleIds = allStudents
                .Where(s => !studentIdsWithPlans.Contains(s.Id))
                .Select(s => s.Id)
                .ToList();

            return Ok(ApiResponse<List<int>>.SuccessResult(eligibleIds));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting eligible students");
            return StatusCode(500, ApiResponse<List<int>>.FailureResult("Failed to retrieve eligible students"));
        }
    }

    // GET: api/payments/my
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PaymentSummaryDto>>> GetMyPayments()
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var students = await _studentRepository.FindAsync(s => s.UserId == Guid.Parse(userId));
            var student = students.FirstOrDefault();
            if (student == null)
                return NotFound(ApiResponse<PaymentSummaryDto>.FailureResult("Student profile not found"));

            var user = await _userRepository.GetByIdAsync(Guid.Parse(userId));
            var payments = await _repository.FindAsync(p => p.StudentId == student.Id);
            var paymentList = payments.OrderBy(p => p.InstallmentNumber).ToList();

            var summary = new PaymentSummaryDto
            {
                TotalAmount = paymentList.Sum(p => p.Amount),
                PaidAmount = paymentList.Where(p => p.Status == (int)PaymentStatus.Completed).Sum(p => p.Amount),
                RemainingAmount = paymentList.Where(p => p.Status != (int)PaymentStatus.Completed).Sum(p => p.Amount),
                TotalInstallments = paymentList.Count,
                PaidInstallments = paymentList.Count(p => p.Status == (int)PaymentStatus.Completed),
                Payments = paymentList.Select(p => MapToDto(p, student, user)).ToList()
            };

            return Ok(ApiResponse<PaymentSummaryDto>.SuccessResult(summary));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting student payments");
            return StatusCode(500, ApiResponse<PaymentSummaryDto>.FailureResult("Failed to retrieve payments"));
        }
    }

    // POST: api/payments/generate-installments
    [HttpPost("generate-installments")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<List<PaymentDto>>>> GenerateInstallments([FromBody] CreatePaymentRequest request)
    {
        try
        {
            var students = await _studentRepository.FindAsync(s => s.Id == request.StudentId);
            var student = students.FirstOrDefault();
            if (student == null)
                return NotFound(ApiResponse<List<PaymentDto>>.FailureResult("Student not found"));

            // Check if installments already exist
            var existing = await _repository.FindAsync(p => p.StudentId == request.StudentId);
            if (existing.Any())
                return BadRequest(ApiResponse<List<PaymentDto>>.FailureResult("Installments already exist for this student"));

            var user = await _userRepository.GetByIdAsync(student.UserId);

            // Get amount from program if not specified
            decimal totalAmount = request.Amount;
            if (totalAmount <= 0)
            {
                var program = await _programRepository.GetByIdAsync(student.ProgramId);
                totalAmount = program?.TuitionFee ?? 0;
                if (totalAmount <= 0)
                    return BadRequest(ApiResponse<List<PaymentDto>>.FailureResult("Program tuition fee not set"));
            }

            var installmentAmount = Math.Round(totalAmount / 6, 2);
            // Adjust last installment for rounding
            var lastInstallmentAmount = totalAmount - (installmentAmount * 5);

            var payments = new List<Payment>();
            var startDate = DateTime.UtcNow;

            for (int i = 1; i <= 6; i++)
            {
                var payment = new Payment
                {
                    StudentId = request.StudentId,
                    Amount = i == 6 ? lastInstallmentAmount : installmentAmount,
                    Currency = request.Currency ?? "USD",
                    Description = $"Tuition Payment - Installment {i}/6",
                    Type = (int)PaymentType.Tuition,
                    Status = (int)PaymentStatus.Pending,
                    InstallmentNumber = i,
                    TotalInstallments = 6,
                    DueDate = startDate.AddMonths(i - 1)
                };

                var created = await _repository.AddAsync(payment);
                payments.Add(created);
            }

            var dtos = payments.Select(p => MapToDto(p, student, user)).ToList();
            return Ok(ApiResponse<List<PaymentDto>>.SuccessResult(dtos, $"6 installments created. Each: ${installmentAmount}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating installments");
            return StatusCode(500, ApiResponse<List<PaymentDto>>.FailureResult("Failed to generate installments"));
        }
    }

    // POST: api/payments/{id}/pay
    [HttpPost("{id}/pay")]
    public async Task<ActionResult<ApiResponse<PaymentLinkResponse>>> Pay(int id)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var payment = await _repository.GetByIdAsync(id);
            if (payment == null)
                return NotFound(ApiResponse<PaymentLinkResponse>.FailureResult("Payment not found"));

            if (payment.Status == (int)PaymentStatus.Completed)
                return BadRequest(ApiResponse<PaymentLinkResponse>.FailureResult("Payment already completed"));

            // Check sequential payment - previous installments must be paid first
            if (payment.InstallmentNumber > 1)
            {
                var allPayments = await _repository.FindAsync(p => p.StudentId == payment.StudentId);
                var previousUnpaid = allPayments.Any(p =>
                    p.InstallmentNumber < payment.InstallmentNumber &&
                    p.Status != (int)PaymentStatus.Completed);

                if (previousUnpaid)
                    return BadRequest(ApiResponse<PaymentLinkResponse>.FailureResult(
                        $"Please pay installment {payment.InstallmentNumber - 1} first"));
            }

            // If link already exists and not expired, return it
            if (!string.IsNullOrEmpty(payment.SquarePaymentLinkUrl) && payment.Status == (int)PaymentStatus.Pending)
            {
                return Ok(ApiResponse<PaymentLinkResponse>.SuccessResult(new PaymentLinkResponse
                {
                    PaymentId = payment.Id,
                    PaymentUrl = payment.SquarePaymentLinkUrl
                }));
            }

            var students = await _studentRepository.FindAsync(s => s.Id == payment.StudentId);
            var student = students.FirstOrDefault();
            var user = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;

            (string? linkId, string? linkUrl, string? orderId, string? error) = await _squareService.CreatePaymentLink(
                payment.Amount, payment.Currency, payment.Description, user?.Email);

            if (error != null)
                return BadRequest(ApiResponse<PaymentLinkResponse>.FailureResult($"Payment link creation failed: {error}"));

            payment.SquarePaymentLinkId = linkId;
            payment.SquarePaymentLinkUrl = linkUrl;
            payment.SquareOrderId = orderId;
            payment.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(payment);

            return Ok(ApiResponse<PaymentLinkResponse>.SuccessResult(new PaymentLinkResponse
            {
                PaymentId = payment.Id,
                PaymentUrl = linkUrl!
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment link");
            return StatusCode(500, ApiResponse<PaymentLinkResponse>.FailureResult("Failed to create payment link"));
        }
    }

    // POST: api/payments/{id}/check-status
    [HttpPost("{id}/check-status")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> CheckStatus(int id)
    {
        try
        {
            var payment = await _repository.GetByIdAsync(id);
            if (payment == null)
                return NotFound(ApiResponse<PaymentDto>.FailureResult("Payment not found"));

            if (payment.Status == (int)PaymentStatus.Pending && !string.IsNullOrEmpty(payment.SquareOrderId))
            {
                (string? status, string? squarePaymentId, string? error) = await _squareService.GetOrderStatus(payment.SquareOrderId);

                if (error == null && status != null)
                {
                    if (status == "COMPLETED")
                    {
                        payment.Status = (int)PaymentStatus.Completed;
                        payment.SquarePaymentId = squarePaymentId;
                        payment.PaidAt = DateTime.UtcNow;
                        payment.UpdatedAt = DateTime.UtcNow;
                        await _repository.UpdateAsync(payment);
                    }
                    else if (status == "CANCELED")
                    {
                        payment.Status = (int)PaymentStatus.Cancelled;
                        payment.UpdatedAt = DateTime.UtcNow;
                        await _repository.UpdateAsync(payment);
                    }
                }
            }

            var students = await _studentRepository.FindAsync(s => s.Id == payment.StudentId);
            var student = students.FirstOrDefault();
            var user = student != null ? await _userRepository.GetByIdAsync(student.UserId) : null;

            return Ok(ApiResponse<PaymentDto>.SuccessResult(MapToDto(payment, student, user)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking payment status");
            return StatusCode(500, ApiResponse<PaymentDto>.FailureResult("Failed to check payment status"));
        }
    }

    // POST: api/payments/webhook
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> SquareWebhook()
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();
            _logger.LogInformation("Square webhook received: {Body}", body);

            using var doc = System.Text.Json.JsonDocument.Parse(body);
            var root = doc.RootElement;
            var eventType = root.GetProperty("type").GetString();

            if (eventType == "payment.completed")
            {
                var data = root.GetProperty("data").GetProperty("object").GetProperty("payment");
                var orderId = data.GetProperty("order_id").GetString();
                var squarePaymentId = data.GetProperty("id").GetString();

                if (!string.IsNullOrEmpty(orderId))
                {
                    var payments = await _repository.FindAsync(p => p.SquareOrderId == orderId);
                    var payment = payments.FirstOrDefault();

                    if (payment != null && payment.Status == (int)PaymentStatus.Pending)
                    {
                        payment.Status = (int)PaymentStatus.Completed;
                        payment.SquarePaymentId = squarePaymentId;
                        payment.PaidAt = DateTime.UtcNow;
                        payment.UpdatedAt = DateTime.UtcNow;
                        await _repository.UpdateAsync(payment);
                        _logger.LogInformation("Payment {PaymentId} completed via webhook", payment.Id);
                    }
                }
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Square webhook");
            return Ok();
        }
    }

    // DELETE: api/payments/student/{studentId}
    [HttpDelete("student/{studentId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteStudentPayments(int studentId)
    {
        try
        {
            var payments = await _repository.FindAsync(p => p.StudentId == studentId);
            foreach (var payment in payments)
            {
                await _repository.DeleteAsync(payment);
            }
            return Ok(ApiResponse<string>.SuccessResult($"Deleted {payments.Count()} payments"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting payments");
            return StatusCode(500, ApiResponse<string>.FailureResult("Failed to delete payments"));
        }
    }

    private static PaymentDto MapToDto(Payment p, StudentProfile? student, User? user) => new()
    {
        Id = p.Id,
        StudentId = p.StudentId,
        StudentName = user != null ? $"{user.FirstName} {user.LastName}" : "",
        StudentNumber = student?.StudentNumber ?? "",
        Amount = p.Amount,
        Currency = p.Currency,
        Description = p.Description,
        Type = ((PaymentType)p.Type).ToString(),
        Status = ((PaymentStatus)p.Status).ToString(),
        InstallmentNumber = p.InstallmentNumber,
        TotalInstallments = p.TotalInstallments,
        DueDate = p.DueDate,
        PaymentUrl = p.SquarePaymentLinkUrl,
        SquareOrderId = p.SquareOrderId,
        PaidAt = p.PaidAt,
        CreatedAt = p.CreatedAt
    };
}

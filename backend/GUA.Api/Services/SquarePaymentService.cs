using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GUA.Api.Services;

public class SquarePaymentService
{
    private readonly string _accessToken;
    private readonly string _locationId;
    private readonly string _baseUrl;
    private readonly HttpClient _httpClient;
    private readonly ILogger<SquarePaymentService> _logger;

    public SquarePaymentService(IConfiguration configuration, ILogger<SquarePaymentService> logger)
    {
        _logger = logger;
        var squareConfig = configuration.GetSection("Square");
        _accessToken = squareConfig["AccessToken"] ?? throw new ArgumentNullException("Square:AccessToken");
        _locationId = squareConfig["LocationId"] ?? throw new ArgumentNullException("Square:LocationId");

        var environment = squareConfig["Environment"] ?? "sandbox";
        _baseUrl = environment == "production"
            ? "https://connect.squareup.com"
            : "https://connect.squareupsandbox.com";

        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<(string? PaymentLinkId, string? PaymentLinkUrl, string? OrderId, string? Error)> CreatePaymentLink(
        decimal amount, string currency, string description, string? studentEmail = null)
    {
        try
        {
            var amountInCents = (long)(amount * 100);
            var idempotencyKey = Guid.NewGuid().ToString();

            var requestBody = new
            {
                idempotency_key = idempotencyKey,
                quick_pay = new
                {
                    name = description,
                    price_money = new
                    {
                        amount = amountInCents,
                        currency = currency
                    },
                    location_id = _locationId
                },
                checkout_options = new
                {
                    allow_tipping = false,
                    accepted_payment_methods = new
                    {
                        apple_pay = true,
                        google_pay = true
                    }
                },
                pre_populated_data = studentEmail != null ? new
                {
                    buyer_email = studentEmail
                } : null
            };

            var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/v2/online-checkout/payment-links", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Square API error: {StatusCode} - {Response}", response.StatusCode, responseBody);
                return (null, null, null, $"Square API error: {response.StatusCode}");
            }

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            var paymentLink = root.GetProperty("payment_link");

            var linkId = paymentLink.GetProperty("id").GetString();
            var linkUrl = paymentLink.GetProperty("url").GetString();
            var orderId = paymentLink.GetProperty("order_id").GetString();

            _logger.LogInformation("Square payment link created: {LinkId}, URL: {Url}", linkId, linkUrl);
            return (linkId, linkUrl, orderId, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Square payment link");
            return (null, null, null, ex.Message);
        }
    }

    public async Task<(string? Status, string? PaymentId, string? Error)> GetOrderStatus(string orderId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/v2/orders/{orderId}");
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return (null, null, $"Square API error: {response.StatusCode}");
            }

            using var doc = JsonDocument.Parse(responseBody);
            var order = doc.RootElement.GetProperty("order");
            var state = order.GetProperty("state").GetString();

            // Try to get payment ID from tenders
            string? paymentId = null;
            bool hasTender = false;
            if (order.TryGetProperty("tenders", out var tenders) && tenders.GetArrayLength() > 0)
            {
                paymentId = tenders[0].GetProperty("payment_id").GetString();
                hasTender = true;
            }

            // If order has tenders (payment made), treat as COMPLETED
            // Square sandbox keeps orders as OPEN even after payment
            var effectiveState = (state == "OPEN" && hasTender) ? "COMPLETED" : state;

            return (effectiveState, paymentId, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Square order status for {OrderId}", orderId);
            return (null, null, ex.Message);
        }
    }
}

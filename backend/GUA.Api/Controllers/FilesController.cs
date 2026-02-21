using GUA.Infrastructure.Services;
using GUA.Shared.DTOs;
using GUA.Shared.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public FilesController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    /// <summary>
    /// Upload a file (image, document, etc.)
    /// </summary>
    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<FileUploadResponseDto>>> UploadFile(
        [FromForm] IFormFile file,
        [FromForm] string folder = "general")
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<FileUploadResponseDto>.FailureResult("No file provided"));
            }

            // Validate file
            if (!_fileStorageService.IsValidFile(file))
            {
                return BadRequest(ApiResponse<FileUploadResponseDto>.FailureResult(
                    "Invalid file. Max size: 10MB. Allowed types: jpg, png, pdf, doc, docx, ppt, pptx"));
            }

            // Upload file
            var fileUrl = await _fileStorageService.UploadFileAsync(file, folder);

            var response = new FileUploadResponseDto
            {
                FileName = file.FileName,
                FileUrl = fileUrl,
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.UtcNow
            };

            return Ok(ApiResponse<FileUploadResponseDto>.SuccessResult(response, "File uploaded successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<FileUploadResponseDto>.FailureResult($"Upload failed: {ex.Message}"));
        }
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    [HttpDelete]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteFile([FromQuery] string fileUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                return BadRequest(ApiResponse<bool>.FailureResult("File URL is required"));
            }

            var deleted = await _fileStorageService.DeleteFileAsync(fileUrl);

            if (deleted)
            {
                return Ok(ApiResponse<bool>.SuccessResult(true, "File deleted successfully"));
            }

            return NotFound(ApiResponse<bool>.FailureResult("File not found"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<bool>.FailureResult($"Delete failed: {ex.Message}"));
        }
    }

    /// <summary>
    /// Get allowed file types and max size
    /// </summary>
    [HttpGet("config")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<FileUploadConfigDto>> GetUploadConfig()
    {
        var config = new FileUploadConfigDto
        {
            MaxSizeInBytes = 10485760, // 10MB
            MaxSizeLabel = "10 MB",
            AllowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".ppt", ".pptx" },
            AllowedMimeTypes = new[]
            {
                "image/jpeg", "image/png", "image/gif",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            }
        };

        return Ok(ApiResponse<FileUploadConfigDto>.SuccessResult(config));
    }
}

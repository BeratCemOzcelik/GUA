using GUA.Api.Models;
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
    private readonly IWebHostEnvironment _environment;

    public FilesController(IFileStorageService fileStorageService, IWebHostEnvironment environment)
    {
        _fileStorageService = fileStorageService;
        _environment = environment;
    }

    /// <summary>
    /// Upload a file (image, document, etc.)
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(524288000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
    public async Task<ActionResult<ApiResponse<FileUploadResponseDto>>> UploadFile([FromForm] FileUploadRequest request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
            {
                return BadRequest(ApiResponse<FileUploadResponseDto>.FailureResult("No file provided"));
            }

            // Validate file
            if (!_fileStorageService.IsValidFile(request.File))
            {
                return BadRequest(ApiResponse<FileUploadResponseDto>.FailureResult(
                    "Invalid file. Max size: 500MB. Allowed types: jpg, png, pdf, doc, docx, ppt, pptx"));
            }

            // Upload file
            var folder = string.IsNullOrWhiteSpace(request.Folder) ? "general" : request.Folder;
            var fileUrl = await _fileStorageService.UploadFileAsync(request.File, folder);

            var response = new FileUploadResponseDto
            {
                FileName = request.File.FileName,
                FileUrl = fileUrl,
                FileSize = request.File.Length,
                ContentType = request.File.ContentType,
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
    /// Bulk upload multiple files in a single request
    /// </summary>
    [HttpPost("upload-bulk")]
    [RequestSizeLimit(524288000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
    public async Task<ActionResult<ApiResponse<List<FileUploadResponseDto>>>> UploadBulk(
        [FromForm] IFormFileCollection files,
        [FromForm] string? folder)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest(ApiResponse<List<FileUploadResponseDto>>.FailureResult("No files provided"));

            var results = new List<FileUploadResponseDto>();
            var folderName = string.IsNullOrWhiteSpace(folder) ? "general" : folder;

            foreach (var file in files)
            {
                if (!_fileStorageService.IsValidFile(file)) continue;
                var url = await _fileStorageService.UploadFileAsync(file, folderName);
                results.Add(new FileUploadResponseDto
                {
                    FileName = file.FileName,
                    FileUrl = url,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedAt = DateTime.UtcNow
                });
            }

            return Ok(ApiResponse<List<FileUploadResponseDto>>.SuccessResult(results, $"Uploaded {results.Count} files"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<FileUploadResponseDto>>.FailureResult($"Bulk upload failed: {ex.Message}"));
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
            MaxSizeInBytes = 524288000, // 500MB
            MaxSizeLabel = "500 MB",
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

    /// <summary>
    /// Download a file with proper headers to force download instead of opening in browser
    /// </summary>
    [HttpGet("download")]
    [AllowAnonymous]
    public IActionResult Download([FromQuery] string fileUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                return BadRequest("File URL is required");
            }

            // Remove leading slash if present
            var relativePath = fileUrl.TrimStart('/');

            // Construct full file path
            var webRootPath = _environment.WebRootPath;
            var filePath = Path.Combine(webRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("File not found");
            }

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            var fileName = Path.GetFileName(filePath);
            var contentType = GetContentType(fileName);

            // Force download with Content-Disposition header
            return File(fileBytes, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error downloading file: {ex.Message}");
        }
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt" => "text/plain",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => "application/octet-stream",
        };
    }
}

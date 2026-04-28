using Microsoft.AspNetCore.Http;

namespace GUA.Infrastructure.Services;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string folder = "general");
    Task<bool> DeleteFileAsync(string fileUrl);
    bool IsValidFile(IFormFile file, long maxSizeInBytes = 524288000); // 10MB default
    string GetFileExtension(IFormFile file);
}

public class FileStorageService : IFileStorageService
{
    private readonly string _uploadPath;
    private readonly string[] _allowedExtensions = new[]
    {
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", // Images
        ".pdf", // PDF
        ".doc", ".docx", // Word
        ".ppt", ".pptx", // PowerPoint
        ".xls", ".xlsx", // Excel
        ".txt", ".md", // Text
        ".mp4", ".webm", ".mov" // Video
    };

    public FileStorageService(string webRootPath)
    {
        _uploadPath = Path.Combine(webRootPath, "uploads");

        // Ensure uploads directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folder = "general")
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File is empty");
        }

        if (!IsValidFile(file))
        {
            throw new InvalidOperationException("Invalid file type or size");
        }

        // Create year/month folder structure
        var now = DateTime.UtcNow;
        var yearMonth = Path.Combine(now.Year.ToString(), now.Month.ToString("00"));
        var folderPath = Path.Combine(_uploadPath, folder, yearMonth);

        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        // Generate unique filename
        var extension = GetFileExtension(file);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(folderPath, fileName);

        // Save file
        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return public URL (relative path)
        return $"/uploads/{folder}/{yearMonth}/{fileName}".Replace("\\", "/");
    }

    public Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                return Task.FromResult(false);
            }

            // Convert URL to physical path
            var relativePath = fileUrl.TrimStart('/').Replace("/", "\\");
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public bool IsValidFile(IFormFile file, long maxSizeInBytes = 524288000)
    {
        if (file == null || file.Length == 0)
        {
            return false;
        }

        // Check file size (default 10MB)
        if (file.Length > maxSizeInBytes)
        {
            return false;
        }

        // Check file extension
        var extension = GetFileExtension(file);
        if (!_allowedExtensions.Contains(extension.ToLower()))
        {
            return false;
        }

        return true;
    }

    public string GetFileExtension(IFormFile file)
    {
        return Path.GetExtension(file.FileName).ToLower();
    }
}

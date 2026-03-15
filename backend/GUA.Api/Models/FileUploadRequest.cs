namespace GUA.Api.Models;

public class FileUploadRequest
{
    public IFormFile File { get; set; } = null!;
    public string Folder { get; set; } = "general";
}

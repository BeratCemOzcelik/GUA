namespace GUA.Shared.DTOs.BlogPost;

public class UpdateBlogPostRequest
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public string? Tags { get; set; }
    public bool IsPublished { get; set; }
}

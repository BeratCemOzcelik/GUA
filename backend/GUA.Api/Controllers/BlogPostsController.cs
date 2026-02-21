using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.BlogPost;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using BlogPostEntity = GUA.Core.Entities.BlogPost;
using UserEntity = GUA.Core.Entities.User;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BlogPostsController : ControllerBase
{
    private readonly IRepository<BlogPostEntity> _blogPostRepository;
    private readonly IRepository<UserEntity> _userRepository;
    private readonly ILogger<BlogPostsController> _logger;

    public BlogPostsController(
        IRepository<BlogPostEntity> blogPostRepository,
        IRepository<UserEntity> userRepository,
        ILogger<BlogPostsController> logger)
    {
        _blogPostRepository = blogPostRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<BlogPostDto>>>> GetAll()
    {
        try
        {
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            // Anonymous users and non-admin users only see published posts
            var posts = isAdmin
                ? await _blogPostRepository.GetAllAsync()
                : await _blogPostRepository.FindAsync(bp => bp.IsPublished);

            var authorIds = posts.Select(p => p.AuthorUserId).Distinct().ToList();
            var authors = await _userRepository.FindAsync(u => authorIds.Contains(u.Id));
            var authorDict = authors.ToDictionary(a => a.Id);

            var dtos = posts.Select(p =>
            {
                var author = authorDict.GetValueOrDefault(p.AuthorUserId);
                return new BlogPostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Slug = p.Slug,
                    Content = p.Content,
                    Excerpt = p.Excerpt,
                    AuthorUserId = p.AuthorUserId,
                    AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : string.Empty,
                    FeaturedImageUrl = p.FeaturedImageUrl,
                    Tags = p.Tags,
                    IsPublished = p.IsPublished,
                    PublishedAt = p.PublishedAt,
                    CreatedAt = p.CreatedAt
                };
            }).OrderByDescending(p => p.PublishedAt ?? p.CreatedAt);

            return Ok(ApiResponse<IEnumerable<BlogPostDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blog posts");
            return StatusCode(500, ApiResponse<IEnumerable<BlogPostDto>>.FailureResult(
                "An error occurred while retrieving blog posts"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> GetById(int id)
    {
        try
        {
            var post = await _blogPostRepository.GetByIdAsync(id);
            if (post == null)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            // Non-admin users can only see published posts
            if (!isAdmin && !post.IsPublished)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            var author = await _userRepository.GetByIdAsync(post.AuthorUserId);

            var dto = new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                Excerpt = post.Excerpt,
                AuthorUserId = post.AuthorUserId,
                AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : string.Empty,
                FeaturedImageUrl = post.FeaturedImageUrl,
                Tags = post.Tags,
                IsPublished = post.IsPublished,
                PublishedAt = post.PublishedAt,
                CreatedAt = post.CreatedAt
            };

            return Ok(ApiResponse<BlogPostDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blog post {Id}", id);
            return StatusCode(500, ApiResponse<BlogPostDto>.FailureResult(
                "An error occurred while retrieving the blog post"));
        }
    }

    [HttpGet("slug/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> GetBySlug(string slug)
    {
        try
        {
            var posts = await _blogPostRepository.FindAsync(bp => bp.Slug == slug);
            var post = posts.FirstOrDefault();

            if (post == null)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            // Non-admin users can only see published posts
            if (!isAdmin && !post.IsPublished)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            var author = await _userRepository.GetByIdAsync(post.AuthorUserId);

            var dto = new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                Excerpt = post.Excerpt,
                AuthorUserId = post.AuthorUserId,
                AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : string.Empty,
                FeaturedImageUrl = post.FeaturedImageUrl,
                Tags = post.Tags,
                IsPublished = post.IsPublished,
                PublishedAt = post.PublishedAt,
                CreatedAt = post.CreatedAt
            };

            return Ok(ApiResponse<BlogPostDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blog post by slug {Slug}", slug);
            return StatusCode(500, ApiResponse<BlogPostDto>.FailureResult(
                "An error occurred while retrieving the blog post"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> Create([FromBody] CreateBlogPostRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Title is required"));
            }

            if (string.IsNullOrWhiteSpace(request.Slug))
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Slug is required"));
            }

            // Check slug uniqueness
            if (await _blogPostRepository.ExistsAsync(bp => bp.Slug == request.Slug))
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult(
                    "A blog post with this slug already exists"));
            }

            // Get current user ID
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var authorUserId))
            {
                return Unauthorized(ApiResponse<BlogPostDto>.FailureResult("User not authenticated"));
            }

            var author = await _userRepository.GetByIdAsync(authorUserId);
            if (author == null)
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Author user not found"));
            }

            var post = new BlogPostEntity
            {
                Title = request.Title,
                Slug = request.Slug,
                Content = request.Content ?? string.Empty,
                Excerpt = request.Excerpt,
                AuthorUserId = authorUserId,
                FeaturedImageUrl = request.FeaturedImageUrl,
                Tags = request.Tags,
                IsPublished = false,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _blogPostRepository.AddAsync(post);

            var dto = new BlogPostDto
            {
                Id = created.Id,
                Title = created.Title,
                Slug = created.Slug,
                Content = created.Content,
                Excerpt = created.Excerpt,
                AuthorUserId = created.AuthorUserId,
                AuthorName = $"{author.FirstName} {author.LastName}".Trim(),
                FeaturedImageUrl = created.FeaturedImageUrl,
                Tags = created.Tags,
                IsPublished = created.IsPublished,
                PublishedAt = created.PublishedAt,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<BlogPostDto>.SuccessResult(dto, "Blog post created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating blog post");
            return StatusCode(500, ApiResponse<BlogPostDto>.FailureResult(
                "An error occurred while creating the blog post"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> Update(int id, [FromBody] UpdateBlogPostRequest request)
    {
        try
        {
            var post = await _blogPostRepository.GetByIdAsync(id);
            if (post == null)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Title is required"));
            }

            if (string.IsNullOrWhiteSpace(request.Slug))
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Slug is required"));
            }

            // Check slug uniqueness (excluding current post)
            if (post.Slug != request.Slug &&
                await _blogPostRepository.ExistsAsync(bp => bp.Slug == request.Slug && bp.Id != id))
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult(
                    "A blog post with this slug already exists"));
            }

            post.Title = request.Title;
            post.Slug = request.Slug;
            post.Content = request.Content ?? string.Empty;
            post.Excerpt = request.Excerpt;
            post.FeaturedImageUrl = request.FeaturedImageUrl;
            post.Tags = request.Tags;

            // Handle publish state change
            if (request.IsPublished && !post.IsPublished)
            {
                post.IsPublished = true;
                post.PublishedAt = DateTime.UtcNow;
            }
            else if (!request.IsPublished && post.IsPublished)
            {
                post.IsPublished = false;
                post.PublishedAt = null;
            }

            post.UpdatedAt = DateTime.UtcNow;

            await _blogPostRepository.UpdateAsync(post);

            var author = await _userRepository.GetByIdAsync(post.AuthorUserId);

            var dto = new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                Excerpt = post.Excerpt,
                AuthorUserId = post.AuthorUserId,
                AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : string.Empty,
                FeaturedImageUrl = post.FeaturedImageUrl,
                Tags = post.Tags,
                IsPublished = post.IsPublished,
                PublishedAt = post.PublishedAt,
                CreatedAt = post.CreatedAt
            };

            return Ok(ApiResponse<BlogPostDto>.SuccessResult(dto, "Blog post updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating blog post {Id}", id);
            return StatusCode(500, ApiResponse<BlogPostDto>.FailureResult(
                "An error occurred while updating the blog post"));
        }
    }

    [HttpPost("{id}/publish")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> Publish(int id)
    {
        try
        {
            var post = await _blogPostRepository.GetByIdAsync(id);
            if (post == null)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            if (post.IsPublished)
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Blog post is already published"));
            }

            post.IsPublished = true;
            post.PublishedAt = DateTime.UtcNow;
            post.UpdatedAt = DateTime.UtcNow;

            await _blogPostRepository.UpdateAsync(post);

            var author = await _userRepository.GetByIdAsync(post.AuthorUserId);

            var dto = new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                Excerpt = post.Excerpt,
                AuthorUserId = post.AuthorUserId,
                AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : string.Empty,
                FeaturedImageUrl = post.FeaturedImageUrl,
                Tags = post.Tags,
                IsPublished = post.IsPublished,
                PublishedAt = post.PublishedAt,
                CreatedAt = post.CreatedAt
            };

            return Ok(ApiResponse<BlogPostDto>.SuccessResult(dto, "Blog post published successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing blog post {Id}", id);
            return StatusCode(500, ApiResponse<BlogPostDto>.FailureResult(
                "An error occurred while publishing the blog post"));
        }
    }

    [HttpPost("{id}/unpublish")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> Unpublish(int id)
    {
        try
        {
            var post = await _blogPostRepository.GetByIdAsync(id);
            if (post == null)
            {
                return NotFound(ApiResponse<BlogPostDto>.FailureResult("Blog post not found"));
            }

            if (!post.IsPublished)
            {
                return BadRequest(ApiResponse<BlogPostDto>.FailureResult("Blog post is not published"));
            }

            post.IsPublished = false;
            post.PublishedAt = null;
            post.UpdatedAt = DateTime.UtcNow;

            await _blogPostRepository.UpdateAsync(post);

            var author = await _userRepository.GetByIdAsync(post.AuthorUserId);

            var dto = new BlogPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Slug = post.Slug,
                Content = post.Content,
                Excerpt = post.Excerpt,
                AuthorUserId = post.AuthorUserId,
                AuthorName = author != null ? $"{author.FirstName} {author.LastName}".Trim() : string.Empty,
                FeaturedImageUrl = post.FeaturedImageUrl,
                Tags = post.Tags,
                IsPublished = post.IsPublished,
                PublishedAt = post.PublishedAt,
                CreatedAt = post.CreatedAt
            };

            return Ok(ApiResponse<BlogPostDto>.SuccessResult(dto, "Blog post unpublished successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unpublishing blog post {Id}", id);
            return StatusCode(500, ApiResponse<BlogPostDto>.FailureResult(
                "An error occurred while unpublishing the blog post"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var post = await _blogPostRepository.GetByIdAsync(id);
            if (post == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Blog post not found"));
            }

            await _blogPostRepository.DeleteAsync(post);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Blog post deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting blog post {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the blog post"));
        }
    }
}

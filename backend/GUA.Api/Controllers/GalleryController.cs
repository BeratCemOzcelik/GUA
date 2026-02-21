using GUA.Core.Interfaces;
using GUA.Shared.DTOs.Common;
using GUA.Shared.DTOs.Gallery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GalleryItemEntity = GUA.Core.Entities.GalleryItem;

namespace GUA.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GalleryController : ControllerBase
{
    private readonly IRepository<GalleryItemEntity> _galleryRepository;
    private readonly ILogger<GalleryController> _logger;

    public GalleryController(
        IRepository<GalleryItemEntity> galleryRepository,
        ILogger<GalleryController> logger)
    {
        _galleryRepository = galleryRepository;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<GalleryItemDto>>>> GetAll()
    {
        try
        {
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            // Anonymous users and non-admin users only see active items
            var items = isAdmin
                ? await _galleryRepository.GetAllAsync()
                : await _galleryRepository.FindAsync(g => g.IsActive);

            var dtos = items
                .OrderBy(g => g.DisplayOrder)
                .ThenByDescending(g => g.CreatedAt)
                .Select(g => new GalleryItemDto
                {
                    Id = g.Id,
                    Title = g.Title,
                    Description = g.Description,
                    ImageUrl = g.ImageUrl,
                    Category = g.Category,
                    DisplayOrder = g.DisplayOrder,
                    IsActive = g.IsActive,
                    CreatedAt = g.CreatedAt
                });

            return Ok(ApiResponse<IEnumerable<GalleryItemDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving gallery items");
            return StatusCode(500, ApiResponse<IEnumerable<GalleryItemDto>>.FailureResult(
                "An error occurred while retrieving gallery items"));
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<GalleryItemDto>>> GetById(int id)
    {
        try
        {
            var item = await _galleryRepository.GetByIdAsync(id);
            if (item == null)
            {
                return NotFound(ApiResponse<GalleryItemDto>.FailureResult("Gallery item not found"));
            }

            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            // Non-admin users can only see active items
            if (!isAdmin && !item.IsActive)
            {
                return NotFound(ApiResponse<GalleryItemDto>.FailureResult("Gallery item not found"));
            }

            var dto = new GalleryItemDto
            {
                Id = item.Id,
                Title = item.Title,
                Description = item.Description,
                ImageUrl = item.ImageUrl,
                Category = item.Category,
                DisplayOrder = item.DisplayOrder,
                IsActive = item.IsActive,
                CreatedAt = item.CreatedAt
            };

            return Ok(ApiResponse<GalleryItemDto>.SuccessResult(dto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving gallery item {Id}", id);
            return StatusCode(500, ApiResponse<GalleryItemDto>.FailureResult(
                "An error occurred while retrieving the gallery item"));
        }
    }

    [HttpGet("category/{category}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<GalleryItemDto>>>> GetByCategory(string category)
    {
        try
        {
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            // Anonymous users and non-admin users only see active items
            var items = isAdmin
                ? await _galleryRepository.FindAsync(g => g.Category == category)
                : await _galleryRepository.FindAsync(g => g.Category == category && g.IsActive);

            var dtos = items
                .OrderBy(g => g.DisplayOrder)
                .ThenByDescending(g => g.CreatedAt)
                .Select(g => new GalleryItemDto
                {
                    Id = g.Id,
                    Title = g.Title,
                    Description = g.Description,
                    ImageUrl = g.ImageUrl,
                    Category = g.Category,
                    DisplayOrder = g.DisplayOrder,
                    IsActive = g.IsActive,
                    CreatedAt = g.CreatedAt
                });

            return Ok(ApiResponse<IEnumerable<GalleryItemDto>>.SuccessResult(dtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving gallery items by category {Category}", category);
            return StatusCode(500, ApiResponse<IEnumerable<GalleryItemDto>>.FailureResult(
                "An error occurred while retrieving gallery items"));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<GalleryItemDto>>> Create([FromBody] CreateGalleryItemRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(ApiResponse<GalleryItemDto>.FailureResult("Title is required"));
            }

            if (string.IsNullOrWhiteSpace(request.ImageUrl))
            {
                return BadRequest(ApiResponse<GalleryItemDto>.FailureResult("Image URL is required"));
            }

            var item = new GalleryItemEntity
            {
                Title = request.Title,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                Category = request.Category,
                DisplayOrder = request.DisplayOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _galleryRepository.AddAsync(item);

            var dto = new GalleryItemDto
            {
                Id = created.Id,
                Title = created.Title,
                Description = created.Description,
                ImageUrl = created.ImageUrl,
                Category = created.Category,
                DisplayOrder = created.DisplayOrder,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                ApiResponse<GalleryItemDto>.SuccessResult(dto, "Gallery item created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating gallery item");
            return StatusCode(500, ApiResponse<GalleryItemDto>.FailureResult(
                "An error occurred while creating the gallery item"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<GalleryItemDto>>> Update(int id, [FromBody] UpdateGalleryItemRequest request)
    {
        try
        {
            var item = await _galleryRepository.GetByIdAsync(id);
            if (item == null)
            {
                return NotFound(ApiResponse<GalleryItemDto>.FailureResult("Gallery item not found"));
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(ApiResponse<GalleryItemDto>.FailureResult("Title is required"));
            }

            if (string.IsNullOrWhiteSpace(request.ImageUrl))
            {
                return BadRequest(ApiResponse<GalleryItemDto>.FailureResult("Image URL is required"));
            }

            item.Title = request.Title;
            item.Description = request.Description;
            item.ImageUrl = request.ImageUrl;
            item.Category = request.Category;
            item.DisplayOrder = request.DisplayOrder;
            item.IsActive = request.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            await _galleryRepository.UpdateAsync(item);

            var dto = new GalleryItemDto
            {
                Id = item.Id,
                Title = item.Title,
                Description = item.Description,
                ImageUrl = item.ImageUrl,
                Category = item.Category,
                DisplayOrder = item.DisplayOrder,
                IsActive = item.IsActive,
                CreatedAt = item.CreatedAt
            };

            return Ok(ApiResponse<GalleryItemDto>.SuccessResult(dto, "Gallery item updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating gallery item {Id}", id);
            return StatusCode(500, ApiResponse<GalleryItemDto>.FailureResult(
                "An error occurred while updating the gallery item"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var item = await _galleryRepository.GetByIdAsync(id);
            if (item == null)
            {
                return NotFound(ApiResponse<bool>.FailureResult("Gallery item not found"));
            }

            await _galleryRepository.DeleteAsync(item);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Gallery item deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting gallery item {Id}", id);
            return StatusCode(500, ApiResponse<bool>.FailureResult(
                "An error occurred while deleting the gallery item"));
        }
    }
}

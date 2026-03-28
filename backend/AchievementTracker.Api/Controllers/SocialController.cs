using AchievementTracker.Api.Models.DTOs.Social;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Controllers;

[ApiController]
[Route("social")]
public sealed class SocialController(ICurrentUser currentUser, ISocialService socialService) : ControllerBase
{
     private const string PageTokenParameterName = "pageToken";

     private readonly ICurrentUser _currentUser = currentUser;
     private readonly ISocialService _socialService = socialService;

     [Authorize]
     [HttpPost("post")]
     public async Task<IActionResult> CreatePost(
          [FromBody] CreateSocialPostRequestDto request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          try
          {
               Guid postPublicId = await _socialService.CreatePostAsync(
                    _currentUser.AppUserId.Value,
                    request,
                    ct);

               return Ok(new { postPublicId });
          }
          catch (SocialIdentityRequiredException ex)
          {
               return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
          }
          catch (ArgumentException ex)
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [Authorize]
     [Consumes("multipart/form-data")]
     [HttpPost("upload/image")]
     public async Task<ActionResult<UploadSocialImageResponseDto>> UploadImage(
          [FromForm] UploadSocialImageRequestDto request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          try
          {
               UploadSocialImageResponseDto result = await _socialService.UploadImageAsync(
                    _currentUser.AppUserId.Value,
                    request,
                    ct);

               return Ok(result);
          }
          catch (SocialIdentityRequiredException ex)
          {
               return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
          }
          catch (SocialAttachmentStorageException ex)
          {
               return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = ex.Message });
          }
          catch (ArgumentException ex)
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [AllowAnonymous]
     [HttpGet("feed")]
     public async Task<ActionResult<SocialFeedPageDto>> GetFeed(
          [FromQuery] int pageSize = 0,
          [FromQuery] string? pageToken = null,
          CancellationToken ct = default)
     {
          try
          {
               SocialFeedPageDto result = await _socialService.GetFeedAsync(
                    _currentUser.AppUserId,
                    pageSize,
                    pageToken,
                    ct);

               return Ok(result);
          }
          catch (ArgumentException ex) when (IsInvalidPageToken(ex))
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [AllowAnonymous]
     [HttpGet("feed/users/{authorPublicId:guid}")]
     public async Task<ActionResult<SocialFeedPageDto>> GetFeedForUser(
          Guid authorPublicId,
          [FromQuery] int pageSize = 0,
          [FromQuery] string? pageToken = null,
          CancellationToken ct = default)
     {
          try
          {
               SocialFeedPageDto result = await _socialService.GetFeedByUserAsync(
                    _currentUser.AppUserId,
                    authorPublicId,
                    pageSize,
                    pageToken,
                    ct);

               return Ok(result);
          }
          catch (ArgumentException ex) when (IsInvalidPageToken(ex))
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [AllowAnonymous]
     [HttpGet("feed/refresh")]
     public async Task<ActionResult<SocialFeedPageDto>> RefreshFeed(
          [FromQuery] int intervalSeconds,
          [FromQuery] int pageSize = 0,
          CancellationToken ct = default)
     {
          try
          {
               SocialFeedPageDto result = await _socialService.GetFeedRefreshAsync(
                    _currentUser.AppUserId,
                    intervalSeconds,
                    pageSize,
                    ct);

               return Ok(result);
          }
          catch (ArgumentOutOfRangeException ex)
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [Authorize]
     [HttpPost("posts/{postPublicId:guid}/comment")]
     public async Task<ActionResult<SocialCommentDto>> CreateComment(
          Guid postPublicId,
          [FromBody] CreateSocialCommentRequestDto request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          try
          {
               SocialCommentDto created = await _socialService.CreateCommentAsync(
                    _currentUser.AppUserId.Value,
                    postPublicId,
                    request,
                    ct);

               return Ok(created);
          }
          catch (SocialIdentityRequiredException ex)
          {
               return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
          }
          catch (KeyNotFoundException)
          {
               return NotFound();
          }
          catch (ArgumentException ex)
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [Authorize]
     [HttpPut("posts/{postPublicId:guid}/reaction")]
     public async Task<IActionResult> SetReaction(
          Guid postPublicId,
          [FromBody] SetReactionRequestDto request,
          CancellationToken ct)
     {
          if (_currentUser.AppUserId is null)
               return Unauthorized();

          try
          {
               bool? result = await _socialService.SetReactionAsync(
                    _currentUser.AppUserId.Value,
                    postPublicId,
                    request,
                    ct);

               return result.HasValue ? Ok() : NotFound();
          }
          catch (ArgumentException ex)
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     [AllowAnonymous]
     [HttpGet("posts/{postPublicId:guid}/reactions")]
     public async Task<ActionResult<List<SocialReactionDto>>> GetReactions(
          Guid postPublicId,
          CancellationToken ct)
     {
          List<SocialReactionDto>? reactions = await _socialService.GetReactionsAsync(postPublicId, ct);
          if (reactions == null)
               return NotFound();

          return Ok(reactions);
     }

     [AllowAnonymous]
     [HttpGet("posts/{postPublicId:guid}/comments")]
     public async Task<ActionResult<SocialCommentPageDto>> GetComments(
          Guid postPublicId,
          [FromQuery] int pageSize = 0,
          [FromQuery] string? pageToken = null,
          CancellationToken ct = default)
     {
          try
          {
               SocialCommentPageDto? comments = await _socialService.GetCommentsAsync(
                    postPublicId,
                    pageSize,
                    pageToken,
                    ct);
               if (comments == null)
                    return NotFound();

               return Ok(comments);
          }
          catch (ArgumentException ex) when (IsInvalidPageToken(ex))
          {
               return BadRequest(new { error = ex.Message });
          }
     }

     private static bool IsInvalidPageToken(ArgumentException ex) =>
          string.Equals(ex.ParamName, PageTokenParameterName, StringComparison.Ordinal);
}

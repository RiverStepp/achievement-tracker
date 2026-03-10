using AchievementTracker.Api.Models.DTOs.Steam;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Helpers;
public sealed class ActionResultFactory
{
     public static ContentResult ToContentResult(SteamRawResponseDto result)
          => new()
          {
               StatusCode = result.StatusCode,
               ContentType = result.ContentType,
               Content = result.Body ?? string.Empty
          };
}

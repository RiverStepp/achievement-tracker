using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AchievementTracker.Api.Models.DTOs.Settings;

/// <summary>Multipart body for <c>PUT /me/settings/media</c> (profile/banner images only).</summary>
public sealed class UpdateMySettingsMediaForm
{
    [FromForm(Name = "profileImage")]
    public IFormFile? ProfileImage { get; set; }

    [FromForm(Name = "bannerImage")]
    public IFormFile? BannerImage { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace AchievementTracker.Api.Models.DTOs.DirectMessages;

public sealed class SendMessageRequest
{
     [Required]
     public int RecipientUserId { get; set; }

     [Required]
     [MaxLength(2000)]
     public string Content { get; set; } = string.Empty;
}

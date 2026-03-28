namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SocialAttachmentStorageException : InvalidOperationException
{
     public SocialAttachmentStorageException(string message)
          : base(message)
     {
     }

     public SocialAttachmentStorageException(string message, Exception innerException)
          : base(message, innerException)
     {
     }
}

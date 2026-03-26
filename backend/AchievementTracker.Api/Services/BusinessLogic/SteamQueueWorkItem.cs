namespace AchievementTracker.Api.Services.BusinessLogic;

internal sealed class SteamQueueWorkItem
{
     public SteamQueueWorkItem(
          CancellationToken requestCt,
          bool isBackground,
          Func<CancellationToken, Task> execute,
          Action cancel,
          Action<Exception> fail
     )
     {
          RequestCt = requestCt;
          IsBackground = isBackground;
          Execute = execute;
          Cancel = cancel;
          Fail = fail;
     }

     public CancellationToken RequestCt { get; }
     public bool IsBackground { get; }

     public Func<CancellationToken, Task> Execute { get; }
     public Action Cancel { get; }
     public Action<Exception> Fail { get; }
}

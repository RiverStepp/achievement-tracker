using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Models.Enums;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.Interfaces;

namespace AchievementTracker.Api.Services.BusinessLogic;

public sealed class SteamRequestQueue(
     SteamApiRateLimitOptions options,
     ISteamRateLimiter rateLimiter,
     ILogger<SteamRequestQueue> logger
): BackgroundService, ISteamRequestQueue
{
     private readonly SteamApiRateLimitOptions _options = options;
     private readonly ISteamRateLimiter _rateLimiter = rateLimiter;
     private readonly ILogger<SteamRequestQueue> _logger = logger;

     private readonly object _gate = new object();

     private readonly PriorityQueue<SteamQueueWorkItem, (eSteamRequestPriority priority, long seq)> _queue = new();
     private readonly SemaphoreSlim _itemsAvailable = new(0);

     private readonly SemaphoreSlim _totalCapacity = new(options.TotalQueueCapacity, options.TotalQueueCapacity);
     private readonly SemaphoreSlim _backgroundCapacity = new(options.BackgroundQueueCapacity, options.BackgroundQueueCapacity);

     private long _sequence;

     public async Task<T> EnqueueAsync<T>(
          Func<CancellationToken, Task<T>> work,
          eSteamRequestPriority priority,
          CancellationToken ct = default
     )
     {
          if(work == null)
          {
               throw new ArgumentNullException(nameof(work));
          }

          bool isBackground = priority >= _options.BackgroundPriorityMin;
          await AcquireCapacityAsync(isBackground, ct);

          var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);

          try
          {
               SteamQueueWorkItem item = new(
                    requestCt: ct,
                    isBackground: isBackground,
                    execute: async execCt =>
                    {
                         T result = await work(execCt);
                         tcs.TrySetResult(result);
                    },
                    cancel: () => tcs.TrySetCanceled(ct),
                    fail: ex => tcs.TrySetException(ex)
               );

               EnqueueInternal(item, priority);
          }
          catch
          {
               ReleaseCapacity(isBackground);
               throw;
          }

          return await tcs.Task;
     }

     protected override async Task ExecuteAsync(CancellationToken stoppingToken)
     {
          while(!stoppingToken.IsCancellationRequested)
          {
               SteamQueueWorkItem item;

               try
               {
                    item = await DequeueAsync(stoppingToken);
               }
               catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
               {
                    return;
               }

               ReleaseCapacity(item.IsBackground);

               if(item.RequestCt.IsCancellationRequested)
               {
                    item.Cancel();
                    continue;
               }

               using var linked = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, item.RequestCt);

               try
               {
                    await _rateLimiter.WaitForAvailabilityAsync(linked.Token);
                    await item.Execute(linked.Token);
               }
               catch(OperationCanceledException) when (stoppingToken.IsCancellationRequested)
               {
                    item.Cancel();
               }
               catch (Exception ex)
               {
                    _logger.LogWarning(ex, "Steam queue work item failed.");
                    item.Fail(ex);
               }
          }
     }

     private void EnqueueInternal(SteamQueueWorkItem item, eSteamRequestPriority priority)
     {
          long seq = Interlocked.Increment(ref _sequence);

          lock(_gate)
          {
               _queue.Enqueue(item, (priority, seq));
          }

          _itemsAvailable.Release();
     }

     private async Task<SteamQueueWorkItem> DequeueAsync(CancellationToken ct)
     {
          await _itemsAvailable.WaitAsync(ct);

          lock(_gate)
          {
               return _queue.Dequeue();
          }
     }

     private async Task AcquireCapacityAsync(bool isBackground, CancellationToken ct)
     {
          await _totalCapacity.WaitAsync(ct);

          if (!isBackground)
               return;

          try
          {
               await _backgroundCapacity.WaitAsync(ct);
          }
          catch
          {
               _totalCapacity.Release();
               throw;
          }
     }

     private void ReleaseCapacity(bool isBackground)
     {
          if(isBackground)
               _backgroundCapacity.Release();

          _totalCapacity.Release();
     }
}

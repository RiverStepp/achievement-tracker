using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.Helpers;
using AchievementTracker.Api.Models.Exceptions;
using AchievementTracker.Api.Models.Options;
using StackExchange.Redis;
using System.Diagnostics;

namespace AchievementTracker.Api.DataAccess.Redis;

public sealed class RedisSteamRateLimiter(
     IConnectionMultiplexer redis,
     SteamApiRateLimitOptions options,
     ILogger<RedisSteamRateLimiter> logger
): ISteamRateLimiter
{
     private readonly IConnectionMultiplexer _redis = redis;
     private readonly SteamApiRateLimitOptions _options = options;
     private readonly ILogger<RedisSteamRateLimiter> _logger = logger;

     private IDatabase Db => _redis.GetDatabase();

     // Constants used for building the redis keys 
     private const string RateSegment = "rate";
     private const string DailySegment = "daily";
     private const string DailyDateFormat = "yyyyMMdd";
     private const string LockValue = "1";

     public async Task WaitForAvailabilityAsync(CancellationToken ct = default)
     {
          int sliceMs = _options.MinRequestIntervalMs;
          int maxWaitMs = _options.MaxWaitMs;

          TimeSpan interval = TimeSpan.FromMilliseconds(sliceMs);
          Stopwatch sw = Stopwatch.StartNew();

          while (true)
          {
               ct.ThrowIfCancellationRequested();

               if (sw.ElapsedMilliseconds >= maxWaitMs)
                    throw new TimeoutException($"Timed out waiting for Steam rate-limit permit after {maxWaitMs}ms.");

               bool acquired = await TryAcquireSlotAsync(sliceMs);

               if (acquired)
                    break;

               await DelayBeforeRetryAsync(sw, interval, maxWaitMs, ct);
          }

          await IncrementDailyOrThrowAsync(sliceMs, ct);
     }

     private async Task<bool> TryAcquireSlotAsync(int sliceMs)
     {
          long bucket = GetTimeBucket(sliceMs);

          string rateKey = SteamRedisKeyBuilder.Build(
               prefix: _options.RedisKeyPrefix!, // null-forgiving b/c this is validated in Program.cs
               segment: RateSegment,
               value: bucket.ToString()
          );

          // The factor here is arbitrary. We are simply using this to ensure they key outlives the slice 
          TimeSpan ttl = TimeSpan.FromMilliseconds((long)sliceMs * 2);

          return await Db.StringSetAsync(
               key: rateKey,
               value: LockValue,
               expiry: ttl,
               when: When.NotExists
          );
     }

     private async Task DelayBeforeRetryAsync(
          Stopwatch sw,
          TimeSpan interval,
          int maxWaitMs,
          CancellationToken ct
     )
     {
          long remainingMs = maxWaitMs - sw.ElapsedMilliseconds;
          if (remainingMs <= 0)
               return;

          TimeSpan retryDelay = TimeSpan.FromMilliseconds(_options.RetryDelayMs);

          TimeSpan delay = new List<TimeSpan>
          {
               retryDelay,
               interval,
               TimeSpan.FromMilliseconds(remainingMs)
          }
          .Min();

          await Task.Delay(delay, ct);
     }

     private async Task IncrementDailyOrThrowAsync(int sliceMs, CancellationToken ct)
     {
          ct.ThrowIfCancellationRequested();

          DateTime utcNow = DateTime.UtcNow;

          string dailyKey = SteamRedisKeyBuilder.Build(
               prefix: _options.RedisKeyPrefix!, // null-forgiving b/c this is validated in Program.cs
               segment: DailySegment,
               value: utcNow.ToString(DailyDateFormat)
          );

          long dailyCount = await Db.StringIncrementAsync(dailyKey);

          // First request of the day
          if(dailyCount == 1)
          {
               TimeSpan ttlToMidnight = GetTimeUntilNextUtcMidnight(utcNow, sliceMs);
               await Db.KeyExpireAsync(dailyKey, ttlToMidnight);
          }

          if (dailyCount > _options.DailyRequestLimit)
          {
               await Db.StringDecrementAsync(dailyKey);
               throw new SteamDailyLimitExceededException(_options.DailyRequestLimit, dailyCount - 1);
          }
     }

     public async Task<long> GetTodayCountAsync(CancellationToken ct = default)
     {
          ct.ThrowIfCancellationRequested();
          DateTime utcNow = DateTime.UtcNow;

          string dailyKey = SteamRedisKeyBuilder.Build(
               prefix: _options.RedisKeyPrefix!, // null-forgiving b/c this is validated in Program.cs
               segment: DailySegment,
               value: utcNow.ToString(DailyDateFormat)
          );

          RedisValue value = await Db.StringGetAsync(dailyKey);

          // First request of the day, so no key exists yet in redis 
          if (!value.HasValue)
               return 0;

          string raw = value.ToString();

          if (!long.TryParse(raw, out long count))
          {
               _logger.LogError(
                    "Invalid Steam daily counter value in Redis. Key={Key} Value={Value}",
                    dailyKey,
                    raw
               );
               throw new InvalidOperationException($"Invalid Steam daily counter value in Redis for key '{dailyKey}'");
          }

          return count;
     }

     private static long GetTimeBucket(int sliceMs)
     {
          long unixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
          return unixMs / sliceMs;
     }

     private static TimeSpan GetTimeUntilNextUtcMidnight(DateTime utcNow, int sliceMs)
     {
          TimeSpan ttl = utcNow.Date.AddDays(1) - utcNow;

          // Ensures a positive TTL even at boundary; use slice size as the floor.
          TimeSpan minTtl = TimeSpan.FromMilliseconds(sliceMs);
          return ttl < minTtl ? minTtl : ttl;
     }
}

using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.DataAccess.Redis;
using AchievementTracker.Api.DataAccess.Repositories;
using AchievementTracker.Api.Hubs;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Extensions;
using AchievementTracker.Models.Options;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.Text;
using System.Threading.RateLimiting;
using HeaderNames = Microsoft.Net.Http.Headers.HeaderNames;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Sets up key vault
string keyVaultUri = builder.Configuration["KeyVault:VaultUri"]!;
builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new DefaultAzureCredential());

string? steamApiKey = builder.Configuration["Authentication:Steam:ApiKey"];

if (string.IsNullOrWhiteSpace(steamApiKey))
     throw new InvalidOperationException("Steam API key is missing (Authentication:Steam:ApiKey)");

JwtSettings jwtSettings = new JwtSettings();
builder.Configuration.GetSection("Jwt").Bind(jwtSettings);

AuthSettings authSettings = new AuthSettings();
builder.Configuration.GetSection("Auth").Bind(authSettings);

CorsSettings corsSettings = new CorsSettings();
builder.Configuration.GetSection("Cors").Bind(corsSettings);

FrontendSettings frontendSettings = new FrontendSettings();
builder.Configuration.GetSection("Frontend").Bind(frontendSettings);

string jwtSigningKeyValue = builder.Configuration["Jwt:SigningKey"]!;
SymmetricSecurityKey jwtSigningKey = new SymmetricSecurityKey(
     Encoding.UTF8.GetBytes(jwtSigningKeyValue));

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(authSettings);
builder.Services.AddSingleton(corsSettings);
builder.Services.AddSingleton(frontendSettings);
builder.Services.AddSingleton(jwtSigningKey);

builder.Services
     .AddOptions<SocialOptions>()
     .BindConfiguration("Social")
     .Validate(
          o => o.DefaultFeedPageSize > 0 && o.DefaultFeedPageSize <= o.MaxFeedPageSize,
          "Social: DefaultFeedPageSize must be > 0 and <= MaxFeedPageSize.")
     .Validate(o => o.MaxFeedPageSize > 0, "Social: MaxFeedPageSize must be > 0.")
     .Validate(o => o.MaxRefreshIntervalSeconds > 0, "Social: MaxRefreshIntervalSeconds must be > 0.")
     .Validate(o => o.MaxAttachmentCount > 0, "Social: MaxAttachmentCount must be > 0.")
     .Validate(o => o.MaxHandleLength > 0, "Social: MaxHandleLength must be > 0.")
     .Validate(o => o.MaxDisplayNameLength > 0, "Social: MaxDisplayNameLength must be > 0.")
     .Validate(o => o.MaxContentLength > 0, "Social: MaxContentLength must be > 0.")
     .Validate(o => o.MaxAttachmentUrlLength > 0, "Social: MaxAttachmentUrlLength must be > 0.")
     .Validate(
          o => o.DefaultCommentsPageSize > 0 && o.DefaultCommentsPageSize <= o.MaxCommentsPageSize,
          "Social: DefaultCommentsPageSize must be > 0 and <= MaxCommentsPageSize.")
     .Validate(o => o.MaxCommentsPageSize > 0, "Social: MaxCommentsPageSize must be > 0.")
     .Validate(o => o.Upload.MaxImageBytes > 0, "Social:Upload:MaxImageBytes must be > 0.")
     .Validate(
          o => o.Upload.AllowedImageMimeTypes is { Length: > 0 },
          "Social:Upload:AllowedImageMimeTypes must not be empty.")
     .ValidateOnStart();

builder.Services.AddCors(options =>
{
     // Origins come from config so dev/prod differ without code changes.
     options.AddDefaultPolicy(policy =>
         policy.WithOrigins(corsSettings.AllowedOrigins)
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials());
});

// REDIS_REQUIRED: Replace this with a Redis-backed IDistributedCache for restart-safe + multi-instance refresh tokens.
// builder.Services.AddDistributedMemoryCache();

builder.Services.AddAuthentication(options =>
{
     options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
     options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
     options.TokenValidationParameters = new TokenValidationParameters
     {
          ValidateIssuer = true,
          ValidIssuer = jwtSettings.Issuer,
          ValidateAudience = true,
          ValidAudience = jwtSettings.Audience,
          ValidateIssuerSigningKey = true,
          IssuerSigningKey = jwtSigningKey,
          ValidateLifetime = true,
          ClockSkew = TimeSpan.FromMinutes(1)
     };

     // SignalR WebSocket connections cannot set Authorization headers, so the token is sent via query string.
     options.Events = new JwtBearerEvents
     {
          OnMessageReceived = context =>
          {
               var accessToken = context.Request.Query["access_token"];
               if (!string.IsNullOrEmpty(accessToken) &&
                   context.HttpContext.Request.Path.StartsWithSegments("/chat"))
               {
                    context.Token = accessToken;
               }

               return Task.CompletedTask;
          }
     };
})
.AddCookie(authSettings.ExternalScheme, options =>
{
     // External cookie is only used to complete the Steam callback.
     options.Cookie.HttpOnly = true;
     options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
     options.Cookie.SameSite = SameSiteMode.Lax;
})
.AddSteam(options =>
{
     options.ApplicationKey = steamApiKey;
     options.SignInScheme = authSettings.ExternalScheme;
});

builder.Services.AddAuthorization();

// Rate limiting (applied to REST API controllers). ChatHub rates are limited inside the hub.
builder.Services.AddRateLimiter(options =>
{
     options.AddSlidingWindowLimiter("chat-api", configure =>
     {
          configure.Window = TimeSpan.FromSeconds(10);
          configure.SegmentsPerWindow = 5;
          configure.PermitLimit = 20;
          configure.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
          configure.QueueLimit = 0;
     });
     options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddSignalR();

builder.Services.AddScoped<IAuthBusinessLogic, AuthBusinessLogic>();
builder.Services.AddScoped<IRefreshTokenStore, DistributedCacheRefreshTokenStore>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddSingleton<IProfileGatheringScriptRunner, ProfileGatheringScriptRunner>();

builder.Services
     .AddOptions<ProfileGatheringScriptOptions>()
     .BindConfiguration(ProfileGatheringScriptOptions.SectionName)
     .Validate(o => o.ProcessTimeoutMinutes > 0, "ProfileGatheringScript: ProcessTimeoutMinutes must be > 0.")
     .ValidateOnStart();

builder.Services.AddControllers();
builder.Services.AddDataAccess(builder.Configuration);
builder.Services.AddScoped<IDirectMessageRepository, DirectMessageRepository>();
builder.Services.AddScoped<IDirectMessageService, DirectMessageService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
     options.MapType<IFormFile>(() => new OpenApiSchema
     {
          Type = "string",
          Format = "binary"
     });

     string securitySchemeId = JwtBearerDefaults.AuthenticationScheme;

     OpenApiSecurityScheme bearer = new OpenApiSecurityScheme
     {
          Name = HeaderNames.Authorization,
          Type = SecuritySchemeType.Http,
          Scheme = "bearer",
          BearerFormat = "JWT",
          In = ParameterLocation.Header
     };

     options.AddSecurityDefinition(securitySchemeId, bearer);

     options.AddSecurityRequirement(new OpenApiSecurityRequirement
     {
          {
               new OpenApiSecurityScheme
               {
                    Reference = new OpenApiReference
                    {
                         Type = ReferenceType.SecurityScheme,
                         Id = securitySchemeId
                    }
               },
               Array.Empty<string>()
          }
     });
});

builder.Services.AddHttpClient<ISteamClient, SteamClient>(client =>
{
     client.BaseAddress = new Uri(builder.Configuration["Steam:BaseUrl"]!);
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<IAppUserRepository, AppUserRepository>();
builder.Services.AddScoped<IMeService, MeService>();
builder.Services.AddScoped<ISocialRepository, SocialRepository>();
builder.Services.AddScoped<ISocialAttachmentStorageService, SocialAttachmentStorageService>();
builder.Services.AddScoped<ISocialService, SocialService>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IGameDetailsRepository, GameDetailsRepository>();
builder.Services.AddScoped<IUserPinnedAchievementRepository, UserPinnedAchievementRepository>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<IGameDetailsService, GameDetailsService>();
builder.Services.AddScoped<ILookupRepository, LookupRepository>();
builder.Services.AddScoped<IUserSettingsRepository, UserSettingsRepository>();
builder.Services.AddScoped<IUserProfileMediaStorageService, UserProfileMediaStorageService>();
builder.Services.AddScoped<IUserSettingsService, UserSettingsService>();
builder.Services.AddOptions<ProfileOptions>()
    .BindConfiguration("Profile")
    .Validate(
        o => o.GamesPageSize > 0,
        "Profile: GamesPageSize must be > 0.")
    .Validate(
        o => o.AchievementsPageSize > 0,
        "Profile: AchievementsPageSize must be > 0.")
    .Validate(
        o => o.AchievementsByPointsPageSize > 0,
        "Profile: AchievementsByPointsPageSize must be > 0.")
    .Validate(
        o => o.LatestActivityPageSize > 0 && o.LatestActivityPageSize <= o.MaxLatestActivityPageSize,
        "Profile: LatestActivityPageSize must be > 0 and <= MaxLatestActivityPageSize.")
    .Validate(o => o.MaxLatestActivityPageSize > 0, "Profile: MaxLatestActivityPageSize must be > 0.")
    .Validate(o => o.MaxPinnedAchievements > 0, "Profile: MaxPinnedAchievements must be > 0.")
    .Validate(o => o.PinnedAchievementDisplayOrderStep > 0, "Profile: PinnedAchievementDisplayOrderStep must be > 0.")
    .ValidateOnStart();

builder.Services
    .AddOptions<UserSettingsOptions>()
    .BindConfiguration("UserSettings")
    .Validate(o => o.MaxBioLength > 0, "UserSettings: MaxBioLength must be > 0.")
    .Validate(o => o.MaxSocialLinkValueLength > 0, "UserSettings: MaxSocialLinkValueLength must be > 0.")
    .Validate(o => o.ProfileMediaUpload.MaxImageBytes > 0, "UserSettings:ProfileMediaUpload:MaxImageBytes must be > 0.")
    .Validate(o => o.ProfileMediaUpload.MaxDecodeDimension > 0, "UserSettings:ProfileMediaUpload:MaxDecodeDimension must be > 0.")
    .Validate(o => o.ProfileMediaUpload.ProfileOutputSize > 0, "UserSettings:ProfileMediaUpload:ProfileOutputSize must be > 0.")
    .Validate(o => o.ProfileMediaUpload.BannerOutputWidth > 0, "UserSettings:ProfileMediaUpload:BannerOutputWidth must be > 0.")
    .Validate(o => o.ProfileMediaUpload.BannerOutputHeight > 0, "UserSettings:ProfileMediaUpload:BannerOutputHeight must be > 0.")
    .Validate(
        o => o.ProfileMediaUpload.JpegQuality is >= 1 and <= 100,
        "UserSettings:ProfileMediaUpload:JpegQuality must be between 1 and 100.")
    .Validate(
        o => o.ProfileMediaUpload.AllowedImageMimeTypes is { Length: > 0 },
        "UserSettings:ProfileMediaUpload:AllowedImageMimeTypes must not be empty.")
    .ValidateOnStart();

// Redis
// TODO: Use .Validate() instead of if statements
RedisOptions redisOptions = new RedisOptions();
builder.Configuration.GetSection("Redis").Bind(redisOptions);

if (string.IsNullOrWhiteSpace(redisOptions.ConnectionString))
    throw new InvalidOperationException("Missing config: Redis:ConnectionString");

if (string.IsNullOrWhiteSpace(redisOptions.InstanceName))
    throw new InvalidOperationException("Missing config: Redis:InstanceName");

builder.Services.AddSingleton(redisOptions);

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisOptions.ConnectionString;
    options.InstanceName = redisOptions.InstanceName;
});

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
     ConnectionMultiplexer.Connect(redisOptions.ConnectionString));

builder.Services.AddSingleton<ISteamRateLimiter, RedisSteamRateLimiter>();

builder.Services.AddSingleton(sp =>
     sp.GetRequiredService<IOptions<SteamApiRateLimitOptions>>().Value);

builder.Services
     .AddOptions<SteamApiRateLimitOptions>()
     .BindConfiguration("Steam:RateLimit")
     .Validate(o => o.MinRequestIntervalMs > 0, "Steam:RateLimit:MinRequestIntervalMs must be > 0")
     .Validate(o => o.DailyRequestLimit > 0, "Steam:RateLimit:DailyRequestLimit must be > 0")
     .Validate(o => !string.IsNullOrWhiteSpace(o.RedisKeyPrefix), "Steam:RateLimit:RedisKeyPrefix is required")
     .Validate(o => o.RetryDelayMs > 0, "Steam:RateLimit:RetryDelayMs must be > 0")
     .Validate(o => o.TotalQueueCapacity > 0, "Steam:RateLimit:TotalQueueCapacity must be > 0")
     .Validate(o => o.BackgroundQueueCapacity > 0 && o.BackgroundQueueCapacity <= o.TotalQueueCapacity,
          "Steam:RateLimit:BackgroundQueueCapacity must be > 0 and <= TotalQueueCapacity")
     .Validate(o => o.MaxWaitMs > 0 && o.MaxWaitMs < 10000, "Steam:RateLimit:MaxWaitMs must be < 10000")
     .ValidateOnStart();

builder.Services.AddSingleton<SteamRequestQueue>();
builder.Services.AddSingleton<ISteamRequestQueue>(sp =>
     sp.GetRequiredService<SteamRequestQueue>());
builder.Services.AddHostedService(sp =>
     sp.GetRequiredService<SteamRequestQueue>());

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
     app.UseSwagger();
     app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHub<ChatHub>("/chat");

app.Run();

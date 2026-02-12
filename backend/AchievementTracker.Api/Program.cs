using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.DataAccess.Redis;
using AchievementTracker.Api.DataAccess.Repositories;
using AchievementTracker.Api.Models.Options;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Extensions;
using AchievementTracker.Models.Options;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.Text;
using HeaderNames = Microsoft.Net.Http.Headers.HeaderNames;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Sets up key vault
string keyVaultUri = builder.Configuration["KeyVault:VaultUri"]!;
builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new DefaultAzureCredential());

JwtSettings jwtSettings = new JwtSettings();
builder.Configuration.GetSection("Jwt").Bind(jwtSettings);

AuthSettings authSettings = new AuthSettings();
builder.Configuration.GetSection("Auth").Bind(authSettings);

CorsSettings corsSettings = new CorsSettings();
builder.Configuration.GetSection("Cors").Bind(corsSettings);

string jwtSigningKeyValue = builder.Configuration["Jwt:SigningKey"]!;
SymmetricSecurityKey jwtSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKeyValue));

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(authSettings);
builder.Services.AddSingleton(corsSettings);
builder.Services.AddSingleton(jwtSigningKey);

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
     string steamApiKey = builder.Configuration["Authentication:Steam:ApiKey"]!;
     options.ApplicationKey = steamApiKey;
     options.SignInScheme = authSettings.ExternalScheme;
});

builder.Services.AddAuthorization();

builder.Services.AddScoped<IAuthBusinessLogic, AuthBusinessLogic>();
builder.Services.AddScoped<IRefreshTokenStore, DistributedCacheRefreshTokenStore>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddControllers();
builder.Services.AddDataAccess(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
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

app.MapControllers();

app.Run();

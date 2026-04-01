using AchievementTracker.Api.DataAccess.Interfaces;
using AchievementTracker.Api.DataAccess.Repositories;
using AchievementTracker.Api.Hubs;
using AchievementTracker.Api.Services.BusinessLogic;
using AchievementTracker.Api.Services.Interfaces;
using AchievementTracker.Data.Extensions;
using AchievementTracker.Models.Options;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;
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
builder.Services.AddDistributedMemoryCache();

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

     // SignalR WebSocket connections cannot set Authorization headers, so the token is sent via the access_token query string parameter and forwarded to the bearer handler here
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
     string steamApiKey = builder.Configuration["Authentication:Steam:ApiKey"]!;
     options.ApplicationKey = steamApiKey;
     options.SignInScheme = authSettings.ExternalScheme;
});

builder.Services.AddAuthorization();

// Rate limiting (applied to REST API controllers). ChatHub rates for users are limited internally.
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

builder.Services.AddControllers();
builder.Services.AddDataAccess(builder.Configuration);

builder.Services.AddScoped<IDirectMessageRepository, DirectMessageRepository>();
builder.Services.AddScoped<IDirectMessageService, DirectMessageService>();

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

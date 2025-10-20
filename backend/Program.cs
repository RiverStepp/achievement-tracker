using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AspNet.Security.OpenId.Steam;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Key Vault
var kv = builder.Configuration["KeyVault:VaultUri"]
         ?? throw new InvalidOperationException("Set KeyVault:VaultUri");
builder.Configuration.AddAzureKeyVault(new Uri(kv), new DefaultAzureCredential());

// JWT + Steam config
var jwtKey = builder.Configuration["Jwt:SigningKey"]
            ?? throw new InvalidOperationException("Missing Jwt:SigningKey in Key Vault");
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
var issuer = builder.Configuration["Jwt:Issuer"] ?? "AchievementTracker";
var audience = builder.Configuration["Jwt:Audience"] ?? "AchievementTrackerClients";

builder.Services.AddAuthentication(o =>
{
     o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
     o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
     o.TokenValidationParameters = new TokenValidationParameters
     {
          ValidateIssuer = true,
          ValidIssuer = issuer,
          ValidateAudience = true,
          ValidAudience = audience,
          ValidateIssuerSigningKey = true,
          IssuerSigningKey = key,
          ValidateLifetime = true
     };
})
.AddCookie("External")
.AddSteam(o =>
{
     o.ApplicationKey = builder.Configuration["Authentication:Steam:ApiKey"]
         ?? throw new InvalidOperationException("Missing Authentication:Steam:ApiKey in Key Vault");
     o.SignInScheme = "External";
});

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger(); app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// start login
app.MapGet("/auth/steam/login", (HttpContext ctx) =>
    Results.Challenge(new AuthenticationProperties { RedirectUri = "/auth/steam/callback" },
        [SteamAuthenticationDefaults.AuthenticationScheme]));

// callback → mint JWT
app.MapGet("/auth/steam/callback", async (HttpContext ctx) =>
{
     var res = await ctx.AuthenticateAsync("External");
     if (!res.Succeeded) return Results.Unauthorized();

     var steamId = res.Principal!.FindFirst("urn:steam:id")?.Value
                ?? res.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? "unknown";

     var token = new JwtSecurityToken(
         issuer: issuer, audience: audience,
         claims: new[] { new Claim("steamId", steamId) },
         expires: DateTime.UtcNow.AddHours(1),
         signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

     return Results.Json(new { token = new JwtSecurityTokenHandler().WriteToken(token), steamId });
});

app.MapGet("/me", (ClaimsPrincipal user) =>
    Results.Ok(new { steamId = user.FindFirst("steamId")?.Value ?? "none" })
).RequireAuthorization();

app.Run();

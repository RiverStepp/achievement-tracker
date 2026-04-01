# Database setup

The solution now uses Entity Framework Core 8 with SQL Server. The `AchievementTracker.Data` project owns the `AppDbContext`, entities, and DI helpers, while the API consumes it via `builder.Services.AddDataAccess(builder.Configuration);`.

## Configuration

- Always set `ConnectionStrings:DefaultConnection` via a secure provider (user-secrets for local development, environment variables or managed secret stores for staging/production).
- The values in `appsettings*.json` are intentionally blank so no secrets are committed.
- Standard ASP.NET Core configuration layering applies: `appsettings.json` → `appsettings.{Environment}.json` → user secrets (Development) → environment variables → Azure Key Vault, etc.

## Managing connection strings

```
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=YOUR_SERVER;Database=YOUR_DB;Trusted_Connection=True;Encrypt=True;"
```

Replace the placeholder values with your actual SQL Server details. Never commit the real connection string.

For Staging/Production, configure the same key (`ConnectionStrings:DefaultConnection`) using your platform's secret manager or environment variables instead of user-secrets.

## Working with migrations

Run migrations from the repo root so that the data project is used for the context and the API project provides the host configuration:

```
dotnet ef migrations add <MigrationName> -p AchievementTracker.Data -s AchievementTracker.Api
dotnet ef database update -p AchievementTracker.Data -s AchievementTracker.Api
```

These commands assume the data project is `AchievementTracker.Data` and the API project is `AchievementTracker.Api`; adjust if you rename them.


using AchievementTracker.Data.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AchievementTracker.Data.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDataAccess(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = NormalizeConfiguredValue(
            configuration.GetConnectionString("DefaultConnection"));

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("The 'ConnectionStrings:DefaultConnection' setting is missing. Configure it via user-secrets or environment variables.");
        }

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        return services;
    }

    private static string? NormalizeConfiguredValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        string trimmed = value.Trim();

        if ((trimmed.StartsWith('\'') && trimmed.EndsWith('\'')) ||
            (trimmed.StartsWith('"') && trimmed.EndsWith('"')))
        {
            return trimmed[1..^1];
        }

        return trimmed;
    }
}

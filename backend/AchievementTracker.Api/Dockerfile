FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/AchievementTracker.Api.sln ./backend/
COPY backend/AchievementTracker.Api/AchievementTracker.Api.csproj ./backend/AchievementTracker.Api/
COPY backend/AchievementTracker.Data/AchievementTracker.Data.csproj ./backend/AchievementTracker.Data/
COPY backend/AchievementTracker.Tests/AchievementTracker.Tests.csproj ./backend/AchievementTracker.Tests/

RUN dotnet restore ./backend/AchievementTracker.Api.sln

COPY backend/ ./backend/

RUN dotnet publish ./backend/AchievementTracker.Api/AchievementTracker.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish ./
COPY scripts/package.json ./scripts/package.json
COPY scripts/package-lock.json ./scripts/package-lock.json

WORKDIR /app/scripts
RUN npm ci

COPY scripts/ ./

WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ProfileGatheringScript__ScriptsDirectoryRelativePath=scripts
ENV ProfileGatheringScript__EntryScriptRelativePath=src/testScraper.ts
ENV ProfileGatheringScript__NodeExecutable=node
EXPOSE 8080

ENTRYPOINT ["dotnet", "AchievementTracker.Api.dll"]

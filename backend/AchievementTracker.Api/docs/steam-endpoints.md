# Steam API Endpoints

This document lists all Steam API endpoints that are called by the achievement tracker scraper.

## Endpoints Used

### 1. Resolve Vanity URL
- **Endpoint**: `/ISteamUser/ResolveVanityURL/v0001/`
- **Purpose**: Resolves a Steam username or custom URL to a Steam ID 64-bit
- **Parameters**:
  - `key`: Steam API key
  - `vanityurl`: Username or custom URL
- **Used in**: `SteamApiService.resolveUsername()`

### 2. Get Player Summaries
- **Endpoint**: `/ISteamUser/GetPlayerSummaries/v0002/`
- **Purpose**: Retrieves basic profile information for a Steam user
- **Parameters**:
  - `key`: Steam API key
  - `steamids`: Steam ID (64-bit)
- **Used in**: `SteamApiService.getUserProfile()`

### 3. Get Owned Games
- **Endpoint**: `/IPlayerService/GetOwnedGames/v0001/`
- **Purpose**: Retrieves list of games owned by a Steam user
- **Parameters**:
  - `key`: Steam API key
  - `steamid`: Steam ID (64-bit)
  - `include_appinfo`: Include game details (true)
  - `include_played_free_games`: Include free games (true)
- **Used in**: `SteamApiService.getUserGames()`

### 4. Get Player Achievements
- **Endpoint**: `/ISteamUserStats/GetPlayerAchievements/v0001/`
- **Purpose**: Retrieves achievement progress for a user in a specific game
- **Parameters**:
  - `key`: Steam API key
  - `steamid`: Steam ID (64-bit)
  - `appid`: Steam App ID
- **Used in**: `SteamApiService.getUserAchievements()`

### 5. Get User Stats For Game
- **Endpoint**: `/ISteamUserStats/GetUserStatsForGame/v0002/`
- **Purpose**: Retrieves statistics for a user in a specific game
- **Parameters**:
  - `key`: Steam API key
  - `steamid`: Steam ID (64-bit)
  - `appid`: Steam App ID
- **Used in**: `SteamApiService.getUserStatsForGame()`

### 6. Get Schema For Game
- **Endpoint**: `/ISteamUserStats/GetSchemaForGame/v0002/`
- **Purpose**: Retrieves achievement and stats schema for a game
- **Parameters**:
  - `key`: Steam API key
  - `appid`: Steam App ID
- **Used in**: `SteamApiService.getGameSchema()`
- **Note**: Currently available but not actively used in the scraping flow

## Rate Limiting

- **Rate Limit**: 1 request per second
- **Daily Limit**: 100,000 requests per day
- **Implementation**: `RateLimiter` class in `scripts/src/utils/rateLimiter.ts`

## Tracking

All Steam API calls are tracked and can be monitored via the API:

- **View Stats**: `GET /api/steam-api/stats`
- **View Recent Calls**: `GET /api/steam-api/calls?limit=100`
- **View Endpoint Summaries**: `GET /api/steam-api/endpoints`
- **Clear History**: `DELETE /api/steam-api/history`

## Cancellation

Scraping operations can be cancelled:

- **Cancel All**: `POST /api/scraper/cancel`
- **Cancel Specific**: `POST /api/scraper/cancel?processId={id}`
- **Check Status**: `GET /api/scraper/status`

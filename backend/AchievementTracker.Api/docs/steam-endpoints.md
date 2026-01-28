# Steam API Endpoints

Complete list of Steam API endpoints used by the scraper. All endpoints are defined in `SteamApiService.STEAM_ENDPOINTS`.

## Endpoints

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

## Rate Limiting & Configuration

- **Rate Limit**: 1 request per second (when `IsInvokedThroughApi=0`)
- **Daily Limit**: 100,000 requests per day
- **IsInvokedThroughApi=1**: Script skips rate limiting (API handles it)
- **IsInvokedThroughApi=0**: Script enforces 1 req/sec

## API Endpoints

- `GET /api/steam-api/stats` - View API call statistics
- `GET /api/steam-api/calls` - View recent API calls
- `GET /api/steam-api/endpoints` - View endpoint summaries
- `POST /api/scraper/cancel` - Cancel scraping operations

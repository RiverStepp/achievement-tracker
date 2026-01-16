# Steam Achievement Scraper Scripts

This directory contains Node.js/TypeScript scripts for **development and testing** of the Steam scraper functionality.

**Note:** These scripts are for development/testing only. In production, the scraper functionality will be integrated into the .NET backend API, and users will interact with it through the website (not by running scripts).

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `scripts` directory with the following variables:

```env
# Required: Steam API Key
STEAM_API_KEY=your_steam_api_key_here

# Database Configuration
# Option 1: Individual variables
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=your_password
DB_NAME=AchievementTracker
DB_PORT=1433

# Option 2: Connection string (alternative)
# DB_CONNECTION_STRING=Server=localhost;Database=AchievementTracker;User Id=sa;Password=your_password;

# Optional: Scraper Configuration
MAX_CONCURRENT_REQUESTS=1
REQUEST_DELAY=2000
MAX_RETRIES=3
OUTPUT_FILE=./data/steam_achievements.json
```

**To get a Steam API Key:**
1. Go to https://steamcommunity.com/dev/apikey
2. Log in with your Steam account
3. Register for a new API key
4. Copy the key to your `.env` file

### 3. Database Setup

Ensure your MSSQL database is set up with the schema from `src/database/schema.sql`. The database should be running and accessible with the credentials in your `.env` file.

## Usage

### Run the Main Scraper

Scrape multiple users (configured in `src/index.ts`):

```bash
npm start
```

Or with environment variable for users:

```bash
STEAM_IDS=76561198046029799,76561198046029800 npm start
```

### Test Script (Recommended for Testing)

The test script allows you to scrape a single user and optionally clean up the test data:

```bash
# Scrape a user (keep data in database)
npm run test -- <steamIdOrUsername>

# Scrape a user and then remove all their data
npm run test -- <steamIdOrUsername> --cleanup
```

**Examples:**

```bash
# Test with Steam ID
npm run test -- 76561198046029799

# Test with username
npm run test -- myusername

# Test and cleanup
npm run test -- 76561198046029799 --cleanup
```

## How It Works

1. **User Scraping**: The scraper fetches user profile data from Steam API
2. **Game Discovery**: Retrieves all games owned by the user
3. **Achievement Collection**: For each game, fetches achievement data
4. **Database Storage**: 
   - Saves user information to the `users` table
   - Saves unlocked achievements to the `user_achievements` table
   - Uses `upsert` operations to handle existing data gracefully

## Test Cleanup

The test script includes a cleanup feature that removes all data for a test user:

- Deletes all user achievements from `user_achievements` table
- Deletes the user from `users` table

This is useful for testing without polluting your database with test data.

**Note**: Cleanup only removes user and user_achievement records. Games and achievements in the database are NOT deleted (they are shared data).

## Database Schema

The scraper writes to these tables:

- `users`: User profile information (Steam ID, username, avatar, etc.)
- `user_achievements`: Junction table linking users to their unlocked achievements

The scraper reads from:

- `games`: To match Steam app IDs to database game IDs
- `achievements`: To match Steam achievement API names to database achievement IDs

## Troubleshooting

### Database Connection Issues

- Verify your database server is running
- Check that your `.env` file has correct credentials
- Ensure the database exists and the schema is applied
- For local SQL Server, ensure TCP/IP is enabled

### Steam API Issues

- Verify your Steam API key is valid
- Check rate limits (the scraper includes rate limiting)
- Ensure the Steam profile you're scraping is public (not private)

### TypeScript Compilation Errors

- Run `npm install` to ensure all dependencies are installed
- Check that `tsconfig.json` is properly configured
- Ensure `@types/node` is installed

## Development

### Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist` directory.

### Project Structure

```
scripts/
├── src/
│   ├── database/
│   │   ├── connection.ts      # Database connection setup
│   │   ├── models.ts          # Database service and models
│   │   └── schema.sql         # Database schema
│   ├── services/
│   │   ├── steamScraper.ts    # Main scraper logic
│   │   ├── steamApiService.ts # Steam API client
│   │   └── scraperApi.ts      # API service wrapper
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── dataStorage.ts     # File storage utilities
│   │   └── rateLimiter.ts     # API rate limiting
│   ├── index.ts               # Main entry point
│   └── testScraper.ts         # Test script with cleanup
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- The scraper saves data directly to the database (no file output by default)
- File saving code is commented out but available for debugging if needed
- The scraper respects Steam API rate limits
- Progress is tracked and displayed during scraping
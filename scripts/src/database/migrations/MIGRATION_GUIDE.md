# Database Migration Guide

This guide walks you through migrating your existing database to match `schema.sql`.

## Overview

The migration is broken down into 9 simple, focused steps (with one optional cleanup step). All SQL files now live under `scripts/src/database/migrations/`. Run each step one at a time and verify it completes successfully before moving to the next.

## Prerequisites

1. **BACKUP YOUR DATABASE FIRST!**
2. Make sure you have the `.env` file configured with database connection details
3. Run each step individually and check for errors

## Running a Migration Step

```bash
cd scripts
npm run migrate migrations/migrate-step1-rename-tables.sql
```

The script will automatically resolve the file path from the current directory.

## Migration Steps

### Step 1: Rename Tables to PascalCase
**File:** `migrations/migrate-step1-rename-tables.sql`

Renames all tables from snake_case or lowercase to PascalCase format.
- `games` → `SteamGames`
- `achievements` → `SteamAchievements`
- `users` → `SteamUsers`
- etc.

**Run:**
```bash
npm run migrate migrations/migrate-step1-rename-tables.sql
```

### Step 2: Rename Columns to PascalCase
**File:** `migrations/migrate-step2-rename-columns.sql`

Renames all columns from snake_case to PascalCase format.
- `steam_appid` → `SteamAppId`
- `created_at` → `CreateDate`
- etc.

**Run:**
```bash
npm run migrate migrations/migrate-step2-rename-columns.sql
```

### Step 3: Add Missing Columns and Clean Lookup Tables
**File:** `migrations/migrate-step3-add-columns.sql`

Adds `CreateDate`, `UpdateDate`, and `IsActive` columns to main tables, then removes those columns from lookup tables that shouldn't have them.

**Run:**
```bash
npm run migrate migrations/migrate-step3-add-columns.sql
```

### Step 4: Migrate Data to New Tables
**File:** `migrations/migrate-step4-migrate-data.sql`

Moves price and review data from `SteamGames` to `SteamGamePrices` and `SteamGameReviews`.

**Run:**
```bash
npm run migrate migrations/migrate-step4-migrate-data.sql
```

### Step 5: Remove Redundant Columns and Legacy Tables
**File:** `migrations/migrate-step5-remove-columns.sql`

Removes columns that were moved to other tables (price, original_price, etc. from `SteamGames`) and drops the legacy `SteamCheckedGames` table if it still exists.

**Run:**
```bash
npm run migrate migrations/migrate-step5-remove-columns.sql
```

### Step 6: Update Data Types
**File:** `migrations/migrate-step6-update-types.sql`

Fixes nullability and adds default constraints for required columns.

**Run:**
```bash
npm run migrate migrations/migrate-step6-update-types.sql
```

### Step 7: Update Junction Tables
**File:** `migrations/migrate-step7-junction-tables.sql`

Removes `id` columns from junction tables and adds composite primary keys.

**Run:**
```bash
npm run migrate migrations/migrate-step7-junction-tables.sql
```

### Step 8: Add Constraints
**File:** `migrations/migrate-step8-add-constraints.sql`

Adds UNIQUE and CHECK constraints. This step will show warnings for any constraints that can't be added (e.g., due to duplicate data).

**Run:**
```bash
npm run migrate migrations/migrate-step8-add-constraints.sql
```

### Step 9: Add Indexes
**File:** `migrations/migrate-step9-add-indexes.sql`

Adds indexes for better performance.

**Run:**
```bash
npm run migrate migrations/migrate-step9-add-indexes.sql
```

## Troubleshooting

If a step fails:
1. Check the error message in the terminal
2. The transaction will be rolled back automatically
3. Fix any data issues (duplicates, NULLs, etc.)
4. Re-run the step

### Helper / Documentation Scripts

The following SQL scripts live in `scripts/src/database/migrations/` and are **not** part of the main numbered migration. They are kept for documentation, one-off maintenance, or backwards-compatibility:

- **`diag-achievement-stats.sql`**: Shows structure, constraints, and sample data for `SteamAchievementStats`.
- **`add-originalcurrencycode-column.sql`**: Adds `OriginalCurrencyCode` to `SteamGamePrices` if it is missing (for very old databases).
- **`clean-duplicates-for-constraints.sql`**: Deletes duplicate rows in key tables to make UNIQUE constraints easier to add.
- **`fix-check-violations.sql`**: Normalizes out-of-range values for discount, Metacritic score, and achievement percentage so CHECK constraints can be added.

## Verifying Migration

After completing all steps, verify your database matches `schema.sql`:
- All tables should be PascalCase
- All columns should be PascalCase
- Required columns should exist
- Constraints should be in place

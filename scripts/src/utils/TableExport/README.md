# Steam Table Export

Exports selected Steam tables from SQL Server to one CSV file per table.

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

## Database configuration

This script follows existing script conventions:

1. Azure Key Vault (if `KEY_VAULT_URI` or `AZURE_KEY_VAULT_URI` is set), secret name `ConnectionStrings--DefaultConnection`
2. `DB_CONNECTION_STRING`
3. Individual DB variables from environment or `.env`:
   - `DB_SERVER` or `DB_HOST`
   - `DB_NAME` or `DB_DATABASE`
   - `DB_USER` or `DB_USERNAME`
   - `DB_PASSWORD`
   - optional `DB_PORT` (default `1433`)

Optional:

- `DB_SCHEMA` (default: `dbo`)
- `EXPORT_OUTPUT_DIR` (default: `./output` inside this folder)

## Run

```bash
python export-steam-tables.py
```

CSV files are written to the configured output directory with names matching each table (for example `SteamGames.csv`).

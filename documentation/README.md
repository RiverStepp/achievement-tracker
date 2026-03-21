# Data Transfer

Runs from the `scripts/` package (shared with other scripts). Install dependencies once there, then use `npm run transfer`.

## Run

```bash
cd scripts
npm install
npm run transfer -- --help
```

### Required (CLI and or environment)

| Setting     | CLI                          | Environment                                                       |
|-------------|------------------------------|-------------------------------------------------------------------|
| Schema SQL  | `--schema <path>`            | `SCHEMA_SQL_PATH`                                                 |
| Source DB   | `--source "<connectionString>"` | `SOURCE_MSSQL_CONNECTION_STRING` or `MSSQL_SOURCE`               |
| Target DB   | `--target "<connectionString>"` | `TARGET_MSSQL_CONNECTION_STRING` or `MSSQL_TARGET`               |

### Optional

| Setting               | CLI                                         | Environment                  |
|----------------------|---------------------------------------------|------------------------------|
| Batch size           | `--batch-size <n>` (1 to 5000, default 1000) | `DATA_TRANSFER_BATCH_SIZE`   |
| Request timeout (ms) | `--timeout-ms <n>` (min 1000, default 300000) | `DATA_TRANSFER_TIMEOUT_MS`  |

## Example (PowerShell)

Avoids quoting issues with `;` in connection strings:

```powershell
cd path\to\repo\scripts
$env:SCHEMA_SQL_PATH = "path\to\schema.sql"
$env:SOURCE_MSSQL_CONNECTION_STRING = "Server=...;Database=...;Trusted_Connection=True;..."
$env:TARGET_MSSQL_CONNECTION_STRING = "Server=...;Database=...;Trusted_Connection=True;..."
npm run transfer
```

## Typecheck (optional)

```bash
npm run typecheck
```

## Authentication

- Local Windows (Trusted Connection or Integrated Security)  
  On Windows, the tool selects `msnodesqlv8` automatically so `Trusted_Connection=True` or `Integrated Security` behaves like ODBC or .NET.  
  `msnodesqlv8` is listed under `optionalDependencies` in `scripts/package.json`. Install may require Visual Studio Build Tools or node-gyp if the native addon does not prebuild for your Node version.

- Azure SQL, Linux, or CI  
  Use a connection string without integrated auth, typically User Id plus Password. The tool uses Tedious (default `mssql` driver).  
  Example:  
  `Server=tcp:yourserver.database.windows.net,1433;Database=...;User Id=...;Password=...;Encrypt=True;TrustServerCertificate=False`

- Overrides  
  - `DATA_TRANSFER_SQL_DRIVER=tedious` always uses Tedious  
  - `DATA_TRANSFER_SQL_DRIVER=msnodesqlv8` or `native` or `v8` always uses the native driver on Windows

The `mssql` connection string parser does not set `trustedConnection` for `Trusted_Connection=True`. This tool sets `options.trustedConnection` when needed and, for `msnodesqlv8`, defaults the ODBC driver to `ODBC Driver 17 for SQL Server`. Override with `DATA_TRANSFER_ODBC_DRIVER`, for example `ODBC Driver 18 for SQL Server`.

Mixed setups are supported, for example Windows integrated source plus SQL auth Azure target.

## Columns

Source and target are matched by column name, with compatible metadata. Physical column order does not matter. Copy uses a deterministic sorted by name column list for reads and writes.
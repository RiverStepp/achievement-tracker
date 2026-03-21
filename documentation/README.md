# Data transfer

## Authentication

- **Local Windows (Trusted Connection / Integrated Security)**  
  On Windows, the tool loads **msnodesqlv8** automatically so `Trusted_Connection=True` works like ODBC/.NET.  
  Requires `msnodesqlv8` (optional dependency; install may need Visual Studio Build Tools).

- **Azure SQL / Linux / CI**  
  Use **SQL authentication** (or any string **without** `Trusted_Connection` / `Integrated Security`): the tool uses **Tedious** (`mssql` default).  
  Example: `Server=tcp:yourserver.database.windows.net,1433;Database=...;User Id=...;Password=...;Encrypt=True;TrustServerCertificate=False`

- **Override**  
  `DATA_TRANSFER_SQL_DRIVER=tedious` — always Tedious.  
  `DATA_TRANSFER_SQL_DRIVER=msnodesqlv8` — always native (Windows).

`mssql`’s connection-string parser does not set `trustedConnection` for `Trusted_Connection=True`. This tool sets `options.trustedConnection` and uses **ODBC Driver 17** (override with `DATA_TRANSFER_ODBC_DRIVER`) when using **msnodesqlv8**.

Mixed setups are supported (e.g. Windows auth source + Azure SQL target).

## Columns

Source and target are matched **by column name** (same names and compatible types). Physical column order in the table does not matter; `SELECT`/`INSERT` use a deterministic **sorted-by-name** column list.

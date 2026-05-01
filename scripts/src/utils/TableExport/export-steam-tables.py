#!/usr/bin/env python3
import csv
import os
import re
import sys
from pathlib import Path
from typing import Iterable, List, Optional, Set, Tuple

import pyodbc
from dotenv import load_dotenv

SCRIPTS_ROOT = Path(__file__).resolve().parents[3]
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_FILE_PATH = SCRIPTS_ROOT / ".env"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "output"
SQL_SERVER_DRIVER = "ODBC Driver 17 for SQL Server"
KEY_VAULT_SECRET_NAME = "ConnectionStrings--DefaultConnection"
IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
FETCH_BATCH_SIZE = 1000
DEFAULT_DB_SCHEMA = "dbo"

GLOBAL_EXCLUDED_COLUMNS = {"IsActive", "CreateDate", "UpdateDate"}
TABLE_EXCLUDED_COLUMNS = {
    "SteamAchievements": {
        "IsUnobtainable",
        "IsBuggy",
        "IsConditionallyObtainable",
        "IsMultiplayer",
        "IsMissable",
        "IsGrind",
        "IsRandom",
        "IsDateSpecific",
        "IsViral",
        "IsDLC",
        "IsWorldRecord",
        "DescriptionSource",
    }
}

TABLES_TO_EXPORT = (
    "SteamAchievements",
    "SteamAchievementStats",
    "SteamCategories",
    "SteamDevelopers",
    "SteamGameCategories",
    "SteamGameDevelopers",
    "SteamGameGenres",
    "SteamGameLanguages",
    "SteamGamePlatforms",
    "SteamGamePrices",
    "SteamGamePublishers",
    "SteamGameReviews",
    "SteamGames",
    "SteamGenres",
    "SteamLanguages",
    "SteamPublishers",
    "SteamTags",
    "SteamGameTags",
)


def load_from_azure_key_vault() -> Optional[str]:
    key_vault_uri = os.getenv("KEY_VAULT_URI") or os.getenv("AZURE_KEY_VAULT_URI")
    if not key_vault_uri:
        return None

    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient

        print(f"Loading DB connection string from Azure Key Vault: {key_vault_uri}")
        credential = DefaultAzureCredential()
        client = SecretClient(vault_url=key_vault_uri, credential=credential)
        secret = client.get_secret(KEY_VAULT_SECRET_NAME)
        if secret and secret.value:
            print("Loaded DB connection string from Azure Key Vault")
            return secret.value

        print("WARNING: Key Vault secret exists but is empty")
        return None
    except ImportError:
        print("WARNING: Azure SDK dependencies not installed; using environment configuration")
        return None
    except Exception as exc:
        print(f"WARNING: Failed to load Key Vault secret: {exc}")
        return None


def get_db_connection_string() -> str:
    key_vault_connection_string = load_from_azure_key_vault()
    if key_vault_connection_string:
        return key_vault_connection_string

    direct_connection_string = os.getenv("DB_CONNECTION_STRING")
    if direct_connection_string:
        return direct_connection_string

    db_user = os.getenv("DB_USER") or os.getenv("DB_USERNAME")
    db_password = os.getenv("DB_PASSWORD")
    db_server = os.getenv("DB_SERVER") or os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME") or os.getenv("DB_DATABASE")
    db_port = os.getenv("DB_PORT", "1433")

    required_values = {
        "DB_USER or DB_USERNAME": db_user,
        "DB_PASSWORD": db_password,
        "DB_SERVER or DB_HOST": db_server,
        "DB_NAME or DB_DATABASE": db_name,
    }
    missing = [name for name, value in required_values.items() if not value]
    if missing:
        raise ValueError(f"Missing required database settings: {', '.join(missing)}")

    return (
        f"DRIVER={{{SQL_SERVER_DRIVER}}};"
        f"SERVER={db_server},{db_port};"
        f"DATABASE={db_name};"
        f"UID={db_user};"
        f"PWD={db_password};"
    )


def quote_identifier(identifier: str) -> str:
    if not IDENTIFIER_PATTERN.fullmatch(identifier):
        raise ValueError(f"Unsafe SQL identifier: {identifier}")
    return f"[{identifier}]"


def get_table_columns(connection: pyodbc.Connection, schema_name: str, table_name: str) -> List[str]:
    query = """
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
    """
    cursor = connection.cursor()
    rows = cursor.execute(query, (schema_name, table_name)).fetchall()
    cursor.close()
    return [row[0] for row in rows]


def get_excluded_columns(table_name: str) -> Set[str]:
    return GLOBAL_EXCLUDED_COLUMNS | TABLE_EXCLUDED_COLUMNS.get(table_name, set())


def get_selected_columns(all_columns: Iterable[str], excluded_columns: Set[str]) -> List[str]:
    return [column for column in all_columns if column not in excluded_columns]


def export_table(
    connection: pyodbc.Connection,
    schema_name: str,
    table_name: str,
    output_directory: Path,
) -> Tuple[int, int]:
    all_columns = get_table_columns(connection, schema_name, table_name)
    if not all_columns:
        raise RuntimeError(f"No columns found for table {schema_name}.{table_name}")

    excluded_columns = get_excluded_columns(table_name)
    selected_columns = get_selected_columns(all_columns, excluded_columns)
    if not selected_columns:
        raise RuntimeError(f"All columns were excluded for table {schema_name}.{table_name}")

    quoted_schema = quote_identifier(schema_name)
    quoted_table = quote_identifier(table_name)
    quoted_columns = ", ".join(quote_identifier(column) for column in selected_columns)
    query = f"SELECT {quoted_columns} FROM {quoted_schema}.{quoted_table}"

    output_path = output_directory / f"{table_name}.csv"
    row_count = 0
    cursor = connection.cursor()
    cursor.execute(query)

    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(selected_columns)
        while True:
            rows = cursor.fetchmany(FETCH_BATCH_SIZE)
            if not rows:
                break
            writer.writerows(rows)
            row_count += len(rows)

    cursor.close()
    excluded_present = len([column for column in all_columns if column in excluded_columns])
    return row_count, excluded_present


def main() -> int:
    load_dotenv(ENV_FILE_PATH)
    load_dotenv()

    schema_name = os.getenv("DB_SCHEMA", DEFAULT_DB_SCHEMA)
    output_directory = Path(os.getenv("EXPORT_OUTPUT_DIR", str(DEFAULT_OUTPUT_DIR))).resolve()
    output_directory.mkdir(parents=True, exist_ok=True)

    print("Exporting Steam tables to CSV")
    print(f"Schema: {schema_name}")
    print(f"Output directory: {output_directory}")

    try:
        connection_string = get_db_connection_string()
        connection = pyodbc.connect(connection_string)
    except Exception as exc:
        print(f"ERROR: Could not connect to database: {exc}")
        return 1

    total_success = 0
    total_failures = 0
    try:
        for table_name in TABLES_TO_EXPORT:
            print(f"\nExporting {table_name}...")
            try:
                row_count, excluded_present = export_table(
                    connection=connection,
                    schema_name=schema_name,
                    table_name=table_name,
                    output_directory=output_directory,
                )
                print(
                    f"Exported {table_name}: {row_count} rows, "
                    f"{excluded_present} excluded column(s) applied"
                )
                total_success += 1
            except Exception as exc:
                print(f"ERROR: Failed to export {table_name}: {exc}")
                total_failures += 1
    finally:
        connection.close()

    print("\nExport complete")
    print(f"Successful tables: {total_success}")
    print(f"Failed tables: {total_failures}")

    return 0 if total_failures == 0 else 2


if __name__ == "__main__":
    sys.exit(main())

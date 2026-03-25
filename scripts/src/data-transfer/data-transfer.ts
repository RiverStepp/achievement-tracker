import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { config as MssqlPoolConfig, ConnectionPool } from 'mssql';
import type { DataTransferConfig, ParsedSchema, InformationSchemaColumnRow } from './types';
import {
  connectionStringUsesIntegratedAuth,
  loadMssqlModule,
  type MssqlDriverVariant,
  type MssqlModule,
} from './sql-module';

function log(message: string): void {
  console.error(`[data-transfer] ${message}`);
}

function redactConnectionString(connectionString: string): string {
  return connectionString.replace(/\b(?:Password|Pwd)\s*=\s*[^;]+/gi, (match) => {
    const key = match.split('=')[0];
    return `${key}=***`;
  });
}

function findMatchingCloseParen(source: string, openParenIndex: number): number {
  let depth = 0;
  for (let i = openParenIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Unbalanced parentheses in schema SQL near offset ${openParenIndex}.`);
}

export function parseSchemaSql(sqlText: string): ParsedSchema {
  const marker = /CREATE\s+TABLE\s+\[dbo\]\.\[([^\]]+)\]\s*\(/gi;
  const tablesInFileOrder: string[] = [];
  const fkEdges: { referenced: string; dependent: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = marker.exec(sqlText)) !== null) {
    const tableName = match[1];
    tablesInFileOrder.push(tableName);
    const openParenIndex = match.index + match[0].length - 1;
    const closeParenIndex = findMatchingCloseParen(sqlText, openParenIndex);
    const body = sqlText.slice(openParenIndex + 1, closeParenIndex);
    const refPattern = /REFERENCES\s+\[dbo\]\.\[([^\]]+)\]/gi;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refPattern.exec(body)) !== null) {
      fkEdges.push({ referenced: refMatch[1], dependent: tableName });
    }
  }
  if (tablesInFileOrder.length === 0) {
    throw new Error('No CREATE TABLE [dbo].[...] blocks found in the schema SQL file.');
  }
  return { tablesInFileOrder, fkEdges };
}

function topologicalCopyOrder(
  tables: readonly string[],
  edges: readonly { referenced: string; dependent: string }[],
): string[] {
  const tableSet = new Set(tables);
  for (const edge of edges) {
    if (!tableSet.has(edge.referenced)) {
      throw new Error(`Schema parse: FOREIGN KEY references undefined table "${edge.referenced}".`);
    }
    if (!tableSet.has(edge.dependent)) {
      throw new Error(`Schema parse: FOREIGN KEY from undefined table "${edge.dependent}".`);
    }
  }
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  for (const t of tables) {
    incoming.set(t, new Set());
    outgoing.set(t, new Set());
  }
  for (const { referenced, dependent } of edges) {
    outgoing.get(referenced)!.add(dependent);
    incoming.get(dependent)!.add(referenced);
  }
  const ready: string[] = [];
  for (const t of tables) {
    if (incoming.get(t)!.size === 0) ready.push(t);
  }
  ready.sort((a, b) => a.localeCompare(b));
  const ordered: string[] = [];
  while (ready.length > 0) {
    const next = ready.shift()!;
    ordered.push(next);
    const dependents = [...outgoing.get(next)!].sort((a, b) => a.localeCompare(b));
    for (const dep of dependents) {
      incoming.get(dep)!.delete(next);
    }
    for (const dep of dependents) {
      if (incoming.get(dep)!.size === 0) ready.push(dep);
    }
    ready.sort((a, b) => a.localeCompare(b));
    outgoing.set(next, new Set());
  }
  if (ordered.length !== tables.length) {
    throw new Error('Foreign keys among schema tables form a cycle; cannot compute a safe copy order.');
  }
  return ordered;
}

function printHelp(): void {
  log('Usage: npm run transfer -- [options]');
  log('Required: --schema <path> | SCHEMA_SQL_PATH');
  log('Required: --source <connectionString> | SOURCE_MSSQL_CONNECTION_STRING');
  log('Required: --target <connectionString> | TARGET_MSSQL_CONNECTION_STRING');
  log('Optional: --batch-size <n>  (default 1000, max 5000)');
  log('Optional: --timeout-ms <n>  (default 300000 per request)');
  log('Optional env: DATA_TRANSFER_SQL_DRIVER=auto|tedious|msnodesqlv8 (default auto)');
  log('Optional env: DATA_TRANSFER_ODBC_DRIVER (msnodesqlv8 only; default "ODBC Driver 17 for SQL Server")');
}

function loadConfig(argv: string[]): DataTransferConfig {
  let schemaSqlPath = process.env.SCHEMA_SQL_PATH?.trim() ?? '';
  let sourceConnectionString =
    process.env.SOURCE_MSSQL_CONNECTION_STRING?.trim() ?? process.env.MSSQL_SOURCE?.trim() ?? '';
  let targetConnectionString =
    process.env.TARGET_MSSQL_CONNECTION_STRING?.trim() ?? process.env.MSSQL_TARGET?.trim() ?? '';
  let batchSize = Number.parseInt(process.env.DATA_TRANSFER_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE), 10);
  let requestTimeoutMs = Number.parseInt(process.env.DATA_TRANSFER_TIMEOUT_MS ?? '300000', 10);

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--schema') {
      const v = argv[++i];
      if (!v) throw new Error('--schema requires a path.');
      schemaSqlPath = v;
      continue;
    }
    if (arg === '--source') {
      const v = argv[++i];
      if (!v) throw new Error('--source requires a connection string.');
      sourceConnectionString = v;
      continue;
    }
    if (arg === '--target') {
      const v = argv[++i];
      if (!v) throw new Error('--target requires a connection string.');
      targetConnectionString = v;
      continue;
    }
    if (arg === '--batch-size') {
      const v = argv[++i];
      if (!v) throw new Error('--batch-size requires a number.');
      batchSize = Number.parseInt(v, 10);
      continue;
    }
    if (arg === '--timeout-ms') {
      const v = argv[++i];
      if (!v) throw new Error('--timeout-ms requires a number.');
      requestTimeoutMs = Number.parseInt(v, 10);
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  const problems: string[] = [];
  if (!schemaSqlPath) problems.push('Set SCHEMA_SQL_PATH or pass --schema <path>.');
  if (!sourceConnectionString) problems.push('Set SOURCE_MSSQL_CONNECTION_STRING or pass --source <connectionString>.');
  if (!targetConnectionString) problems.push('Set TARGET_MSSQL_CONNECTION_STRING or pass --target <connectionString>.');
  if (!Number.isFinite(batchSize) || batchSize < 1 || batchSize > 5000) {
    problems.push('batch-size must be between 1 and 5000.');
  }
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs < 1000) {
    problems.push('timeout-ms must be at least 1000.');
  }
  if (problems.length > 0) throw new Error(problems.join(' '));

  return {
    schemaSqlPath: path.resolve(schemaSqlPath),
    sourceConnectionString,
    targetConnectionString,
    batchSize,
    requestTimeoutMs,
  };
}

async function openPool(
  sqlMod: MssqlModule,
  label: string,
  connectionString: string,
  requestTimeoutMs: number,
  driverVariant: MssqlDriverVariant,
): Promise<ConnectionPool> {
  const parsed = sqlMod.ConnectionPool.parseConnectionString(connectionString) as MssqlPoolConfig & {
    connectionString?: string;
  };
  const integrated = connectionStringUsesIntegratedAuth(connectionString);
  const options = { ...parsed.options };
  if (driverVariant === 'msnodesqlv8' && integrated) {
    options.trustedConnection = true;
  }
  const cfg: MssqlPoolConfig & { driver?: string; connectionString?: string } = {
    ...parsed,
    requestTimeout: requestTimeoutMs,
    options,
  };
  if (driverVariant === 'msnodesqlv8') {
    cfg.driver = process.env.DATA_TRANSFER_ODBC_DRIVER?.trim() || 'ODBC Driver 17 for SQL Server';
    if (integrated) {
      delete cfg.user;
      delete cfg.password;
    }
  }
  delete cfg.connectionString;
  const pool = new sqlMod.ConnectionPool(cfg);
  try {
    await pool.connect();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to connect to ${label}: ${message}`);
  }
  return pool;
}

async function assertTablesExist(
  pool: ConnectionPool,
  sqlMod: MssqlModule,
  tableNames: readonly string[],
  label: string,
): Promise<void> {
  const request = pool.request();
  tableNames.forEach((name, index) => {
    request.input(`n${index}`, sqlMod.NVarChar(256), name);
  });
  const placeholders = tableNames.map((_, index) => `@n${index}`).join(', ');
  const result = await request.query(`
    SELECT t.name
    FROM sys.tables AS t
    WHERE t.schema_id = SCHEMA_ID(N'dbo') AND t.name IN (${placeholders})
  `);
  const found = new Set((result.recordset as { name: string }[]).map((row) => row.name));
  const missing = tableNames.filter((name) => !found.has(name));
  if (missing.length > 0) {
    throw new Error(`${label} is missing required tables: ${missing.join(', ')}`);
  }
}

async function loadInformationSchemaColumns(
  pool: ConnectionPool,
  sqlMod: MssqlModule,
  tableName: string,
): Promise<InformationSchemaColumnRow[]> {
  const result = await pool
    .request()
    .input('table', sqlMod.NVarChar(256), tableName)
    .query(
      `
      SELECT
        COLUMN_NAME,
        ORDINAL_POSITION,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE,
        DATETIME_PRECISION
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = N'dbo' AND TABLE_NAME = @table
      ORDER BY ORDINAL_POSITION
    `,
    );
  return result.recordset as InformationSchemaColumnRow[];
}

function columnsByName(rows: InformationSchemaColumnRow[]): Map<string, InformationSchemaColumnRow> {
  const map = new Map<string, InformationSchemaColumnRow>();
  for (const row of rows) {
    if (map.has(row.COLUMN_NAME)) {
      throw new Error(`Duplicate column name "${row.COLUMN_NAME}" in metadata.`);
    }
    map.set(row.COLUMN_NAME, row);
  }
  return map;
}

function assertSameColumnMetadata(
  tableName: string,
  columnName: string,
  source: InformationSchemaColumnRow,
  target: InformationSchemaColumnRow,
): void {
  if (source.DATA_TYPE !== target.DATA_TYPE) {
    throw new Error(
      `[dbo].[${tableName}] column "${columnName}": type mismatch source ${source.DATA_TYPE} vs target ${target.DATA_TYPE}.`,
    );
  }
  if (source.IS_NULLABLE !== target.IS_NULLABLE) {
    throw new Error(
      `[dbo].[${tableName}] column "${columnName}": NULLability mismatch source ${source.IS_NULLABLE} vs target ${target.IS_NULLABLE}.`,
    );
  }
  if (source.CHARACTER_MAXIMUM_LENGTH !== target.CHARACTER_MAXIMUM_LENGTH) {
    throw new Error(
      `[dbo].[${tableName}] column "${columnName}": max length mismatch source ${source.CHARACTER_MAXIMUM_LENGTH} vs target ${target.CHARACTER_MAXIMUM_LENGTH}.`,
    );
  }
  if (source.NUMERIC_PRECISION !== target.NUMERIC_PRECISION || source.NUMERIC_SCALE !== target.NUMERIC_SCALE) {
    throw new Error(`[dbo].[${tableName}] column "${columnName}": numeric precision/scale mismatch.`);
  }
  if (source.DATETIME_PRECISION !== target.DATETIME_PRECISION) {
    throw new Error(
      `[dbo].[${tableName}] column "${columnName}": date/time precision mismatch source ${source.DATETIME_PRECISION} vs target ${target.DATETIME_PRECISION}.`,
    );
  }
}

function assertCompatibleColumnsByName(
  tableName: string,
  sourceCols: InformationSchemaColumnRow[],
  targetCols: InformationSchemaColumnRow[],
): string[] {
  const sourceMap = columnsByName(sourceCols);
  const targetMap = columnsByName(targetCols);
  const sourceNames = new Set(sourceMap.keys());
  const targetNames = new Set(targetMap.keys());
  const onlySource = [...sourceNames].filter((n) => !targetNames.has(n));
  const onlyTarget = [...targetNames].filter((n) => !sourceNames.has(n));
  if (onlySource.length > 0 || onlyTarget.length > 0) {
    const parts: string[] = [];
    if (onlySource.length > 0) parts.push(`only on source: ${onlySource.sort().join(', ')}`);
    if (onlyTarget.length > 0) parts.push(`only on target: ${onlyTarget.sort().join(', ')}`);
    throw new Error(`[dbo].[${tableName}] column set mismatch (${parts.join('; ')}).`);
  }
  const ordered = [...sourceNames].sort((a, b) => a.localeCompare(b));
  for (const name of ordered) {
    assertSameColumnMetadata(tableName, name, sourceMap.get(name)!, targetMap.get(name)!);
  }
  return ordered;
}

const DEFAULT_BATCH_SIZE = 1000;

function toSqlType(row: InformationSchemaColumnRow, sqlMod: MssqlModule) {
  const dataType = row.DATA_TYPE.toLowerCase();
  switch (dataType) {
    case 'bigint':
      return sqlMod.BigInt;
    case 'int':
      return sqlMod.Int;
    case 'smallint':
      return sqlMod.SmallInt;
    case 'tinyint':
      return sqlMod.TinyInt;
    case 'bit':
      return sqlMod.Bit;
    case 'decimal':
    case 'numeric': {
      const precision = row.NUMERIC_PRECISION ?? 18;
      const scale = row.NUMERIC_SCALE ?? 0;
      return sqlMod.Decimal(precision, scale);
    }
    case 'money':
      return sqlMod.Decimal(19, 4);
    case 'smallmoney':
      return sqlMod.Decimal(10, 4);
    case 'float':
      return sqlMod.Float;
    case 'real':
      return sqlMod.Real;
    case 'datetime2': {
      const scale = row.DATETIME_PRECISION ?? 7;
      return sqlMod.DateTime2(scale);
    }
    case 'datetimeoffset': {
      const scale = row.DATETIME_PRECISION ?? 7;
      return sqlMod.DateTimeOffset(scale);
    }
    case 'datetime':
      return sqlMod.DateTime;
    case 'smalldatetime':
      return sqlMod.SmallDateTime;
    case 'date':
      return sqlMod.Date;
    case 'time': {
      const scale = row.DATETIME_PRECISION ?? 7;
      return sqlMod.Time(scale);
    }
    case 'uniqueidentifier':
      return sqlMod.UniqueIdentifier;
    case 'nvarchar':
    case 'nchar': {
      const len = row.CHARACTER_MAXIMUM_LENGTH;
      if (len === null || len === -1) return sqlMod.NVarChar(sqlMod.MAX);
      return sqlMod.NVarChar(len);
    }
    case 'varchar':
    case 'char': {
      const len = row.CHARACTER_MAXIMUM_LENGTH;
      if (len === null || len === -1) return sqlMod.VarChar(sqlMod.MAX);
      return sqlMod.VarChar(len);
    }
    case 'varbinary':
    case 'binary': {
      const len = row.CHARACTER_MAXIMUM_LENGTH;
      if (len === null || len === -1) return sqlMod.VarBinary(sqlMod.MAX);
      return sqlMod.VarBinary(len);
    }
    default:
      throw new Error(
        `Unsupported or unmapped SQL type "${row.DATA_TYPE}" on column ${row.COLUMN_NAME}. Extend the type mapper.`,
      );
  }
}

async function tableHasIdentityColumn(pool: ConnectionPool, sqlMod: MssqlModule, tableName: string): Promise<boolean> {
  const result = await pool
    .request()
    .input('table', sqlMod.NVarChar(256), tableName)
    .query(
      `
      SELECT COUNT_BIG(*) AS c
      FROM sys.identity_columns AS ic
      INNER JOIN sys.tables AS t ON ic.object_id = t.object_id
      INNER JOIN sys.schemas AS s ON t.schema_id = s.schema_id
      WHERE s.name = N'dbo' AND t.name = @table
    `,
    );
  return Number((result.recordset as { c: string | number }[])[0].c) > 0;
}

async function getPrimaryKeyColumnNames(pool: ConnectionPool, sqlMod: MssqlModule, tableName: string): Promise<string[]> {
  const result = await pool
    .request()
    .input('table', sqlMod.NVarChar(256), tableName)
    .query(
      `
      SELECT c.name
      FROM sys.tables AS t
      INNER JOIN sys.schemas AS s ON t.schema_id = s.schema_id
      INNER JOIN sys.key_constraints AS k ON t.object_id = k.parent_object_id AND k.type = N'PK'
      INNER JOIN sys.index_columns AS ic
        ON k.parent_object_id = ic.object_id AND k.unique_index_id = ic.index_id
      INNER JOIN sys.columns AS c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE s.name = N'dbo' AND t.name = @table
      ORDER BY ic.key_ordinal
    `,
    );
  const names = (result.recordset as { name: string }[]).map((row) => row.name);
  if (names.length === 0) {
    throw new Error(`Table [dbo].[${tableName}] has no primary key; cannot build a deterministic read order.`);
  }
  return names;
}

function bracketIdent(name: string): string {
  return `[${name.replace(/]/g, ']]')}]`;
}

async function insertBatchOnTarget(
  targetPool: ConnectionPool,
  targetSqlMod: MssqlModule,
  tableName: string,
  columnNames: string[],
  sqlTypes: ReturnType<typeof toSqlType>[],
  rows: unknown[][],
  hasIdentity: boolean,
): Promise<void> {
  if (rows.length === 0) return;
  const tableSql = `${bracketIdent('dbo')}.${bracketIdent(tableName)}`;
  if (hasIdentity) {
    const tempName = `#dt_${tableName.replace(/[^a-zA-Z0-9_]/g, '_')}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const transaction = new targetSqlMod.Transaction(targetPool);
    await transaction.begin();
    try {
      const stage = new targetSqlMod.Table(tempName);
      stage.create = true;
      for (let i = 0; i < columnNames.length; i++) {
        stage.columns.add(columnNames[i], sqlTypes[i], { nullable: true });
      }
      for (const row of rows) {
        stage.rows.add(
          ...(row.map((value) => (value === undefined ? null : value)) as Array<
            string | number | boolean | Date | Buffer | null | undefined
          >),
        );
      }
      await new targetSqlMod.Request(transaction).bulk(stage, { keepNulls: true } as never);
      const columnList = columnNames.map((c) => bracketIdent(c)).join(', ');
      await new targetSqlMod.Request(transaction).query(
        `SET IDENTITY_INSERT ${tableSql} ON;
INSERT INTO ${tableSql} (${columnList})
SELECT ${columnList}
FROM ${bracketIdent(tempName)};
SET IDENTITY_INSERT ${tableSql} OFF;`,
      );
      await transaction.commit();
    } catch (error) {
      try {
        await new targetSqlMod.Request(transaction).query(`SET IDENTITY_INSERT ${tableSql} OFF`);
      } catch {
        // ignore best-effort cleanup
      }
      await transaction.rollback();
      throw error;
    }
    return;
  }
  const table = new targetSqlMod.Table(tableSql);
  table.create = false;
  for (let i = 0; i < columnNames.length; i++) {
    table.columns.add(columnNames[i], sqlTypes[i], { nullable: true });
  }
  for (const row of rows) {
    table.rows.add(
      ...(row.map((value) => (value === undefined ? null : value)) as Array<
        string | number | boolean | Date | Buffer | null | undefined
      >),
    );
  }
  await targetPool.request().bulk(table, { keepNulls: true } as never);
}

async function copySingleTable(
  sourcePool: ConnectionPool,
  targetPool: ConnectionPool,
  sourceSqlMod: MssqlModule,
  targetSqlMod: MssqlModule,
  tableName: string,
  batchSize: number,
): Promise<void> {
  const sourceColRows = await loadInformationSchemaColumns(sourcePool, sourceSqlMod, tableName);
  const targetColRows = await loadInformationSchemaColumns(targetPool, targetSqlMod, tableName);
  const columnNames = assertCompatibleColumnsByName(tableName, sourceColRows, targetColRows);
  const targetByName = columnsByName(targetColRows);
  const sqlTypes = columnNames.map((name) => toSqlType(targetByName.get(name)!, targetSqlMod));
  const hasIdentity = await tableHasIdentityColumn(targetPool, targetSqlMod, tableName);
  const effectiveBatchSize = batchSize;
  const pkColumns = await getPrimaryKeyColumnNames(sourcePool, sourceSqlMod, tableName);
  const targetPk = await getPrimaryKeyColumnNames(targetPool, targetSqlMod, tableName);
  const pkSig = (cols: string[]) => [...cols].sort((a, b) => a.localeCompare(b)).join('|');
  if (pkSig(pkColumns) !== pkSig(targetPk)) {
    throw new Error(
      `Primary key columns differ for [dbo].[${tableName}]: source (${pkColumns.join(', ')}) vs target (${targetPk.join(', ')}).`,
    );
  }

  const countResult = await sourcePool.request().query(
    `SELECT COUNT_BIG(1) AS c FROM ${bracketIdent('dbo')}.${bracketIdent(tableName)}`,
  );
  const totalRows = Number((countResult.recordset as { c: string | number }[])[0].c);
  log(`Table ${tableName}: ${totalRows} row(s) on source`);

  if (totalRows === 0) {
    log(`Table ${tableName}: nothing to insert`);
    return;
  }

  const selectList = columnNames.map((c) => bracketIdent(c)).join(', ');
  const orderBy = pkColumns.map((c) => bracketIdent(c)).join(', ');
  const fromClause = `${bracketIdent('dbo')}.${bracketIdent(tableName)}`;
  let inserted = 0;
  const sourceRequest = sourcePool.request();
  sourceRequest.stream = true;
  let batch: unknown[][] = [];
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let flushing = false;
    let doneReceived = false;

    const safeResolve = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    const safeReject = (error: unknown) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    const flushBatch = async () => {
      if (flushing || batch.length === 0) {
        if (doneReceived && !flushing && batch.length === 0) safeResolve();
        return;
      }
      flushing = true;
      const toInsert = batch;
      batch = [];
      try {
        await insertBatchOnTarget(
          targetPool,
          targetSqlMod,
          tableName,
          columnNames,
          sqlTypes,
          toInsert,
          hasIdentity,
        );
        inserted += toInsert.length;
        log(`Table ${tableName}: inserted ${inserted}/${totalRows}`);
      } catch (error) {
        try {
          sourceRequest.cancel();
        } catch {
          // ignore cancellation races
        }
        safeReject(error);
        return;
      } finally {
        flushing = false;
      }
      if (doneReceived) {
        if (batch.length > 0) {
          void flushBatch();
          return;
        }
        safeResolve();
        return;
      }
      sourceRequest.resume();
    };

    sourceRequest.on('row', (record: Record<string, unknown>) => {
      batch.push(columnNames.map((name) => record[name]));
      if (batch.length >= effectiveBatchSize) {
        sourceRequest.pause();
        void flushBatch();
      }
    });

    sourceRequest.once('error', (error) => {
      safeReject(error);
    });

    sourceRequest.once('done', () => {
      doneReceived = true;
      if (batch.length > 0) {
        sourceRequest.pause();
        void flushBatch();
      } else if (!flushing) {
        safeResolve();
      }
    });

    void sourceRequest
      .query(
        `
      SELECT ${selectList}
      FROM ${fromClause}
      ORDER BY ${orderBy}
    `,
      )
      .catch((error) => {
        safeReject(error);
      });
  });
}

async function run(): Promise<void> {
  const config = loadConfig(process.argv);
  log(`Schema file: ${config.schemaSqlPath}`);
  log(`Source: ${redactConnectionString(config.sourceConnectionString)}`);
  log(`Target: ${redactConnectionString(config.targetConnectionString)}`);
  log(`Batch size: ${config.batchSize}`);

  const schemaText = await fs.readFile(config.schemaSqlPath, 'utf8');
  const parsed = parseSchemaSql(schemaText);
  const schemaTables = [...new Set(parsed.tablesInFileOrder)];
  if (schemaTables.length !== parsed.tablesInFileOrder.length) {
    throw new Error('Duplicate CREATE TABLE entries detected in schema SQL file.');
  }
  const copyOrder = topologicalCopyOrder(schemaTables, parsed.fkEdges);
  const deterministicAllTables = [...schemaTables].sort((a, b) => a.localeCompare(b));

  let sourcePool: ConnectionPool | undefined;
  let targetPool: ConnectionPool | undefined;
  try {
    const sourceLoad = await loadMssqlModule(config.sourceConnectionString, 'source', log);
    const targetLoad = await loadMssqlModule(config.targetConnectionString, 'target', log);

    sourcePool = await openPool(
      sourceLoad.sql,
      'source',
      config.sourceConnectionString,
      config.requestTimeoutMs,
      sourceLoad.variant,
    );
    targetPool = await openPool(
      targetLoad.sql,
      'target',
      config.targetConnectionString,
      config.requestTimeoutMs,
      targetLoad.variant,
    );

    await assertTablesExist(sourcePool, sourceLoad.sql, schemaTables, 'Source database');
    await assertTablesExist(targetPool, targetLoad.sql, schemaTables, 'Target database');

    for (const tableName of deterministicAllTables) {
      const sourceCols = await loadInformationSchemaColumns(sourcePool, sourceLoad.sql, tableName);
      const targetCols = await loadInformationSchemaColumns(targetPool, targetLoad.sql, tableName);
      assertCompatibleColumnsByName(tableName, sourceCols, targetCols);
    }

    log(`Copy order (${copyOrder.length} tables): ${copyOrder.join(' → ')}`);
    for (const tableName of copyOrder) {
      await copySingleTable(
        sourcePool,
        targetPool,
        sourceLoad.sql,
        targetLoad.sql,
        tableName,
        config.batchSize,
      );
    }

    log('Completed successfully.');
  } finally {
    await targetPool?.close();
    await sourcePool?.close();
  }
}

if (require.main === module) {
  run().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    log(`FATAL: ${message}`);
    process.exitCode = 1;
  });
}

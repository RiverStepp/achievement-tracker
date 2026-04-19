import process from 'node:process';

export type MssqlModule = typeof import('mssql');

export type MssqlDriverVariant = 'tedious' | 'msnodesqlv8';

export interface LoadedMssql {
  sql: MssqlModule;
  variant: MssqlDriverVariant;
}

/** Tedious: TCP, SQL auth, Azure SQL. msnodesqlv8: native client; required for Trusted_Connection on Windows. */
export type SqlDriverChoice = 'auto' | 'tedious' | 'msnodesqlv8';

export function parseSqlDriverEnv(): SqlDriverChoice {
  const raw = process.env.DATA_TRANSFER_SQL_DRIVER?.trim().toLowerCase() ?? '';
  if (raw === 'tedious' || raw === 'tds') return 'tedious';
  if (raw === 'msnodesqlv8' || raw === 'native' || raw === 'v8') return 'msnodesqlv8';
  return 'auto';
}

export function connectionStringUsesIntegratedAuth(connectionString: string): boolean {
  return (
    /\btrusted[_\s]?connection\s*=\s*(?:true|yes|sspi|1)\b/i.test(connectionString) ||
    /\bintegrated\s+security\s*=\s*(?:true|yes|sspi|1)\b/i.test(connectionString)
  );
}

function logDriver(role: string, message: string, emit: (m: string) => void): void {
  emit(`[${role}] ${message}`);
}

export async function loadMssqlModule(
  connectionString: string,
  role: string,
  emit: (m: string) => void,
): Promise<LoadedMssql> {
  const driver = parseSqlDriverEnv();
  const integrated = connectionStringUsesIntegratedAuth(connectionString);

  if (integrated && process.platform !== 'win32' && driver !== 'tedious') {
    throw new Error(
      `${role}: Trusted_Connection / Integrated Security is only supported on Windows (msnodesqlv8). On ${process.platform} use SQL authentication (User Id + Password) for Azure or other servers, or set DATA_TRANSFER_SQL_DRIVER=tedious if you use a tunnel.`,
    );
  }

  const pickNative =
    driver === 'msnodesqlv8' ||
    (driver === 'auto' && integrated && process.platform === 'win32');

  if (driver === 'tedious' || !pickNative) {
    logDriver(
      role,
      'Driver: Tedious (TCP; use User Id/Password or Azure SQL auth; required for Linux/macOS and typical Azure).',
      emit,
    );
    const mod = await import('mssql');
    const sql = mod.default ?? mod;
    return { sql, variant: 'tedious' };
  }

  logDriver(
    role,
    'Driver: msnodesqlv8 (ODBC / native; Windows integrated auth uses Trusted_Connection in pool config).',
    emit,
  );
  try {
    const mod = await import('mssql/msnodesqlv8');
    const sql = (mod as { default?: MssqlModule }).default ?? (mod as unknown as MssqlModule);
    return { sql, variant: 'msnodesqlv8' };
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${role}: Could not load msnodesqlv8 (${hint}). On Windows, install it: npm install msnodesqlv8 (requires build tools for node-gyp). For Azure/Linux use a SQL login and Tedious (omit Trusted_Connection).`,
    );
  }
}

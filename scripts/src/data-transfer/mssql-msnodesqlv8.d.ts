declare module 'mssql/msnodesqlv8' {
  import type * as Mssql from 'mssql';
  const sql: typeof Mssql;
  export default sql;
}

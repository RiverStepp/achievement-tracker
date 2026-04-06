export interface DataTransferConfig {
  schemaSqlPath: string;
  sourceConnectionString: string;
  targetConnectionString: string;
  batchSize: number;
  requestTimeoutMs: number;
}

export interface ParsedSchema {
  tablesInFileOrder: readonly string[];
  /** referenced → dependent (referenced must be copied before dependent) */
  fkEdges: readonly { referenced: string; dependent: string }[];
}

export interface InformationSchemaColumnRow {
  COLUMN_NAME: string;
  ORDINAL_POSITION: number;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  NUMERIC_PRECISION: number | null;
  NUMERIC_SCALE: number | null;
  DATETIME_PRECISION: number | null;
}
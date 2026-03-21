export interface DataTransferConfig {
  schemaSqlPath: string;
  sourceConnectionString: string;
  targetConnectionString: string;
  replaceTargetData: boolean;
  batchSize: number;
  requestTimeoutMs: number;
}

export interface ParsedSchema {
  tablesInFileOrder: readonly string[];
  /** referenced → dependent (referenced must be copied before dependent) */
  fkEdges: readonly { referenced: string; dependent: string }[];
}

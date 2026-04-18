export type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

export type BiDirectoryNode = {
  children: BiDirectoryNode[];
  datasourceIds: number[];
  id: number;
  level?: number | null;
  nodeCode: string;
  nodeName: string;
  nodeType: string;
  orderNo?: number | null;
  parentId?: number | null;
  status?: string | null;
  treePath?: string | null;
};

export type BiDataAssetField = {
  assetId: number;
  bizComment?: string | null;
  dbComment?: string | null;
  exampleValue?: string | null;
  fieldLabel?: string | null;
  fieldName: string;
  fieldOrigin?: string | null;
  fieldType?: string | null;
  id: number;
  isNullable?: boolean | null;
  sortNo?: number | null;
};

export type BiDataAsset = {
  assetCode: string;
  assetName: string;
  assetType: 'SQL' | 'TABLE' | string;
  comment?: string | null;
  datasourceId: number;
  fields: BiDataAssetField[];
  id: number;
  sortNo?: number | null;
  sourceTables: string[];
  sqlText?: string | null;
  status?: string | null;
  syncMeta?: Record<string, unknown>;
  tableName?: string | null;
  tableSchema?: string | null;
};

export type BiDatasourceTable = {
  id: number;
  orderNo?: number | null;
  tableComment?: string | null;
  tableName: string;
};

export type BiDatasource = {
  assets: BiDataAsset[];
  businessScope?: string | null;
  dataScope?: string | null;
  description?: string | null;
  id: number;
  name: string;
  sourceCode: string;
  status?: string | null;
  tables?: BiDatasourceTable[];
};

export type BiScreenModule = {
  cacheSeconds?: number | null;
  id: number;
  layout?: Record<string, unknown>;
  moduleCode: string;
  moduleName: string;
  moduleType: string;
  params: Array<Record<string, unknown>>;
  resultFields: Array<Record<string, unknown>>;
  sortNo?: number | null;
  sqlText?: string | null;
  style?: Record<string, unknown>;
};

export type BiScreenVersion = {
  externalConfig?: Record<string, unknown>;
  filters: Array<Record<string, unknown>>;
  generatedByAi?: boolean | null;
  id: number;
  moduleLayout?: Record<string, unknown>;
  modules: BiScreenModule[];
  pageSchema?: Record<string, unknown>;
  prompt?: string | null;
  published?: boolean | null;
  screenId: number;
  theme?: string | null;
  versionNo?: number | null;
};

export type BiScreen = {
  accessMode?: string | null;
  biType: string;
  currentVersionId?: number | null;
  id: number;
  name: string;
  nodeId: number;
  publishStatus?: string | null;
  screenCode: string;
  versions: BiScreenVersion[];
};

export type BiRuntimeModule = {
  columns: string[];
  error?: string | null;
  layout?: Record<string, unknown>;
  moduleCode: string;
  moduleId: number;
  moduleName: string;
  moduleType: string;
  rows: Array<Record<string, unknown>>;
  style?: Record<string, unknown>;
};

export type BiRuntimeScreen = {
  accessMode?: string | null;
  biType: string;
  externalConfig?: Record<string, unknown>;
  filters: Array<Record<string, unknown>>;
  modules: BiRuntimeModule[];
  nodeCode?: string | null;
  nodeId?: number | null;
  nodeName?: string | null;
  pageSchema?: Record<string, unknown>;
  publishStatus?: string | null;
  screenCode: string;
  screenId: number;
  screenName: string;
  theme?: string | null;
};

export type BiShareToken = {
  createTime?: string | null;
  expiresAt?: string | null;
  id: number;
  screenId: number;
  status?: string | null;
  tokenValue: string;
};

export type BiRoute =
  | { kind: 'workspace' }
  | { kind: 'node'; value: string }
  | { kind: 'screen'; value: string }
  | { kind: 'share'; value: string }
  | { kind: 'not-found' };

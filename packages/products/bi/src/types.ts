export type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

export type BiCanvasMeta = {
  accent?: string;
  collapsed?: boolean;
  height?: number;
  width?: number;
  x?: number;
  y?: number;
  [key: string]: unknown;
};

export type BiDirectoryNode = {
  canvasMeta?: BiCanvasMeta | null;
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

export type BiDatasource = {
  assets: BiDataAsset[];
  businessScope?: string | null;
  dataScope?: string | null;
  description?: string | null;
  id: number;
  name: string;
  sourceCode: string;
  status?: string | null;
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
  designBrief?: Record<string, unknown> | null;
  designMeta?: Record<string, unknown> | null;
  designStatus?: string | null;
  id: number;
  latestDesignPrompt?: string | null;
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

export type BiPromptTemplate = {
  defaultTemplate?: boolean | null;
  description?: string | null;
  id: number;
  modelName?: string | null;
  providerCode?: string | null;
  status?: string | null;
  systemPrompt?: string | null;
  templateCode: string;
  templateName: string;
  templateType: string;
  userPrompt?: string | null;
};

export type BiPromptPreview = {
  context?: Record<string, unknown> | null;
  modelName?: string | null;
  providerCode?: string | null;
  systemPrompt?: string | null;
  templateCode?: string | null;
  userPrompt?: string | null;
};

export type BiGenerationTask = {
  createTime?: string | null;
  errorMessage?: string | null;
  id: number;
  modelName?: string | null;
  nodeId?: number | null;
  prompt?: string | null;
  providerCode?: string | null;
  publishMode?: string | null;
  request?: Record<string, unknown> | null;
  responseText?: string | null;
  result?: Record<string, unknown> | null;
  screenId?: number | null;
  sourceSnapshot?: Array<Record<string, unknown>>;
  status?: string | null;
  validation?: Record<string, unknown> | null;
  versionId?: number | null;
};

export type BiScreenDesignRecord = {
  createTime?: string | null;
  externalLink?: string | null;
  generationTaskId?: number | null;
  id: number;
  output?: Record<string, unknown> | null;
  promptContext?: Record<string, unknown> | null;
  promptText?: string | null;
  providerCode?: string | null;
  resultSummary?: string | null;
  screenId: number;
  status?: string | null;
  templateCode?: string | null;
};

export type BiRoute =
  | { kind: 'workspace' }
  | { kind: 'node'; value: string }
  | { kind: 'screen'; value: string }
  | { kind: 'share'; value: string }
  | { kind: 'not-found' };

export type BiDisplayRoute =
  | { kind: 'selector' }
  | { kind: 'platform'; platformCode: string }
  | { kind: 'not-found' };

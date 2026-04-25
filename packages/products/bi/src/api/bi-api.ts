import { createApiClient } from '@lserp/http';

import type {
  BiDataAsset,
  BiDataAssetField,
  BiDatasource,
  BiDirectoryNode,
  BiGenerationTask,
  BiNodeType,
  BiPromptPreview,
  BiPromptTemplate,
  BiRuntimeScreen,
  BiScreen,
  BiScreenDesignRecord,
  BiScreenVersion,
  BiShareToken,
  CommonResult,
} from '../types';

const biApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_BI_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

async function unwrap<T>(promise: Promise<CommonResult<T>>) {
  const result = await promise;
  return result.data;
}

export type DirectorySavePayload = {
  canvasMeta?: Record<string, unknown>;
  nodeCode: string;
  nodeName: string;
  nodeType: string;
  orderNo?: number;
  parentId?: number | null;
  status?: string;
};

export type DirectoryCanvasLayoutItemPayload = {
  canvasMeta?: Record<string, unknown>;
  id: number;
};

export type DataAssetFieldSavePayload = {
  bizComment?: string;
  dbComment?: string;
  exampleValue?: string;
  fieldLabel?: string;
  fieldName: string;
  fieldOrigin?: string;
  fieldType?: string;
  isNullable?: boolean;
  sortNo?: number;
};

export type DataAssetSavePayload = {
  assetCode?: string;
  assetName?: string;
  assetType: 'SQL' | 'TABLE';
  comment?: string;
  fields?: DataAssetFieldSavePayload[];
  sortNo?: number;
  sourceTables?: string[];
  sqlText?: string;
  status?: string;
  syncMeta?: Record<string, unknown>;
  tableName?: string;
  tableSchema?: string;
};

export type DatasourceSavePayload = {
  assets?: DataAssetSavePayload[];
  businessScope?: string;
  dataScope?: string;
  description?: string;
  name: string;
  sourceCode: string;
  status?: string;
};

export type ScreenSavePayload = {
  accessMode?: string;
  biType: 'EXTERNAL' | 'INTERNAL';
  designBrief?: Record<string, unknown>;
  designMeta?: Record<string, unknown>;
  latestDesignPrompt?: string;
  name: string;
  nodeId: number;
  screenCode: string;
  versionDraft?: {
    externalConfig?: Record<string, unknown>;
    filters?: Array<Record<string, unknown>>;
    modules?: Array<Record<string, unknown>>;
    pageSchema?: Record<string, unknown>;
    publishNow?: boolean;
    theme?: string;
  };
};

export type ScreenVersionSavePayload = {
  externalConfig?: Record<string, unknown>;
  filters?: Array<Record<string, unknown>>;
  id?: number;
  moduleLayout?: Record<string, unknown>;
  modules?: Array<Record<string, unknown>>;
  pageSchema?: Record<string, unknown>;
  publishNow?: boolean;
  theme?: string;
};

export type AiGeneratePayload = {
  datasourceIds?: number[];
  nodeId: number;
  prompt: string;
  screenCode?: string;
  screenName?: string;
  sourceAssetIds?: number[];
};

export type GenerateDraftPayload = {
  datasourceIds?: number[];
  nodeId: number;
  prompt: string;
  providerCode?: string;
  publishMode?: string;
  screenCode?: string;
  screenId?: number;
  screenName?: string;
  sourceAssetIds?: number[];
  templateCode?: string;
};

export type NodeTypeSavePayload = {
  allowedChildTypeCodes?: string[];
  description?: string;
  sortNo?: number;
  status?: string;
  systemDefault?: boolean;
  typeCode: string;
  typeName: string;
};

export type RegenerateVersionPayload = {
  datasourceIds?: number[];
  prompt?: string;
  providerCode?: string;
  publishMode?: string;
  sourceAssetIds?: number[];
  templateCode?: string;
};

export type PromptPreviewPayload = {
  datasourceIds?: number[];
  nodeId: number;
  prompt: string;
  providerCode?: string;
  screenId?: number;
  sourceAssetIds?: number[];
  templateCode?: string;
};

export type PromptTemplateSavePayload = {
  defaultTemplate?: boolean;
  description?: string;
  id?: number;
  modelName?: string;
  providerCode?: string;
  status?: string;
  systemPrompt?: string;
  templateCode: string;
  templateName: string;
  templateType: string;
  userPrompt?: string;
};

export type ShareCreatePayload = {
  expiresAt?: string | null;
  screenId: number;
};

export const biApi = {
  bindNodeSourceAssets(nodeId: number, sourceAssetIds: number[]) {
    return unwrap<BiDirectoryNode>(
      biApiClient.request(`/api/bi/directories/${nodeId}/source-assets`, {
        body: { sourceAssetIds },
        method: 'POST',
      }),
    );
  },
  bindNodeSources(nodeId: number, datasourceIds: number[]) {
    return unwrap<BiDirectoryNode>(
      biApiClient.request(`/api/bi/directories/${nodeId}/sources`, {
        body: { datasourceIds },
        method: 'POST',
      }),
    );
  },
  createDatasource(payload: DatasourceSavePayload) {
    return unwrap<BiDatasource>(
      biApiClient.request('/api/bi/datasources', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  updateDatasource(id: number, payload: DatasourceSavePayload) {
    return unwrap<BiDatasource>(
      biApiClient.request(`/api/bi/datasources/${id}`, {
        body: payload,
        method: 'PUT',
      }),
    );
  },
  createDatasourceAsset(datasourceId: number, payload: DataAssetSavePayload) {
    return unwrap<BiDataAsset>(
      biApiClient.request(`/api/bi/datasources/${datasourceId}/assets`, {
        body: payload,
        method: 'POST',
      }),
    );
  },
  createDirectory(payload: DirectorySavePayload) {
    return unwrap<BiDirectoryNode>(
      biApiClient.request('/api/bi/directories', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  deleteDirectory(id: number) {
    return unwrap<boolean>(
      biApiClient.request(`/api/bi/directories/${id}`, {
        method: 'DELETE',
      }),
    );
  },
  createScreen(payload: ScreenSavePayload) {
    return unwrap<BiScreen>(
      biApiClient.request('/api/bi/screens', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  updateScreen(screenId: number, payload: ScreenSavePayload) {
    return unwrap<BiScreen>(
      biApiClient.request(`/api/bi/screens/${screenId}`, {
        body: payload,
        method: 'PUT',
      }),
    );
  },
  createShareToken(payload: ShareCreatePayload) {
    return unwrap<BiShareToken>(
      biApiClient.request('/api/bi/shares', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  generateDraft(payload: GenerateDraftPayload) {
    return unwrap<BiGenerationTask>(
      biApiClient.request('/api/bi/screens/generate-draft', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  generateScreen(payload: AiGeneratePayload) {
    return unwrap<BiScreen>(
      biApiClient.request('/api/bi/screens/ai-generate', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  generateBizComments(assetId: number) {
    return unwrap<BiDataAssetField[]>(
      biApiClient.request(`/api/bi/assets/${assetId}/generate-biz-comments`, {
        method: 'POST',
      }),
    );
  },
  getGenerationTask(taskId: number) {
    return unwrap<BiGenerationTask>(biApiClient.request(`/api/bi/generation-tasks/${taskId}`));
  },
  getRuntimeByNode(nodeCode: string) {
    return unwrap<BiRuntimeScreen>(biApiClient.request(`/api/bi/runtime/node/${nodeCode}`));
  },
  getRuntimeByScreen(screenCode: string) {
    return unwrap<BiRuntimeScreen>(biApiClient.request(`/api/bi/runtime/screen/${screenCode}`));
  },
  getPreviewRuntimeByScreen(screenCode: string, versionId?: number | null) {
    return unwrap<BiRuntimeScreen>(
      biApiClient.request(`/api/bi/runtime/screen/${screenCode}/preview`, {
        query: { versionId: versionId ?? undefined },
      }),
    );
  },
  getShareRuntime(token: string) {
    return unwrap<BiRuntimeScreen>(biApiClient.request(`/api/bi/share/${token}`));
  },
  listAssetFields(assetId: number) {
    return unwrap<BiDataAssetField[]>(biApiClient.request(`/api/bi/assets/${assetId}/fields`));
  },
  listDatasourceAssets(datasourceId: number) {
    return unwrap<BiDataAsset[]>(biApiClient.request(`/api/bi/datasources/${datasourceId}/assets`));
  },
  listAssetCatalog() {
    return unwrap<BiDatasource[]>(biApiClient.request('/api/bi/assets/catalog'));
  },
  listDatasources() {
    return unwrap<BiDatasource[]>(biApiClient.request('/api/bi/datasources'));
  },
  listDesignRecords(screenId: number) {
    return unwrap<BiScreenDesignRecord[]>(
      biApiClient.request(`/api/bi/screens/${screenId}/design-records`),
    );
  },
  listDirectoryTree() {
    return unwrap<BiDirectoryNode[]>(biApiClient.request('/api/bi/directories/tree'));
  },
  listNodeTypes() {
    return unwrap<BiNodeType[]>(biApiClient.request('/api/bi/node-types'));
  },
  listPromptTemplates(templateType?: string) {
    return unwrap<BiPromptTemplate[]>(
      biApiClient.request('/api/bi/prompts/templates', {
        query: { templateType: templateType ?? undefined },
      }),
    );
  },
  listScreens(nodeId?: number | null) {
    return unwrap<BiScreen[]>(
      biApiClient.request('/api/bi/screens', {
        query: { nodeId: nodeId ?? undefined },
      }),
    );
  },
  listShareTokens(screenId?: number | null) {
    return unwrap<BiShareToken[]>(
      biApiClient.request('/api/bi/shares', {
        query: { screenId: screenId ?? undefined },
      }),
    );
  },
  previewPrompt(payload: PromptPreviewPayload) {
    return unwrap<BiPromptPreview>(
      biApiClient.request('/api/bi/prompts/preview', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  publishGeneratedVersion(screenId: number, versionId?: number | null) {
    return unwrap<BiScreen>(
      biApiClient.request(`/api/bi/screens/${screenId}/publish-generated-version`, {
        body: versionId ? { versionId } : {},
        method: 'POST',
      }),
    );
  },
  publishScreenVersion(screenId: number, versionId: number) {
    return unwrap<BiScreen>(
      biApiClient.request(`/api/bi/screens/${screenId}/versions/${versionId}/publish`, {
        method: 'POST',
      }),
    );
  },
  queryRuntimeByScreen(screenCode: string, params?: Record<string, unknown>) {
    return unwrap<BiRuntimeScreen>(
      biApiClient.request(`/api/bi/runtime/screen/${screenCode}/query`, {
        body: { params: params ?? {} },
        method: 'POST',
      }),
    );
  },
  queryPreviewRuntimeByScreen(screenCode: string, versionId?: number | null, params?: Record<string, unknown>) {
    return unwrap<BiRuntimeScreen>(
      biApiClient.request(`/api/bi/runtime/screen/${screenCode}/preview/query`, {
        body: { params: params ?? {} },
        method: 'POST',
        query: { versionId: versionId ?? undefined },
      }),
    );
  },
  queryShareRuntime(token: string, params?: Record<string, unknown>) {
    return unwrap<BiRuntimeScreen>(
      biApiClient.request(`/api/bi/share/${token}/query`, {
        body: { params: params ?? {} },
        method: 'POST',
      }),
    );
  },
  regenerateVersion(screenId: number, payload: RegenerateVersionPayload) {
    return unwrap<BiGenerationTask>(
      biApiClient.request(`/api/bi/screens/${screenId}/regenerate-version`, {
        body: payload,
        method: 'POST',
      }),
    );
  },
  replaceAssetFields(assetId: number, fields: DataAssetFieldSavePayload[]) {
    return unwrap<BiDataAssetField[]>(
      biApiClient.request(`/api/bi/assets/${assetId}/fields`, {
        body: { fields },
        method: 'PUT',
      }),
    );
  },
  revokeShareToken(id: number) {
    return unwrap<BiShareToken>(
      biApiClient.request(`/api/bi/shares/${id}/revoke`, {
        method: 'POST',
      }),
    );
  },
  saveCanvasLayout(items: DirectoryCanvasLayoutItemPayload[]) {
    return unwrap<BiDirectoryNode[]>(
      biApiClient.request('/api/bi/directories/canvas-layout', {
        body: { items },
        method: 'PUT',
      }),
    );
  },
  savePromptTemplate(payload: PromptTemplateSavePayload) {
    return unwrap<BiPromptTemplate>(
      biApiClient.request('/api/bi/prompts/templates', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  createNodeType(payload: NodeTypeSavePayload) {
    return unwrap<BiNodeType>(
      biApiClient.request('/api/bi/node-types', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  saveScreenVersion(screenId: number, payload: ScreenVersionSavePayload) {
    return unwrap<BiScreenVersion>(
      biApiClient.request(`/api/bi/screens/${screenId}/versions`, {
        body: payload,
        method: 'POST',
      }),
    );
  },
  updateNodeType(id: number, payload: NodeTypeSavePayload) {
    return unwrap<BiNodeType>(
      biApiClient.request(`/api/bi/node-types/${id}`, {
        body: payload,
        method: 'PUT',
      }),
    );
  },
  updateDatasourceAsset(datasourceId: number, assetId: number, payload: DataAssetSavePayload) {
    return unwrap<BiDataAsset>(
      biApiClient.request(`/api/bi/datasources/${datasourceId}/assets/${assetId}`, {
        body: payload,
        method: 'PUT',
      }),
    );
  },
  updateDirectory(id: number, payload: DirectorySavePayload) {
    return unwrap<BiDirectoryNode>(
      biApiClient.request(`/api/bi/directories/${id}`, {
        body: payload,
        method: 'PUT',
      }),
    );
  },
};

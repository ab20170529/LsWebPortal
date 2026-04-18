import { createApiClient } from '@lserp/http';

import type {
  BiDataAsset,
  BiDataAssetField,
  BiDatasource,
  BiDirectoryNode,
  BiRuntimeScreen,
  BiScreen,
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
  nodeCode: string;
  nodeName: string;
  nodeType: string;
  orderNo?: number;
  parentId?: number | null;
  status?: string;
};

export type DataAssetFieldSavePayload = {
  bizComment?: string;
  dbComment?: string;
  exampleValue?: string;
  fieldLabel?: string;
  fieldName: string;
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

export type AiGeneratePayload = {
  datasourceIds?: number[];
  nodeId: number;
  prompt: string;
  screenCode?: string;
  screenName?: string;
};

export type ShareCreatePayload = {
  expiresAt?: string | null;
  screenId: number;
};

export const biApi = {
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
  createScreen(payload: ScreenSavePayload) {
    return unwrap<BiScreen>(
      biApiClient.request('/api/bi/screens', {
        body: payload,
        method: 'POST',
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
  generateScreen(payload: AiGeneratePayload) {
    return unwrap<BiScreen>(
      biApiClient.request('/api/bi/screens/ai-generate', {
        body: payload,
        method: 'POST',
      }),
    );
  },
  getRuntimeByNode(nodeCode: string) {
    return unwrap<BiRuntimeScreen>(biApiClient.request(`/api/bi/runtime/node/${nodeCode}`));
  },
  getRuntimeByScreen(screenCode: string) {
    return unwrap<BiRuntimeScreen>(biApiClient.request(`/api/bi/runtime/screen/${screenCode}`));
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
  listDatasources() {
    return unwrap<BiDatasource[]>(biApiClient.request('/api/bi/datasources'));
  },
  listDirectoryTree() {
    return unwrap<BiDirectoryNode[]>(biApiClient.request('/api/bi/directories/tree'));
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
  queryShareRuntime(token: string, params?: Record<string, unknown>) {
    return unwrap<BiRuntimeScreen>(
      biApiClient.request(`/api/bi/share/${token}/query`, {
        body: { params: params ?? {} },
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
  saveScreenVersion(screenId: number, payload: Record<string, unknown>) {
    return unwrap<BiScreenVersion>(
      biApiClient.request(`/api/bi/screens/${screenId}/versions`, {
        body: payload,
        method: 'POST',
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
};

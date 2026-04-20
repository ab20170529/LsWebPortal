import { apiRequest } from './http';

import type {
  FunctionFlowDetail,
  FunctionFlowGraphJson,
  FunctionFlowModuleMeta,
  FunctionFlowPreviewResult,
} from '../features/dashboard/function-flow-types';

type FunctionFlowModuleListItem = {
  dllFileName?: string;
  menuCaption?: string;
  menuId?: number | null;
  moduleCode: string;
  moduleKind: 'bill' | 'bill_review' | 'module';
};

type SaveFunctionFlowInput = {
  drawioXml: string;
  flowCode: string;
  flowName: string;
  generatedArtifacts: FunctionFlowGraphJson['generatedArtifacts'];
  graphJson: FunctionFlowGraphJson;
};

export async function fetchFunctionFlowModules() {
  return apiRequest<FunctionFlowModuleListItem[]>('/api/function-flow/modules', {
    auth: true,
    method: 'GET',
  });
}

export async function fetchFunctionFlowModuleMeta(moduleCode: string) {
  return apiRequest<FunctionFlowModuleMeta>(`/api/function-flow/modules/${encodeURIComponent(moduleCode)}/meta`, {
    auth: true,
    method: 'GET',
  });
}

export async function previewFunctionFlow(input: {
  flowCode: string;
  graphJson: FunctionFlowGraphJson;
}) {
  return apiRequest<FunctionFlowPreviewResult>('/api/function-flow/preview', {
    auth: true,
    body: input,
    method: 'POST',
  });
}

export async function saveFunctionFlow(input: SaveFunctionFlowInput) {
  return apiRequest<FunctionFlowDetail>('/api/function-flow/save', {
    auth: true,
    body: input,
    method: 'POST',
  });
}

export async function fetchFunctionFlowDetail(flowCode: string) {
  return apiRequest<FunctionFlowDetail | null>(`/api/function-flow/detail/${encodeURIComponent(flowCode)}`, {
    auth: true,
    method: 'GET',
  });
}

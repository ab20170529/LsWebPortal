import { apiRequest } from './http';

import type {
  FunctionFlowDetail,
  FunctionFlowGraphJson,
  FunctionFlowSummary,
} from '../features/dashboard/function-flow-types';

type SaveFunctionFlowInput = {
  drawioXml?: string;
  editorXml?: string;
  flowCode: string;
  flowId?: number | string | null;
  flowName: string;
  generatedArtifacts?: FunctionFlowGraphJson['generatedArtifacts'];
  graphJson?: FunctionFlowGraphJson;
  rowVersion?: number | string | null;
  status?: string;
  subsystemId: string;
};

type CreateFunctionFlowRequest = {
  editorType: string;
  editorXml: string;
  flowCode: string;
  flowName: string;
  status: string;
  subsystemId: string;
};

type UpdateFunctionFlowRequest = {
  editorXml: string;
  flowName: string;
  rowVersion?: number | string | null;
  status: string;
};

type PersistedFunctionFlowPayload = Partial<FunctionFlowDetail> & {
  id?: number | string | null;
  rowVersion?: number | string | null;
  updatedAt?: number | string | null;
  xmlSize?: number | string | null;
};

function normalizeText(value?: number | string | null) {
  return String(value ?? '').trim();
}

function toOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function resolveEditorXml(input: Pick<SaveFunctionFlowInput, 'drawioXml' | 'editorXml'> | Partial<FunctionFlowDetail> | null | undefined) {
  return normalizeText(input?.editorXml) || normalizeText(input?.drawioXml);
}

function getXmlSize(xml: string) {
  return new TextEncoder().encode(xml).length;
}

function normalizeFunctionFlowSummary(input: Partial<FunctionFlowSummary> | null | undefined): FunctionFlowSummary {
  const flowCode = normalizeText(input?.flowCode);
  const flowName = normalizeText(input?.flowName);
  const id = normalizeText(input?.id);
  const subsystemId = normalizeText(input?.subsystemId);
  const xmlSize = toOptionalNumber(input?.xmlSize);

  return {
    editorType: normalizeText(input?.editorType) || undefined,
    flowCode,
    flowName,
    id,
    rowVersion: input?.rowVersion ?? null,
    status: normalizeText(input?.status) || undefined,
    subsystemId,
    updatedAt: input?.updatedAt ?? null,
    updatedBy: normalizeText(input?.updatedBy) || null,
    updatedName: normalizeText(input?.updatedName) || null,
    xmlSize,
  };
}

function buildFunctionFlowDetail(
  response: PersistedFunctionFlowPayload | null | undefined,
  fallback: {
    editorType?: string;
    editorXml: string;
    flowCode: string;
    flowId?: number | string | null;
    flowName: string;
    generatedArtifacts?: FunctionFlowDetail['generatedArtifacts'];
    graphJson?: FunctionFlowGraphJson;
    rowVersion?: number | string | null;
    status?: string;
    subsystemId: string;
  },
): FunctionFlowDetail {
  const normalizedSummary = normalizeFunctionFlowSummary({
    editorType: response?.editorType ?? fallback.editorType,
    flowCode: response?.flowCode ?? fallback.flowCode,
    flowName: response?.flowName ?? fallback.flowName,
    id: normalizeText(response?.id ?? fallback.flowId),
    rowVersion: response?.rowVersion ?? fallback.rowVersion ?? null,
    status: response?.status ?? fallback.status,
    subsystemId: response?.subsystemId ?? fallback.subsystemId,
    updatedAt: response?.updatedAt ?? null,
    updatedBy: response?.updatedBy ?? null,
    updatedName: response?.updatedName ?? null,
    xmlSize: response?.xmlSize ?? getXmlSize(fallback.editorXml),
  });
  const editorXml = resolveEditorXml(response) || fallback.editorXml;

  return {
    bizType: normalizeText(response?.bizType) || undefined,
    drawioXml: editorXml,
    editorType: normalizedSummary.editorType,
    editorXml,
    flowCode: normalizedSummary.flowCode,
    flowName: normalizedSummary.flowName,
    generatedArtifacts: response?.generatedArtifacts ?? fallback.generatedArtifacts ?? null,
    graphJson: response?.graphJson ?? fallback.graphJson,
    id: normalizedSummary.id,
    rowVersion: normalizedSummary.rowVersion,
    status: normalizedSummary.status,
    subsystemId: normalizedSummary.subsystemId,
    updatedAt: normalizedSummary.updatedAt,
    updatedBy: normalizedSummary.updatedBy,
    updatedName: normalizedSummary.updatedName,
    xmlSize: normalizedSummary.xmlSize,
  };
}

export async function fetchFunctionFlowModuleMeta(moduleCode: string) {
  return apiRequest<import('../features/dashboard/function-flow-types').FunctionFlowModuleMeta>(`/api/function-flow/modules/${encodeURIComponent(moduleCode)}/meta`, {
    auth: true,
    method: 'GET',
  });
}

export async function fetchFunctionFlowList(subsystemId: string) {
  const rows = await apiRequest<Array<Partial<FunctionFlowSummary>>>(
    `/api/function-flow/subsystems/${encodeURIComponent(subsystemId)}/flows`,
    {
      auth: true,
      method: 'GET',
    },
  );

  return Array.isArray(rows) ? rows.map((row) => normalizeFunctionFlowSummary(row)) : [];
}

export async function fetchFunctionFlowDetail(flowId: string) {
  const detail = await apiRequest<PersistedFunctionFlowPayload>(
    `/api/function-flow/flows/${encodeURIComponent(flowId)}`,
    {
      auth: true,
      method: 'GET',
    },
  );

  return buildFunctionFlowDetail(detail, {
    editorXml: resolveEditorXml(detail),
    flowCode: normalizeText(detail?.flowCode),
    flowId: detail?.id,
    flowName: normalizeText(detail?.flowName),
    generatedArtifacts: detail?.generatedArtifacts ?? null,
    graphJson: detail?.graphJson,
    rowVersion: detail?.rowVersion ?? null,
    status: normalizeText(detail?.status) || undefined,
    subsystemId: normalizeText(detail?.subsystemId),
  });
}

export async function saveFunctionFlow(input: SaveFunctionFlowInput) {
  const editorXml = resolveEditorXml(input);
  if (!editorXml) {
    throw new Error('功能流程图 XML 不能为空');
  }

  const status = normalizeText(input.status) || 'draft';
  const flowId = normalizeText(input.flowId);

  if (!flowId) {
    const created = await apiRequest<PersistedFunctionFlowPayload>('/api/function-flow/flows', {
      auth: true,
      body: {
        editorType: 'drawio',
        editorXml,
        flowCode: input.flowCode,
        flowName: input.flowName,
        status,
        subsystemId: input.subsystemId,
      } satisfies CreateFunctionFlowRequest,
      method: 'POST',
    });

    return buildFunctionFlowDetail(created, {
      editorType: 'drawio',
      editorXml,
      flowCode: input.flowCode,
      flowName: input.flowName,
      generatedArtifacts: input.generatedArtifacts ?? null,
      graphJson: input.graphJson,
      status,
      subsystemId: input.subsystemId,
    });
  }

  const updated = await apiRequest<PersistedFunctionFlowPayload>(`/api/function-flow/flows/${encodeURIComponent(flowId)}`, {
    auth: true,
    body: {
      editorXml,
      flowName: input.flowName,
      rowVersion: input.rowVersion ?? null,
      status,
    } satisfies UpdateFunctionFlowRequest,
    method: 'PUT',
  });

  return buildFunctionFlowDetail(updated, {
    editorType: 'drawio',
    editorXml,
    flowCode: input.flowCode,
    flowId,
    flowName: input.flowName,
    generatedArtifacts: input.generatedArtifacts ?? null,
    graphJson: input.graphJson,
    rowVersion: input.rowVersion ?? null,
    status,
    subsystemId: input.subsystemId,
  });
}

export async function deleteFunctionFlow(flowId: string) {
  return apiRequest<boolean>(`/api/function-flow/flows/${encodeURIComponent(flowId)}`, {
    auth: true,
    method: 'DELETE',
  });
}

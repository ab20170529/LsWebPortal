import type { ProcessDesignerDocument } from '../features/dashboard/module-settings/process-designer-types';
import type {
  SimpleProcessSchema,
  SimpleProcessSchemaVersion,
} from './simple-process-designer-host';
import { apiRequest } from './http';

export type ApprovalFlowFamily = 'bill' | 'archive';

export type LegacyApprovalTableSet = {
  flowTable: string;
  flowTypeStepTable: string;
  flowTypeTable: string;
  ownerTable: string;
  stepGridTable: string;
};

type FlowableApiEnvelope<T> = {
  code?: number;
  data?: T;
  message?: string;
};

export type FlowableLegacyStepConfigPayloadDto = {
  attachmentCount?: number;
  attachments: Array<Record<string, unknown>>;
  conditionCount?: number;
  conditions: Array<Record<string, unknown>>;
  flowTypeStepValues: Record<string, unknown>;
  flowValues: Record<string, unknown>;
  formKey?: string;
  gridFieldCount?: number;
  gridFields: Array<Record<string, unknown>>;
  menuCount?: number;
  menus: Array<Record<string, unknown>>;
  nodeId: string;
  nodeName: string;
  stepApplyText?: string;
  stepBackText?: string;
  stepCode?: number;
  stepGroup?: string;
  stepSql?: string;
};

export type FlowableBridgeCompileResult = {
  approvalFamily?: ApprovalFlowFamily;
  bpmnXml: string;
  legacyTableSet?: LegacyApprovalTableSet;
  modelKey?: string;
  processId?: string;
  processName?: string;
  userTaskCount?: number;
  warnings?: string[];
};

export type FlowableBridgeTablePreview = {
  note?: string;
  plannedRowCount?: number;
  sampleRows?: Array<Record<string, unknown>>;
  tableName: string;
};

export type FlowableBridgePreviewResult = {
  approvalFamily?: ApprovalFlowFamily;
  gatewayCount?: number;
  legacyFlowTypeId?: number;
  legacyFlowTypeName?: string;
  legacyTableSet?: LegacyApprovalTableSet;
  legacyTypeCode?: string;
  modelId?: number;
  modelKey?: string;
  modelName?: string;
  modelVersion?: number;
  processId?: string;
  processName?: string;
  sequenceFlowCount?: number;
  stepPreviews?: Array<Record<string, unknown>>;
  tablePreviews?: FlowableBridgeTablePreview[];
  userTaskCount?: number;
  warnings?: string[];
};

export type FlowableBridgePublishResult = {
  approvalFamily?: ApprovalFlowFamily;
  insertedAttachmentCount?: number;
  insertedConditionCount?: number;
  insertedGridFieldCount?: number;
  insertedMenuCount?: number;
  legacyFlowTypeId?: number;
  legacyTableSet?: LegacyApprovalTableSet;
  legacyTypeCode?: string;
  modelKey?: string;
  upsertedFlowCount?: number;
  upsertedFlowTypeStepCount?: number;
  warnings?: string[];
};

export type FlowableBridgeRequestPayload = {
  approvalFamily: ApprovalFlowFamily;
  businessType?: string;
  designerSchema: ProcessDesignerDocument;
  flowTypeValues?: Record<string, unknown>;
  legacyFlowTypeId?: number;
  legacyFlowTypeName?: string;
  legacyTableSet: LegacyApprovalTableSet;
  legacyTypeCode?: string;
  modelKey: string;
  modelName: string;
  overwriteExisting?: boolean;
  publishedBy?: string;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
  stepConfigs: FlowableLegacyStepConfigPayloadDto[];
};

export type ProcessDesignerSchemeDto = {
  legacyFlowTypeId?: number;
  planValue?: string;
  approvalFamily?: ApprovalFlowFamily;
  businessCode?: string;
  businessType?: string;
  schemeCode?: string;
  schemeName?: string;
  permissionScope?: string;
  actionDescription?: string;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
  stepCount?: number;
};

export type ProcessDesignerSchemeSavePayload = {
  approvalFamily: ApprovalFlowFamily;
  actionDescription?: string;
  businessCode: string;
  businessType?: string;
  legacyFlowTypeId?: number;
  permissionScope?: string;
  planValue?: string;
  schemeCode?: string;
  schemeName: string;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
};

function unwrapFlowableEnvelope<T>(response: T | FlowableApiEnvelope<T>) {
  if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
    return (response as FlowableApiEnvelope<T>).data as T;
  }

  return response as T;
}

export function resolveApprovalFlowFamily(input: {
  approvalFamily?: ApprovalFlowFamily;
  businessType?: string;
}) {
  if (input.approvalFamily) {
    return input.approvalFamily;
  }

  const normalizedBusinessType = (input.businessType || '').trim().toLowerCase();
  return normalizedBusinessType === '单据' || normalizedBusinessType === 'table' ? 'bill' : 'archive';
}

export function resolveLegacyApprovalTableSet(family: ApprovalFlowFamily): LegacyApprovalTableSet {
  if (family === 'bill') {
    return {
      flowTable: 'p_systembillflow',
      flowTypeStepTable: 'p_systembillflowtypestep',
      flowTypeTable: 'p_systembillflowtype',
      ownerTable: 'p_systembilltype',
      stepGridTable: 'p_systembillstepgrid',
    };
  }

  return {
    flowTable: 'p_systemdlltabflow',
    flowTypeStepTable: 'p_systemdlltabflowtypestep',
    flowTypeTable: 'p_systemdlltabflowtype',
    ownerTable: 'p_systemdlltab',
    stepGridTable: 'p_systemdlltabflowstepgrid',
  };
}

export function buildFlowableBridgeRequest(input: {
  approvalFamily?: ApprovalFlowFamily;
  businessCode?: string;
  businessType?: string;
  currentUserName?: string;
  document: ProcessDesignerDocument;
  permissionScope?: string;
  planValue?: string;
  schemeCode?: string;
  schemeName?: string;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
}): FlowableBridgeRequestPayload {
  const approvalFamily = resolveApprovalFlowFamily({
    approvalFamily: input.approvalFamily,
    businessType: input.businessType,
  });
  const legacyTableSet = resolveLegacyApprovalTableSet(approvalFamily);
  const modelKey = (input.schemeCode || input.businessCode || 'process_design').trim();
  const modelName = (input.schemeName || input.document.properties.modelName || '流程设计').trim();

  const stepConfigs: FlowableLegacyStepConfigPayloadDto[] = input.document.nodes
    .filter((node) => node.type === 'user-task' || node.type === 'approver-task')
    .map((node, index) => ({
      attachments: [],
      conditions: [],
      flowTypeStepValues: {},
      flowValues: {},
      gridFields: [],
      menus: [],
      nodeId: node.id,
      nodeName: node.textValue,
      stepApplyText: '同意',
      stepBackText: '驳回',
      stepCode: node.properties.stepCode ?? (index + 1) * 100,
      stepGroup: node.properties.stepGroup || node.textValue,
    }));

  return {
    approvalFamily,
    businessType: input.businessType,
    designerSchema: input.document,
    flowTypeValues: {
      ...(input.permissionScope ? { permissionScope: input.permissionScope } : {}),
      approvalFamily,
      ownerTable: legacyTableSet.ownerTable,
    },
    legacyTableSet,
    legacyTypeCode: input.businessCode?.trim() || undefined,
    modelKey,
    modelName,
    overwriteExisting: false,
    publishedBy: input.currentUserName,
    simpleSchema: input.simpleSchema,
    simpleSchemaVersion: input.simpleSchemaVersion,
    stepConfigs,
  };
}

export async function compileProcessDesignerXml(body: FlowableBridgeRequestPayload) {
  const response = await apiRequest<FlowableApiEnvelope<FlowableBridgeCompileResult> | FlowableBridgeCompileResult>(
    '/api/bpm/legacy-flow/compile-xml',
    {
      auth: true,
      body,
      method: 'POST',
    },
  );

  return unwrapFlowableEnvelope(response);
}

export async function previewProcessDesignerBridge(body: FlowableBridgeRequestPayload) {
  const response = await apiRequest<FlowableApiEnvelope<FlowableBridgePreviewResult> | FlowableBridgePreviewResult>(
    '/api/bpm/legacy-flow/preview',
    {
      auth: true,
      body,
      method: 'POST',
    },
  );

  return unwrapFlowableEnvelope(response);
}

export async function publishProcessDesignerBridge(body: FlowableBridgeRequestPayload) {
  const response = await apiRequest<FlowableApiEnvelope<FlowableBridgePublishResult> | FlowableBridgePublishResult>(
    '/api/bpm/legacy-flow/publish',
    {
      auth: true,
      body,
      method: 'POST',
    },
  );

  return unwrapFlowableEnvelope(response);
}

export async function listProcessDesignerSchemes(query: {
  approvalFamily?: ApprovalFlowFamily;
  businessCode: string;
  businessType?: string;
}) {
  const response = await apiRequest<FlowableApiEnvelope<ProcessDesignerSchemeDto[]> | ProcessDesignerSchemeDto[]>(
    '/api/process-designer/schemes',
    {
      auth: true,
      method: 'GET',
      query,
    },
  );

  return unwrapFlowableEnvelope(response) ?? [];
}

export async function saveProcessDesignerScheme(body: ProcessDesignerSchemeSavePayload) {
  const response = await apiRequest<FlowableApiEnvelope<ProcessDesignerSchemeDto> | ProcessDesignerSchemeDto>(
    '/api/process-designer/schemes/save',
    {
      auth: true,
      body,
      method: 'POST',
    },
  );

  return unwrapFlowableEnvelope(response);
}

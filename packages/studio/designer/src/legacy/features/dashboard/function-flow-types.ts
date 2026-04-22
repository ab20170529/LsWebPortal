export type FunctionFlowModuleKind = 'bill' | 'bill_review' | 'module';

export type FunctionFlowModuleOption = {
  code: string;
  dllFileName?: string;
  id: string;
  menuId?: number | null;
  moduleKind: FunctionFlowModuleKind;
  moduleType: string;
  pathLabel: string;
  title: string;
};

export type FunctionFlowModuleField = {
  dataType?: string;
  editable?: boolean | null;
  fieldKey?: string;
  fieldLabel: string;
  fieldName: string;
  fieldSql?: string;
  fieldSqlId?: string;
  fieldSqlName?: string;
  fieldSqlTag?: number | null;
  formKey?: string;
  id?: number | null;
  orderId?: number | null;
  rowField?: boolean | null;
  scope?: 'main' | 'detail' | string;
  systemName?: string;
  tab?: string;
  tagId?: number | null;
  visible?: boolean | null;
  width?: number | null;
};

export type FunctionFlowModuleCondition = {
  controlLabel?: string;
  controlName?: string;
  controlType?: string;
  defaultValue?: string;
  formKey?: string;
  id?: number | null;
  keyField?: string;
  orderId?: number | null;
  resultField?: string;
  sourceId?: string;
  sourceSql?: string;
};

export type FunctionFlowModuleMeta = {
  conditions: FunctionFlowModuleCondition[];
  condKey?: string;
  configId?: number | null;
  configTable?: string;
  countSql?: string;
  deleteCond?: string;
  detailSql?: string;
  detailTable?: string;
  dllFileName?: string;
  fields: FunctionFlowModuleField[];
  formKey?: string;
  mainModuleCodeField?: string;
  mainSql?: string;
  mainTable?: string;
  menuCaption?: string;
  menuId?: number | null;
  modifyCond?: string;
  moduleCode: string;
  moduleKind: FunctionFlowModuleKind;
  moduleName: string;
  taskSql?: string;
  treeKeyFieldName?: string;
  treeParentFieldName?: string;
  treeSql?: string;
};

export type FunctionFlowPassField = {
  fromField: string;
  toParam: string;
};

export type FunctionFlowEdgeConfig = {
  cellId: string;
  sourceCellId: string;
  targetCellId: string;
  // 以下字段后端自动推断，前端不显示
};

export type FunctionFlowFieldMapping = {
  aggregateFunc: string;
  exprText: string;
  exprType: 'field' | 'expr' | 'agg' | 'constant' | '';
  id: string;
  isGroupBy: boolean;
  isRequired: boolean;
  isVisible: boolean;
  mappingScope: 'main' | 'detail' | 'grid' | '';
  orderNo: number;
  ownerCellId: string;
  sourceCellId: string;
  sourceField: string;
  sourceTableScope: 'main' | 'detail' | '';
  targetField: string;
  targetLabel: string;
  width: number;
};

export type FunctionFlowNodeConfig = {
  cellId: string;
  condition: string;
  defaultDetailAlias: string;
  defaultMainAlias: string;
  detailFkToMain: string;
  detailPk: string;
  detailSql: string;
  detailTable: string;
  mainBillNoField: string;
  mainPk: string;
  mainTable: string;
  moduleCode: string;
  moduleKind: string;
  moduleName: string;
  primarySql: string;
};

export type FunctionFlowGeneratedArtifacts = {
  detailSql: string;
  gridJson: Array<Record<string, unknown>>;
  sourceSql: string;
};

export type FunctionFlowGraphJson = {
  edges: FunctionFlowEdgeConfig[];
  fieldMappings: FunctionFlowFieldMapping[];
  generatedArtifacts: FunctionFlowGeneratedArtifacts;
  nodes: FunctionFlowNodeConfig[];
};

export type FunctionFlowPreviewResult = {
  detailSql: string;
  gridJson: Array<Record<string, unknown>>;
  sourceSql: string;
  validationMessages: string[];
};

export type FunctionFlowSummary = {
  editorType?: string;
  flowCode: string;
  flowName: string;
  id: string;
  rowVersion?: number | string | null;
  status?: string;
  subsystemId: string;
  updatedAt?: number | string | null;
  updatedBy?: string | null;
  updatedName?: string | null;
  xmlSize?: number | null;
};

export type FunctionFlowDetail = {
  bizType?: string;
  drawioXml?: string;
  editorType?: string;
  editorXml?: string;
  flowCode: string;
  flowName: string;
  id: string;
  generatedArtifacts?: (FunctionFlowGeneratedArtifacts & {
    createdAt?: number | null;
    validationMessages?: string[];
    versionNo?: number | null;
  }) | null;
  graphJson?: FunctionFlowGraphJson;
  rowVersion?: number | string | null;
  status?: string;
  subsystemId: string;
  updatedAt?: number | string | null;
  updatedBy?: string | null;
  updatedName?: string | null;
  xmlSize?: number | null;
};

export function createEmptyFunctionFlowGeneratedArtifacts(): FunctionFlowGeneratedArtifacts {
  return {
    detailSql: '',
    gridJson: [],
    sourceSql: '',
  };
}

export function createEmptyFunctionFlowGraphJson(): FunctionFlowGraphJson {
  return {
    edges: [],
    fieldMappings: [],
    generatedArtifacts: createEmptyFunctionFlowGeneratedArtifacts(),
    nodes: [],
  };
}

// 连线详情（后端推断）
export type FunctionFlowEdgeDetail = {
  edgeId: string;
  sourceNodeName: string;
  targetNodeName: string;
  inferredJoinType: 'left' | 'inner' | 'right' | 'full';
};

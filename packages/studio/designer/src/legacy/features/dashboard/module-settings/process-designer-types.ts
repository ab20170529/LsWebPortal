export type ProcessDesignerNodeType =
  | 'start-node'
  | 'user-task'
  | 'approver-task'
  | 'exclusive-gateway'
  | 'parallel-gateway'
  | 'end-node';

export type ProcessDesignerNodeProperties = {
  x: number;
  y: number;
  name?: string;
  stepCode?: number;
  stepGroup?: string;
  assigneeMode?: string;
  assigneeLabel?: string;
  branchLabel?: string;
  conditionSummary?: string;
  parallelMode?: string;
  description?: string;
};

export type ProcessDesignerNode = {
  id: string;
  type: ProcessDesignerNodeType;
  textValue: string;
  properties: ProcessDesignerNodeProperties;
};

export type ProcessDesignerEdgeProperties = {
  conditionExpression?: string;
  conditionLabel?: string;
  priority?: number;
};

export type ProcessDesignerEdge = {
  id: string;
  type: 'sequence-flow';
  sourceNodeId: string;
  targetNodeId: string;
  properties: ProcessDesignerEdgeProperties;
};

export type ProcessDesignerDocument = {
  engine: 'logicflow';
  schemaVersion: 'v1';
  nodes: ProcessDesignerNode[];
  edges: ProcessDesignerEdge[];
  properties: {
    template: 'linear' | 'branch' | 'parallel';
    modelName?: string;
  };
};

const HORIZONTAL_STEP = 240;
const VERTICAL_STEP = 158;

function createNode(
  id: string,
  type: ProcessDesignerNodeType,
  textValue: string,
  x: number,
  y: number,
  properties: Partial<ProcessDesignerNodeProperties> = {},
): ProcessDesignerNode {
  return {
    id,
    type,
    textValue,
    properties: {
      x,
      y,
      ...properties,
    },
  };
}

function createEdge(
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
  properties: ProcessDesignerEdgeProperties = {},
): ProcessDesignerEdge {
  return {
    id,
    type: 'sequence-flow',
    sourceNodeId,
    targetNodeId,
    properties,
  };
}

export function createLinearProcessDesignerDocument(moduleName: string): ProcessDesignerDocument {
  return {
    engine: 'logicflow',
    schemaVersion: 'v1',
    properties: {
      modelName: `${moduleName}流程`,
      template: 'linear',
    },
    nodes: [
      createNode('start_1', 'start-node', '开始', 48, 140),
      createNode('task_apply', 'user-task', '发起申请', 48 + HORIZONTAL_STEP, 140, {
        assigneeMode: 'initiator',
        stepCode: 100,
        stepGroup: '申请',
      }),
      createNode('task_manager', 'approver-task', '主管审批', 48 + HORIZONTAL_STEP * 2, 140, {
        assigneeMode: 'role',
        stepCode: 200,
        stepGroup: '审批',
      }),
      createNode('end_1', 'end-node', '结束', 48 + HORIZONTAL_STEP * 3, 140),
    ],
    edges: [
      createEdge('edge_1', 'start_1', 'task_apply'),
      createEdge('edge_2', 'task_apply', 'task_manager'),
      createEdge('edge_3', 'task_manager', 'end_1'),
    ],
  };
}

export function createBranchProcessDesignerDocument(moduleName: string): ProcessDesignerDocument {
  return {
    engine: 'logicflow',
    schemaVersion: 'v1',
    properties: {
      modelName: `${moduleName}条件分支流程`,
      template: 'branch',
    },
    nodes: [
      createNode('start_1', 'start-node', '开始', 48, 180),
      createNode('task_apply', 'user-task', '发起申请', 48 + HORIZONTAL_STEP, 180, {
        assigneeMode: 'initiator',
        stepCode: 100,
        stepGroup: '申请',
      }),
      createNode('gateway_amount', 'exclusive-gateway', '条件判断', 48 + HORIZONTAL_STEP * 2, 180),
      createNode('task_manager', 'approver-task', '主管审批', 48 + HORIZONTAL_STEP * 3, 40, {
        assigneeMode: 'role',
        branchLabel: '条件 A',
        stepCode: 200,
        stepGroup: '主管',
      }),
      createNode('task_finance', 'approver-task', '财务审批', 48 + HORIZONTAL_STEP * 3, 320, {
        assigneeMode: 'role',
        branchLabel: '条件 B',
        stepCode: 300,
        stepGroup: '财务',
      }),
      createNode('end_1', 'end-node', '结束', 48 + HORIZONTAL_STEP * 4, 180),
    ],
    edges: [
      createEdge('edge_1', 'start_1', 'task_apply'),
      createEdge('edge_2', 'task_apply', 'gateway_amount'),
      createEdge('edge_3', 'gateway_amount', 'task_manager', {
        conditionExpression: 'conditionA == true',
        conditionLabel: '条件 A',
        priority: 1,
      }),
      createEdge('edge_4', 'gateway_amount', 'task_finance', {
        conditionExpression: 'conditionB == true',
        conditionLabel: '条件 B',
        priority: 2,
      }),
      createEdge('edge_5', 'task_manager', 'end_1'),
      createEdge('edge_6', 'task_finance', 'end_1'),
    ],
  };
}

export function createParallelProcessDesignerDocument(moduleName: string): ProcessDesignerDocument {
  return {
    engine: 'logicflow',
    schemaVersion: 'v1',
    properties: {
      modelName: `${moduleName}并行会签流程`,
      template: 'parallel',
    },
    nodes: [
      createNode('start_1', 'start-node', '开始', 48, 180),
      createNode('task_apply', 'user-task', '发起申请', 48 + HORIZONTAL_STEP, 180, {
        assigneeMode: 'initiator',
        stepCode: 100,
        stepGroup: '申请',
      }),
      createNode('gateway_parallel_open', 'parallel-gateway', '并行发起', 48 + HORIZONTAL_STEP * 2, 180),
      createNode('task_ops', 'approver-task', '运营审批', 48 + HORIZONTAL_STEP * 3, 48, {
        assigneeMode: 'role',
        stepCode: 200,
        stepGroup: '运营',
      }),
      createNode('task_finance', 'approver-task', '财务审批', 48 + HORIZONTAL_STEP * 3, 312, {
        assigneeMode: 'role',
        stepCode: 300,
        stepGroup: '财务',
      }),
      createNode('gateway_parallel_close', 'parallel-gateway', '并行汇聚', 48 + HORIZONTAL_STEP * 4, 180),
      createNode('end_1', 'end-node', '结束', 48 + HORIZONTAL_STEP * 5, 180),
    ],
    edges: [
      createEdge('edge_1', 'start_1', 'task_apply'),
      createEdge('edge_2', 'task_apply', 'gateway_parallel_open'),
      createEdge('edge_3', 'gateway_parallel_open', 'task_ops'),
      createEdge('edge_4', 'gateway_parallel_open', 'task_finance'),
      createEdge('edge_5', 'task_ops', 'gateway_parallel_close'),
      createEdge('edge_6', 'task_finance', 'gateway_parallel_close'),
      createEdge('edge_7', 'gateway_parallel_close', 'end_1'),
    ],
  };
}

export function createProcessDesignerTemplateDocument(
  template: ProcessDesignerDocument['properties']['template'],
  moduleName: string,
): ProcessDesignerDocument {
  if (template === 'branch') {
    return createBranchProcessDesignerDocument(moduleName);
  }
  if (template === 'parallel') {
    return createParallelProcessDesignerDocument(moduleName);
  }
  return createLinearProcessDesignerDocument(moduleName);
}

export function countProcessDesignerTaskNodes(document: ProcessDesignerDocument): number {
  return document.nodes.filter((node) => node.type === 'user-task' || node.type === 'approver-task').length;
}

export function countProcessDesignerGatewayNodes(document: ProcessDesignerDocument): number {
  return document.nodes.filter((node) => node.type === 'exclusive-gateway' || node.type === 'parallel-gateway').length;
}

export function getProcessDesignerCanvasSize(document: ProcessDesignerDocument) {
  const maxX = Math.max(...document.nodes.map((node) => node.properties.x), 0);
  const maxY = Math.max(...document.nodes.map((node) => node.properties.y), 0);

  return {
    width: maxX + HORIZONTAL_STEP,
    height: maxY + VERTICAL_STEP,
  };
}

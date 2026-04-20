import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';
import { type ProcessDesignerDocument, type ProcessDesignerEdge, type ProcessDesignerNode, getProcessDesignerCanvasSize } from './process-designer-types';

type Props = { className?: string; onToast?: (message: string) => void; onChange: (nextValue: ProcessDesignerDocument) => void; value: ProcessDesignerDocument };
type DragState = { nodeId: string; offsetX: number; offsetY: number } | null;
type InsertMenu = { edgeId: string; x: number; y: number } | null;

const NODE_W = 156;
const NODE_H = 76;
const GAP_X = 220;
const GAP_Y = 150;
const MIN_POS = 48;
const INPUT = 'h-11 rounded-[14px] border border-slate-200/80 bg-white px-3 text-[13px] text-slate-700 shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100';
const TEXTAREA = `${INPUT} min-h-[104px] resize-none py-3`;

const META: Record<ProcessDesignerNode['type'], { accent: string; icon: string; label: string }> = {
  'approver-task': { accent: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100', icon: 'approval', label: '审批节点' },
  'end-node': { accent: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100', icon: 'stop_circle', label: '结束' },
  'exclusive-gateway': { accent: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100', icon: 'call_split', label: '条件网关' },
  'parallel-gateway': { accent: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100', icon: 'join_full', label: '并行网关' },
  'start-node': { accent: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100', icon: 'play_circle', label: '开始' },
  'user-task': { accent: 'border-primary/20 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-slate-100', icon: 'assignment_ind', label: '发起节点' },
};
const ASSIGNEE_OPTIONS = [
  { value: 'initiator', label: '发起人' },
  { value: 'role', label: '角色' },
  { value: 'user', label: '指定用户' },
  { value: 'leader', label: '直属上级' },
  { value: 'department', label: '部门负责人' },
];
const PARALLEL_OPTIONS = [
  { value: 'all', label: '全部通过' },
  { value: 'any', label: '任意通过' },
];
const EDGE_PRESETS = [
  { label: '同意', expression: 'approved == true', priority: 1 },
  { label: '驳回', expression: 'approved == false', priority: 2 },
  { label: '金额大于 1 万', expression: 'amount > 10000', priority: 10 },
];

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const createEdge = (sourceNodeId: string, targetNodeId: string, properties: ProcessDesignerEdge['properties'] = {}): ProcessDesignerEdge => ({ id: createId('edge'), type: 'sequence-flow', sourceNodeId, targetNodeId, properties });
const nextStepCode = (doc: ProcessDesignerDocument) => ((Math.max(0, ...doc.nodes.map((node) => node.properties.stepCode ?? 0))) + 100);

function createTaskNode(type: 'user-task' | 'approver-task', textValue: string, x: number, y: number, stepCode: number): ProcessDesignerNode {
  const isUserTask = type === 'user-task';
  return { id: createId(isUserTask ? 'user' : 'task'), type, textValue, properties: { x, y, stepCode, stepGroup: textValue, assigneeMode: isUserTask ? 'initiator' : 'role', assigneeLabel: isUserTask ? '发起人' : '默认审批角色', description: isUserTask ? '由业务发起人提交流程' : '待配置审批规则' } };
}

function createGatewayNode(type: 'exclusive-gateway' | 'parallel-gateway', textValue: string, x: number, y: number): ProcessDesignerNode {
  return { id: createId(type === 'exclusive-gateway' ? 'exclusive' : 'parallel'), type, textValue, properties: { x, y, stepGroup: textValue, conditionSummary: type === 'exclusive-gateway' ? '请配置分支判断规则' : undefined, parallelMode: type === 'parallel-gateway' ? 'all' : undefined, description: type === 'parallel-gateway' ? '多个审批分支同时发起' : '按条件命中不同流转分支' } };
}

function reconnectAfterNodeDelete(doc: ProcessDesignerDocument, nodeId: string) {
  const incoming = doc.edges.filter((item) => item.targetNodeId === nodeId);
  const outgoing = doc.edges.filter((item) => item.sourceNodeId === nodeId);
  const nodes = doc.nodes.filter((node) => node.id !== nodeId);
  const edges = doc.edges.filter((item) => item.targetNodeId !== nodeId && item.sourceNodeId !== nodeId);
  return incoming.length === 1 && outgoing.length === 1 ? { nodes, edges: edges.concat(createEdge(incoming[0].sourceNodeId, outgoing[0].targetNodeId, outgoing[0].properties)) } : { nodes, edges };
}

function shiftRight(doc: ProcessDesignerDocument, fromX: number, dx: number, keepIds: string[] = []) {
  return doc.nodes.map((node) => keepIds.includes(node.id) || node.properties.x < fromX ? node : { ...node, properties: { ...node.properties, x: node.properties.x + dx } });
}

function insertApproval(doc: ProcessDesignerDocument, edgeId: string) {
  const edge = doc.edges.find((item) => item.id === edgeId);
  if (!edge) return null;
  const source = doc.nodes.find((node) => node.id === edge.sourceNodeId);
  const target = doc.nodes.find((node) => node.id === edge.targetNodeId);
  if (!source || !target) return null;
  const shiftedNodes = shiftRight(doc, target.properties.x, GAP_X, [source.id]);
  const shiftedTarget = shiftedNodes.find((node) => node.id === target.id) ?? target;
  const inserted = createTaskNode('approver-task', `审批节点 ${doc.nodes.filter((node) => node.type === 'approver-task').length + 1}`, source.properties.x + GAP_X, Math.round((source.properties.y + shiftedTarget.properties.y) / 2), nextStepCode(doc));
  return { nodes: [...shiftedNodes, inserted], edges: doc.edges.filter((item) => item.id !== edgeId).concat(createEdge(source.id, inserted.id), createEdge(inserted.id, shiftedTarget.id)), selectedNodeId: inserted.id };
}

function insertBranch(doc: ProcessDesignerDocument, edgeId: string) {
  const edge = doc.edges.find((item) => item.id === edgeId);
  if (!edge) return null;
  const source = doc.nodes.find((node) => node.id === edge.sourceNodeId);
  const target = doc.nodes.find((node) => node.id === edge.targetNodeId);
  if (!source || !target) return null;
  const shiftedNodes = shiftRight(doc, target.properties.x, GAP_X * 2, [source.id]);
  const shiftedTarget = shiftedNodes.find((node) => node.id === target.id) ?? target;
  const centerY = Math.round((source.properties.y + shiftedTarget.properties.y) / 2);
  const gateway = createGatewayNode('exclusive-gateway', '条件分支', source.properties.x + GAP_X, centerY);
  const branchA = createTaskNode('approver-task', '分支 A', gateway.properties.x + GAP_X, centerY - GAP_Y, nextStepCode(doc));
  const branchB = createTaskNode('approver-task', '分支 B', gateway.properties.x + GAP_X, centerY + GAP_Y, nextStepCode(doc) + 100);
  return { nodes: [...shiftedNodes, gateway, branchA, branchB], edges: doc.edges.filter((item) => item.id !== edgeId).concat(createEdge(source.id, gateway.id), createEdge(gateway.id, branchA.id, { conditionLabel: '条件 A', conditionExpression: 'conditionA == true', priority: 1 }), createEdge(gateway.id, branchB.id, { conditionLabel: '条件 B', conditionExpression: 'conditionB == true', priority: 2 }), createEdge(branchA.id, shiftedTarget.id), createEdge(branchB.id, shiftedTarget.id)), selectedNodeId: gateway.id };
}

function insertParallel(doc: ProcessDesignerDocument, edgeId: string) {
  const edge = doc.edges.find((item) => item.id === edgeId);
  if (!edge) return null;
  const source = doc.nodes.find((node) => node.id === edge.sourceNodeId);
  const target = doc.nodes.find((node) => node.id === edge.targetNodeId);
  if (!source || !target) return null;
  const shiftedNodes = shiftRight(doc, target.properties.x, GAP_X * 3, [source.id]);
  const shiftedTarget = shiftedNodes.find((node) => node.id === target.id) ?? target;
  const centerY = Math.round((source.properties.y + shiftedTarget.properties.y) / 2);
  const open = createGatewayNode('parallel-gateway', '并行发起', source.properties.x + GAP_X, centerY);
  const close = createGatewayNode('parallel-gateway', '并行汇聚', source.properties.x + GAP_X * 3, centerY);
  const nodeA = createTaskNode('approver-task', '会签 A', source.properties.x + GAP_X * 2, centerY - GAP_Y, nextStepCode(doc));
  const nodeB = createTaskNode('approver-task', '会签 B', source.properties.x + GAP_X * 2, centerY + GAP_Y, nextStepCode(doc) + 100);
  return { nodes: [...shiftedNodes, open, close, nodeA, nodeB], edges: doc.edges.filter((item) => item.id !== edgeId).concat(createEdge(source.id, open.id), createEdge(open.id, nodeA.id), createEdge(open.id, nodeB.id), createEdge(nodeA.id, close.id), createEdge(nodeB.id, close.id), createEdge(close.id, shiftedTarget.id)), selectedNodeId: open.id };
}

const getNodeSummary = (node: ProcessDesignerNode) => node.properties.assigneeLabel || node.properties.conditionSummary || node.properties.branchLabel || node.properties.parallelMode || node.properties.stepGroup || node.properties.assigneeMode || '点击后配置属性';
const getOutgoingEdges = (doc: ProcessDesignerDocument, nodeId: string) => doc.edges.filter((edge) => edge.sourceNodeId === nodeId);

export function ProcessDesignerStudio({ className, onToast, onChange, value }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [insertMenu, setInsertMenu] = useState<InsertMenu>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = useMemo(() => value.nodes.find((node) => node.id === selectedNodeId) ?? null, [selectedNodeId, value.nodes]);
  const selectedEdge = useMemo(() => value.edges.find((edge) => edge.id === selectedEdgeId) ?? null, [selectedEdgeId, value.edges]);
  const canvasSize = useMemo(() => getProcessDesignerCanvasSize(value), [value]);

  const closeDrawer = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);
  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const viewport = viewportRef.current;
    if (!rect || !viewport) return { x: clientX, y: clientY };
    return { x: clientX - rect.left + viewport.scrollLeft, y: clientY - rect.top + viewport.scrollTop };
  }, []);

  const updateNode = (nodeId: string, patch: Partial<Omit<ProcessDesignerNode, 'properties'>> & { properties?: Partial<ProcessDesignerNode['properties']> }) => onChange({ ...value, nodes: value.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch, properties: { ...node.properties, ...(patch.properties ?? {}) } } : node)) });
  const updateEdge = (edgeId: string, patch: Partial<Omit<ProcessDesignerEdge, 'properties'>> & { properties?: Partial<ProcessDesignerEdge['properties']> }) => onChange({ ...value, edges: value.edges.map((edge) => (edge.id === edgeId ? { ...edge, ...patch, properties: { ...edge.properties, ...(patch.properties ?? {}) } } : edge)) });

  const deleteNode = useCallback((nodeId: string) => {
    const currentNode = value.nodes.find((node) => node.id === nodeId);
    if (!currentNode) return;
    if (currentNode.type === 'start-node' || currentNode.type === 'end-node') {
      onToast?.('开始和结束节点暂不允许删除。');
      return;
    }
    const next = reconnectAfterNodeDelete(value, nodeId);
    const nextValue = { ...value, nodes: next.nodes, edges: next.edges };
    onChange(nextValue);
    closeDrawer();
    setInsertMenu(null);
    onToast?.('已删除节点。');
  }, [closeDrawer, onChange, onToast, value]);

  const deleteEdge = useCallback((edgeId: string) => {
    const nextValue = { ...value, edges: value.edges.filter((edge) => edge.id !== edgeId) };
    onChange(nextValue);
    setSelectedEdgeId(null);
    setInsertMenu(null);
    onToast?.('已删除连线。');
  }, [onChange, onToast, value]);

  const insertByKind = useCallback((kind: 'approver' | 'branch' | 'parallel', edgeId: string) => {
    const inserted = kind === 'approver' ? insertApproval(value, edgeId) : kind === 'branch' ? insertBranch(value, edgeId) : insertParallel(value, edgeId);
    if (!inserted) {
      onToast?.('当前连线无法插入新的流程节点。');
      return;
    }
    const nextValue = { ...value, nodes: inserted.nodes, edges: inserted.edges };
    onChange(nextValue);
    setSelectedNodeId(inserted.selectedNodeId);
    setSelectedEdgeId(null);
    setInsertMenu(null);
    onToast?.(kind === 'approver' ? '已插入审批节点。' : kind === 'branch' ? '已插入条件分支。' : '已插入并行会签。');
  }, [onChange, onToast, value]);

  const insertAfterNode = useCallback((nodeId: string, kind: 'approver' | 'branch' | 'parallel') => {
    const outgoing = value.edges.filter((edge) => edge.sourceNodeId === nodeId);
    if (outgoing.length !== 1) {
      onToast?.('当前节点不是单出口，暂时不能直接从节点工具条插入。');
      return;
    }
    insertByKind(kind, outgoing[0].id);
  }, [insertByKind, onToast, value]);

  useEffect(() => {
    if (!dragState) return undefined;
    const handleMouseMove = (event: MouseEvent) => {
      const point = getCanvasPoint(event.clientX, event.clientY);
      const nextNodes = value.nodes.map((node) => (node.id === dragState.nodeId ? {
        ...node,
        properties: {
          ...node.properties,
          x: Math.max(MIN_POS, Math.round(point.x - dragState.offsetX)),
          y: Math.max(MIN_POS, Math.round(point.y - dragState.offsetY)),
        },
      } : node));
      onChange({ ...value, nodes: nextNodes });
    };
    const handleMouseUp = () => setDragState(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, getCanvasPoint, onChange, value]);



  return (
    <section className={cn('relative min-h-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-4 shadow-sm dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.92))]', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[16px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">流程画布</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-300">以画布为主工作区，支持拖动节点、Delete 删除，以及从连线中间快速插入节点。</div>
        </div>
        <div className="rounded-full border border-slate-200/80 bg-white/85 px-3 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">点击节点后，从右侧抽屉编辑属性</div>
      </div>

      <div ref={viewportRef} className="scrollbar-none mt-4 min-h-0 h-[calc(100%-4rem)] overflow-auto rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.92))] p-4 dark:border-slate-700 dark:bg-slate-950/60">
        <div ref={canvasRef} className="relative rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.32))] dark:bg-slate-950/20" style={{ height: Math.max(canvasSize.height, 560), minWidth: Math.max(canvasSize.width, 1100) }} onMouseDown={(event) => { if (event.target === event.currentTarget) { closeDrawer(); setInsertMenu(null); } }}>
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {value.edges.map((edge) => {
              const source = value.nodes.find((node) => node.id === edge.sourceNodeId);
              const target = value.nodes.find((node) => node.id === edge.targetNodeId);
              if (!source || !target) return null;
              const sx = source.properties.x + NODE_W;
              const sy = source.properties.y + NODE_H / 2;
              const tx = target.properties.x;
              const ty = target.properties.y + NODE_H / 2;
              const mx = sx + (tx - sx) / 2;
              return (
                <g key={edge.id}>
                  <polyline points={`${sx},${sy} ${mx},${sy} ${mx},${ty} ${tx},${ty}`} fill="none" stroke={edge.id === selectedEdgeId ? '#3162ff' : '#94a3b8'} strokeWidth={edge.id === selectedEdgeId ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" onClick={() => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); setInsertMenu(null); }} className="cursor-pointer" />
                  {(edge.properties.conditionLabel || edge.properties.conditionExpression) ? <text x={mx} y={Math.min(sy, ty) - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-bold dark:fill-slate-300">{edge.properties.conditionLabel || edge.properties.conditionExpression}</text> : null}
                </g>
              );
            })}
          </svg>

          {value.edges.map((edge) => {
            const source = value.nodes.find((node) => node.id === edge.sourceNodeId);
            const target = value.nodes.find((node) => node.id === edge.targetNodeId);
            if (!source || !target) return null;
            const sx = source.properties.x + NODE_W;
            const sy = source.properties.y + NODE_H / 2;
            const tx = target.properties.x;
            const ty = target.properties.y + NODE_H / 2;
            return (
              <button key={`${edge.id}_insert`} type="button" onClick={() => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); setInsertMenu({ edgeId: edge.id, x: sx + (tx - sx) / 2, y: sy + (ty - sy) / 2 }); }} className="absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.4)] transition-all hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" style={{ left: sx + (tx - sx) / 2, top: sy + (ty - sy) / 2 }}>
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            );
          })}

          {insertMenu ? (
            <div className="absolute z-20 min-w-[240px] -translate-x-1/2 rounded-[20px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900/95" style={{ left: insertMenu.x, top: insertMenu.y + 32 }}>
              <div className="mb-2 px-1 text-[11px] font-bold tracking-[0.08em] text-slate-400">添加节点</div>
              {[
                ['approver', 'person_add', '审批节点', '插入一个普通审批步骤'],
                ['branch', 'call_split', '条件分支', '创建一组条件分支'],
                ['parallel', 'join_full', '并行会签', '创建并行审批分支'],
              ].map(([kind, icon, label, desc]) => (
                <button key={kind} type="button" onClick={() => insertByKind(kind as 'approver' | 'branch' | 'parallel', insertMenu.edgeId)} className="mb-2 inline-flex w-full items-start gap-3 rounded-[16px] border border-slate-200/80 bg-slate-50 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-950/50">
                  <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">{icon}</span>
                  <span><span className="block text-[12px] font-bold text-slate-800 dark:text-slate-100">{label}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-300">{desc}</span></span>
                </button>
              ))}
              <button type="button" onClick={() => setInsertMenu(null)} className="w-full rounded-[14px] px-3 py-2 text-[12px] font-bold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200">关闭</button>
            </div>
          ) : null}

          {value.nodes.map((node) => {
            const meta = META[node.type];
            const showNodeTools = hoverNodeId === node.id || selectedNodeId === node.id;
            const outgoingEdges = getOutgoingEdges(value, node.id);
            const showBranchSummary = node.type === 'exclusive-gateway' || node.type === 'parallel-gateway';
            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  onMouseEnter={() => setHoverNodeId(node.id)}
                  onMouseLeave={() => setHoverNodeId((current) => (current === node.id ? null : current))}
                  onMouseDown={(event) => {
                    const point = getCanvasPoint(event.clientX, event.clientY);
                    setDragState({ nodeId: node.id, offsetX: point.x - node.properties.x, offsetY: point.y - node.properties.y });
                    setSelectedNodeId(node.id);
                    setSelectedEdgeId(null);
                    setInsertMenu(null);
                  }}
                  className={cn('absolute flex h-[76px] w-[156px] cursor-grab flex-col items-start justify-between rounded-[20px] border px-4 py-3 text-left shadow-[0_18px_40px_-32px_rgba(15,23,42,0.34)] transition-all active:cursor-grabbing', meta.accent, node.id === selectedNodeId && 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-950')}
                  style={{ left: node.properties.x, top: node.properties.y }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-1 text-[10px] font-black dark:bg-slate-950/40"><span className="material-symbols-outlined text-[13px]">{meta.icon}</span>{meta.label}</span>
                    <span className="material-symbols-outlined text-[16px] opacity-50">drag_indicator</span>
                  </div>
                  <div className="w-full">
                    <div className="truncate text-[14px] font-black tracking-[-0.02em]">{node.textValue}</div>
                    <div className="mt-1 truncate text-[10px] opacity-80">{getNodeSummary(node)}</div>
                  </div>
                </button>

                {showNodeTools ? (
                  <div
                    className="absolute z-20 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-2 py-1 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900/95"
                    style={{ left: node.properties.x + NODE_W - 8, top: node.properties.y - 18 }}
                    onMouseEnter={() => setHoverNodeId(node.id)}
                    onMouseLeave={() => setHoverNodeId((current) => (current === node.id ? null : current))}
                  >
                    {node.type !== 'end-node' ? (
                      <>
                        <button
                          type="button"
                          title="后插审批"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.stopPropagation();
                            insertAfterNode(node.id, 'approver');
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                        <button
                          type="button"
                          title="后插分支"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.stopPropagation();
                            insertAfterNode(node.id, 'branch');
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[18px]">call_split</span>
                        </button>
                      </>
                    ) : null}
                    {node.type !== 'start-node' && node.type !== 'end-node' ? (
                      <button
                        type="button"
                        title="删除节点"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {showBranchSummary && outgoingEdges.length > 0 ? (
                  <div
                    className="absolute z-10 min-w-[180px] max-w-[260px] rounded-[18px] border border-slate-200/80 bg-white/90 px-3 py-2 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.25)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
                    style={{ left: node.properties.x - 8, top: node.properties.y + NODE_H + 12 }}
                  >
                    <div className="text-[10px] font-black tracking-[0.08em] text-slate-400">
                      {node.type === 'exclusive-gateway' ? 'BRANCHES' : 'PARALLEL PATHS'}
                    </div>
                    <div className="mt-2 grid gap-2">
                      {outgoingEdges.map((edge, index) => (
                        <div key={edge.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedEdgeId(edge.id);
                              setSelectedNodeId(null);
                              setInsertMenu(null);
                            }}
                            className={cn(
                              'min-w-0 flex-1 rounded-full border px-2.5 py-1 text-left text-[10px] font-bold transition-all',
                              edge.id === selectedEdgeId
                                ? 'border-primary/20 bg-primary/10 text-primary'
                                : 'border-slate-200/80 bg-slate-50 text-slate-500 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300',
                            )}
                          >
                            {edge.properties.conditionLabel || (node.type === 'exclusive-gateway' ? `分支 ${index + 1}` : `并行 ${index + 1}`)}
                          </button>
                          <button
                            type="button"
                            title="在该分支上新增审批节点"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.stopPropagation();
                              insertByKind('approver', edge.id);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 transition-all hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {(selectedNode || selectedEdge) ? (
        <div className="pointer-events-none absolute inset-y-4 right-4 z-30 flex justify-end">
          <aside className="pointer-events-auto flex h-full w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-28px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-700">
              <div><div className="text-[15px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">{selectedNode ? '节点配置' : '连线配置'}</div><div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-300">这里集中处理选中对象的属性、规则和删除动作。</div></div>
              <button type="button" onClick={closeDrawer} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 transition-colors hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selectedNode ? (
                <div className="grid gap-4">
                  <Card title="基础信息"><div className="grid gap-4"><Field label="节点名称"><input className={INPUT} value={selectedNode.textValue} onChange={(event) => updateNode(selectedNode.id, { textValue: event.target.value })} /></Field><Field label="步骤代码"><input className={INPUT} value={selectedNode.properties.stepCode ?? ''} onChange={(event) => updateNode(selectedNode.id, { properties: { stepCode: event.target.value ? Number(event.target.value) : undefined } })} /></Field><Field label="步骤分组"><input className={INPUT} value={selectedNode.properties.stepGroup ?? ''} onChange={(event) => updateNode(selectedNode.id, { properties: { stepGroup: event.target.value } })} /></Field><Field label="节点说明"><textarea className={TEXTAREA} value={selectedNode.properties.description ?? ''} onChange={(event) => updateNode(selectedNode.id, { properties: { description: event.target.value } })} /></Field></div></Card>
                  {(selectedNode.type === 'user-task' || selectedNode.type === 'approver-task') ? <Card title="审批设置" desc="先选审批模式，再填写审批对象。"><div className="grid gap-4"><Segmented options={ASSIGNEE_OPTIONS} value={selectedNode.properties.assigneeMode ?? ''} onChange={(assigneeMode) => updateNode(selectedNode.id, { properties: { assigneeMode } })} /><Field label="审批对象"><input className={INPUT} value={selectedNode.properties.assigneeLabel ?? ''} onChange={(event) => updateNode(selectedNode.id, { properties: { assigneeLabel: event.target.value } })} /></Field></div></Card> : null}
                  {selectedNode.type === 'exclusive-gateway' ? <Card title="分支规则"><Field label="判断摘要"><textarea className={TEXTAREA} value={selectedNode.properties.conditionSummary ?? ''} onChange={(event) => updateNode(selectedNode.id, { properties: { conditionSummary: event.target.value } })} /></Field></Card> : null}
                  {selectedNode.type === 'parallel-gateway' ? <Card title="并行策略"><div className="grid gap-4"><Segmented options={PARALLEL_OPTIONS} value={selectedNode.properties.parallelMode ?? 'all'} onChange={(parallelMode) => updateNode(selectedNode.id, { properties: { parallelMode } })} /><Field label="说明"><textarea className={TEXTAREA} value={selectedNode.properties.description ?? ''} onChange={(event) => updateNode(selectedNode.id, { properties: { description: event.target.value } })} /></Field></div></Card> : null}
                  <Card title="节点操作" desc="开始和结束节点会被保护。"><button type="button" onClick={() => deleteNode(selectedNode.id)} disabled={selectedNode.type === 'start-node' || selectedNode.type === 'end-node'} className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"><span className="material-symbols-outlined text-[18px]">delete</span>删除当前节点</button></Card>
                </div>
              ) : selectedEdge ? (
                <div className="grid gap-4">
                  <Card title="快捷条件">{EDGE_PRESETS.map((preset) => <button key={preset.label} type="button" onClick={() => updateEdge(selectedEdge.id, { properties: { conditionLabel: preset.label, conditionExpression: preset.expression, priority: preset.priority } })} className="mb-2 w-full rounded-[14px] border border-slate-200/80 bg-slate-50 px-3 py-2 text-left text-[12px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">{preset.label}</button>)}</Card>
                  <Card title="连线属性"><div className="grid gap-4"><Field label="连线标签"><input className={INPUT} value={selectedEdge.properties.conditionLabel ?? ''} onChange={(event) => updateEdge(selectedEdge.id, { properties: { conditionLabel: event.target.value } })} /></Field><Field label="条件表达式"><textarea className={`${INPUT} min-h-[120px] resize-none py-3`} value={selectedEdge.properties.conditionExpression ?? ''} onChange={(event) => updateEdge(selectedEdge.id, { properties: { conditionExpression: event.target.value } })} /></Field><Field label="优先级"><input className={INPUT} value={selectedEdge.properties.priority ?? ''} onChange={(event) => updateEdge(selectedEdge.id, { properties: { priority: event.target.value ? Number(event.target.value) : undefined } })} /></Field></div></Card>
                  <Card title="连线操作"><button type="button" onClick={() => deleteEdge(selectedEdge.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"><span className="material-symbols-outlined text-[18px]">delete</span>删除当前连线</button></Card>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="grid gap-2 text-[11px] font-bold tracking-[0.04em] text-slate-500 dark:text-slate-300"><span>{label}</span>{children}</label>;
}

function Card({ children, desc, title }: { children: React.ReactNode; desc?: string; title: string }) {
  return <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40"><div className="text-[13px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">{title}</div>{desc ? <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-300">{desc}</div> : null}<div className="mt-4">{children}</div></section>;
}

function Segmented({ onChange, options, value }: { onChange: (value: string) => void; options: Array<{ label: string; value: string }>; value: string }) {
  return <div className="grid grid-cols-2 gap-2">{options.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={cn('rounded-[14px] border px-3 py-2 text-[12px] font-bold transition-all', option.value === value ? 'border-primary/20 bg-primary/10 text-primary' : 'border-slate-200/80 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200')}>{option.label}</button>)}</div>;
}

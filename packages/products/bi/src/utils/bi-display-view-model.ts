import type { BiDirectoryNode, BiScreen } from '../types';

export type BiDisplayBadgeTone = 'danger' | 'neutral' | 'success' | 'warning';

export type BiDisplayScreenMap = Map<number, BiScreen[]>;

export type BiDisplayNodeBadge = {
  label: string;
  tone: BiDisplayBadgeTone;
};

export type BiDisplayScreenMix = {
  external: number;
  internal: number;
  total: number;
  unbound: number;
};

export type BiDisplayNodeSummary = {
  accent: string;
  activeNodes: number;
  activeRate: number;
  badge: BiDisplayNodeBadge;
  boundScreens: number;
  childCount: number;
  datasourceCount: number;
  node: BiDirectoryNode;
  screenMix: BiDisplayScreenMix;
  totalNodes: number;
};

const ACTIVE_STATUSES = new Set(['ACTIVE', 'PUBLISHED']);
const FALLBACK_ACCENTS = ['#00eaff', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

function normalizeStatus(status?: string | null) {
  return (status ?? 'ACTIVE').trim().toUpperCase();
}

function collectSubtreeNodes(node: BiDirectoryNode): BiDirectoryNode[] {
  return [node, ...node.children.flatMap((child) => collectSubtreeNodes(child))];
}

function isActiveNode(status?: string | null) {
  return ACTIVE_STATUSES.has(normalizeStatus(status));
}

function getNodeScreenKind(node: BiDirectoryNode, screenMap: BiDisplayScreenMap) {
  const screens = screenMap.get(node.id) ?? [];
  if (screens.some((screen) => screen.biType === 'INTERNAL')) {
    return 'internal' as const;
  }

  if (screens.some((screen) => screen.biType === 'EXTERNAL')) {
    return 'external' as const;
  }

  return 'unbound' as const;
}

export function buildDisplayScreenMap(screens: BiScreen[]): BiDisplayScreenMap {
  const screenMap = new Map<number, BiScreen[]>();

  screens.forEach((screen) => {
    const list = screenMap.get(screen.nodeId) ?? [];
    list.push(screen);
    screenMap.set(screen.nodeId, list);
  });

  return screenMap;
}

export function getDisplayAccent(node: BiDirectoryNode, fallbackIndex: number): string {
  const accent = node.canvasMeta?.accent;
  return typeof accent === 'string' && accent.trim()
    ? accent.trim()
    : (FALLBACK_ACCENTS[fallbackIndex % FALLBACK_ACCENTS.length] ?? '#00eaff');
}

export function getDisplayBadge(
  status: string | null | undefined,
  hasScreens: boolean,
): BiDisplayNodeBadge {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === 'DISABLED') {
    return { label: '已停用', tone: 'danger' };
  }

  if (normalizedStatus === 'FAILED') {
    return { label: '异常', tone: 'danger' };
  }

  if (normalizedStatus === 'DRAFT') {
    return { label: '草稿', tone: 'warning' };
  }

  if (hasScreens) {
    return { label: '已绑定', tone: 'success' };
  }

  return { label: '待完善', tone: 'neutral' };
}

export function summarizeDisplayNode(
  node: BiDirectoryNode,
  screenMap: BiDisplayScreenMap,
  fallbackIndex = 0,
): BiDisplayNodeSummary {
  const subtreeNodes = collectSubtreeNodes(node);
  const screenMix: BiDisplayScreenMix = {
    external: 0,
    internal: 0,
    total: subtreeNodes.length,
    unbound: 0,
  };

  let activeNodes = 0;
  let boundScreens = 0;
  let datasourceCount = 0;

  subtreeNodes.forEach((currentNode) => {
    const nodeScreens = screenMap.get(currentNode.id) ?? [];
    if (isActiveNode(currentNode.status)) {
      activeNodes += 1;
    }

    datasourceCount += currentNode.datasourceIds.length;
    boundScreens += nodeScreens.length;
    screenMix[getNodeScreenKind(currentNode, screenMap)] += 1;
  });

  const totalNodes = subtreeNodes.length || 1;

  return {
    accent: getDisplayAccent(node, fallbackIndex),
    activeNodes,
    activeRate: activeNodes / totalNodes,
    badge: getDisplayBadge(node.status, boundScreens > 0),
    boundScreens,
    childCount: node.children.length,
    datasourceCount,
    node,
    screenMix,
    totalNodes,
  };
}

export function buildDisplayNodeSummaries(nodes: BiDirectoryNode[], screenMap: BiDisplayScreenMap) {
  return nodes.map((node, index) => summarizeDisplayNode(node, screenMap, index));
}

export function formatDisplayRate(rate: number) {
  const percent = Math.max(0, Math.min(1, rate)) * 100;
  const precision = Number.isInteger(percent) ? 0 : 1;
  return `${percent.toFixed(precision)}%`;
}

export function getDisplayScreenMixSegments(summary: BiDisplayNodeSummary) {
  const total = Math.max(summary.screenMix.total, 1);

  return [
    {
      key: 'internal',
      label: '内部',
      percentage: (summary.screenMix.internal / total) * 100,
      value: summary.screenMix.internal,
    },
    {
      key: 'external',
      label: '外链',
      percentage: (summary.screenMix.external / total) * 100,
      value: summary.screenMix.external,
    },
    {
      key: 'unbound',
      label: '未绑定',
      percentage: (summary.screenMix.unbound / total) * 100,
      value: summary.screenMix.unbound,
    },
  ] as const;
}

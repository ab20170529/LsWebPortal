import type { BiDirectoryNode } from '../types';

const DISPLAY_NODE_TYPES = new Set([
  'ANALYSIS_DIM',
  'COMPANY',
  'DEPARTMENT',
  'FACTORY',
  'GROUP',
  'LINE',
  'ORG',
  'ORGANIZATION',
  'SUB_DIM',
  'TEAM',
  'WORKSHOP',
]);

function normalizeNodeType(nodeType?: string | null) {
  return (nodeType ?? '').trim().toUpperCase();
}

function pruneNode(node: BiDirectoryNode): BiDirectoryNode | null {
  const normalizedType = normalizeNodeType(node.nodeType);
  const children = node.children
    .map((child) => pruneNode(child))
    .filter((child): child is BiDirectoryNode => child !== null);

  if (DISPLAY_NODE_TYPES.has(normalizedType) || children.length > 0 || node.parentId == null) {
    return {
      ...node,
      children,
    };
  }

  return null;
}

export function pruneOrganizationForest(nodes: BiDirectoryNode[]) {
  return nodes
    .map((node) => pruneNode(node))
    .filter((node): node is BiDirectoryNode => node !== null);
}

export function findNodeByCode(nodes: BiDirectoryNode[], nodeCode: string): BiDirectoryNode | null {
  for (const node of nodes) {
    if (node.nodeCode === nodeCode) {
      return node;
    }

    const childMatch = findNodeByCode(node.children, nodeCode);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

export function findNodeById(nodes: BiDirectoryNode[], nodeId: number): BiDirectoryNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    const childMatch = findNodeById(node.children, nodeId);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

export function findPreferredDisplayRoot(nodes: BiDirectoryNode[], preferredCode: string) {
  const directMatch = preferredCode ? findNodeByCode(nodes, preferredCode) : null;
  if (directMatch) {
    return directMatch;
  }

  const preferredRoot = nodes.find((node) => normalizeNodeType(node.nodeType) === 'COMPANY');
  if (preferredRoot) {
    return preferredRoot;
  }

  return nodes[0] ?? null;
}

export function findDisplayNodeForRoute(
  nodes: BiDirectoryNode[],
  preferredCode: string,
  nodeCode?: string | null,
) {
  const rootNode = findPreferredDisplayRoot(nodes, preferredCode);

  if (!rootNode) {
    return { rootNode: null, selectedNode: null };
  }

  if (!nodeCode) {
    return { rootNode, selectedNode: rootNode };
  }

  const selectedNode =
    rootNode.nodeCode === nodeCode ? rootNode : findNodeByCode([rootNode], nodeCode);

  return { rootNode, selectedNode };
}

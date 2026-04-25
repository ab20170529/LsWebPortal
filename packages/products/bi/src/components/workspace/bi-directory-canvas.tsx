import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { Button } from '@lserp/ui';

import type { BiCanvasMeta, BiDirectoryNode } from '../../types';
import { flattenDirectoryNodes, getNodeCanvasMeta } from '../../utils/bi-directory';
import { GridIcon, PlusIcon } from './bi-icons';
import { BiNodeCard } from './bi-node-card';

type BiDirectoryCanvasProps = {
  archiveCountByNodeId: Record<number, number>;
  assetCount: number;
  focusRequest?: number;
  layoutMap: Record<number, BiCanvasMeta>;
  maxLevel: number;
  nodes: BiDirectoryNode[];
  onDeleteNode: (node: BiDirectoryNode) => void;
  onDesignInternalArchive: (node: BiDirectoryNode) => void;
  onEditNode: (node: BiDirectoryNode) => void;
  onQuickAddChild: (node: BiDirectoryNode) => void;
  onQuickAddRoot: () => void;
  onQuickCreateExternalArchive: (node: BiDirectoryNode) => void;
  onSaveLayout: () => void;
  onSelectNode: (nodeId: number) => void;
  onUpdateNodeLayout: (nodeId: number, patch: Partial<BiCanvasMeta>) => void;
  selectedNodeId: number | null;
};

type ConnectorLine = {
  fromId: number;
  fromX: number;
  fromY: number;
  id: string;
  toId: number;
  toX: number;
  toY: number;
};

const CONNECTOR_ARROW_GAP = 28;

function SaveStageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M5 5h11l3 3v11H5zM8 5v6h8V5M8 18h8"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function BiDirectoryCanvas({
  archiveCountByNodeId,
  assetCount,
  focusRequest = 0,
  layoutMap,
  maxLevel,
  nodes,
  onDeleteNode,
  onDesignInternalArchive,
  onEditNode,
  onQuickAddChild,
  onQuickAddRoot,
  onQuickCreateExternalArchive,
  onSaveLayout,
  onSelectNode,
  onUpdateNodeLayout,
  selectedNodeId,
}: BiDirectoryCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const canvasPanStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [highlightedNodeId, setHighlightedNodeId] = useState<number | null>(null);
  const branchFocusEnabled = false;
  const flatNodes = useMemo(() => flattenDirectoryNodes(nodes), [nodes]);
  const dragFrameIdState = useMemo(() => ({ current: null as number | null }), []);
  const selectedNode = useMemo(
    () => flatNodes.find((node) => node.id === selectedNodeId) ?? null,
    [flatNodes, selectedNodeId],
  );
  const nodeIndex = useMemo(() => {
    const map = new Map<number, BiDirectoryNode>();
    flatNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [flatNodes]);
  const selectedPath = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    const path: BiDirectoryNode[] = [];
    let current: BiDirectoryNode | null = selectedNode;
    while (current) {
      path.unshift(current);
      current = current.parentId ? nodeIndex.get(current.parentId) ?? null : null;
    }
    return path;
  }, [nodeIndex, selectedNode]);
  const visibleNodes = flatNodes;
  const displayStats = useMemo(
    () => ({
      assetCount,
      levelCount: Math.max(1, maxLevel),
    }),
    [assetCount, maxLevel],
  );
  const searchMatches = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return [];
    }
    return flatNodes.filter((node) => {
      const nodeName = node.nodeName.toLowerCase();
      const nodeCode = node.nodeCode.toLowerCase();
      const nodeTypeName = (node.nodeTypeName ?? node.nodeType).toLowerCase();
      return nodeName.includes(keyword) || nodeCode.includes(keyword) || nodeTypeName.includes(keyword);
    });
  }, [flatNodes, searchTerm]);
  const subtreeArchiveCountByNodeId = useMemo(() => {
    const countMap: Record<number, number> = {};

    const collectSubtreeArchiveCount = (node: BiDirectoryNode): number => {
      const childArchiveCount = node.children.reduce(
        (total, child) => total + collectSubtreeArchiveCount(child),
        0,
      );
      const subtreeArchiveCount = (archiveCountByNodeId[node.id] ?? 0) + childArchiveCount;
      countMap[node.id] = subtreeArchiveCount;
      return subtreeArchiveCount;
    };

    nodes.forEach((node) => {
      collectSubtreeArchiveCount(node);
    });

    return countMap;
  }, [archiveCountByNodeId, nodes]);
  const connectors = useMemo<ConnectorLine[]>(() => {
    return visibleNodes
      .filter((node) => node.parentId)
      .flatMap((node) => {
        const parent = node.parentId ? nodeIndex.get(node.parentId) : null;
        if (!parent) {
          return [];
        }
        const parentLayout = getNodeCanvasMeta(parent, layoutMap);
        const nodeLayout = getNodeCanvasMeta(node, layoutMap);
        return [
          {
            fromX: parentLayout.x + parentLayout.width,
            fromY: parentLayout.y + parentLayout.height / 2,
            fromId: parent.id,
            id: `${parent.id}-${node.id}`,
            toId: node.id,
            toX: nodeLayout.x - CONNECTOR_ARROW_GAP,
            toY: nodeLayout.y + nodeLayout.height / 2,
          },
        ];
      });
  }, [layoutMap, nodeIndex, visibleNodes]);

  function handlePointerDown(node: BiDirectoryNode, event: { clientX: number; clientY: number }) {
    const layout = getNodeCanvasMeta(node, layoutMap);
    const dragState = {
      nodeId: node.id,
      originX: layout.x,
      originY: layout.y,
      pendingX: layout.x,
      pendingY: layout.y,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };

    const release = () => {
      if (dragFrameIdState.current !== null) {
        window.cancelAnimationFrame(dragFrameIdState.current);
        dragFrameIdState.current = null;
        onUpdateNodeLayout(dragState.nodeId, {
          x: dragState.pendingX,
          y: dragState.pendingY,
        });
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', release);
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      dragState.pendingX = Math.max(40, dragState.originX + moveEvent.clientX - dragState.pointerX);
      dragState.pendingY = Math.max(40, dragState.originY + moveEvent.clientY - dragState.pointerY);
      if (dragFrameIdState.current !== null) {
        return;
      }
      dragFrameIdState.current = window.requestAnimationFrame(() => {
        dragFrameIdState.current = null;
        onUpdateNodeLayout(dragState.nodeId, {
          x: dragState.pendingX,
          y: dragState.pendingY,
        });
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', release, { once: true });
  }

  function handleCanvasMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (!surfaceRef.current || !target) {
      return;
    }
    if (
      target.closest('.bi-node-card') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a')
    ) {
      return;
    }

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startScrollLeft = surfaceRef.current.scrollLeft;
    const startScrollTop = surfaceRef.current.scrollTop;
    event.preventDefault();
    canvasPanStateRef.current = {
      startClientX,
      startClientY,
      startScrollLeft,
      startScrollTop,
    };
    setIsPanningCanvas(true);
  }

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const panState = canvasPanStateRef.current;
      if (!surfaceRef.current || !panState) {
        return;
      }
      surfaceRef.current.scrollLeft = Math.max(0, panState.startScrollLeft + (event.clientX - panState.startClientX));
      surfaceRef.current.scrollTop = Math.max(0, panState.startScrollTop + (event.clientY - panState.startClientY));
    };

    const handleMouseUp = () => {
      canvasPanStateRef.current = null;
      setIsPanningCanvas(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasPanStateRef.current = null;
    };
  }, []);

  function focusNodeById(nodeId: number) {
    if (!surfaceRef.current) {
      return;
    }
    const targetNode = nodeIndex.get(nodeId);
    if (!targetNode) {
      return;
    }
    const layout = getNodeCanvasMeta(targetNode, layoutMap);
    surfaceRef.current.scrollTo({
      behavior: 'smooth',
      left: Math.max(0, layout.x - surfaceRef.current.clientWidth / 2 + layout.width / 2),
      top: Math.max(0, layout.y - surfaceRef.current.clientHeight / 2 + layout.height / 2),
    });
  }

  function focusSelectedNode() {
    if (!selectedNode) {
      return;
    }
    focusNodeById(selectedNode.id);
  }

  function resetCanvasViewport() {
    if (!surfaceRef.current) {
      return;
    }
    surfaceRef.current.scrollTo({
      behavior: 'smooth',
      left: 0,
      top: 0,
    });
  }

  function selectSearchMatch(index = activeSearchIndex) {
    if (searchMatches.length === 0) {
      return;
    }
    const normalizedIndex = ((index % searchMatches.length) + searchMatches.length) % searchMatches.length;
    const targetNode = searchMatches[normalizedIndex]!;
    setActiveSearchIndex(normalizedIndex);
    setHighlightedNodeId(targetNode.id);
    onSelectNode(targetNode.id);
    window.requestAnimationFrame(() => focusNodeById(targetNode.id));
  }

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (focusRequest > 0) {
      window.requestAnimationFrame(focusSelectedNode);
    }
  }, [focusRequest]);

  useEffect(() => {
    if (highlightedNodeId == null) {
      return undefined;
    }
    const timer = window.setTimeout(() => setHighlightedNodeId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [highlightedNodeId]);

  const canvasWidth = Math.max(
    2600,
    ...visibleNodes.map((node) => {
      const layout = getNodeCanvasMeta(node, layoutMap);
      return layout.x + layout.width + 280;
    }),
  );
  const canvasHeight = Math.max(
    1800,
    ...visibleNodes.map((node) => {
      const layout = getNodeCanvasMeta(node, layoutMap);
      return layout.y + layout.height + 240;
    }),
  );

  return (
    <section className="bi-canvas-panel">
      <div className="bi-canvas-toolbar">
        <div className="bi-canvas-toolbar-actions">
          <div className="bi-canvas-toolbar-group">
          <Button onClick={onQuickAddRoot} tone="ghost">
            <span className="bi-toolbar-button-content">
              <PlusIcon className="bi-toolbar-button-icon" />
              新增根节点
            </span>
          </Button>
          </div>
          <div className="bi-canvas-toolbar-group">
          <Button className="bi-canvas-toolbar-auto" onClick={resetCanvasViewport} tone="ghost">
            <span className="bi-toolbar-button-content">
              <GridIcon className="bi-toolbar-button-icon" />
              自动布局
            </span>
          </Button>
          <Button
            className="bi-canvas-toolbar-button bi-canvas-toolbar-locate"
            disabled={!selectedNode}
            onClick={focusSelectedNode}
            tone="ghost"
          >
            <span className="bi-toolbar-button-content">
              <GridIcon className="bi-toolbar-button-icon" />
              定位选中
            </span>
          </Button>
          <Button className="bi-canvas-toolbar-button" onClick={resetCanvasViewport} tone="ghost">
            <span className="bi-toolbar-button-content">
              <GridIcon className="bi-toolbar-button-icon" />
              回到默认位置
            </span>
          </Button>
          <Button
            className="bi-canvas-toolbar-button bi-canvas-toolbar-focus"
            onClick={resetCanvasViewport}
            tone="ghost"
          >
            <span className="bi-toolbar-button-content">
              <GridIcon className="bi-toolbar-button-icon" />
              {branchFocusEnabled ? '显示全部' : '聚焦分支'}
            </span>
          </Button>
          </div>
          <div className="bi-canvas-toolbar-group">
          <Button onClick={onSaveLayout} tone="ghost">
            <span className="bi-toolbar-button-content">
              <SaveStageIcon className="bi-toolbar-button-icon" />
              保存布局
            </span>
          </Button>
          </div>
        </div>

        <form
          className="bi-canvas-search"
          onSubmit={(event) => {
            event.preventDefault();
            selectSearchMatch();
          }}
        >
          <input
            className="bi-canvas-search-input"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜索节点名称 / code"
            value={searchTerm}
          />
          {searchTerm.trim() ? (
            <span className="bi-canvas-search-count">
              {searchMatches.length > 0 ? `${activeSearchIndex + 1}/${searchMatches.length}` : '0'}
            </span>
          ) : null}
          <button
            className="bi-canvas-search-nav"
            disabled={searchMatches.length < 2}
            onClick={() => selectSearchMatch(activeSearchIndex - 1)}
            type="button"
          >
            上一个
          </button>
          <button
            className="bi-canvas-search-nav"
            disabled={searchMatches.length < 2}
            onClick={() => selectSearchMatch(activeSearchIndex + 1)}
            type="button"
          >
            下一个
          </button>
          <Button disabled={searchMatches.length === 0} tone="ghost" type="submit">
            定位
          </Button>
        </form>

        <div className="bi-canvas-toolbar-stats">
          <span className="bi-canvas-toolbar-stat">层级：{displayStats.levelCount} 级</span>
          <span className="bi-canvas-toolbar-stat">分析源资产：{displayStats.assetCount}</span>
        </div>
      </div>

      {selectedPath.length > 0 ? (
        <div className="bi-canvas-pathbar" aria-label="当前路径">
          <span className="bi-canvas-pathbar-label">当前路径</span>
          <div className="bi-canvas-pathbar-list">
            {selectedPath.map((pathNode, index) => (
              <span className="bi-canvas-pathbar-item" key={pathNode.id}>
                {index > 0 ? <span className="bi-canvas-pathbar-separator">/</span> : null}
                <button
                  className={`bi-canvas-pathbar-button${pathNode.id === selectedNodeId ? ' is-current' : ''}`}
                  onClick={() => onSelectNode(pathNode.id)}
                  title={pathNode.nodeName}
                  type="button"
                >
                  {pathNode.nodeName}
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`bi-canvas-surface${isPanningCanvas ? ' is-panning' : ''}`}
        onMouseDown={handleCanvasMouseDown}
        ref={surfaceRef}
      >
        {flatNodes.length === 0 ? (
          <div className="bi-canvas-empty">
            <div className="bi-canvas-empty-title">还没有任何目录节点</div>
            <div className="bi-canvas-empty-text">
              先创建一个根节点，再继续挂接部门、分析维度、子维度以及节点下的 BI 档案。
            </div>
            <Button onClick={onQuickAddRoot}>
              <span className="bi-toolbar-button-content">
                <PlusIcon className="bi-toolbar-button-icon" />
                创建第一个根节点
              </span>
            </Button>
          </div>
        ) : (
          <div className="bi-canvas-stage" style={{ height: canvasHeight, width: canvasWidth }}>
            <svg className="bi-canvas-links" height={canvasHeight} width={canvasWidth}>
              <defs>
                <marker
                  id="bi-canvas-arrow"
                  markerHeight="7"
                  markerWidth="10"
                  orient="auto"
                  refX="10"
                  refY="3.5"
                >
                  <polygon fill="#94A3B8" points="0 0, 10 3.5, 0 7" />
                </marker>
                <marker
                  id="bi-canvas-arrow-related"
                  markerHeight="7"
                  markerWidth="10"
                  orient="auto"
                  refX="10"
                  refY="3.5"
                >
                  <polygon fill="#60A5FA" points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
              {connectors.map((line) => {
                const midX = line.fromX + (line.toX - line.fromX) * 0.48;
                return (
                  <path
                    className="is-related"
                    key={line.id}
                    d={`M${line.fromX} ${line.fromY} C${midX} ${line.fromY} ${midX} ${line.toY} ${line.toX} ${line.toY}`}
                    markerEnd="url(#bi-canvas-arrow-related)"
                  />
                );
              })}
            </svg>

            {visibleNodes.map((node) => (
              <BiNodeCard
                key={node.id}
                archiveCount={archiveCountByNodeId[node.id] ?? 0}
                canDeleteNode={
                  node.id > 0 &&
                  (subtreeArchiveCountByNodeId[node.id] ?? 0) === 0 &&
                  (node.parentId != null || node.children.length === 0)
                }
                deleteDisabledReason={
                  node.id < 0
                    ? '新建中的节点需要先保存后才能删除'
                    : node.parentId == null && node.children.length > 0
                      ? '当前是根节点，但下面还有子节点，需要先清空成空根节点才能删除'
                      : node.parentId == null
                        ? '空根节点可以删除'
                        : (subtreeArchiveCountByNodeId[node.id] ?? 0) > 0
                          ? '当前节点或下级节点仍有 BI 档案，请先清理后再删除'
                          : undefined
                }
                layout={getNodeCanvasMeta(node, layoutMap)}
                node={node}
                onDeleteNode={onDeleteNode}
                onDesignInternalArchive={onDesignInternalArchive}
                onEditNode={onEditNode}
                onPointerDown={handlePointerDown}
                onQuickAddChild={onQuickAddChild}
                onQuickCreateExternalArchive={onQuickCreateExternalArchive}
                onSelect={onSelectNode}
                searchHighlighted={node.id === highlightedNodeId}
                selected={node.id === selectedNodeId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useMemo } from 'react';
import type React from 'react';
import { Button } from '@lserp/ui';

import type { BiCanvasMeta, BiDirectoryNode } from '../../types';
import { flattenDirectoryNodes, getNodeCanvasMeta } from '../../utils/bi-directory';
import { GridIcon, PlusIcon } from './bi-icons';
import { BiNodeCard } from './bi-node-card';

type BiDirectoryCanvasProps = {
  archiveCountByNodeId: Record<number, number>;
  assetCount: number;
  layoutMap: Record<number, BiCanvasMeta>;
  maxLevel: number;
  nodes: BiDirectoryNode[];
  onAutoLayout: () => void;
  onDesignInternalArchive: (node: BiDirectoryNode) => void;
  onQuickAddChild: (node: BiDirectoryNode) => void;
  onQuickAddRoot: () => void;
  onQuickCreateExternalArchive: (node: BiDirectoryNode) => void;
  onSaveLayout: () => void;
  onSelectNode: (nodeId: number) => void;
  onUpdateNodeLayout: (nodeId: number, patch: Partial<BiCanvasMeta>) => void;
  selectedNodeId: number | null;
};

type ConnectorLine = {
  fromX: number;
  fromY: number;
  id: string;
  toX: number;
  toY: number;
};

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
  layoutMap,
  maxLevel,
  nodes,
  onAutoLayout,
  onDesignInternalArchive,
  onQuickAddChild,
  onQuickAddRoot,
  onQuickCreateExternalArchive,
  onSaveLayout,
  onSelectNode,
  onUpdateNodeLayout,
  selectedNodeId,
}: BiDirectoryCanvasProps) {
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
  const connectors = useMemo<ConnectorLine[]>(() => {
    return flatNodes
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
            id: `${parent.id}-${node.id}`,
            toX: nodeLayout.x,
            toY: nodeLayout.y + nodeLayout.height / 2,
          },
        ];
      });
  }, [flatNodes, layoutMap, nodeIndex]);

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

  const canvasWidth = Math.max(
    2600,
    ...flatNodes.map((node) => {
      const layout = getNodeCanvasMeta(node, layoutMap);
      return layout.x + layout.width + 280;
    }),
  );
  const canvasHeight = Math.max(
    1800,
    ...flatNodes.map((node) => {
      const layout = getNodeCanvasMeta(node, layoutMap);
      return layout.y + layout.height + 240;
    }),
  );

  return (
    <section className="bi-canvas-panel">
      <div className="bi-canvas-toolbar">
        <div className="bi-canvas-toolbar-actions">
          <Button onClick={onQuickAddRoot} tone="ghost">
            <span className="bi-toolbar-button-content">
              <PlusIcon className="bi-toolbar-button-icon" />
              新增根节点
            </span>
          </Button>
          <Button
            disabled={!selectedNode || selectedNode.id < 0}
            onClick={() => selectedNode && selectedNode.id > 0 && onQuickAddChild(selectedNode)}
            tone="ghost"
          >
            <span className="bi-toolbar-button-content">
              <PlusIcon className="bi-toolbar-button-icon" />
              新增子节点
            </span>
          </Button>
          <Button onClick={onAutoLayout} tone="ghost">
            <span className="bi-toolbar-button-content">
              <GridIcon className="bi-toolbar-button-icon" />
              自动布局
            </span>
          </Button>
          <Button onClick={onSaveLayout} tone="ghost">
            <span className="bi-toolbar-button-content">
              <SaveStageIcon className="bi-toolbar-button-icon" />
              保存布局
            </span>
          </Button>
        </div>

        <div className="bi-canvas-toolbar-stats">
          <span className="bi-canvas-toolbar-stat">层级：{Math.max(1, maxLevel)} 级</span>
          <span className="bi-canvas-toolbar-stat">分析源资产：{assetCount}</span>
        </div>
      </div>

      <div className="bi-canvas-surface">
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
              </defs>
              {connectors.map((line) => {
                const midX = line.fromX + (line.toX - line.fromX) * 0.48;
                return (
                  <path
                    key={line.id}
                    d={`M${line.fromX} ${line.fromY} C${midX} ${line.fromY} ${midX} ${line.toY} ${line.toX} ${line.toY}`}
                    markerEnd="url(#bi-canvas-arrow)"
                  />
                );
              })}
            </svg>

            {flatNodes.map((node) => (
              <BiNodeCard
                key={node.id}
                archiveCount={archiveCountByNodeId[node.id] ?? 0}
                layout={getNodeCanvasMeta(node, layoutMap)}
                node={node}
                onDesignInternalArchive={onDesignInternalArchive}
                onPointerDown={handlePointerDown}
                onQuickAddChild={onQuickAddChild}
                onQuickCreateExternalArchive={onQuickCreateExternalArchive}
                onSelect={onSelectNode}
                selected={node.id === selectedNodeId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

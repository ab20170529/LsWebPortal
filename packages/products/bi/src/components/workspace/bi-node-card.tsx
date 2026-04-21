import type React from 'react';
import { cx } from '@lserp/ui';

import type { BiDirectoryNode } from '../../types';
import { getNodeTone, getNodeTypeLabel, getStatusLabel } from '../../utils/bi-directory';
import { ExternalLinkIcon, HistoryIcon, PlusIcon } from './bi-icons';

type BiNodeCardProps = {
  archiveCount: number;
  layout: { height?: number; width?: number; x?: number; y?: number };
  node: BiDirectoryNode;
  onDesignInternalArchive: (node: BiDirectoryNode) => void;
  onPointerDown: (node: BiDirectoryNode, event: { clientX: number; clientY: number }) => void;
  onQuickAddChild: (node: BiDirectoryNode) => void;
  onQuickCreateExternalArchive: (node: BiDirectoryNode) => void;
  onSelect: (nodeId: number) => void;
  selected: boolean;
};

export function BiNodeCard({
  archiveCount,
  layout,
  node,
  onDesignInternalArchive,
  onPointerDown,
  onQuickAddChild,
  onQuickCreateExternalArchive,
  onSelect,
  selected,
}: BiNodeCardProps) {
  const tone = getNodeTone(node.nodeType);
  const isPendingNode = node.id < 0;

  return (
    <article
      aria-label={node.nodeName}
      className={cx('bi-node-card', `is-${tone}`, selected ? 'is-selected' : '')}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(node.id);
        }
      }}
      onPointerDown={(event: React.PointerEvent<HTMLElement>) => onPointerDown(node, event)}
      role="button"
      style={{
        height: layout.height,
        left: layout.x,
        top: layout.y,
        width: layout.width,
      }}
      tabIndex={0}
    >
      <div className={cx('bi-node-card-actions', selected ? 'is-visible' : '')}>
        <button
          aria-label="新增子节点"
          className="bi-node-card-action"
          disabled={isPendingNode}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (!isPendingNode) {
              onQuickAddChild(node);
            }
          }}
          onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
          type="button"
        >
          <PlusIcon className="bi-node-card-action-icon" />
          新增子节点
        </button>
        <button
          aria-label="设计内置 BI"
          className="bi-node-card-action"
          disabled={isPendingNode}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (!isPendingNode) {
              onDesignInternalArchive(node);
            }
          }}
          onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
          type="button"
        >
          <HistoryIcon className="bi-node-card-action-icon" />
          设计 BI
        </button>
        <button
          aria-label="新建外链 BI"
          className="bi-node-card-action"
          disabled={isPendingNode}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (!isPendingNode) {
              onQuickCreateExternalArchive(node);
            }
          }}
          onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
          type="button"
        >
          <ExternalLinkIcon className="bi-node-card-action-icon" />
          外链 BI
        </button>
      </div>

      <div className="bi-node-card-header">
        <div className="bi-node-card-title-wrap">
          <div className="bi-node-card-accent" />
          <div>
            <div className="bi-node-card-title">{node.nodeName}</div>
            <div className="bi-node-card-type">{getNodeTypeLabel(node.nodeType, node.nodeTypeName)}</div>
          </div>
        </div>
        <span className="bi-node-card-status">{getStatusLabel(node.status)}</span>
      </div>

      <div className="bi-node-card-meta-chip">{node.nodeCode}</div>

      <div className="bi-node-card-footer">
        <span>{node.sourceAssetIds.length} 个分析源</span>
        <span>{archiveCount} 个档案</span>
      </div>
    </article>
  );
}

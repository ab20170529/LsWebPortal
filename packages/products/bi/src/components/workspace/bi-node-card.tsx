import { memo } from 'react';
import { cx } from '@lserp/ui';

import type { BiDirectoryNode } from '../../types';
import { getNodeTone, getNodeTypeLabel, getStatusLabel } from '../../utils/bi-directory';
import { PlusIcon } from './bi-icons';

type BiNodeCardProps = {
  archiveCount: number;
  layout: { height?: number; width?: number; x?: number; y?: number };
  node: BiDirectoryNode;
  onPointerDown: (node: BiDirectoryNode, event: { clientX: number; clientY: number }) => void;
  onQuickAddChild: (node: BiDirectoryNode) => void;
  onSelect: (nodeId: number) => void;
  selected: boolean;
};

function BiNodeCardComponent({
  archiveCount,
  layout,
  node,
  onPointerDown,
  onQuickAddChild,
  onSelect,
  selected,
}: BiNodeCardProps) {
  const tone = getNodeTone(node.nodeType);

  return (
    <article
      className={cx('bi-node-card', `is-${tone}`, selected ? 'is-selected' : '')}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(node.id);
        }
      }}
      onPointerDown={(event: { clientX: number; clientY: number }) => onPointerDown(node, event)}
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
          className="bi-node-card-action"
          onClick={(event) => {
            event.stopPropagation();
            onQuickAddChild(node);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <PlusIcon className="bi-node-card-action-icon" />
          添加子节点
        </button>
      </div>

      <div className="bi-node-card-header">
        <div className="bi-node-card-title-wrap">
          <div className="bi-node-card-accent" />
          <div>
            <div className="bi-node-card-title">{node.nodeName}</div>
            <div className="bi-node-card-type">{getNodeTypeLabel(node.nodeType)}</div>
          </div>
        </div>
        <span className="bi-node-card-status">{getStatusLabel(node.status)}</span>
      </div>

      <div className="bi-node-card-meta-chip">{node.nodeCode}</div>

      <div className="bi-node-card-footer">
        <span>{node.datasourceIds.length} 个分析源</span>
        <span>{archiveCount} 个档案</span>
      </div>
    </article>
  );
}

export const BiNodeCard = memo(BiNodeCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.archiveCount === nextProps.archiveCount &&
    prevProps.node === nextProps.node &&
    prevProps.selected === nextProps.selected &&
    prevProps.layout.height === nextProps.layout.height &&
    prevProps.layout.width === nextProps.layout.width &&
    prevProps.layout.x === nextProps.layout.x &&
    prevProps.layout.y === nextProps.layout.y
  );
});

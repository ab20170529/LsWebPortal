import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cx } from '@lserp/ui';

import type { BiDirectoryNode } from '../../types';
import { getNodeTone, getNodeTypeLabel, getStatusLabel } from '../../utils/bi-directory';
import { EditIcon, ExternalLinkIcon, HistoryIcon, PlusIcon, TrashIcon } from './bi-icons';

type BiNodeCardProps = {
  archiveCount: number;
  canDeleteNode?: boolean;
  deleteDisabledReason?: string;
  focusTone?: 'descendant' | 'path';
  layout: { height?: number; width?: number; x?: number; y?: number };
  muted?: boolean;
  node: BiDirectoryNode;
  onDeleteNode: (node: BiDirectoryNode) => void;
  onDesignInternalArchive: (node: BiDirectoryNode) => void;
  onEditNode: (node: BiDirectoryNode) => void;
  onPointerDown: (node: BiDirectoryNode, event: { clientX: number; clientY: number }) => void;
  onQuickAddChild: (node: BiDirectoryNode) => void;
  onQuickCreateExternalArchive: (node: BiDirectoryNode) => void;
  onSelect: (nodeId: number) => void;
  searchHighlighted?: boolean;
  selected: boolean;
};

export function BiNodeCard({
  archiveCount,
  canDeleteNode: canDeleteNodeOverride,
  deleteDisabledReason,
  focusTone,
  layout,
  muted = false,
  node,
  onDeleteNode,
  onDesignInternalArchive,
  onEditNode,
  onPointerDown,
  onQuickAddChild,
  onQuickCreateExternalArchive,
  onSelect,
  searchHighlighted = false,
  selected,
}: BiNodeCardProps) {
  const tone = getNodeTone(node.nodeType);
  const isPendingNode = node.id < 0;
  const isRootNode = !node.parentId;
  const canDeleteNode =
    typeof canDeleteNodeOverride === 'boolean' ? canDeleteNodeOverride : !isPendingNode && !isRootNode;
  const [menuOpen, setMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selected) {
      setMenuOpen(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (actionsRef.current?.contains(event.target as Node)) {
        return;
      }
      setMenuOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', closeOnOutsidePointerDown);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutsidePointerDown);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <article
      aria-label={node.nodeName}
      className={cx(
        'bi-node-card',
        `is-${tone}`,
        selected ? 'is-selected' : '',
        focusTone ? `is-focus-${focusTone}` : '',
        searchHighlighted ? 'is-search-highlighted' : '',
        menuOpen ? 'is-menu-open' : '',
        muted ? 'is-muted' : '',
      )}
      onClick={() => {
        if (!isPendingNode) {
          onSelect(node.id);
        }
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (isPendingNode) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(node.id);
        }
      }}
      onPointerDown={(event: React.PointerEvent<HTMLElement>) => {
        if (!isPendingNode) {
          onPointerDown(node, event);
        }
      }}
      role="button"
      style={{
        height: layout.height,
        left: layout.x,
        top: layout.y,
        width: layout.width,
      }}
      tabIndex={isPendingNode ? -1 : 0}
    >
      <div
        className={cx('bi-node-card-actions', selected ? 'is-visible' : '', menuOpen ? 'is-open' : '')}
        ref={actionsRef}
      >
        <button
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="节点操作"
          className="bi-node-card-action-trigger"
          disabled={isPendingNode}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (!isPendingNode) {
              setMenuOpen((open) => !open);
            }
          }}
          onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
          type="button"
        >
          操作
        </button>
        <div className="bi-node-card-action-menu" role="menu">
          <button
            aria-label="新增子节点"
            className="bi-node-card-action"
            disabled={isPendingNode}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              if (!isPendingNode) {
                setMenuOpen(false);
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
            aria-label="编辑节点"
            className="bi-node-card-action"
            disabled={isPendingNode}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              if (!isPendingNode) {
                setMenuOpen(false);
                onEditNode(node);
              }
            }}
            onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
            type="button"
          >
            <EditIcon className="bi-node-card-action-icon" />
            编辑节点
          </button>
          <button
            aria-label="设计内置 BI"
            className="bi-node-card-action"
            disabled={isPendingNode}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              if (!isPendingNode) {
                setMenuOpen(false);
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
                setMenuOpen(false);
                onQuickCreateExternalArchive(node);
              }
            }}
            onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
            type="button"
          >
            <ExternalLinkIcon className="bi-node-card-action-icon" />
            外链 BI
          </button>
          <button
            aria-label="删除节点"
            className="bi-node-card-action is-danger"
            disabled={!canDeleteNode}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              if (canDeleteNode) {
                setMenuOpen(false);
                onDeleteNode(node);
              }
            }}
            onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
            title={deleteDisabledReason ?? (isRootNode ? '根节点不可删除' : undefined)}
            type="button"
          >
            <TrashIcon className="bi-node-card-action-icon" />
            删除
          </button>
        </div>
      </div>

      <div className="bi-node-card-header">
        <div className="bi-node-card-title-wrap">
          <div className="bi-node-card-accent" />
          <div>
            <div className="bi-node-card-title">{node.nodeName}</div>
            <div className="bi-node-card-type">{getNodeTypeLabel(node.nodeType, node.nodeTypeName)}</div>
          </div>
        </div>
        <div className="bi-node-card-status-stack">
          {selected ? <span className="bi-node-card-current">当前选中</span> : null}
          <span className="bi-node-card-status">{getStatusLabel(node.status)}</span>
        </div>
      </div>

      <div className="bi-node-card-meta-chip" title={node.nodeCode}>
        {node.nodeCode}
      </div>

      <div className="bi-node-card-footer">
        <span>{node.sourceAssetIds.length} 个分析源</span>
        <span>{archiveCount} 个档案</span>
      </div>
    </article>
  );
}

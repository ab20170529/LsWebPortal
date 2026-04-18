import { Button, Card, cx } from '@lserp/ui';

import type { BiDirectoryNode } from '../types';

type BiDirectoryTreeProps = {
  nodes: BiDirectoryNode[];
  onSelect: (node: BiDirectoryNode) => void;
  selectedNodeId?: number | null;
};

function TreeNode({
  node,
  onSelect,
  selectedNodeId,
}: {
  node: BiDirectoryNode;
  onSelect: (node: BiDirectoryNode) => void;
  selectedNodeId?: number | null;
}) {
  const isActive = node.id === selectedNodeId;

  return (
    <div className="space-y-3">
      <button
        className={cx(
          'w-full rounded-[20px] border px-4 py-3 text-left transition-transform hover:-translate-y-0.5',
          isActive ? 'shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]' : '',
        )}
        onClick={() => {
          onSelect(node);
        }}
        style={{
          backgroundColor: isActive
            ? 'color-mix(in srgb, var(--portal-color-brand-500) 9%, white)'
            : 'color-mix(in srgb, var(--portal-color-surface-panel) 82%, white)',
          borderColor: isActive
            ? 'color-mix(in srgb, var(--portal-color-brand-500) 26%, white)'
            : 'color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
        }}
        type="button"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="theme-text-strong text-sm font-black tracking-tight">{node.nodeName}</div>
          <div className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.18em]">
            {node.nodeType}
          </div>
        </div>
        <div className="theme-text-muted mt-2 text-xs leading-6">{node.nodeCode}</div>
      </button>

      {node.children.length > 0 ? (
        <div className="ml-4 space-y-3 border-l border-[color:color-mix(in_srgb,var(--portal-color-border-soft)_80%,white)] pl-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BiDirectoryTree({ nodes, onSelect, selectedNodeId }: BiDirectoryTreeProps) {
  return (
    <Card className="rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            BI Directory
          </div>
          <div className="theme-text-strong mt-2 text-xl font-black tracking-tight">
            Organization and analysis tree
          </div>
        </div>
        <Button onClick={() => window.location.assign('/bi/workspace')} tone="ghost">
          Refresh
        </Button>
      </div>
      <div className="mt-5 space-y-3">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onSelect={onSelect}
            selectedNodeId={selectedNodeId}
          />
        ))}
      </div>
    </Card>
  );
}

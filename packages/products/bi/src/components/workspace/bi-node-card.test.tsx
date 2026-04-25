import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiDirectoryNode } from '../../types';
import { BiNodeCard } from './bi-node-card';

const node: BiDirectoryNode = {
  boundAssets: [],
  children: [],
  datasourceIds: [1, 2],
  id: 9,
  nodeCode: 'sales_north',
  nodeName: 'North Sales Board',
  nodeType: 'ANALYSIS_DIM',
  parentId: 1,
  sourceAssetIds: [],
  status: 'ACTIVE',
};

const layout = {
  height: 132,
  width: 224,
  x: 120,
  y: 160,
};

describe('BiNodeCard', () => {
  it('selects the node when clicking the card body', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <BiNodeCard
        archiveCount={3}
        layout={layout}
        node={node}
        onDeleteNode={vi.fn()}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onPointerDown={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSelect={onSelect}
        selected={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /North Sales Board/i }));

    expect(onSelect).toHaveBeenCalledWith(9);
  });

  it('triggers quick add child without re-selecting through nested button bubbling', async () => {
    const user = userEvent.setup();
    const onQuickAddChild = vi.fn();
    const onSelect = vi.fn();

    render(
      <BiNodeCard
        archiveCount={3}
        layout={layout}
        node={node}
        onDeleteNode={vi.fn()}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onPointerDown={vi.fn()}
        onQuickAddChild={onQuickAddChild}
        onQuickCreateExternalArchive={vi.fn()}
        onSelect={onSelect}
        selected
      />,
    );

    await user.click(screen.getByRole('button', { name: /节点操作/i }));
    await user.click(screen.getByRole('button', { name: /新增子节点/i }));

    expect(onQuickAddChild).toHaveBeenCalledWith(node);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('triggers delete without selecting the card', async () => {
    const user = userEvent.setup();
    const onDeleteNode = vi.fn();
    const onSelect = vi.fn();

    render(
      <BiNodeCard
        archiveCount={3}
        layout={layout}
        node={node}
        onDeleteNode={onDeleteNode}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onPointerDown={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSelect={onSelect}
        selected
      />,
    );

    await user.click(screen.getByRole('button', { name: /节点操作/i }));
    await user.click(screen.getByRole('button', { name: /删除节点/i }));

    expect(onDeleteNode).toHaveBeenCalledWith(node);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('triggers edit without selecting the card', async () => {
    const user = userEvent.setup();
    const onEditNode = vi.fn();
    const onSelect = vi.fn();

    render(
      <BiNodeCard
        archiveCount={3}
        layout={layout}
        node={node}
        onDeleteNode={vi.fn()}
        onDesignInternalArchive={vi.fn()}
        onEditNode={onEditNode}
        onPointerDown={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSelect={onSelect}
        selected
      />,
    );

    await user.click(screen.getByRole('button', { name: /节点操作/i }));
    await user.click(screen.getByRole('button', { name: /编辑节点/i }));

    expect(onEditNode).toHaveBeenCalledWith(node);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('keeps delete disabled when the canvas marks the node as not deletable', async () => {
    const user = userEvent.setup();
    const onDeleteNode = vi.fn();

    render(
      <BiNodeCard
        archiveCount={3}
        canDeleteNode={false}
        deleteDisabledReason="当前节点或下级节点仍有 BI 档案，请先清理后再删除"
        layout={layout}
        node={node}
        onDeleteNode={onDeleteNode}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onPointerDown={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSelect={vi.fn()}
        selected
      />,
    );

    await user.click(screen.getByRole('button', { name: /节点操作/i }));

    const deleteButton = screen.getByRole('button', { name: /删除节点/i });
    expect(deleteButton.hasAttribute('disabled')).toBe(true);
    expect(deleteButton.getAttribute('title')).toContain('当前节点或下级节点仍有 BI 档案');
    expect(onDeleteNode).not.toHaveBeenCalled();
  });
});

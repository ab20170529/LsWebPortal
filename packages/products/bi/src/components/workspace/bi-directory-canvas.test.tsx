import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiCanvasMeta, BiDirectoryNode } from '../../types';
import { BiDirectoryCanvas } from './bi-directory-canvas';

const node: BiDirectoryNode = {
  children: [],
  datasourceIds: [],
  id: 1,
  nodeCode: 'company_root',
  nodeName: '总部公司',
  nodeType: 'COMPANY',
  status: 'ACTIVE',
};

const layoutMap: Record<number, BiCanvasMeta> = {
  1: { height: 132, width: 224, x: 120, y: 120 },
};

describe('BiDirectoryCanvas', () => {
  it('allows creating the first root node from the empty state', async () => {
    const user = userEvent.setup();
    const onQuickAddRoot = vi.fn();

    render(
      <BiDirectoryCanvas
        archiveCountByNodeId={{}}
        assetCount={0}
        layoutMap={{}}
        maxLevel={1}
        nodes={[]}
        onAutoLayout={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickAddRoot={onQuickAddRoot}
        onSaveLayout={vi.fn()}
        onSelectNode={vi.fn()}
        onUpdateNodeLayout={vi.fn()}
        selectedNodeId={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: '创建第一个根节点' }));

    expect(onQuickAddRoot).toHaveBeenCalledTimes(1);
  });

  it('uses the toolbar child button for the currently selected node', async () => {
    const user = userEvent.setup();
    const onQuickAddChild = vi.fn();

    render(
      <BiDirectoryCanvas
        archiveCountByNodeId={{ 1: 0 }}
        assetCount={0}
        layoutMap={layoutMap}
        maxLevel={1}
        nodes={[node]}
        onAutoLayout={vi.fn()}
        onQuickAddChild={onQuickAddChild}
        onQuickAddRoot={vi.fn()}
        onSaveLayout={vi.fn()}
        onSelectNode={vi.fn()}
        onUpdateNodeLayout={vi.fn()}
        selectedNodeId={1}
      />,
    );

    await user.click(screen.getByRole('button', { name: '新增子节点' }));

    expect(onQuickAddChild).toHaveBeenCalledWith(node);
  });
});

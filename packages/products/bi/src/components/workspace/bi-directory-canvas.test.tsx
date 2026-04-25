import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiCanvasMeta, BiDirectoryNode } from '../../types';
import { BiDirectoryCanvas } from './bi-directory-canvas';

const node: BiDirectoryNode = {
  boundAssets: [],
  children: [],
  datasourceIds: [],
  id: 1,
  nodeCode: 'company_root',
  nodeName: '总部公司',
  nodeType: 'COMPANY',
  sourceAssetIds: [],
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
        onDeleteNode={vi.fn()}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickAddRoot={onQuickAddRoot}
        onQuickCreateExternalArchive={vi.fn()}
        onSaveLayout={vi.fn()}
        onSelectNode={vi.fn()}
        onUpdateNodeLayout={vi.fn()}
        selectedNodeId={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: /创建第一个根节点/i }));

    expect(onQuickAddRoot).toHaveBeenCalledTimes(1);
  });

  it('uses the node card menu to add a child node', async () => {
    const user = userEvent.setup();
    const onQuickAddChild = vi.fn();

    render(
      <BiDirectoryCanvas
        archiveCountByNodeId={{ 1: 0 }}
        assetCount={0}
        layoutMap={layoutMap}
        maxLevel={1}
        nodes={[node]}
        onDeleteNode={vi.fn()}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onQuickAddChild={onQuickAddChild}
        onQuickAddRoot={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSaveLayout={vi.fn()}
        onSelectNode={vi.fn()}
        onUpdateNodeLayout={vi.fn()}
        selectedNodeId={1}
      />,
    );

    const menuButtons = screen.getAllByRole('button', { name: /节点操作/i });
    expect(menuButtons[0]).toBeDefined();
    await user.click(menuButtons[0]!);
    await user.click(screen.getByRole('button', { name: /新增子节点/i }));

    expect(onQuickAddChild).toHaveBeenCalledWith(node);
  });

  it('keeps root-node delete disabled in the card menu when the root is not empty', async () => {
    const user = userEvent.setup();
    const onDeleteNode = vi.fn();

    render(
      <BiDirectoryCanvas
        archiveCountByNodeId={{ 1: 0 }}
        assetCount={0}
        layoutMap={layoutMap}
        maxLevel={1}
        nodes={[
          {
            ...node,
            children: [
              {
                ...node,
                id: 2,
                nodeCode: 'department_a',
                nodeName: '部门 A',
                nodeType: 'DEPARTMENT',
                parentId: 1,
                children: [],
              },
            ],
          },
        ]}
        onDeleteNode={onDeleteNode}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickAddRoot={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSaveLayout={vi.fn()}
        onSelectNode={vi.fn()}
        onUpdateNodeLayout={vi.fn()}
        selectedNodeId={1}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /节点操作/i })[0]!);

    const deleteButton = screen.getAllByRole('button', { name: /删除节点/i })[0]!;
    expect(deleteButton.hasAttribute('disabled')).toBe(true);
    expect(deleteButton.getAttribute('title')).toContain('根节点');
    expect(onDeleteNode).not.toHaveBeenCalled();
  });

  it('pans the canvas when dragging the blank surface', () => {
    const { container } = render(
      <BiDirectoryCanvas
        archiveCountByNodeId={{ 1: 0 }}
        assetCount={0}
        layoutMap={layoutMap}
        maxLevel={1}
        nodes={[node]}
        onDeleteNode={vi.fn()}
        onDesignInternalArchive={vi.fn()}
        onEditNode={vi.fn()}
        onQuickAddChild={vi.fn()}
        onQuickAddRoot={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onSaveLayout={vi.fn()}
        onSelectNode={vi.fn()}
        onUpdateNodeLayout={vi.fn()}
        selectedNodeId={1}
      />,
    );

    const surface = container.querySelector('.bi-canvas-surface') as HTMLDivElement | null;
    expect(surface).not.toBeNull();
    if (!surface) {
      return;
    }

    surface.scrollLeft = 120;
    surface.scrollTop = 40;

    fireEvent.mouseDown(surface, { clientX: 200, clientY: 120 });
    fireEvent.mouseMove(window, { clientX: 260, clientY: 170 });
    fireEvent.mouseUp(window);

    expect(surface.scrollLeft).toBe(180);
    expect(surface.scrollTop).toBe(90);
  });
});

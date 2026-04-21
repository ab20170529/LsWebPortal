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
        onDesignInternalArchive={vi.fn()}
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
        onDesignInternalArchive={vi.fn()}
        onPointerDown={vi.fn()}
        onQuickAddChild={onQuickAddChild}
        onQuickCreateExternalArchive={vi.fn()}
        onSelect={onSelect}
        selected
      />,
    );

    const addChildButton = screen.getByRole('button', { name: '新增子节点' });

    await user.click(addChildButton);

    expect(onQuickAddChild).toHaveBeenCalledWith(node);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

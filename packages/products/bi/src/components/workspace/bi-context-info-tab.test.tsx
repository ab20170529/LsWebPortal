import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiDirectoryNode } from '../../types';
import { BiContextInfoTab } from './bi-context-info-tab';

const node: BiDirectoryNode = {
  boundAssets: [],
  children: [],
  datasourceIds: [],
  id: 18,
  nodeCode: 'sales_dim',
  nodeName: 'Sales Dimension',
  nodeType: 'ANALYSIS_DIM',
  parentId: 10,
  sourceAssetIds: [],
  status: 'ACTIVE',
};

describe('BiContextInfoTab', () => {
  it('deletes the selected node after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDeleteSelectedNode = vi.fn().mockResolvedValue(undefined);

    render(
      <BiContextInfoTab
        isMutating={false}
        node={node}
        nodeTypes={[
          { allowedChildTypeCodes: [], id: 1, typeCode: 'ANALYSIS_DIM', typeName: 'Analysis Dimension' },
        ]}
        onDeleteSelectedNode={onDeleteSelectedNode}
        onSaveSelectedNode={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const deleteButton = screen
      .getAllByRole('button')
      .find((button) => /删除|Delete/.test(button.textContent ?? ''));

    expect(deleteButton).toBeDefined();
    await user.click(deleteButton!);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDeleteSelectedNode).toHaveBeenCalledWith(18);
  });
});

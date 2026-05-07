import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BiDirectoryNode } from '../../types';
import { BiNodeContextPanel } from './bi-node-context-panel';

const node: BiDirectoryNode = {
  boundAssets: [],
  children: [
    {
      boundAssets: [],
      children: [],
      datasourceIds: [],
      id: 14,
      level: 2,
      nodeCode: 'company_child',
      nodeName: '子节点',
      nodeType: 'DEPARTMENT',
      parentId: 13,
      sourceAssetIds: [],
      status: 'ACTIVE',
    },
  ],
  datasourceIds: [],
  id: 13,
  level: 1,
  nodeCode: 'company_root',
  nodeName: '新建公司 / 大维度节点',
  nodeType: 'COMPANY',
  parentId: null,
  sourceAssetIds: [],
  status: 'ACTIVE',
};

describe('BiNodeContextPanel', () => {
  it('shows a clear delete restriction reason for non-empty root nodes', () => {
    render(
      <BiNodeContextPanel
        activeArchiveTab="base"
        activeSection="canvas"
        canDeleteNode={false}
        canPreviewCurrent={false}
        canPublishCurrent={false}
        deleteHint="当前节点是根节点，但下面还有子节点。只有没有子节点、没有 BI 档案的空根节点才可以删除。"
        node={node}
        onDeleteNode={vi.fn()}
        onEditNode={vi.fn()}
        onLocateCurrentNode={vi.fn()}
        onOpenArchiveTab={vi.fn()}
        onOpenPreview={vi.fn()}
        onOpenSection={vi.fn()}
        onPublishCurrent={vi.fn()}
        onQuickCreateExternalArchive={vi.fn()}
        onQuickDesignInternalArchive={vi.fn()}
        previewHint={null}
        screens={[]}
      />,
    );

    expect(screen.getByRole('button', { name: /删除节点/i }).hasAttribute('disabled')).toBe(true);
    expect(
      screen.queryByText('当前节点是根节点，但下面还有子节点。只有没有子节点、没有 BI 档案的空根节点才可以删除。'),
    ).not.toBeNull();
  });
});

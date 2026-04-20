import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiDatasource, BiDirectoryNode } from '../../types';
import { BiContextAssetsTab } from './bi-context-assets-tab';

const node: BiDirectoryNode = {
  children: [],
  datasourceIds: [1],
  id: 8,
  nodeCode: 'sales_north',
  nodeName: '华北销售',
  nodeType: 'ANALYSIS_DIM',
  status: 'ACTIVE',
};

const boundDatasources: BiDatasource[] = [
  {
    assets: [
      {
        assetCode: 'sales_table',
        assetName: '销售事实表',
        assetType: 'TABLE',
        datasourceId: 1,
        fields: [],
        id: 31,
        sourceTables: [],
        tableName: 'dw_sales',
        tableSchema: 'dbo',
      },
    ],
    id: 1,
    name: '销售分析源',
    sourceCode: 'sales_ds',
  },
];

describe('BiContextAssetsTab', () => {
  it('keeps create-asset mode separate from editing the currently selected asset', async () => {
    const user = userEvent.setup();

    render(
      <BiContextAssetsTab
        boundDatasources={boundDatasources}
        datasources={boundDatasources}
        isMutating={false}
        node={node}
        onBindSources={vi.fn()}
        onCreateDatasource={vi.fn()}
        onCreateScreen={vi.fn()}
        onCreateShareToken={vi.fn()}
        onGenerateBizComments={vi.fn()}
        onPublishVersion={vi.fn()}
        onRevokeShareToken={vi.fn()}
        onSaveAsset={vi.fn()}
        onSelectScreen={vi.fn()}
        screens={[]}
        selectedScreenId={null}
        shareTokens={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: '新建资产' }));
    expect((screen.getByLabelText('资产名称') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('表名') as HTMLInputElement).value).toBe('');

    await user.click(screen.getByRole('button', { name: '编辑当前资产' }));
    expect((screen.getByLabelText('资产名称') as HTMLInputElement).value).toBe('销售事实表');
    expect((screen.getByLabelText('表名') as HTMLInputElement).value).toBe('dw_sales');
  });
});

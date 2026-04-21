import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiDatasource, BiDirectoryNode } from '../../types';
import { BiContextAssetsTab } from './bi-context-assets-tab';

const node: BiDirectoryNode = {
  boundAssets: [],
  children: [],
  datasourceIds: [1],
  id: 8,
  nodeCode: 'sales_north',
  nodeName: 'North Sales',
  nodeType: 'ANALYSIS_DIM',
  sourceAssetIds: [],
  status: 'ACTIVE',
};

const boundDatasources: BiDatasource[] = [
  {
    assets: [
      {
        assetCode: 'sales_table',
        assetName: 'Sales Detail Table',
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
    name: 'Sales Source',
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
        onBindSourceAssets={vi.fn()}
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

    await user.click(screen.getByRole('button', { name: 'New asset' }));
    expect((screen.getByLabelText('Asset name') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Table name') as HTMLInputElement).value).toBe('');

    await user.click(screen.getByRole('button', { name: 'Edit current asset' }));
    expect((screen.getByLabelText('Asset name') as HTMLInputElement).value).toBe('Sales Detail Table');
    expect((screen.getByLabelText('Table name') as HTMLInputElement).value).toBe('dw_sales');
  });
});

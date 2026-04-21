import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiDatasource, BiDirectoryNode, BiScreen } from '../../types';
import { BiContextPromptTab } from './bi-context-prompt-tab';

const node: BiDirectoryNode = {
  boundAssets: [],
  children: [],
  datasourceIds: [1],
  id: 11,
  nodeCode: 'sales_north',
  nodeName: 'North Sales',
  nodeType: 'ANALYSIS_DIM',
  sourceAssetIds: [],
  status: 'ACTIVE',
};

const boundDatasources: BiDatasource[] = [
  {
    assets: [],
    id: 1,
    name: 'Sales Source',
    sourceCode: 'sales_ds',
  },
];

const screens: BiScreen[] = [
  {
    biType: 'INTERNAL',
    id: 21,
    name: 'Sales Overview',
    nodeId: 11,
    screenCode: 'sales_overview',
    versions: [],
  },
  {
    biType: 'INTERNAL',
    id: 22,
    name: 'Region Rank',
    nodeId: 11,
    screenCode: 'region_rank',
    versions: [],
  },
];

describe('BiContextPromptTab', () => {
  it('switches the real target archive when the target select changes', async () => {
    const user = userEvent.setup();
    const onSelectScreen = vi.fn();

    render(
      <BiContextPromptTab
        boundDatasources={boundDatasources}
        designRecords={[]}
        generationTask={null}
        isMutating={false}
        node={node}
        onGenerateDraft={vi.fn()}
        onPreviewPrompt={vi.fn()}
        onPublishGeneratedVersion={vi.fn()}
        onRegenerateVersion={vi.fn()}
        onSelectScreen={onSelectScreen}
        promptPreview={null}
        promptTemplates={[]}
        screens={screens}
        selectedScreenId={21}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Target archive'), '22');

    expect(onSelectScreen).toHaveBeenCalledWith(22);
    expect((screen.getByLabelText('Archive code') as HTMLInputElement).value).toBe('region_rank');
    expect((screen.getByLabelText('Archive name') as HTMLInputElement).value).toBe('Region Rank');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BiDatasource, BiDirectoryNode, BiScreen } from '../../types';
import { BiContextPromptTab } from './bi-context-prompt-tab';

const node: BiDirectoryNode = {
  children: [],
  datasourceIds: [1],
  id: 11,
  nodeCode: 'sales_north',
  nodeName: '华北销售',
  nodeType: 'ANALYSIS_DIM',
  status: 'ACTIVE',
};

const boundDatasources: BiDatasource[] = [
  {
    assets: [],
    id: 1,
    name: '销售分析源',
    sourceCode: 'sales_ds',
  },
];

const screens: BiScreen[] = [
  {
    biType: 'INTERNAL',
    id: 21,
    name: '销售概览',
    nodeId: 11,
    screenCode: 'sales_overview',
    versions: [],
  },
  {
    biType: 'INTERNAL',
    id: 22,
    name: '区域排名',
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

    await user.selectOptions(screen.getByLabelText('目标 BI 档案'), '22');

    expect(onSelectScreen).toHaveBeenCalledWith(22);
    expect((screen.getByLabelText('档案编码') as HTMLInputElement).value).toBe('region_rank');
    expect((screen.getByLabelText('档案名称') as HTMLInputElement).value).toBe('区域排名');
  });
});

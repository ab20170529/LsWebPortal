import { describe, expect, it } from 'vitest';

import type { BiDirectoryNode } from '../types';
import {
  findNodeByCode,
  findPreferredDisplayRoot,
  pruneOrganizationForest,
} from './bi-display-tree';

const treeFixture: BiDirectoryNode[] = [
  {
    children: [
      {
        children: [
          {
            children: [],
            datasourceIds: [],
            id: 3,
            nodeCode: 'analysis-west',
            nodeName: 'Analysis West',
            nodeType: 'ANALYSIS_DIM',
            parentId: 2,
          },
        ],
        datasourceIds: [11],
        id: 2,
        nodeCode: 'dept-west',
        nodeName: 'Dept West',
        nodeType: 'DEPARTMENT',
        parentId: 1,
      },
    ],
    datasourceIds: [],
    id: 1,
    nodeCode: 'root',
    nodeName: 'Root Company',
    nodeType: 'COMPANY',
    parentId: null,
  },
];

describe('bi display tree utils', () => {
  it('removes analysis dimension nodes from the display tree', () => {
    const pruned = pruneOrganizationForest(treeFixture);

    expect(pruned[0]?.children[0]?.children).toEqual([]);
  });

  it('finds the preferred root by configured code', () => {
    const pruned = pruneOrganizationForest(treeFixture);

    expect(findPreferredDisplayRoot(pruned, 'root')?.nodeCode).toBe('root');
  });

  it('can locate descendant nodes by node code', () => {
    const pruned = pruneOrganizationForest(treeFixture);

    expect(findNodeByCode(pruned, 'dept-west')?.nodeName).toBe('Dept West');
  });
});

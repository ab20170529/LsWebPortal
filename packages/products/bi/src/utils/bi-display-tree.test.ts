import { describe, expect, it } from 'vitest';

import type { BiDirectoryNode } from '../types';
import {
  findDisplayNodeForRoute,
  findNodeByCode,
  findPreferredDisplayRoot,
  pruneOrganizationForest,
} from './bi-display-tree';

const treeFixture: BiDirectoryNode[] = [
  {
    boundAssets: [],
    children: [
      {
        boundAssets: [],
        children: [
          {
            boundAssets: [],
            children: [],
            datasourceIds: [],
            id: 3,
            nodeCode: 'analysis-west',
            nodeName: 'Analysis West',
            nodeType: 'ANALYSIS_DIM',
            parentId: 2,
            sourceAssetIds: [],
          },
        ],
        datasourceIds: [11],
        id: 2,
        nodeCode: 'dept-west',
        nodeName: 'Dept West',
        nodeType: 'DEPARTMENT',
        parentId: 1,
        sourceAssetIds: [],
      },
    ],
    datasourceIds: [],
    id: 1,
    nodeCode: 'root',
    nodeName: 'Root Company',
    nodeType: 'COMPANY',
    parentId: null,
    sourceAssetIds: [],
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

  it('resolves the department detail target inside the preferred root', () => {
    const pruned = pruneOrganizationForest(treeFixture);

    expect(findDisplayNodeForRoute(pruned, 'root', 'dept-west')).toEqual({
      rootNode: pruned[0],
      selectedNode: pruned[0]?.children[0],
    });
  });

  it('returns null for a node route outside the preferred root', () => {
    const treeWithOtherRoot: BiDirectoryNode[] = [
      ...treeFixture,
      {
        boundAssets: [],
        children: [],
        datasourceIds: [],
        id: 9,
        nodeCode: 'outside-root',
        nodeName: 'Outside Root',
        nodeType: 'COMPANY',
        parentId: null,
        sourceAssetIds: [],
      },
    ];

    const pruned = pruneOrganizationForest(treeWithOtherRoot);

    expect(findDisplayNodeForRoute(pruned, 'root', 'outside-root').selectedNode).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import type { BiDirectoryNode } from '../types';
import { buildAutoLayout } from './bi-directory';

const forest: BiDirectoryNode[] = [
  {
    boundAssets: [],
    children: [
      {
        boundAssets: [],
        children: [],
        datasourceIds: [],
        id: 11,
        level: 2,
        nodeCode: 'root_a_dept',
        nodeName: '一级1-部门',
        nodeType: 'DEPARTMENT',
        parentId: 10,
        sourceAssetIds: [],
        status: 'ACTIVE',
      },
    ],
    datasourceIds: [],
    id: 10,
    level: 1,
    nodeCode: 'root_a',
    nodeName: '一级1',
    nodeType: 'COMPANY',
    parentId: null,
    sourceAssetIds: [],
    status: 'ACTIVE',
  },
  {
    boundAssets: [],
    children: [
      {
        boundAssets: [],
        children: [],
        datasourceIds: [],
        id: 21,
        level: 2,
        nodeCode: 'root_b_dept',
        nodeName: '一级2-部门',
        nodeType: 'DEPARTMENT',
        parentId: 20,
        sourceAssetIds: [],
        status: 'ACTIVE',
      },
    ],
    datasourceIds: [],
    id: 20,
    level: 1,
    nodeCode: 'root_b',
    nodeName: '一级2',
    nodeType: 'COMPANY',
    parentId: null,
    sourceAssetIds: [],
    status: 'ACTIVE',
  },
];

describe('bi directory helpers', () => {
  it('keeps separate root trees in distinct auto-layout bands', () => {
    const layout = buildAutoLayout(forest);

    const rootOne = layout.get(10);
    const rootOneChild = layout.get(11);
    const rootTwo = layout.get(20);
    const rootTwoChild = layout.get(21);

    expect(rootOne).toBeDefined();
    expect(rootOneChild).toBeDefined();
    expect(rootTwo).toBeDefined();
    expect(rootTwoChild).toBeDefined();

    if (!rootOne || !rootOneChild || !rootTwo || !rootTwoChild) {
      throw new Error('auto layout should place every node in the forest');
    }

    const rootOneX = rootOne.x ?? 0;
    const rootOneChildX = rootOneChild.x ?? 0;
    const rootOneChildY = rootOneChild.y ?? 0;
    const rootTwoX = rootTwo.x ?? 0;
    const rootTwoY = rootTwo.y ?? 0;
    const rootTwoChildX = rootTwoChild.x ?? 0;
    const rootTwoChildY = rootTwoChild.y ?? 0;

    expect(rootOneChildX).toBeGreaterThan(rootOneX);
    expect(rootTwoChildX).toBeGreaterThan(rootTwoX);
    expect(rootTwoY).toBeGreaterThan(rootOneChildY + 200);
    expect(rootTwoChildY).toBeGreaterThan(rootOneChildY + 200);
  });
});

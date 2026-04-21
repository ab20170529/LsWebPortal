import { describe, expect, it } from 'vitest';

import type { BiDirectoryNode, BiScreen } from '../types';
import {
  buildDisplayScreenMap,
  formatDisplayRate,
  getDisplayAccent,
  getDisplayBadge,
  getDisplayScreenMixSegments,
  summarizeDisplayNode,
} from './bi-display-view-model';

const treeFixture: BiDirectoryNode = {
  boundAssets: [],
  children: [
    {
      boundAssets: [],
      children: [
        {
          boundAssets: [],
          children: [],
          datasourceIds: [],
          id: 4,
          nodeCode: 'team-east',
          nodeName: 'Team East',
          nodeType: 'TEAM',
          parentId: 2,
          sourceAssetIds: [],
          status: 'ACTIVE',
        },
      ],
      datasourceIds: [11, 12],
      id: 2,
      nodeCode: 'dept-east',
      nodeName: 'Dept East',
      nodeType: 'DEPARTMENT',
      parentId: 1,
      sourceAssetIds: [],
      status: 'ACTIVE',
    },
    {
      boundAssets: [],
      children: [],
      datasourceIds: [33],
      id: 3,
      nodeCode: 'dept-west',
      nodeName: 'Dept West',
      nodeType: 'DEPARTMENT',
      parentId: 1,
      sourceAssetIds: [],
      status: 'DISABLED',
    },
  ],
  datasourceIds: [9],
  id: 1,
  nodeCode: 'root',
  nodeName: 'Root Company',
  nodeType: 'COMPANY',
  parentId: null,
  sourceAssetIds: [],
  status: 'ACTIVE',
};

function createScreen(id: number, nodeId: number, biType: string): BiScreen {
  return {
    biType,
    id,
    name: `Screen ${id}`,
    nodeId,
    screenCode: `screen-${id}`,
    versions: [],
  };
}

describe('bi display view model', () => {
  it('builds aggregated node statistics from the organization tree', () => {
    const screenMap = buildDisplayScreenMap([
      createScreen(1, 2, 'INTERNAL'),
      createScreen(2, 4, 'EXTERNAL'),
    ]);

    const summary = summarizeDisplayNode(treeFixture, screenMap);

    expect(summary.totalNodes).toBe(4);
    expect(summary.activeNodes).toBe(3);
    expect(summary.boundScreens).toBe(2);
    expect(summary.datasourceCount).toBe(4);
    expect(summary.childCount).toBe(2);
    expect(summary.screenMix).toEqual({
      external: 1,
      internal: 1,
      total: 4,
      unbound: 2,
    });
    expect(summary.badge).toEqual({ label: '已绑定', tone: 'success' });
  });

  it('derives badge tone and accent fallback consistently', () => {
    expect(getDisplayBadge('DRAFT', true)).toEqual({ label: '草稿', tone: 'warning' });
    expect(getDisplayBadge('DISABLED', true)).toEqual({ label: '已停用', tone: 'danger' });
    expect(
      getDisplayAccent(
        {
          ...treeFixture,
          canvasMeta: { accent: '#123456' },
        },
        3,
      ),
    ).toBe('#123456');
    expect(getDisplayAccent(treeFixture, 1)).toBe('#8b5cf6');
  });

  it('formats rates and mix segments for display', () => {
    const screenMap = buildDisplayScreenMap([createScreen(1, 2, 'INTERNAL')]);
    const departmentNode = treeFixture.children[0];
    expect(departmentNode).toBeDefined();

    const summary = summarizeDisplayNode(departmentNode!, screenMap, 0);

    expect(formatDisplayRate(summary.activeRate)).toBe('100%');
    expect(getDisplayScreenMixSegments(summary)).toEqual([
      { key: 'internal', label: '内部', percentage: 50, value: 1 },
      { key: 'external', label: '外链', percentage: 0, value: 0 },
      { key: 'unbound', label: '未绑定', percentage: 50, value: 1 },
    ]);
  });
});

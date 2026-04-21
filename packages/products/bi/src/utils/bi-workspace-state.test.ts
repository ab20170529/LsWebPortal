import { describe, expect, it } from 'vitest';

import type { BiDatasource, BiDirectoryNode, BiScreen } from '../types';
import {
  replaceDatasourceAssetFields,
  removeDirectoryNode,
  resolveScreenDraftSelection,
  resolveSelectedScreenIdForNode,
  updateDirectoryNode,
  upsertDatasource,
  upsertDatasourceAsset,
  upsertDirectoryNode,
  upsertScreen,
  upsertShareToken,
} from './bi-workspace-state';

const screens: BiScreen[] = [
  {
    biType: 'INTERNAL',
    id: 1,
    name: 'Sales Board',
    nodeId: 10,
    screenCode: 'sales-board',
    versions: [],
  },
  {
    biType: 'EXTERNAL',
    id: 2,
    name: 'Purchase Board',
    nodeId: 20,
    screenCode: 'purchase-board',
    versions: [],
  },
];

const nodes: BiDirectoryNode[] = [
  {
    boundAssets: [],
    children: [
      {
        boundAssets: [],
        children: [],
        datasourceIds: [],
        id: 11,
        nodeCode: 'sales_north',
        nodeName: 'North Sales',
        nodeType: 'DEPARTMENT',
        parentId: 10,
        sourceAssetIds: [],
        status: 'ACTIVE',
      },
    ],
    datasourceIds: [],
    id: 10,
    nodeCode: 'company_root',
    nodeName: 'Company Root',
    nodeType: 'COMPANY',
    parentId: null,
    sourceAssetIds: [],
    status: 'ACTIVE',
  },
];

const datasources: BiDatasource[] = [
  {
    assets: [],
    id: 1,
    name: 'Sales Source',
    sourceCode: 'sales_ds',
  },
];

describe('bi workspace state helpers', () => {
  it('keeps the current screen when it still belongs to the selected node', () => {
    expect(resolveSelectedScreenIdForNode(screens, 10, 1)).toBe(1);
  });

  it('falls back to the first screen under the selected node', () => {
    expect(resolveSelectedScreenIdForNode(screens, 20, 1)).toBe(2);
    expect(resolveSelectedScreenIdForNode(screens, 99, 1)).toBeNull();
  });

  it('resolves draft selection from the chosen target screen', () => {
    expect(resolveScreenDraftSelection(screens, '2')).toEqual({
      screenCode: 'purchase-board',
      screenId: 2,
      screenName: 'Purchase Board',
    });
    expect(resolveScreenDraftSelection(screens, '')).toEqual({
      screenCode: '',
      screenId: null,
      screenName: '',
    });
  });

  it('upserts a new child node without replacing unrelated branches', () => {
    const nextNodes = upsertDirectoryNode(nodes, {
      boundAssets: [],
      children: [],
      datasourceIds: [],
      id: 12,
      nodeCode: 'sales_east',
      nodeName: 'East Sales',
      nodeType: 'DEPARTMENT',
      parentId: 10,
      sourceAssetIds: [],
      status: 'ACTIVE',
    });

    expect(nextNodes[0]).not.toBe(nodes[0]);
    expect(nextNodes[0]!.children).toHaveLength(2);
    expect(nextNodes[0]!.children[0]).toBe(nodes[0]!.children[0]);
    expect(nextNodes[0]!.children[1]!.nodeCode).toBe('sales_east');
  });

  it('updates node datasource bindings in place', () => {
    const nextNodes = updateDirectoryNode(nodes, 11, (node) => ({
      ...node,
      datasourceIds: [1, 2],
    }));

    expect(nextNodes[0]).not.toBe(nodes[0]);
    expect(nextNodes[0]!.children[0]!.datasourceIds).toEqual([1, 2]);
  });

  it('removes a node subtree without touching sibling branches', () => {
    const nextNodes = removeDirectoryNode(nodes, 11);

    expect(nextNodes[0]!.children).toHaveLength(0);
    expect(removeDirectoryNode(nodes, 999)).toBe(nodes);
  });

  it('upserts datasource and assets without reloading the whole workspace', () => {
    const nextDatasourceList = upsertDatasource(datasources, {
      assets: [],
      id: 2,
      name: 'Purchase Source',
      sourceCode: 'purchase_ds',
    });
    expect(nextDatasourceList).toHaveLength(2);

    const nextWithAsset = upsertDatasourceAsset(nextDatasourceList, 1, {
      assetCode: 'sales_table',
      assetName: 'Sales Detail Table',
      assetType: 'TABLE',
      datasourceId: 1,
      fields: [],
      id: 31,
      sourceTables: [],
      tableName: 'dw_sales',
      tableSchema: 'dbo',
    });
    expect(nextWithAsset[0]!.assets[0]!.assetCode).toBe('sales_table');

    const nextWithFields = replaceDatasourceAssetFields(nextWithAsset, 31, [
      {
        assetId: 31,
        fieldName: 'amount',
        id: 900,
      },
    ]);
    expect(nextWithFields[0]!.assets[0]!.fields[0]!.fieldName).toBe('amount');
  });

  it('upserts screens and share tokens locally', () => {
    const nextScreens = upsertScreen(screens, {
      biType: 'INTERNAL',
      id: 3,
      name: 'Inventory Board',
      nodeId: 20,
      screenCode: 'inventory-board',
      versions: [],
    });
    expect(nextScreens).toHaveLength(3);

    const nextTokens = upsertShareToken([], {
      id: 91,
      screenId: 3,
      tokenValue: 'share_token',
    });
    expect(nextTokens[0]!.tokenValue).toBe('share_token');
  });
});

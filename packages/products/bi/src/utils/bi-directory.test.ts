import { describe, expect, it } from 'vitest';

import type { BiDatasource } from '../types';
import {
  collectAllowedTables,
  getGenerationStatusLabel,
  getNodeTypeLabel,
  getPublishModeLabel,
  getScreenDesignStatusLabel,
  getStatusLabel,
} from './bi-directory';

const datasources: BiDatasource[] = [
  {
    assets: [
      {
        assetCode: 'sales_table',
        assetName: '销售事实表',
        assetType: 'TABLE',
        datasourceId: 1,
        fields: [],
        id: 11,
        sourceTables: [],
        tableName: 'dw_sales',
        tableSchema: 'dbo',
      },
      {
        assetCode: 'region_sql',
        assetName: '区域排名 SQL',
        assetType: 'SQL',
        datasourceId: 1,
        fields: [],
        id: 12,
        sourceTables: ['dbo.dw_region', 'dbo.dw_sales'],
      },
    ],
    id: 1,
    name: '销售分析源',
    sourceCode: 'sales_ds',
  },
];

describe('bi directory helpers', () => {
  it('collects table whitelist from table assets and sql source tables', () => {
    expect(collectAllowedTables(datasources)).toEqual(['dbo.dw_sales', 'dbo.dw_region']);
  });

  it('maps labels to deliverable Chinese copy', () => {
    expect(getNodeTypeLabel('ANALYSIS_DIM')).toBe('分析维度');
    expect(getStatusLabel('ACTIVE')).toBe('已生效');
    expect(getScreenDesignStatusLabel('FAILED')).toBe('生成失败');
    expect(getGenerationStatusLabel('RUNNING')).toBe('生成中');
    expect(getPublishModeLabel('DRAFT')).toBe('仅生成草稿');
  });
});

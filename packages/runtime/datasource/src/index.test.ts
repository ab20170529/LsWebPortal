import { describe, expect, it } from 'vitest';

import { createRuntimeDatasourceEngine } from './index';

describe('runtime datasource', () => {
  it('filters conditional options from schema datasource definitions', async () => {
    const engine = createRuntimeDatasourceEngine({
      schema: {
        behaviorRules: [],
        datasources: [
          {
            id: 'approval-options',
            kind: 'static-options',
            options: [
              { label: 'Standard', value: 'standard' },
              {
                label: 'High Value Approval',
                value: 'high-value',
                when: 'amount >= 10000',
              },
            ],
          },
        ],
        fields: [
          {
            control: 'select',
            datasourceId: 'approval-options',
            field: 'approvalMode',
            label: 'Approval Mode',
            valueType: 'string',
          },
        ],
        id: 'datasource.demo',
        template: 'bill',
        title: 'Datasource Demo',
        view: {
          root: {
            component: 'page',
            id: 'root',
            kind: 'page',
          },
          templateKind: 'bill',
          version: '1.0.0',
        },
      },
    });

    const smallAmountOptions = await engine.getFieldOptions('approvalMode', {
      amount: 100,
    });
    const largeAmountOptions = await engine.getFieldOptions('approvalMode', {
      amount: 12000,
    });

    expect(smallAmountOptions.map((option) => option.value)).toEqual(['standard']);
    expect(largeAmountOptions.map((option) => option.value)).toEqual([
      'standard',
      'high-value',
    ]);
  });
});

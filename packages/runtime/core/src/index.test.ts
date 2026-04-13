import { describe, expect, it } from 'vitest';

import { createRuntimePageState, setRuntimeFieldValue } from './index';

const schema = {
  behaviorRules: [],
  fields: [
    {
      field: 'billNo',
      initialValue: 'SO-001',
      label: 'Bill No',
      valueType: 'string' as const,
    },
    {
      field: 'amount',
      initialValue: 100,
      label: 'Amount',
      validations: [
        {
          id: 'amount.min',
          kind: 'min' as const,
          value: 1,
        },
      ],
      valueType: 'number' as const,
    },
  ],
  id: 'erp.bill.demo',
  template: 'bill' as const,
  title: 'Demo Bill',
  view: {
    root: {
      component: 'page',
      id: 'page',
      kind: 'page' as const,
    },
    templateKind: 'bill' as const,
    version: '1.0.0',
  },
};

describe('runtime core', () => {
  it('creates runtime values from schema defaults', () => {
    const state = createRuntimePageState(schema);

    expect(state.values.billNo).toBe('SO-001');
    expect(state.values.amount).toBe(100);
  });

  it('updates one field without mutating other values', () => {
    const state = createRuntimePageState(schema);
    const nextState = setRuntimeFieldValue(state, 'amount', 320);

    expect(nextState.values.amount).toBe(320);
    expect(nextState.values.billNo).toBe('SO-001');
  });

  it('recomputes validation after value changes', () => {
    const state = createRuntimePageState(schema);
    const nextState = setRuntimeFieldValue(state, 'amount', 0);

    expect(nextState.validationErrors.amount).toContain(
      'Amount must be greater than or equal to 1.',
    );
  });
});

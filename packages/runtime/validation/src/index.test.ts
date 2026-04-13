import { describe, expect, it } from 'vitest';

import { validateRuntimePage } from './index';

const schema = {
  behaviorRules: [],
  fields: [
    {
      field: 'customerName',
      label: 'Customer',
      validations: [
        {
          id: 'customer.required',
          kind: 'required' as const,
        },
      ],
      valueType: 'string' as const,
    },
    {
      field: 'amount',
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
  id: 'validation.demo',
  template: 'bill' as const,
  title: 'Validation Demo',
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

describe('runtime validation', () => {
  it('returns field-level errors from schema rules', () => {
    const errors = validateRuntimePage(schema, {
      amount: 0,
      customerName: '',
    });

    expect(errors.customerName).toContain('Customer is required.');
    expect(errors.amount).toContain('Amount must be greater than or equal to 1.');
  });
});

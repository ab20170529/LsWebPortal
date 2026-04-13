import { describe, expect, it } from 'vitest';

import { createRuntimeActionEngine } from './index';

const state = {
  activeBehaviorEffects: [],
  activeBehaviorRuleIds: [],
  fieldOrder: ['billNo'],
  fields: {
    billNo: {
      field: 'billNo',
      label: 'Bill Number',
      value: 'SO-1001',
      valueType: 'string' as const,
    },
  },
  pageId: 'demo',
  schema: {} as never,
  validationErrors: {},
  values: {
    billNo: 'SO-1001',
  },
};

describe('runtime actions', () => {
  it('interpolates submit messages from runtime values', () => {
    const engine = createRuntimeActionEngine({
      schema: {
        actions: [
          {
            id: 'submitDraft',
            kind: 'submit',
            messageTemplate: 'Submitted {{billNo}} successfully.',
          },
        ],
        behaviorRules: [],
        fields: [],
        id: 'demo',
        template: 'bill',
        title: 'Demo',
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
      store: {
        getSnapshot: () => state,
        getValue: () => state.values.billNo,
        reset: () => undefined,
        setFieldValue: () => undefined,
        subscribe: () => () => undefined,
      },
    });

    expect(engine.dispatch('submitDraft').message).toBe(
      'Submitted SO-1001 successfully.',
    );
  });
});

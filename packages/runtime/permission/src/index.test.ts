import { describe, expect, it } from 'vitest';

import { createRuntimePermissionEngine } from './index';

describe('runtime permission', () => {
  it('resolves field and action permission expressions from bindings', () => {
    const engine = createRuntimePermissionEngine({
      schema: {
        actions: [
          {
            id: 'submit',
            kind: 'submit',
            messageTemplate: 'submit',
            permission: {
              enabledWhen: 'permissions.canSubmit == true',
            },
          },
        ],
        behaviorRules: [],
        fields: [
          {
            field: 'amount',
            label: 'Amount',
            permission: {
              editableWhen: 'permissions.canEditAmount == true',
              visibleWhen: 'permissions.canViewAmount == true',
            },
            valueType: 'number',
          },
        ],
        id: 'permission.demo',
        template: 'bill',
        title: 'Permission Demo',
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

    const result = engine.resolveAllFieldPermissions({
      permissions: {
        canEditAmount: false,
        canSubmit: true,
        canViewAmount: true,
      },
    });

    expect(result.amount.disabled).toBe(true);
    expect(result.amount.visible).toBe(true);
    expect(
      engine.resolveAllActionPermissions({
        permissions: {
          canSubmit: true,
        },
      }).submit.disabled,
    ).toBe(false);
  });
});

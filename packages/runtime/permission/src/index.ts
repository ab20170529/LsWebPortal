import type { PlatformPageSchema } from '@lserp/contracts';
import { evaluateBooleanExpression } from '@lserp/runtime-expression';

export type RuntimeActionPermissionState = {
  disabled: boolean;
  visible: boolean;
};

export type RuntimeFieldPermissionState = {
  disabled: boolean;
  visible: boolean;
};

export type RuntimePermissionBindings = Record<string, unknown>;

export type RuntimePermissionEngine = ReturnType<typeof createRuntimePermissionEngine>;

type RuntimePermissionEngineOptions = {
  schema: PlatformPageSchema;
};

export function createRuntimePermissionEngine({
  schema,
}: RuntimePermissionEngineOptions) {
  const fieldMap = new Map(
    schema.fields.map((field) => [field.field, field] as const),
  );
  const actionMap = new Map(
    (schema.actions ?? []).map((action) => [action.id, action] as const),
  );

  const resolveFieldPermission = (
    fieldName: string,
    bindings: RuntimePermissionBindings,
  ): RuntimeFieldPermissionState => {
    const field = fieldMap.get(fieldName);

    if (!field?.permission) {
      return { disabled: false, visible: true };
    }

    return {
      disabled: field.permission.editableWhen
        ? !evaluateBooleanExpression(field.permission.editableWhen, bindings)
        : false,
      visible: field.permission.visibleWhen
        ? evaluateBooleanExpression(field.permission.visibleWhen, bindings)
        : true,
    };
  };

  const resolveActionPermission = (
    actionId: string,
    bindings: RuntimePermissionBindings,
  ): RuntimeActionPermissionState => {
    const action = actionMap.get(actionId);

    if (!action?.permission) {
      return { disabled: false, visible: true };
    }

    return {
      disabled: action.permission.enabledWhen
        ? !evaluateBooleanExpression(action.permission.enabledWhen, bindings)
        : false,
      visible: action.permission.visibleWhen
        ? evaluateBooleanExpression(action.permission.visibleWhen, bindings)
        : true,
    };
  };

  return {
    resolveActionPermission,
    resolveAllActionPermissions(bindings: RuntimePermissionBindings) {
      return Object.fromEntries(
        (schema.actions ?? []).map((action) => [
          action.id,
          resolveActionPermission(action.id, bindings),
        ]),
      ) as Record<string, RuntimeActionPermissionState>;
    },
    resolveAllFieldPermissions(bindings: RuntimePermissionBindings) {
      return Object.fromEntries(
        schema.fields.map((field) => [
          field.field,
          resolveFieldPermission(field.field, bindings),
        ]),
      ) as Record<string, RuntimeFieldPermissionState>;
    },
    resolveFieldPermission,
  };
}

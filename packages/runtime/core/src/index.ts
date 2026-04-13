import type { PlatformPageSchema } from '@lserp/contracts';
import { evaluateBooleanExpression } from '@lserp/runtime-expression';
import {
  validateRuntimePage,
  type RuntimeValidationErrors,
} from '@lserp/runtime-validation';

export type RuntimeFieldValues = Record<string, unknown>;

export type RuntimeFieldState = {
  field: string;
  label: string;
  value: unknown;
  valueType: PlatformPageSchema['fields'][number]['valueType'];
};

export type RuntimePageState = {
  activeBehaviorEffects: string[];
  activeBehaviorRuleIds: string[];
  fieldOrder: string[];
  fields: Record<string, RuntimeFieldState>;
  pageId: string;
  schema: PlatformPageSchema;
  validationErrors: RuntimeValidationErrors;
  values: RuntimeFieldValues;
};

export function createRuntimePageState(
  schema: PlatformPageSchema,
  seedValues: RuntimeFieldValues = {},
): RuntimePageState {
  return deriveRuntimePageState(schema, seedValues);
}

export function setRuntimeFieldValue(
  state: RuntimePageState,
  field: string,
  value: unknown,
): RuntimePageState {
  if (!state.fields[field]) {
    return state;
  }

  return deriveRuntimePageState(state.schema, {
    ...state.values,
    [field]: value,
  });
}

export function resetRuntimePageState(
  schema: PlatformPageSchema,
  seedValues: RuntimeFieldValues = {},
): RuntimePageState {
  return createRuntimePageState(schema, seedValues);
}

function deriveRuntimePageState(
  schema: PlatformPageSchema,
  seedValues: RuntimeFieldValues,
): RuntimePageState {
  const fieldEntries = schema.fields.map((fieldSchema) => {
    const value =
      seedValues[fieldSchema.field] ??
      fieldSchema.initialValue ??
      getDefaultValue(fieldSchema.valueType);

    return [
      fieldSchema.field,
      {
        field: fieldSchema.field,
        label: fieldSchema.label,
        value,
        valueType: fieldSchema.valueType,
      } satisfies RuntimeFieldState,
    ] as const;
  });

  const values = Object.fromEntries(
    fieldEntries.map(([field, state]) => [field, state.value]),
  );

  const activeRules = schema.behaviorRules.filter((rule) =>
    evaluateBooleanExpression(rule.condition, values),
  );

  return {
    activeBehaviorEffects: activeRules.map((rule) => rule.effect),
    activeBehaviorRuleIds: activeRules.map((rule) => rule.id),
    fieldOrder: schema.fields.map((field) => field.field),
    fields: Object.fromEntries(fieldEntries),
    pageId: schema.id,
    schema,
    validationErrors: validateRuntimePage(schema, values),
    values,
  };
}

function getDefaultValue(valueType: RuntimeFieldState['valueType']) {
  if (valueType === 'boolean') {
    return false;
  }

  if (valueType === 'number') {
    return 0;
  }

  if (valueType === 'object') {
    return {};
  }

  return '';
}

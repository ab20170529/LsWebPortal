import type {
  PlatformFieldSchema,
  PlatformPageSchema,
  PlatformValidationRule,
} from '@lserp/contracts';
import { evaluateBooleanExpression } from '@lserp/runtime-expression';

export type RuntimeValidationErrors = Record<string, string[]>;

export function validateRuntimePage(
  schema: PlatformPageSchema,
  values: Record<string, unknown>,
): RuntimeValidationErrors {
  return Object.fromEntries(
    schema.fields.map((field) => [
      field.field,
      validateField(field, values),
    ]),
  );
}

export function validateField(
  field: PlatformFieldSchema,
  values: Record<string, unknown>,
): string[] {
  const rules = field.validations ?? [];

  return rules.flatMap((rule) => {
    if (rule.when && !evaluateBooleanExpression(rule.when, values)) {
      return [];
    }

    const value = values[field.field];
    const message = rule.message ?? getDefaultMessage(field.label, rule);

    if (rule.kind === 'required') {
      return isEmptyValue(value) ? [message] : [];
    }

    if (rule.kind === 'min') {
      return Number(value ?? 0) < rule.value ? [message] : [];
    }

    if (rule.kind === 'max') {
      return Number(value ?? 0) > rule.value ? [message] : [];
    }

    if (rule.kind === 'expression') {
      return evaluateBooleanExpression(rule.expression, values) ? [] : [message];
    }

    return [];
  });
}

function getDefaultMessage(
  label: string,
  rule: PlatformValidationRule,
) {
  if (rule.kind === 'required') {
    return `${label} is required.`;
  }

  if (rule.kind === 'min') {
    return `${label} must be greater than or equal to ${rule.value}.`;
  }

  if (rule.kind === 'max') {
    return `${label} must be less than or equal to ${rule.value}.`;
  }

  return `${label} failed validation.`;
}

function isEmptyValue(value: unknown) {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  return false;
}

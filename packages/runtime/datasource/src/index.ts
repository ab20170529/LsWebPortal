import type {
  PlatformDatasourceOption,
  PlatformPageSchema,
} from '@lserp/contracts';
import { evaluateBooleanExpression } from '@lserp/runtime-expression';

export type RuntimeDatasourceEngine = ReturnType<typeof createRuntimeDatasourceEngine>;

type RuntimeDatasourceEngineOptions = {
  schema: PlatformPageSchema;
};

export function createRuntimeDatasourceEngine({
  schema,
}: RuntimeDatasourceEngineOptions) {
  const datasourceMap = new Map(
    (schema.datasources ?? []).map((datasource) => [datasource.id, datasource] as const),
  );
  const fieldMap = new Map(
    schema.fields.map((field) => [field.field, field] as const),
  );

  const getFieldOptions = async (
    fieldName: string,
    values: Record<string, unknown>,
  ): Promise<PlatformDatasourceOption[]> => {
    const field = fieldMap.get(fieldName);

    if (!field?.datasourceId) {
      return [];
    }

    const datasource = datasourceMap.get(field.datasourceId);

    if (!datasource) {
      return [];
    }

    if (datasource.kind === 'static-options') {
      return datasource.options.filter((option) => {
        if (!option.when) {
          return true;
        }

        return evaluateBooleanExpression(option.when, values);
      });
    }

    return [];
  };

  return {
    getFieldOptions,
    async loadAllFieldOptions(values: Record<string, unknown>) {
      const optionEntries = await Promise.all(
        schema.fields
          .filter((field) => Boolean(field.datasourceId))
          .map(async (field) => [
            field.field,
            await getFieldOptions(field.field, values),
          ] as const),
      );

      return Object.fromEntries(optionEntries);
    },
  };
}

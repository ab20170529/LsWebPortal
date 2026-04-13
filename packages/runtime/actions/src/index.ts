import type { PlatformActionSchema, PlatformPageSchema } from '@lserp/contracts';
import type { RuntimePageStore } from '@lserp/runtime-store';

export type RuntimeActionExecutionResult = {
  actionId: string;
  kind: PlatformActionSchema['kind'];
  message: string;
};

export type RuntimeActionEngine = ReturnType<typeof createRuntimeActionEngine>;

type RuntimeActionEngineOptions = {
  schema: PlatformPageSchema;
  store: RuntimePageStore;
};

export function createRuntimeActionEngine({
  schema,
  store,
}: RuntimeActionEngineOptions) {
  const actionMap = new Map(
    (schema.actions ?? []).map((action) => [action.id, action] as const),
  );

  return {
    dispatch(actionId: string): RuntimeActionExecutionResult {
      const action = actionMap.get(actionId);

      if (!action) {
        throw new Error(`Unknown runtime action: ${actionId}`);
      }

      if (action.kind === 'reset') {
        store.reset();
        return {
          actionId,
          kind: action.kind,
          message:
            action.messageTemplate ?? 'Draft reset back to schema defaults.',
        };
      }

      const snapshot = store.getSnapshot();
      const message = interpolateTemplate(action.messageTemplate, snapshot.values);

      return {
        actionId,
        kind: action.kind,
        message,
      };
    },
    getAction(actionId: string) {
      return actionMap.get(actionId) ?? null;
    },
    listActions() {
      return Array.from(actionMap.values());
    },
  };
}

function interpolateTemplate(
  template: string,
  values: Record<string, unknown>,
) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, token: string) => {
    const value = values[token];
    return value == null || value === '' ? '--' : String(value);
  });
}

import { useSyncExternalStore } from 'react';
import type { PlatformPageSchema } from '@lserp/contracts';
import {
  createRuntimePageState,
  resetRuntimePageState,
  setRuntimeFieldValue,
  type RuntimeFieldValues,
  type RuntimePageState,
} from '@lserp/runtime-core';

export type RuntimePageStore = ReturnType<typeof createRuntimePageStore>;

export function createRuntimePageStore(
  schema: PlatformPageSchema,
  initialValues: RuntimeFieldValues = {},
) {
  let state = createRuntimePageState(schema, initialValues);
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => {
      listener();
    });
  };

  return {
    getSnapshot() {
      return state;
    },
    getValue(field: string) {
      return state.values[field];
    },
    reset(nextValues: RuntimeFieldValues = {}) {
      state = resetRuntimePageState(schema, nextValues);
      emit();
    },
    setFieldValue(field: string, value: unknown) {
      state = setRuntimeFieldValue(state, field, value);
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useRuntimePageSnapshot(store: RuntimePageStore): RuntimePageState {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}

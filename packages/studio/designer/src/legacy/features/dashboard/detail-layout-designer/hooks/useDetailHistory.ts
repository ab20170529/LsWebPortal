import { useCallback, useMemo, useState } from 'react';

import type { DetailLayoutHistory } from '../types';

const DETAIL_LAYOUT_HISTORY_LIMIT = 50;

type HistoryUpdater<T> = T | ((current: T) => T);

export function useDetailHistory<T>(initialPresent: T) {
  const [history, setHistory] = useState<DetailLayoutHistory<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const setPresent = useCallback((nextValue: HistoryUpdater<T>) => {
    setHistory((current) => {
      const nextPresent = typeof nextValue === 'function'
        ? (nextValue as (value: T) => T)(current.present)
        : nextValue;

      if (Object.is(nextPresent, current.present)) {
        return current;
      }

      const nextPast = [...current.past, current.present];
      if (nextPast.length > DETAIL_LAYOUT_HISTORY_LIMIT) {
        nextPast.shift();
      }

      return {
        past: nextPast,
        present: nextPresent,
        future: [],
      };
    });
  }, []);

  const reset = useCallback((nextPresent: T) => {
    setHistory({
      past: [],
      present: nextPresent,
      future: [],
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) {
        return current;
      }

      const past = [...current.past];
      const previous = past.pop() as T;

      return {
        past,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) {
        return current;
      }

      const [nextPresent, ...future] = current.future;

      return {
        past: [...current.past, current.present],
        present: nextPresent,
        future,
      };
    });
  }, []);

  return useMemo(() => ({
    ...history,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    redo,
    reset,
    setPresent,
    undo,
  }), [history, redo, reset, setPresent, undo]);
}

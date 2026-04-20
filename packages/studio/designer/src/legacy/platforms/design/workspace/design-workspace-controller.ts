import { useEffect, useMemo, useState } from 'react';

import type { DesignRouteContext } from '../../../app/contracts/platform-routing';
import {
  buildDesignWorkspacePath,
  navigateToDesignPath,
  updateCurrentDesignSearch,
} from '../navigation/design-navigation';
import type {
  DesignWorkspaceState,
  DesignWorkspaceUrlState,
  DesignWorkspaceWorkbench,
} from './design-workspace-state';

export type DesignWorkspaceSearchPatch = Partial<{
  configOpen: boolean;
  configStep: number | null;
  detailPreview: boolean;
  mode: string | null;
  moduleCode: string | null;
  theme: string | null;
  workbench: DesignWorkspaceWorkbench | null;
}>;

export type DesignWorkspaceMenuIntent = Partial<Pick<DesignRouteContext, 'subsystemCode' | 'menuCode' | 'moduleCode'>>;

export type DesignWorkspaceController = {
  routeContext: DesignRouteContext;
  urlState: DesignWorkspaceUrlState;
  syncMenuIntent: (intent: DesignWorkspaceMenuIntent, options?: { replace?: boolean }) => void;
  syncUrlState: (patch: DesignWorkspaceSearchPatch, options?: { replace?: boolean }) => void;
};

function mapPatchToSearchUpdates(patch: DesignWorkspaceSearchPatch) {
  const updates: Record<string, boolean | number | string | null | undefined> = {};

  if ('configOpen' in patch) {
    updates.config = patch.configOpen ? '1' : null;
    if (patch.configOpen === false) {
      updates.step = null;
      updates.module = null;
    }
  }

  if ('configStep' in patch) {
    updates.step = patch.configStep;
  }

  if ('detailPreview' in patch) {
    updates.detailPreview = patch.detailPreview ? '1' : null;
  }

  if ('mode' in patch) {
    updates.mode = patch.mode;
  }

  if ('moduleCode' in patch) {
    updates.module = patch.moduleCode;
  }

  if ('theme' in patch) {
    updates.theme = patch.theme;
  }

  if ('workbench' in patch) {
    updates.workbench = patch.workbench;
  }

  return updates;
}

function useDesignWorkspaceResolvedState(initialState: DesignWorkspaceState) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  return [state, setState] as const;
}

export function useDesignWorkspaceController(initialState: DesignWorkspaceState): DesignWorkspaceController {
  const [state, setState] = useDesignWorkspaceResolvedState(initialState);

  const controller = useMemo<DesignWorkspaceController>(() => ({
    routeContext: state.routeContext,
    urlState: state.urlState,
    syncMenuIntent: (intent, options = {}) => {
      const nextContext: DesignRouteContext = {
        ...state.routeContext,
        ...intent,
      };

      setState((prev) => ({
        ...prev,
        routeContext: nextContext,
        urlState: {
          ...prev.urlState,
          moduleCode: intent.moduleCode ?? prev.urlState.moduleCode,
        },
      }));

      navigateToDesignPath(buildDesignWorkspacePath(nextContext), options);
    },
    syncUrlState: (patch, options = {}) => {
      setState((prev) => ({
        ...prev,
        urlState: {
          ...prev.urlState,
          configOpen: patch.configOpen ?? prev.urlState.configOpen,
          configStep: patch.configStep ?? prev.urlState.configStep,
          detailPreview: patch.detailPreview ?? prev.urlState.detailPreview,
          mode: patch.mode === undefined ? prev.urlState.mode : patch.mode ?? undefined,
          moduleCode: patch.moduleCode === undefined ? prev.urlState.moduleCode : patch.moduleCode ?? undefined,
          theme: patch.theme === undefined ? prev.urlState.theme : patch.theme ?? undefined,
          workbench: patch.workbench ?? prev.urlState.workbench,
        },
      }));

      updateCurrentDesignSearch(mapPatchToSearchUpdates(patch), options);
    },
  }), [setState, state]);

  return controller;
}

import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { updateCurrentDesignSearch } from '../../../platforms/design/navigation/design-navigation';
import type { DashboardWorkbench } from '../dashboard-workbench-types';

type SyncWorkspaceUrlState = (patch: Partial<{
  configOpen: boolean;
  configStep: number | null;
  detailPreview: boolean;
  mode: string | null;
  moduleCode: string | null;
  theme: string | null;
  workbench: DashboardWorkbench | null;
}>, options?: { replace?: boolean }) => void;

export function useDashboardWorkbenchNav({
  setActiveWorkbench,
  syncWorkspaceUrlState,
}: {
  setActiveWorkbench: Dispatch<SetStateAction<DashboardWorkbench>>;
  syncWorkspaceUrlState?: SyncWorkspaceUrlState;
}) {
  const openResearchRecordWorkbench = useCallback(() => {
    setActiveWorkbench('research-record');
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({ workbench: 'research-record' }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({ workbench: 'research-record' }, { replace: true });
  }, [setActiveWorkbench, syncWorkspaceUrlState]);

  const closeResearchRecordWorkbench = useCallback(() => {
    setActiveWorkbench('modules');
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({ workbench: null }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({ workbench: null }, { replace: true });
  }, [setActiveWorkbench, syncWorkspaceUrlState]);

  const openToolFeedbackWorkbench = useCallback(() => {
    setActiveWorkbench('tool-feedback');
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({ workbench: 'tool-feedback' }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({ workbench: 'tool-feedback' }, { replace: true });
  }, [setActiveWorkbench, syncWorkspaceUrlState]);

  const openFunctionFlowDesignWorkbench = useCallback(() => {
    setActiveWorkbench('function-flow-design');
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({ workbench: 'function-flow-design' }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({ workbench: 'function-flow-design' }, { replace: true });
  }, [setActiveWorkbench, syncWorkspaceUrlState]);

  const closeFunctionFlowDesignWorkbench = useCallback(() => {
    setActiveWorkbench('modules');
    if (syncWorkspaceUrlState) {
      syncWorkspaceUrlState({ workbench: null }, { replace: true });
      return;
    }

    updateCurrentDesignSearch({ workbench: null }, { replace: true });
  }, [setActiveWorkbench, syncWorkspaceUrlState]);

  return {
    closeFunctionFlowDesignWorkbench,
    closeResearchRecordWorkbench,
    openFunctionFlowDesignWorkbench,
    openResearchRecordWorkbench,
    openToolFeedbackWorkbench,
  };
}

import Dashboard from '../../../components/Dashboard';
import type { DesignRouteContext } from '../../../app/contracts/platform-routing';
import type { DashboardWorkbench } from '../../../features/dashboard/dashboard-workbench-types';
import { DesignWorkspaceRoutePresenter } from './design-workspace-route-presenter';
import { useDesignWorkspaceController } from './design-workspace-controller';
import { buildDesignWorkspaceMenuBridgeState } from './design-workspace-menu-bridge';
import type { DesignWorkspaceState } from './design-workspace-state';

type DesignWorkspaceContainerProps = {
  currentUserName: string;
  immersive?: boolean;
  onLogout: () => void;
  state: DesignWorkspaceState;
};

export type DashboardWorkspaceAdapterState = {
  initialConfigOpen: boolean;
  initialConfigStep: number;
  initialDetailPreview: boolean;
  initialModuleCode?: string;
  initialBusinessType?: string;
  initialWorkbench: DashboardWorkbench;
  initialWorkspaceTheme?: string;
  menuBridge: {
    initialMenuCode?: string;
    initialModuleCode?: string;
    initialSubsystemCode?: string;
  };
  routeContext: DesignRouteContext;
  syncMenuIntent: (intent: Partial<Pick<DesignRouteContext, 'subsystemCode' | 'menuCode' | 'moduleCode'>>, options?: { replace?: boolean }) => void;
  syncUrlState: (patch: Partial<{
    configOpen: boolean;
    configStep: number | null;
    detailPreview: boolean;
    mode: string | null;
    moduleCode: string | null;
    theme: string | null;
    workbench: DashboardWorkbench | null;
  }>, options?: { replace?: boolean }) => void;
};

function buildDashboardWorkspaceAdapterState(
  state: DesignWorkspaceState,
  actions: Pick<DashboardWorkspaceAdapterState, 'syncMenuIntent' | 'syncUrlState'>,
): DashboardWorkspaceAdapterState {
  return {
    initialBusinessType: state.urlState.mode,
    initialConfigOpen: state.urlState.configOpen,
    initialConfigStep: state.urlState.configStep,
    initialDetailPreview: state.urlState.detailPreview,
    initialModuleCode: state.urlState.moduleCode,
    initialWorkbench: state.urlState.workbench,
    initialWorkspaceTheme: state.urlState.theme,
    menuBridge: buildDesignWorkspaceMenuBridgeState(state.routeContext, state.urlState.moduleCode),
    routeContext: state.routeContext,
    syncMenuIntent: actions.syncMenuIntent,
    syncUrlState: actions.syncUrlState,
  };
}

export function DesignWorkspaceContainer({
  currentUserName,
  immersive = false,
  onLogout,
  state,
}: DesignWorkspaceContainerProps) {
  const controller = useDesignWorkspaceController(state);
  const dashboardState = buildDashboardWorkspaceAdapterState(state, {
    syncMenuIntent: controller.syncMenuIntent,
    syncUrlState: controller.syncUrlState,
  });

  if (immersive) {
    return (
      <Dashboard
        currentUserName={currentUserName}
        onLogout={onLogout}
        workspaceState={dashboardState}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DesignWorkspaceRoutePresenter context={controller.routeContext} urlState={controller.urlState} />
      <div className="rounded-[28px] border border-slate-200/80 bg-white/78 p-2 shadow-[0_28px_54px_-40px_rgba(15,23,42,0.32)]">
        <Dashboard
          currentUserName={currentUserName}
          onLogout={onLogout}
          workspaceState={dashboardState}
        />
      </div>
    </div>
  );
}

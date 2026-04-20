import type { DesignRouteContext } from '../../../app/contracts/platform-routing';

export type DesignWorkspaceMenuBridgeState = {
  initialSubsystemCode?: string;
  initialMenuCode?: string;
  initialModuleCode?: string;
};

export function buildDesignWorkspaceMenuBridgeState(
  routeContext: DesignRouteContext,
  moduleCode?: string,
): DesignWorkspaceMenuBridgeState {
  return {
    initialMenuCode: routeContext.menuCode,
    initialModuleCode: routeContext.moduleCode || moduleCode,
    initialSubsystemCode: routeContext.subsystemCode,
  };
}

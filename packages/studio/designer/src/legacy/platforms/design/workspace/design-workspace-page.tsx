import type { DesignFixedRoute } from '../../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import { DesignWorkspaceContainer } from './design-workspace-container';
import { resolveDesignWorkspaceState } from './design-workspace-state';

type DesignWorkspacePageProps = {
  activeCompanyTitle?: string;
  currentPath: string;
  currentUserName: string;
  onLogout: () => void;
  onSwitchCompany?: () => void;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

export function DesignWorkspacePage({
  activeCompanyTitle,
  currentUserName,
  onLogout,
  onSwitchCompany,
  route,
}: DesignWorkspacePageProps) {
  const workspaceState = resolveDesignWorkspaceState(
    route.context,
    typeof window === 'undefined' ? '' : window.location.search,
  );

  return (
    <DesignWorkspaceContainer
      activeCompanyTitle={activeCompanyTitle}
      currentUserName={currentUserName}
      immersive
      onLogout={onLogout}
      onSwitchCompany={onSwitchCompany}
      state={workspaceState}
    />
  );
}

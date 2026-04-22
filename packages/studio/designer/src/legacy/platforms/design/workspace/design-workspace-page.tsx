import type { DesignFixedRoute } from '../../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import { DesignWorkspaceContainer } from './design-workspace-container';
import { resolveDesignWorkspaceState } from './design-workspace-state';

type DesignWorkspacePageProps = {
  currentPath: string;
  currentUserName: string;
  onLogout: () => void;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

export function DesignWorkspacePage({
  currentUserName,
  onLogout,
  route,
}: DesignWorkspacePageProps) {
  const workspaceState = resolveDesignWorkspaceState(
    route.context,
    typeof window === 'undefined' ? '' : window.location.search,
  );

  return (
    <DesignWorkspaceContainer
      currentUserName={currentUserName}
      immersive
      onLogout={onLogout}
      state={workspaceState}
    />
  );
}

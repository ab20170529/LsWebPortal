import type { DesignFixedRoute } from '../../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import { DesignWorkspacePage } from '../workspace/design-workspace-page';

type DesignPlatformLegacyWorkspaceEntryProps = {
  currentPath: string;
  currentUserName: string;
  onLogout: () => void;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

export function DesignPlatformLegacyWorkspaceEntry({
  currentPath,
  currentUserName,
  onLogout,
  platform,
  route,
}: DesignPlatformLegacyWorkspaceEntryProps) {
  return (
    <DesignWorkspacePage
      currentPath={currentPath}
      currentUserName={currentUserName}
      onLogout={onLogout}
      platform={platform}
      route={route}
    />
  );
}

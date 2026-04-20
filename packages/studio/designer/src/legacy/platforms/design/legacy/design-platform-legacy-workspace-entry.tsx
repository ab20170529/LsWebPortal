import type { DesignFixedRoute } from '../../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import { DesignWorkspacePage } from '../workspace/design-workspace-page';

type DesignPlatformLegacyWorkspaceEntryProps = {
  activeCompanyTitle?: string;
  currentPath: string;
  currentUserName: string;
  onLogout: () => void;
  onSwitchCompany?: () => void;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

export function DesignPlatformLegacyWorkspaceEntry({
  activeCompanyTitle,
  currentPath,
  currentUserName,
  onLogout,
  onSwitchCompany,
  platform,
  route,
}: DesignPlatformLegacyWorkspaceEntryProps) {
  return (
    <DesignWorkspacePage
      activeCompanyTitle={activeCompanyTitle}
      currentPath={currentPath}
      currentUserName={currentUserName}
      onLogout={onLogout}
      onSwitchCompany={onSwitchCompany}
      platform={platform}
      route={route}
    />
  );
}

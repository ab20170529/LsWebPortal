import type { DesignFixedRoute } from '../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../app/registry/platform-registry';
import { DesignPlatformLegacyWorkspaceEntry } from './legacy/design-platform-legacy-workspace-entry';
import { DesignBillPage } from './routes/design-bill-page';
import { DesignModulePage } from './routes/design-module-page';
import { DesignSettingsPage } from './routes/design-settings-page';

type DesignPlatformAppProps = {
  currentPath: string;
  currentUserName: string;
  onLogout: () => void;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

export function DesignPlatformApp({
  currentPath,
  currentUserName,
  onLogout,
  platform,
  route,
}: DesignPlatformAppProps) {
  switch (route.routeKey) {
    case 'workspace':
      return (
        <DesignPlatformLegacyWorkspaceEntry
          currentPath={currentPath}
          currentUserName={currentUserName}
          onLogout={onLogout}
          platform={platform}
          route={route}
        />
      );
    case 'module':
      return <DesignModulePage currentPath={currentPath} platform={platform} route={route} />;
    case 'bill':
      return <DesignBillPage currentPath={currentPath} platform={platform} route={route} />;
    case 'settings':
      return <DesignSettingsPage currentPath={currentPath} platform={platform} />;
    default:
      return null;
  }
}

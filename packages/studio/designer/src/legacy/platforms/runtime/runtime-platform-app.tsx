import type { RuntimeResolvedRoute } from '../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../app/registry/platform-registry';
import { PlatformPlaceholderShell } from '../../app/shells/platform-placeholder-shell';
import { RuntimeRoutePresenter } from './runtime-route-presenter';

type RuntimePlatformAppProps = {
  currentPath: string;
  platform: PlatformDefinition;
  route: RuntimeResolvedRoute;
};

export function RuntimePlatformApp({
  currentPath,
  platform,
  route,
}: RuntimePlatformAppProps) {
  return (
    <PlatformPlaceholderShell
      currentPath={currentPath}
      platform={platform}
      summary="The runtime platform will own dynamic menu resolution, schema-driven pages, and runtime permission parsing. This step keeps the shell, route contracts, and future runtime-engine boundary in place."
      title="Runtime Platform"
    >
      <RuntimeRoutePresenter route={route} />
    </PlatformPlaceholderShell>
  );
}

import type { PlatformDefinition } from '../../app/registry/platform-registry';
import { PlatformPlaceholderShell } from '../../app/shells/platform-placeholder-shell';
import { MesPlatformPresenter } from './mes-platform-presenter';

type MesPlatformAppProps = {
  currentPath: string;
  platform: PlatformDefinition;
};

export function MesPlatformApp({ currentPath, platform }: MesPlatformAppProps) {
  return (
    <PlatformPlaceholderShell
      currentPath={currentPath}
      platform={platform}
      summary="MES and other business platforms should keep an independent main shell, fixed business routes, and platform-specific navigation instead of growing inside the design studio."
      title="MES Platform Entry"
    >
      <MesPlatformPresenter />
    </PlatformPlaceholderShell>
  );
}

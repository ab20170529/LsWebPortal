import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import { DesignFixedRouteShell } from '../design-fixed-route-shell';
import { getDesignRouteMeta } from '../design-route-meta';

type DesignSettingsPageProps = {
  currentPath: string;
  platform: PlatformDefinition;
};

const SETTINGS_DOMAINS = [
  'Publish and release policies',
  'Naming and schema governance rules',
  'Shared studio toggles and future platform preferences',
] as const;

export function DesignSettingsPage({
  currentPath,
  platform,
}: DesignSettingsPageProps) {
  const routeMeta = getDesignRouteMeta('settings');

  if (!routeMeta) {
    return null;
  }

  return (
    <DesignFixedRouteShell
      currentPath={currentPath}
      currentRouteKey="settings"
      eyebrow="Studio settings route"
      platform={platform}
      routeMeta={routeMeta}
    >
      <div className="rounded-[24px] border border-white/70 bg-white/78 p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Reserved domains</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {SETTINGS_DOMAINS.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-5 text-sm leading-7 text-slate-600">
              {item}
            </div>
          ))}
        </div>
      </div>
    </DesignFixedRouteShell>
  );
}

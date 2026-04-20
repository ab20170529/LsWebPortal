import { useEffect, type Dispatch, type SetStateAction } from 'react';

export function useDashboardDetailTabConfigSync({
  buildDetailTabConfig,
  currentModuleCode,
  detailTabs,
  setDetailTabConfigs,
}: {
  buildDetailTabConfig: () => any;
  currentModuleCode: string;
  detailTabs: Array<{ id: string; name: string }>;
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
}) {
  useEffect(() => {
    setDetailTabConfigs((prev) => {
      let changed = false;
      const next = { ...prev };

      detailTabs.forEach((tab) => {
        const current = prev[tab.id] ?? buildDetailTabConfig();
        const synced = {
          ...current,
          tab: currentModuleCode,
          tabKey: current.tabKey || tab.id,
          detailName: current.detailName || tab.name,
        };

        if (JSON.stringify(synced) !== JSON.stringify(current)) {
          next[tab.id] = synced;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [
    buildDetailTabConfig,
    currentModuleCode,
    detailTabs,
    setDetailTabConfigs,
  ]);
}

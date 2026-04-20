import { type Dispatch, type SetStateAction, useEffect } from 'react';

import { fetchSingleTableModuleDetails, type SingleTableDetailDto } from '../../../lib/backend-module-config';

type ResolvedDetailResource = {
  columns: any[];
  gridPatch: Record<string, any>;
};

export function useDashboardDetailTabsBootstrap({
  activeConfigModuleKey,
  canLoadSingleTableModuleResources,
  captureDetails,
  configStep,
  detailResourceScopeKey,
  getDashboardErrorMessage,
  isConfigOpen,
  mapSingleTableDetailRecord,
  moduleSettingStep,
  resolveSingleTableDetailResource,
  setActiveTab,
  setDetailFilterFields,
  setDetailTabConfigs,
  setDetailTableColumns,
  setDetailTableConfigs,
  setDetailTabs,
  setSelectedDetailFiltersForDelete,
  setSelectedDetailForDelete,
  showToast,
}: {
  activeConfigModuleKey: string;
  canLoadSingleTableModuleResources: boolean;
  captureDetails: (payload: {
    tabConfigs: Record<string, any>;
    tableColumns: Record<string, any[]>;
    tableConfigs: Record<string, any>;
    tabs: Array<{ id: string; name: string }>;
  }) => void;
  configStep: number;
  detailResourceScopeKey: string;
  getDashboardErrorMessage: (error: unknown) => string;
  isConfigOpen: boolean;
  mapSingleTableDetailRecord: (detail: SingleTableDetailDto, index: number) => {
    config: Record<string, any>;
    gridConfig: Record<string, any>;
    tab: { id: string; name: string };
  };
  moduleSettingStep: number;
  resolveSingleTableDetailResource: (options: {
    detailConfig: Record<string, any>;
    detailGridConfig: Record<string, any>;
  }) => Promise<ResolvedDetailResource>;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setDetailFilterFields: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTabs: Dispatch<SetStateAction<Array<{ id: string; name: string }>>>;
  setSelectedDetailFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
  showToast: (message: string) => void;
}) {
  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    let isActive = true;

    const loadSingleTableDetails = async () => {
      try {
        const rows = await fetchSingleTableModuleDetails(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const mappedDetails = rows.map((detail, index) => mapSingleTableDetailRecord(detail, index));
        const detailResourceEntries = await Promise.all(
          mappedDetails.map(async (item) => {
            try {
              const resource = await resolveSingleTableDetailResource({
                detailConfig: (item.config ?? {}) as Record<string, any>,
                detailGridConfig: (item.gridConfig ?? {}) as Record<string, any>,
              });

              if (!isActive) {
                return null;
              }

              return {
                tabId: item.tab.id,
                columns: resource.columns,
                gridPatch: resource.gridPatch,
                warning: null as string | null,
              };
            } catch (error) {
              return {
                tabId: item.tab.id,
                columns: [] as any[],
                gridPatch: {} as Record<string, any>,
                warning: `${item.tab.name}：${getDashboardErrorMessage(error)}`,
              };
            }
          }),
        );

        if (!isActive) {
          return;
        }

        const detailResourceMap = new Map(
          detailResourceEntries
            .filter((item): item is {
              tabId: string;
              columns: any[];
              gridPatch: Record<string, any>;
              warning: string | null;
            } => Boolean(item))
            .map((item) => [item.tabId, item]),
        );
        const detailLoadWarnings = detailResourceEntries
          .flatMap((item) => (item?.warning ? [item.warning] : []));
        const nextTabs = mappedDetails.map((item) => item.tab);
        const nextTabConfigs = Object.fromEntries(mappedDetails.map((item) => [item.tab.id, item.config]));
        const nextGridConfigs = Object.fromEntries(mappedDetails.map((item) => [
          item.tab.id,
          {
            ...item.gridConfig,
            ...(detailResourceMap.get(item.tab.id)?.gridPatch ?? {}),
          },
        ]));
        const nextDetailColumns = Object.fromEntries(mappedDetails.map((item) => [
          item.tab.id,
          detailResourceMap.get(item.tab.id)?.columns ?? [],
        ]));
        const nextDetailFilters = Object.fromEntries(mappedDetails.map((item) => [item.tab.id, [] as any[]]));
        const nextActiveTab = nextTabs[0]?.id ?? '';

        setDetailTabs(nextTabs);
        setDetailTabConfigs(nextTabConfigs);
        setDetailTableConfigs(nextGridConfigs);
        setDetailTableColumns(nextDetailColumns);
        captureDetails({
          tabConfigs: nextTabConfigs,
          tableColumns: nextDetailColumns,
          tableConfigs: nextGridConfigs,
          tabs: nextTabs,
        });
        setDetailFilterFields(nextDetailFilters);
        setSelectedDetailForDelete([]);
        setSelectedDetailFiltersForDelete([]);
        setActiveTab((prev) => (nextTabs.some((tab) => tab.id === prev) ? prev : nextActiveTab));

        if (detailLoadWarnings.length > 0) {
          showToast(detailLoadWarnings[0]);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableDetails();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureDetails,
    configStep,
    detailResourceScopeKey,
    getDashboardErrorMessage,
    isConfigOpen,
    mapSingleTableDetailRecord,
    moduleSettingStep,
    resolveSingleTableDetailResource,
    setActiveTab,
    setDetailFilterFields,
    setDetailTabConfigs,
    setDetailTableColumns,
    setDetailTableConfigs,
    setDetailTabs,
    setSelectedDetailFiltersForDelete,
    setSelectedDetailForDelete,
    showToast,
  ]);
}

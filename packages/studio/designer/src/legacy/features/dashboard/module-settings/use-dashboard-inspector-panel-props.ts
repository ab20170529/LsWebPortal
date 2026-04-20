import { useCallback, type Dispatch, type SetStateAction } from 'react';

import { type InspectorPanelRouterProps } from './inspector-panel-router';
import {
  useInspectorPanelProps,
  type UseInspectorPanelPropsOptions,
} from './use-inspector-panel-props';

export type UseDashboardInspectorPanelPropsInput = Omit<
  UseInspectorPanelPropsOptions,
  'updateActiveDetailTabConfig' | 'updateActiveDetailTabType'
> & {
  buildDetailTabConfig: (input: { detailName: string; tabKey: string }) => Record<string, any>;
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
};

export function useDashboardInspectorPanelProps(
  input: UseDashboardInspectorPanelPropsInput,
): InspectorPanelRouterProps {
  const {
    activeTab,
    applyDetailModuleInheritanceById,
    businessType,
    buildDetailTabConfig,
    detailSourceModuleCandidates,
    detailTableColumns,
    detailTabs,
    getDetailFillTypeBackendValue,
    getDetailTabConfigById,
    handleDetailModuleCodeChange,
    loadSingleTableDetailResourcesById,
    normalizeDetailFillTypeValue,
    setDetailTabConfigs,
    setDetailTableConfigs,
    setDetailTabs,
    setInspectorTarget,
    showToast,
  } = input;

  const updateActiveDetailTabConfig = useCallback((patch: Record<string, any>) => {
    const currentTabId = activeTab;
    const normalizedPatch: Record<string, any> = Object.prototype.hasOwnProperty.call(patch, 'detailType')
      ? (() => {
          const normalizedType = normalizeDetailFillTypeValue(patch.detailType);
          return {
            ...patch,
            detailType: normalizedType,
            detailTypeCode: getDetailFillTypeBackendValue(normalizedType),
          };
        })()
      : patch;

    setDetailTabConfigs((prev) => ({
      ...prev,
      [currentTabId]: {
        ...(prev[currentTabId] ?? buildDetailTabConfig({
          tabKey: currentTabId,
          detailName: detailTabs.find((tab) => tab.id === currentTabId)?.name ?? '当前明细模块',
        })),
        ...normalizedPatch,
      },
    }));

    if (typeof normalizedPatch.detailName === 'string') {
      const nextName = normalizedPatch.detailName.trim() || '未命名明细';
      setDetailTabs((prev) => prev.map((tab) => (
        tab.id === currentTabId
          ? { ...tab, name: nextName }
          : tab
      )));
    }
  }, [
    activeTab,
    buildDetailTabConfig,
    detailTabs,
    getDetailFillTypeBackendValue,
    normalizeDetailFillTypeValue,
    setDetailTabConfigs,
    setDetailTabs,
  ]);

  const updateActiveDetailTabType = useCallback((nextType: string) => {
    const normalizedType = normalizeDetailFillTypeValue(nextType);
    updateActiveDetailTabConfig({ detailType: normalizedType });
    setInspectorTarget((prev) => (
      prev.kind === 'detail-grid'
        ? { kind: 'detail-grid', id: normalizedType }
        : prev
    ));
    void loadSingleTableDetailResourcesById(activeTab, normalizedType);
  }, [
    activeTab,
    loadSingleTableDetailResourcesById,
    normalizeDetailFillTypeValue,
    setInspectorTarget,
    updateActiveDetailTabConfig,
  ]);

  const updateActiveDetailGridConfig = useCallback((patch: Record<string, any>) => {
    const currentTabId = activeTab;
    setDetailTableConfigs((prev) => ({
      ...prev,
      [currentTabId]: {
        mainSql: '',
        defaultQuery: '',
        sourceCondition: '',
        sqlPrompt: '',
        tableType: '普通表格',
        ...(prev[currentTabId] ?? {}),
        ...patch,
      },
    }));
  }, [
    activeTab,
    setDetailTableConfigs,
  ]);

  const detailTabRelationSectionProps = (() => {
    const currentTabId = activeTab;
    if (!currentTabId || businessType === 'table') {
      return null;
    }

    const currentTabConfig = getDetailTabConfigById(currentTabId);
    const detailSourceModuleCode = String(currentTabConfig.relatedModule || '').trim();
    const detailSourceMode = detailSourceModuleCode ? 'module' : 'sql';
    const matchedDetailModuleCandidate = detailSourceModuleCandidates.find(
      (candidate) => String(candidate.moduleCode || '').trim() === detailSourceModuleCode,
    ) ?? null;

    return {
      availableGridColumnCount: (detailTableColumns[currentTabId] ?? []).length,
      detailSourceModuleCandidates,
      detailSourceModuleCode,
      detailSourceMode,
      matchedDetailModuleCandidate,
      relatedCondition: String(currentTabConfig.relatedCondition || '').trim(),
      relatedModuleField: String(currentTabConfig.relatedModuleField || '').trim(),
      relatedValue: String(currentTabConfig.relatedValue || '').trim(),
      onSyncDetailColumnsFromConfiguredModule: () => {
        if (!detailSourceModuleCode) {
          showToast('请先填写模块编号');
          return;
        }
        void applyDetailModuleInheritanceById(currentTabId, detailSourceModuleCode);
      },
      onUpdateDetailSourceModuleCode: (value: string) => {
        handleDetailModuleCodeChange(currentTabId, value, { notify: true });
      },
      onUpdateRelatedCondition: (value: string) => {
        updateActiveDetailTabConfig({ relatedCondition: value });
        updateActiveDetailGridConfig({
          defaultQuery: value,
          sourceCondition: value,
        });
      },
      onUpdateRelatedModuleField: (value: string) => {
        updateActiveDetailTabConfig({ relatedModuleField: value });
      },
      onUpdateRelatedValue: (value: string) => {
        updateActiveDetailTabConfig({ relatedValue: value });
      },
    };
  })();

  return useInspectorPanelProps({
    ...input,
    detailTabRelationSectionProps,
    updateActiveDetailTabConfig,
    updateActiveDetailTabType,
  });
}

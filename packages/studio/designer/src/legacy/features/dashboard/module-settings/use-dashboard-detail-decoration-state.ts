import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect } from 'react';

import {
  fetchSingleTableDetailColors,
  fetchSingleTableDetailMenus,
  fetchSingleTableModuleColors,
  fetchSingleTableModuleMenus,
  type SingleTableColorRuleDto,
  type SingleTableContextMenuDto,
} from '../../../lib/backend-module-config';

type DetailDecorationSnapshot = {
  colorRules: any[];
  contextMenuItems: any[];
};

export function useDashboardDetailDecorationState({
  activeConfigModuleKey,
  activeDetailBackendId,
  activeDetailColorRules,
  activeDetailContextMenuItems,
  activeDetailRelatedModuleCode,
  activeTab,
  buildGridConfig,
  canLoadSingleTableModuleResources,
  captureDetailResources,
  configStep,
  currentDetailFillType,
  detailDecorationSnapshotRef,
  detailModuleDecorationSnapshotRef,
  detailTableColumnsRef,
  getDashboardErrorMessage,
  getRecordFieldValue,
  isConfigOpen,
  mapSingleTableColorRule,
  mapSingleTableContextMenuItem,
  moduleSettingStep,
  selectedDetailColorRuleId,
  selectedDetailContextMenuId,
  setDetailTableConfigs,
  setSelectedDetailColorRuleId,
  setSelectedDetailContextMenuId,
  showToast,
  toRecordNumber,
}: {
  activeConfigModuleKey: string;
  activeDetailBackendId: number;
  activeDetailColorRules: any[];
  activeDetailContextMenuItems: any[];
  activeDetailRelatedModuleCode: string;
  activeTab: string;
  buildGridConfig: (mainSql: string, defaultQuery: string, overrides?: Record<string, any>) => any;
  canLoadSingleTableModuleResources: boolean;
  captureDetailResources: (tabId: string, payload: { columns: any[]; tableConfig: any }) => void;
  configStep: number;
  currentDetailFillType: string;
  detailDecorationSnapshotRef: MutableRefObject<Map<string, DetailDecorationSnapshot>>;
  detailModuleDecorationSnapshotRef: MutableRefObject<Map<string, DetailDecorationSnapshot>>;
  detailTableColumnsRef: MutableRefObject<Record<string, any[]>>;
  getDashboardErrorMessage: (error: unknown) => string;
  getRecordFieldValue: (record: Record<string, unknown> | null | undefined, ...keys: string[]) => unknown;
  isConfigOpen: boolean;
  mapSingleTableColorRule: (rule: SingleTableColorRuleDto, index: number) => any;
  mapSingleTableContextMenuItem: (item: SingleTableContextMenuDto, index: number) => any;
  moduleSettingStep: number;
  selectedDetailColorRuleId: string | null;
  selectedDetailContextMenuId: string | null;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setSelectedDetailColorRuleId: Dispatch<SetStateAction<string | null>>;
  setSelectedDetailContextMenuId: Dispatch<SetStateAction<string | null>>;
  showToast: (message: string) => void;
  toRecordNumber: (value: unknown, fallback: number) => number;
}) {
  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources || !activeTab) {
      return;
    }

    const clearActiveDetailDecorations = () => {
      setDetailTableConfigs((prev) => ({
        ...prev,
        [activeTab]: {
          ...(prev[activeTab] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' })),
          contextMenuEnabled: false,
          contextMenuItems: [],
          colorRulesEnabled: false,
          colorRules: [],
        },
      }));
    };

    if (currentDetailFillType !== '表格' && currentDetailFillType !== '树表格') {
      clearActiveDetailDecorations();
      return;
    }

    let isActive = true;

    const applyDecorationRows = (
      menuRows: SingleTableContextMenuDto[],
      colorRows: SingleTableColorRuleDto[],
    ) => {
      const mappedMenus = [...menuRows]
        .sort(
          (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
            - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
        )
        .map((item, index) => mapSingleTableContextMenuItem(item, index));
      const mappedRules = [...colorRows]
        .sort(
          (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
            - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
        )
        .map((item, index) => mapSingleTableColorRule(item, index));

      if (activeDetailRelatedModuleCode) {
        detailModuleDecorationSnapshotRef.current.set(activeDetailRelatedModuleCode, {
          colorRules: JSON.parse(JSON.stringify(mappedRules)),
          contextMenuItems: JSON.parse(JSON.stringify(mappedMenus)),
        });
      } else if (Number.isFinite(activeDetailBackendId)) {
        detailDecorationSnapshotRef.current.set(`${activeConfigModuleKey}:${activeDetailBackendId}`, {
          colorRules: JSON.parse(JSON.stringify(mappedRules)),
          contextMenuItems: JSON.parse(JSON.stringify(mappedMenus)),
        });
      }

      let nextTableConfig: Record<string, any> = {};
      setDetailTableConfigs((prev) => {
        nextTableConfig = {
          ...(prev[activeTab] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' })),
          contextMenuEnabled: mappedMenus.length > 0,
          contextMenuItems: mappedMenus,
          colorRulesEnabled: mappedRules.length > 0,
          colorRules: mappedRules,
        };

        return {
          ...prev,
          [activeTab]: nextTableConfig,
        };
      });
      captureDetailResources(activeTab, {
        columns: detailTableColumnsRef.current[activeTab] ?? [],
        tableConfig: nextTableConfig,
      });
    };

    const loadSingleTableDetailDecorations = async () => {
      try {
        if (activeDetailRelatedModuleCode) {
          const [menuRows, colorRows] = await Promise.all([
            fetchSingleTableModuleMenus(activeDetailRelatedModuleCode),
            fetchSingleTableModuleColors(activeDetailRelatedModuleCode),
          ]);

          if (!isActive) {
            return;
          }

          applyDecorationRows(menuRows, colorRows);
          return;
        }

        if (!Number.isFinite(activeDetailBackendId)) {
          clearActiveDetailDecorations();
          return;
        }

        const [menuRows, colorRows] = await Promise.all([
          fetchSingleTableDetailMenus(activeConfigModuleKey, activeDetailBackendId),
          fetchSingleTableDetailColors(activeConfigModuleKey, activeDetailBackendId),
        ]);

        if (!isActive) {
          return;
        }

        applyDecorationRows(menuRows, colorRows);
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableDetailDecorations();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    activeDetailBackendId,
    activeDetailRelatedModuleCode,
    activeTab,
    buildGridConfig,
    canLoadSingleTableModuleResources,
    captureDetailResources,
    configStep,
    currentDetailFillType,
    detailDecorationSnapshotRef,
    detailModuleDecorationSnapshotRef,
    detailTableColumnsRef,
    getDashboardErrorMessage,
    getRecordFieldValue,
    isConfigOpen,
    mapSingleTableColorRule,
    mapSingleTableContextMenuItem,
    moduleSettingStep,
    setDetailTableConfigs,
    showToast,
    toRecordNumber,
  ]);

  useEffect(() => {
    if (!activeDetailContextMenuItems.some((item: any) => item.id === selectedDetailContextMenuId)) {
      setSelectedDetailContextMenuId(activeDetailContextMenuItems[0]?.id ?? null);
    }
  }, [
    activeDetailContextMenuItems,
    selectedDetailContextMenuId,
    setSelectedDetailContextMenuId,
  ]);

  useEffect(() => {
    if (!activeDetailColorRules.some((rule: any) => rule.id === selectedDetailColorRuleId)) {
      setSelectedDetailColorRuleId(activeDetailColorRules[0]?.id ?? null);
    }
  }, [
    activeDetailColorRules,
    selectedDetailColorRuleId,
    setSelectedDetailColorRuleId,
  ]);
}

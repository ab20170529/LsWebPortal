import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useEffect, useRef } from 'react';

import {
  fetchSingleTableDetailCharts,
  fetchSingleTableDetailGridFields,
  fetchSingleTableModuleConfig,
  fetchSingleTableModuleColors,
  fetchSingleTableModuleFields,
  fetchSingleTableModuleMenus,
  type SingleTableColorRuleDto,
  type SingleTableContextMenuDto,
  type SingleTableDetailChartDto,
  type SingleTableGridFieldDto,
} from '../../../lib/backend-module-config';
import { fetchSystemTab } from '../../../lib/backend-system';
import { buildDetailBoardConfig } from './detail-board-config';

type DetailDecorationSnapshot = {
  colorRules: any[];
  contextMenuItems: any[];
};

type DetailModuleSnapshot = {
  columns: any[];
  gridConfigPatch: Record<string, any>;
};

type ResolvedDetailResource = {
  columns: any[];
  gridPatch: Record<string, any>;
};

export function useDashboardDetailResourceLoader({
  activeConfigModuleKey,
  buildColumn,
  buildDetailTabConfig,
  buildGridConfig,
  canLoadSingleTableModuleResources,
  captureDetailResources,
  configStep,
  currentModuleCode,
  currentPrimaryTableName,
  detailModuleDecorationSnapshotRef,
  detailTabConfigs,
  detailTableColumns,
  detailTableConfigs,
  getDashboardErrorMessage,
  getRecordFieldValue,
  isAbsoluteHttpUrl,
  isConfigOpen,
  joinHttpUrl,
  mainTableColumns,
  mainTableConfig,
  mapSingleTableColorRule,
  mapSingleTableContextMenuItem,
  mapSingleTableDetailChartConfig,
  mapSingleTableDetailGridFieldToColumn,
  moduleSettingStep,
  normalizeColumn,
  normalizeDetailFillTypeValue,
  setDetailTableColumns,
  setDetailTableConfigs,
  showToast,
  toRecordNumber,
  toRecordText,
}: {
  activeConfigModuleKey: string;
  buildColumn: (prefix: string, index: number, overrides?: Record<string, any>) => any;
  buildDetailTabConfig: (overrides?: Record<string, any>) => Record<string, any>;
  buildGridConfig: (mainSql: string, defaultQuery: string, overrides?: Record<string, any>) => Record<string, any>;
  canLoadSingleTableModuleResources: boolean;
  captureDetailResources: (tabId: string, payload: { columns: any[]; tableConfig: any }) => void;
  configStep: number;
  currentModuleCode: string;
  currentPrimaryTableName: string;
  detailModuleDecorationSnapshotRef: MutableRefObject<Map<string, DetailDecorationSnapshot>>;
  detailTabConfigs: Record<string, any>;
  detailTableColumns: Record<string, any[]>;
  detailTableConfigs: Record<string, any>;
  getDashboardErrorMessage: (error: unknown) => string;
  getRecordFieldValue: (record: Record<string, unknown> | null | undefined, ...keys: string[]) => unknown;
  isAbsoluteHttpUrl: (value: string) => boolean;
  isConfigOpen: boolean;
  joinHttpUrl: (baseUrl: string, path: string) => string;
  mainTableColumns: any[];
  mainTableConfig: Record<string, any>;
  mapSingleTableColorRule: (rule: SingleTableColorRuleDto, index: number) => any;
  mapSingleTableContextMenuItem: (item: SingleTableContextMenuDto, index: number) => any;
  mapSingleTableDetailChartConfig: (chart: SingleTableDetailChartDto) => any;
  mapSingleTableDetailGridFieldToColumn: (field: SingleTableGridFieldDto, index: number, existing?: any) => any;
  moduleSettingStep: number;
  normalizeColumn: (column: any) => any;
  normalizeDetailFillTypeValue: (value: string | undefined | null) => string;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  showToast: (message: string) => void;
  toRecordNumber: (value: unknown, fallback: number) => number;
  toRecordText: (value: unknown) => string;
}) {
  const cloneColumnsForDetailPreview = useCallback((columns: any[] = []) => (
    columns.map((column, index) => {
      const normalizedColumn = JSON.parse(JSON.stringify(normalizeColumn(column)));
      const rest = { ...normalizedColumn };
      delete rest.id;
      return buildColumn('d_col', index + 1, {
        ...rest,
        name: normalizedColumn.name || `字段 ${index + 1}`,
        sourceField: normalizedColumn.sourceField || '',
      });
    })
  ), [buildColumn, normalizeColumn]);

  const resolveDetailModuleSnapshotByCode = useCallback(async (moduleCode: string): Promise<DetailModuleSnapshot | null> => {
    const normalizedModuleCode = String(moduleCode || '').trim();
    if (!normalizedModuleCode) {
      return null;
    }

    const hasLocalMainTableSnapshot = normalizedModuleCode === currentModuleCode && (
      mainTableColumns.length > 0
      || String(mainTableConfig.mainSql || '').trim().length > 0
      || String(mainTableConfig.tableName || '').trim().length > 0
      || Number(mainTableConfig.addEnable ?? 1) !== 1
      || Number(mainTableConfig.deleteEnable ?? 1) !== 1
      || Number(mainTableConfig.modifyEnable ?? 1) !== 1
      || (mainTableConfig.contextMenuItems ?? []).length > 0
      || (mainTableConfig.colorRules ?? []).length > 0
    );

    if (hasLocalMainTableSnapshot) {
      return {
        columns: cloneColumnsForDetailPreview(mainTableColumns),
        gridConfigPatch: {
          ...JSON.parse(JSON.stringify(mainTableConfig)),
          mainSql: String(mainTableConfig.mainSql || '').trim()
            || (currentPrimaryTableName ? `SELECT * FROM ${currentPrimaryTableName}` : ''),
          tableName: String(mainTableConfig.tableName || '').trim() || currentPrimaryTableName,
          sourceMode: 'module',
          sourceModuleCode: normalizedModuleCode,
        },
      };
    }

    const [moduleConfig, moduleFields, menuRows, colorRows] = await Promise.all([
      fetchSingleTableModuleConfig(normalizedModuleCode),
      fetchSingleTableModuleFields(normalizedModuleCode),
      fetchSingleTableModuleMenus(normalizedModuleCode),
      fetchSingleTableModuleColors(normalizedModuleCode),
    ]);

    const normalizedModuleConfig = moduleConfig as Record<string, unknown>;
    const mappedColumns = moduleFields.map((field, index) => (
      mapSingleTableDetailGridFieldToColumn(field as unknown as SingleTableGridFieldDto, index)
    ));
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
      .map((rule, index) => mapSingleTableColorRule(rule, index));

    detailModuleDecorationSnapshotRef.current.set(normalizedModuleCode, {
      colorRules: JSON.parse(JSON.stringify(mappedRules)),
      contextMenuItems: JSON.parse(JSON.stringify(mappedMenus)),
    });

    const resolvedMainSql = toRecordText(getRecordFieldValue(normalizedModuleConfig, 'querySql', 'querysql'))
      || toRecordText(getRecordFieldValue(normalizedModuleConfig, 'mainSql', 'mainsql'));
    const resolvedTableName = toRecordText(getRecordFieldValue(normalizedModuleConfig, 'mainTable', 'maintable'));

    return {
      columns: mappedColumns,
      gridConfigPatch: buildGridConfig(
        resolvedMainSql || (resolvedTableName ? `SELECT * FROM ${resolvedTableName}` : ''),
        '',
        {
          ...normalizedModuleConfig,
          addEnable: toRecordNumber(getRecordFieldValue(normalizedModuleConfig, 'addEnable'), 1),
          deleteEnable: toRecordNumber(getRecordFieldValue(normalizedModuleConfig, 'deleteEnable'), 1),
          modifyEnable: toRecordNumber(getRecordFieldValue(normalizedModuleConfig, 'modifyEnable'), 1),
          tableName: resolvedTableName,
          sourceMode: 'module',
          sourceModuleCode: normalizedModuleCode,
          tableType: '普通表格',
          contextMenuEnabled: mappedMenus.length > 0,
          contextMenuItems: mappedMenus,
          colorRulesEnabled: mappedRules.length > 0,
          colorRules: mappedRules,
          detailBoard: buildDetailBoardConfig([], {
            enabled: false,
            theme: mainTableConfig.detailBoard?.theme || 'aurora',
          }),
        },
      ),
    };
  }, [
    buildGridConfig,
    cloneColumnsForDetailPreview,
    currentModuleCode,
    currentPrimaryTableName,
    detailModuleDecorationSnapshotRef,
    getRecordFieldValue,
    mainTableColumns,
    mainTableConfig,
    mapSingleTableColorRule,
    mapSingleTableContextMenuItem,
    mapSingleTableDetailGridFieldToColumn,
    toRecordNumber,
    toRecordText,
  ]);

  const resolveDetailModuleSnapshotByCodeRef = useRef(resolveDetailModuleSnapshotByCode);
  const systemTabOaUrlPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    resolveDetailModuleSnapshotByCodeRef.current = resolveDetailModuleSnapshotByCode;
  }, [resolveDetailModuleSnapshotByCode]);

  const getSystemTabOaUrl = useCallback(async () => {
    if (!systemTabOaUrlPromiseRef.current) {
      systemTabOaUrlPromiseRef.current = fetchSystemTab()
        .then((systemTab) => toRecordText(getRecordFieldValue(systemTab, 'oaurl', 'oaUrl')));
    }

    return systemTabOaUrlPromiseRef.current;
  }, [getRecordFieldValue, toRecordText]);

  const resolveSingleTableDetailResource = useCallback(async ({
    detailConfig,
    detailGridConfig,
  }: {
    detailConfig: Record<string, any>;
    detailGridConfig: Record<string, any>;
  }): Promise<ResolvedDetailResource> => {
    const detailFillType = normalizeDetailFillTypeValue(detailConfig.detailType);
    const detailId = toRecordNumber(detailConfig.backendId, Number.NaN);
    const detailModuleCode = String(detailConfig.relatedModule || '').trim();
    const detailSql = String(detailGridConfig.mainSql || '').trim();
    const relationCondition = String(
      detailConfig.relatedCondition
      || detailGridConfig.sourceCondition
      || detailGridConfig.defaultQuery
      || '',
    ).trim();
    const gridPatch: Record<string, any> = {};
    let columns: any[] = [];

    if (detailFillType === '表格' || detailFillType === '树表格') {
      if (detailModuleCode) {
        const moduleSnapshot = await resolveDetailModuleSnapshotByCodeRef.current(detailModuleCode);
        if (moduleSnapshot) {
          columns = moduleSnapshot.columns;
          Object.assign(gridPatch, moduleSnapshot.gridConfigPatch, {
            defaultQuery: relationCondition,
            sourceMode: 'module',
            sourceModuleCode: detailModuleCode,
            sourceCondition: relationCondition,
          });
        }
      } else if (Number.isFinite(detailId) && detailSql) {
        const detailGridFields = await fetchSingleTableDetailGridFields(activeConfigModuleKey, detailId);
        columns = detailGridFields.map((field, index) => mapSingleTableDetailGridFieldToColumn(field, index));
        gridPatch.sourceMode = 'sql';
        gridPatch.sourceModuleCode = '';
      }

      return { columns, gridPatch };
    }

    if (detailFillType === '图表') {
      if (!Number.isFinite(detailId)) {
        return { columns, gridPatch };
      }

      const detailCharts = await fetchSingleTableDetailCharts(activeConfigModuleKey, detailId);
      const firstChart = [...detailCharts].sort(
        (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
          - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
      )[0];

      if (firstChart) {
        gridPatch.chartConfig = mapSingleTableDetailChartConfig(firstChart);
      }

      return { columns, gridPatch };
    }

    if (detailFillType === '网页') {
      if (isAbsoluteHttpUrl(detailSql)) {
        gridPatch.webUrl = detailSql;
      } else if (detailSql) {
        const oaUrl = await getSystemTabOaUrl();
        gridPatch.webUrl = joinHttpUrl(oaUrl, detailSql);
      } else {
        gridPatch.webUrl = '';
      }
    }

    return { columns, gridPatch };
  }, [
    activeConfigModuleKey,
    getRecordFieldValue,
    getSystemTabOaUrl,
    isAbsoluteHttpUrl,
    joinHttpUrl,
    mapSingleTableDetailChartConfig,
    mapSingleTableDetailGridFieldToColumn,
    normalizeDetailFillTypeValue,
    toRecordNumber,
  ]);

  const loadSingleTableDetailResourcesById = useCallback(async (tabId: string, explicitFillType?: string) => {
    if (!tabId || !isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    const detailConfig = detailTabConfigs[tabId] ?? buildDetailTabConfig();
    const detailGridConfig = detailTableConfigs[tabId] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' });
    const detailFillType = normalizeDetailFillTypeValue(explicitFillType ?? detailConfig.detailType);
    const { columns, gridPatch } = await resolveSingleTableDetailResource({
      detailConfig,
      detailGridConfig,
    });

    try {
      if (detailFillType === '表格' || detailFillType === '树表格') {
        if (columns.length === 0 && Object.keys(gridPatch).length === 0) {
          return;
        }

        const nextTableConfig = {
          ...(detailTableConfigs[tabId] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' })),
          ...gridPatch,
        };

        setDetailTableColumns((prev) => ({
          ...prev,
          [tabId]: columns,
        }));
        setDetailTableConfigs((prev) => ({
          ...prev,
          [tabId]: nextTableConfig,
        }));
        captureDetailResources(tabId, { columns, tableConfig: nextTableConfig });
        return;
      }

      if (detailFillType === '图表') {
        if (!Object.prototype.hasOwnProperty.call(gridPatch, 'chartConfig')) {
          return;
        }

        const nextTableConfig = {
          ...(detailTableConfigs[tabId] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' })),
          ...gridPatch,
        };

        setDetailTableConfigs((prev) => ({
          ...prev,
          [tabId]: nextTableConfig,
        }));
        captureDetailResources(tabId, { columns: detailTableColumns[tabId] ?? [], tableConfig: nextTableConfig });
        return;
      }

      if (detailFillType === '网页') {
        if (!Object.prototype.hasOwnProperty.call(gridPatch, 'webUrl')) {
          return;
        }

        const nextTableConfig = {
          ...(detailTableConfigs[tabId] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' })),
          ...gridPatch,
        };

        setDetailTableConfigs((prev) => ({
          ...prev,
          [tabId]: nextTableConfig,
        }));
        captureDetailResources(tabId, { columns: detailTableColumns[tabId] ?? [], tableConfig: nextTableConfig });
      }
    } catch (error) {
      showToast(getDashboardErrorMessage(error));
    }
  }, [
    buildDetailTabConfig,
    buildGridConfig,
    canLoadSingleTableModuleResources,
    captureDetailResources,
    configStep,
    detailTabConfigs,
    detailTableColumns,
    detailTableConfigs,
    getDashboardErrorMessage,
    isConfigOpen,
    moduleSettingStep,
    normalizeDetailFillTypeValue,
    resolveSingleTableDetailResource,
    setDetailTableColumns,
    setDetailTableConfigs,
    showToast,
  ]);

  return {
    loadSingleTableDetailResourcesById,
    resolveDetailModuleSnapshotByCode,
    resolveSingleTableDetailResource,
  };
}

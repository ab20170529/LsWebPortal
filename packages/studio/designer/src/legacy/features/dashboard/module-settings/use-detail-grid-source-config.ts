import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';

type UseDetailGridSourceConfigOptions = {
  buildColumn: (prefix: string, index: number, overrides?: Record<string, any>) => any;
  buildDetailTabConfig: (overrides?: Record<string, any>) => Record<string, any>;
  buildGridConfig: (mainSql: string, defaultQuery: string, overrides?: Record<string, any>) => Record<string, any>;
  businessType: string;
  currentModuleCode: string;
  currentModuleName: string;
  currentPrimaryTableName: string;
  detailTabConfigs: Record<string, any>;
  detailTabs: Array<{ id: string; name: string }>;
  detailTableConfigs: Record<string, any>;
  mainTableColumns: any[];
  mainTableConfig: Record<string, any>;
  normalizeColumn: (column: any) => any;
  normalizeDetailChartConfig: (config: any) => any;
  parseSqlFieldNames: (sql: string) => string[];
  resolveDetailModuleSnapshotByCode: (moduleCode: string) => Promise<{
    columns: any[];
    gridConfigPatch: Record<string, any>;
  } | null>;
  restrictionTopStructures: any[];
  setDetailTabConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailTableColumns: Dispatch<SetStateAction<Record<string, any[]>>>;
  setDetailTableConfigs: Dispatch<SetStateAction<Record<string, any>>>;
  showToast: (message: string) => void;
};

export function useDetailGridSourceConfig({
  buildColumn,
  buildDetailTabConfig,
  buildGridConfig,
  businessType,
  currentModuleCode,
  currentModuleName,
  currentPrimaryTableName,
  detailTabConfigs,
  detailTabs,
  detailTableConfigs,
  mainTableColumns,
  mainTableConfig,
  normalizeColumn,
  normalizeDetailChartConfig,
  parseSqlFieldNames,
  resolveDetailModuleSnapshotByCode,
  restrictionTopStructures,
  setDetailTabConfigs,
  setDetailTableColumns,
  setDetailTableConfigs,
  showToast,
}: UseDetailGridSourceConfigOptions) {
  const getDefaultDetailGridConfig = useCallback(() => buildGridConfig('', '', {
    sourceCondition: 'parent_id = ${id}',
  }), [buildGridConfig]);

  const getDetailTabConfigById = useCallback((tabId: string) => (
    detailTabConfigs[tabId] ?? buildDetailTabConfig({
      tabKey: tabId,
      detailName: detailTabs.find((tab) => tab.id === tabId)?.name ?? '',
    })
  ), [buildDetailTabConfig, detailTabConfigs, detailTabs]);

  const getDetailGridConfigById = useCallback((tabId: string) => (
    detailTableConfigs[tabId] ?? getDefaultDetailGridConfig()
  ), [detailTableConfigs, getDefaultDetailGridConfig]);

  const buildDetailColumnsFromFieldNames = useCallback((fieldNames: string[], existingColumns: any[] = []) => {
    const cleanedFieldNames = Array.from(
      new Set(
        fieldNames
          .map((item) => String(item || '').trim())
          .filter((item) => item && item !== '*'),
      ),
    );
    const existingByKey = new Map<string, any>();

    existingColumns.forEach((column) => {
      const normalizedColumn = normalizeColumn(column);
      [normalizedColumn.sourceField, normalizedColumn.name]
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean)
        .forEach((key) => {
          if (!existingByKey.has(key)) {
            existingByKey.set(key, normalizedColumn);
          }
        });
    });

    return cleanedFieldNames.map((fieldName, index) => {
      const existing = existingByKey.get(fieldName.toLowerCase());
      if (existing) {
        return {
          ...existing,
          id: existing.id || `d_col_${Date.now()}_${index + 1}`,
          name: existing.name || fieldName,
          sourceField: existing.sourceField || fieldName,
          width: existing.width || 120,
        };
      }

      return buildColumn('d_col', index + 1, {
        name: fieldName,
        sourceField: fieldName,
        width: 128,
      });
    });
  }, [buildColumn, normalizeColumn]);

  const detailSourceModuleCandidates = useMemo(() => {
    if (businessType === 'table') {
      return [];
    }

    const seen = new Set<string>();
    return [
      {
        moduleCode: currentModuleCode,
        moduleName: currentModuleName,
        tableName: currentPrimaryTableName,
        mainSql: mainTableConfig.mainSql || (currentPrimaryTableName ? `SELECT * FROM ${currentPrimaryTableName}` : ''),
        columnCount: mainTableColumns.length,
        isCurrent: true,
      },
      ...restrictionTopStructures.map((item) => ({
        moduleCode: String(item.moduleCode || '').trim(),
        moduleName: String(item.tableDesc || item.moduleCode || '').trim(),
        tableName: String(item.tableName || '').trim(),
        mainSql: item.tableName ? `SELECT * FROM ${String(item.tableName || '').trim()}` : '',
        columnCount: undefined as number | undefined,
        isCurrent: String(item.moduleCode || '').trim() === currentModuleCode,
      })),
    ].filter((item) => {
      if (!item.moduleCode || seen.has(item.moduleCode)) {
        return false;
      }
      seen.add(item.moduleCode);
      return true;
    });
  }, [
    businessType,
    currentModuleCode,
    currentModuleName,
    currentPrimaryTableName,
    mainTableColumns.length,
    mainTableConfig.mainSql,
    restrictionTopStructures,
  ]);

  const findDetailSourceModuleCandidate = useCallback((moduleCode: string) => (
    detailSourceModuleCandidates.find((item) => item.moduleCode === String(moduleCode || '').trim()) ?? null
  ), [detailSourceModuleCandidates]);

  const updateDetailTabConfigById = useCallback((
    tabId: string,
    updater: SetStateAction<Record<string, any>>,
  ) => {
    setDetailTabConfigs((prev) => ({
      ...prev,
      [tabId]: typeof updater === 'function'
        ? updater(prev[tabId] ?? getDetailTabConfigById(tabId))
        : updater,
    }));
  }, [getDetailTabConfigById, setDetailTabConfigs]);

  const updateDetailGridConfigById = useCallback((
    tabId: string,
    updater: SetStateAction<Record<string, any>>,
  ) => {
    setDetailTableConfigs((prev) => ({
      ...prev,
      [tabId]: typeof updater === 'function'
        ? updater(prev[tabId] ?? getDefaultDetailGridConfig())
        : updater,
    }));
  }, [getDefaultDetailGridConfig, setDetailTableConfigs]);

  const syncDetailColumnsFromSqlById = useCallback((
    tabId: string,
    sql: string,
    options: { notify?: boolean } = {},
  ) => {
    const notify = options.notify ?? true;
    const fieldNames = parseSqlFieldNames(sql);
    if (fieldNames.length === 0 || fieldNames.every((item) => item === '*')) {
      if (notify) {
        showToast('当前 SQL 还没有解析出可用字段');
      }
      return false;
    }

    setDetailTableColumns((prev) => ({
      ...prev,
      [tabId]: buildDetailColumnsFromFieldNames(fieldNames, prev[tabId] || []),
    }));
    if (notify) {
      showToast(`已按 SQL 同步 ${fieldNames.filter((item) => item !== '*').length} 个字段`);
    }
    return true;
  }, [buildDetailColumnsFromFieldNames, parseSqlFieldNames, setDetailTableColumns, showToast]);

  const applyDetailModuleInheritanceById = useCallback(async (
    tabId: string,
    moduleCode: string,
    options: { notify?: boolean } = {},
  ) => {
    const notify = options.notify ?? true;
    const normalizedModuleCode = String(moduleCode || '').trim();

    if (!normalizedModuleCode) {
      if (notify) {
        showToast('请先填写模块编号');
      }
      return false;
    }

    let moduleSnapshot: Awaited<ReturnType<typeof resolveDetailModuleSnapshotByCode>> = null;
    try {
      moduleSnapshot = await resolveDetailModuleSnapshotByCode(normalizedModuleCode);
    } catch (error) {
      if (notify) {
        showToast(error instanceof Error ? error.message : '加载模块主表配置失败');
      }
      return false;
    }

    if (!moduleSnapshot) {
      if (notify) {
        showToast('没有匹配到可继承的模块主表配置');
      }
      return false;
    }

    const currentGridConfig = getDetailGridConfigById(tabId);
    const currentTabConfig = getDetailTabConfigById(tabId);
    const matchedModule = findDetailSourceModuleCandidate(normalizedModuleCode);
    const relationCondition = String(
      currentGridConfig.sourceCondition
      || currentGridConfig.defaultQuery
      || currentTabConfig.relatedCondition
      || '',
    ).trim();

    updateDetailGridConfigById(tabId, {
      ...moduleSnapshot.gridConfigPatch,
      defaultQuery: relationCondition,
      sourceMode: 'module',
      sourceModuleCode: normalizedModuleCode,
      sourceCondition: relationCondition,
      chartConfig: normalizeDetailChartConfig(currentGridConfig.chartConfig),
    });
    updateDetailTabConfigById(tabId, (prev) => ({
      ...prev,
      relatedModule: normalizedModuleCode,
      relatedCondition: relationCondition,
    }));
    setDetailTableColumns((prev) => ({
      ...prev,
      [tabId]: moduleSnapshot.columns,
    }));

    if (notify) {
      showToast(`已继承 ${(matchedModule?.moduleCode || normalizedModuleCode)} 的主表配置`);
    }
    return true;
  }, [
    findDetailSourceModuleCandidate,
    getDetailGridConfigById,
    getDetailTabConfigById,
    normalizeDetailChartConfig,
    resolveDetailModuleSnapshotByCode,
    setDetailTableColumns,
    showToast,
    updateDetailGridConfigById,
    updateDetailTabConfigById,
  ]);

  const handleDetailModuleCodeChange = useCallback((
    tabId: string,
    rawModuleCode: string,
    options: { notify?: boolean } = {},
  ) => {
    const normalizedModuleCode = String(rawModuleCode || '').trim();
    const currentGridConfig = getDetailGridConfigById(tabId);
    updateDetailGridConfigById(tabId, {
      ...currentGridConfig,
      sourceMode: normalizedModuleCode ? 'module' : 'sql',
      sourceModuleCode: rawModuleCode,
    });
    updateDetailTabConfigById(tabId, (prev) => ({
      ...prev,
      relatedModule: rawModuleCode,
    }));

    if (!normalizedModuleCode) {
      return;
    }
    void applyDetailModuleInheritanceById(tabId, normalizedModuleCode, options);
  }, [
    applyDetailModuleInheritanceById,
    getDetailGridConfigById,
    updateDetailGridConfigById,
    updateDetailTabConfigById,
  ]);

  return {
    applyDetailModuleInheritanceById,
    detailSourceModuleCandidates,
    getDetailTabConfigById,
    handleDetailModuleCodeChange,
    syncDetailColumnsFromSqlById,
    updateDetailTabConfigById,
  };
}

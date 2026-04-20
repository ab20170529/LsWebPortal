import { useCallback, useMemo } from 'react';

type DetailFillTypeOption = {
  backendValue?: string;
  value: string;
};

export function useDashboardDetailWorkspaceMeta({
  activeConfigMenuModuleType,
  activeTab,
  buildGridConfig,
  detailFillTypeOptions,
  detailTabConfigs,
  detailTableConfigs,
  isSingleTableFieldsLoading,
  isTreeRelationFieldColumn,
  mainTableColumns,
  normalizeColumn,
  parseSqlFieldNames,
  stripBraces,
  toRecordNumber,
  toRecordText,
}: {
  activeConfigMenuModuleType?: string;
  activeTab: string;
  buildGridConfig: (mainSql: string, defaultQuery: string, overrides?: Record<string, any>) => any;
  detailFillTypeOptions: DetailFillTypeOption[];
  detailTabConfigs: Record<string, any>;
  detailTableConfigs: Record<string, any>;
  isSingleTableFieldsLoading: boolean;
  isTreeRelationFieldColumn: (column: Record<string, unknown> | null | undefined) => boolean;
  mainTableColumns: any[];
  normalizeColumn: (column: any) => any;
  parseSqlFieldNames: (sql: string) => string[];
  stripBraces: (value: string) => string;
  toRecordNumber: (value: unknown, fallback: number) => number;
  toRecordText: (value: unknown) => string;
}) {
  const getDetailFillTypeMeta = useCallback((fillType?: string) => (
    detailFillTypeOptions.find((option) => option.value === fillType) ?? detailFillTypeOptions[0]
  ), [detailFillTypeOptions]);

  const normalizeDetailFillTypeValue = useCallback((value: string | undefined | null) => {
    if (detailFillTypeOptions.some((option) => option.value === value)) {
      return value!;
    }

    const normalizedRawValue = String(value ?? '').trim();
    if (/(tree|树)/i.test(normalizedRawValue)) {
      return '树表格';
    }

    if (/(chart|图)/i.test(normalizedRawValue)) {
      return '图表';
    }

    if (/(web|page|url|网页)/i.test(normalizedRawValue)) {
      return '网页';
    }

    if (normalizedRawValue === '3') {
      return '网页';
    }

    const matchedOption = detailFillTypeOptions.find((option) => option.backendValue === normalizedRawValue);
    return matchedOption?.value ?? detailFillTypeOptions[0]?.value ?? '表格';
  }, [detailFillTypeOptions]);

  const getDetailFillTypeByTabId = useCallback((tabId: string) => (
    normalizeDetailFillTypeValue(detailTabConfigs[tabId]?.detailType)
  ), [detailTabConfigs, normalizeDetailFillTypeValue]);

  const currentDetailFillType = getDetailFillTypeByTabId(activeTab);
  const currentDetailFillTypeValue = getDetailFillTypeMeta(currentDetailFillType).value;
  const activeDetailWebUrl = String((detailTableConfigs[activeTab] ?? {}).webUrl || '').trim();
  const activeDetailBackendId = toRecordNumber(detailTabConfigs[activeTab]?.backendId, Number.NaN);
  const activeDetailRelatedModuleCode = String(detailTabConfigs[activeTab]?.relatedModule || '').trim();
  const activeDetailGridConfig = detailTableConfigs[activeTab] ?? buildGridConfig('', '', { sourceCondition: 'parent_id = ${id}' });
  const activeDetailContextMenuItems = useMemo(
    () => detailTableConfigs[activeTab]?.contextMenuItems ?? [],
    [activeTab, detailTableConfigs],
  );
  const activeDetailColorRules = useMemo(
    () => detailTableConfigs[activeTab]?.colorRules ?? [],
    [activeTab, detailTableConfigs],
  );
  const showDetailGridActionBar = (
    (currentDetailFillType === '表格' || currentDetailFillType === '树表格')
    && Boolean(activeDetailRelatedModuleCode)
  );
  const isTreeMainTableSyncing =
    isSingleTableFieldsLoading && String(activeConfigMenuModuleType || '').trim().toLowerCase() === 'single-table';
  const treeRelationColumn = useMemo(
    () => mainTableColumns.find((column) => isTreeRelationFieldColumn(column)) ?? null,
    [isTreeRelationFieldColumn, mainTableColumns],
  );
  const parsedTreeSourceFields = useMemo(
    () => parseSqlFieldNames(treeRelationColumn?.dynamicSql ?? ''),
    [parseSqlFieldNames, treeRelationColumn?.dynamicSql],
  );
  const isTreePaneVisible = Boolean(treeRelationColumn);
  const treeRelationColumnConfig = treeRelationColumn ? normalizeColumn(treeRelationColumn) : null;
  const documentConditionOwnerFieldKey = treeRelationColumnConfig
    ? stripBraces(
      toRecordText(treeRelationColumnConfig.backendFieldKey || treeRelationColumnConfig.fieldKey)
        || toRecordText(treeRelationColumnConfig.formKey)
        || toRecordText(treeRelationColumnConfig.sourceField)
        || toRecordText(treeRelationColumn.id),
    )
    : '';
  const documentConditionOwnerSourceId = treeRelationColumnConfig?.backendId ?? treeRelationColumn?.id ?? '';

  return {
    activeDetailBackendId,
    activeDetailColorRules,
    activeDetailContextMenuItems,
    activeDetailGridConfig,
    activeDetailRelatedModuleCode,
    activeDetailWebUrl,
    currentDetailFillType,
    currentDetailFillTypeValue,
    documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId,
    getDetailFillTypeByTabId,
    isTreeMainTableSyncing,
    isTreePaneVisible,
    normalizeDetailFillTypeValue,
    parsedTreeSourceFields,
    showDetailGridActionBar,
    treeRelationColumn,
  };
}

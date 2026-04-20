import { type Dispatch, type SetStateAction, useEffect } from 'react';

import {
  fetchSingleTableFieldColors,
  fetchSingleTableFieldConditions,
  fetchSingleTableFieldGridFields,
} from '../../../lib/backend-module-config';
import { normalizeContextMenuItem } from './context-menu-utils';

export function useDashboardSingleTableTreeResources({
  activeConfigModuleKey,
  buildTreeRelationFallbackColumns,
  canLoadSingleTableModuleResources,
  captureFieldColors,
  captureFieldConditions,
  captureFieldGridFields,
  configStep,
  documentConditionOwnerFieldKey,
  documentConditionOwnerSourceId,
  getDashboardErrorMessage,
  getRecordFieldValue,
  isConfigOpen,
  mapSingleTableColorRule,
  mapSingleTableConditionRecordToField,
  mapSingleTableGridFieldRecordToColumn,
  moduleSettingStep,
  normalizeColumn,
  parsedTreeSourceFields,
  setInspectorTarget,
  setLeftFilterFields,
  setLeftTableColumns,
  setLeftTableConfig,
  setSelectedLeftFiltersForDelete,
  showToast,
  toRecordNumber,
  toRecordText,
  treeRelationColumn,
  treeResourceScopeKey,
}: {
  activeConfigModuleKey: string;
  buildTreeRelationFallbackColumns: (fields: string[], currentColumns?: any[]) => any[];
  canLoadSingleTableModuleResources: boolean;
  captureFieldColors: (fieldId: number, rules: any[]) => void;
  captureFieldConditions: (fieldId: number, fields: any[]) => void;
  captureFieldGridFields: (fieldId: number, columns: any[]) => void;
  configStep: number;
  documentConditionOwnerFieldKey: string;
  documentConditionOwnerSourceId: unknown;
  getDashboardErrorMessage: (error: unknown) => string;
  getRecordFieldValue: (record: Record<string, unknown> | null | undefined, ...keys: string[]) => unknown;
  isConfigOpen: boolean;
  mapSingleTableColorRule: (rule: any, index: number) => any;
  mapSingleTableConditionRecordToField: (condition: any, index: number, overrides?: Record<string, unknown>) => any;
  mapSingleTableGridFieldRecordToColumn: (field: any, index: number, existingColumn?: any) => any;
  moduleSettingStep: number;
  normalizeColumn: (column: any) => any;
  parsedTreeSourceFields: string[];
  setInspectorTarget: Dispatch<SetStateAction<any>>;
  setLeftFilterFields: Dispatch<SetStateAction<any[]>>;
  setLeftTableColumns: Dispatch<SetStateAction<any[]>>;
  setLeftTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
  setSelectedLeftFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  showToast: (message: string) => void;
  toRecordNumber: (value: unknown, fallback: number) => number;
  toRecordText: (value: unknown) => string;
  treeRelationColumn: any;
  treeResourceScopeKey: string;
}) {
  useEffect(() => {
    if (!treeRelationColumn) {
      setInspectorTarget((prev) => (
        prev.kind === 'left-col' || prev.kind === 'left-filter' || prev.kind === 'left-grid' || prev.kind === 'left-filter-panel'
          ? { kind: 'none' }
          : prev
      ));
      return;
    }

    const sourceFields = parsedTreeSourceFields.length > 0 ? parsedTreeSourceFields : ['node_id', 'node_name', 'parent_id'];
    const ownerField = normalizeColumn(treeRelationColumn);

    setLeftTableColumns((prev) => buildTreeRelationFallbackColumns(sourceFields, prev));
    setLeftTableConfig((prev) => ({
      ...prev,
      tableType: '树表格',
      mainSql: ownerField.dynamicSql || prev.mainSql || '',
      contextMenuItems: (prev.contextMenuItems ?? []).map((item: any, index: number) => normalizeContextMenuItem({
        ...item,
        tab: documentConditionOwnerFieldKey,
      }, index + 1)),
      colorRules: (prev.colorRules ?? []).map((rule: any) => ({
        ...rule,
        tab: documentConditionOwnerFieldKey,
      })),
    }));
    setLeftFilterFields((prev) => prev.map((field) => ({
      ...field,
      sourceid: documentConditionOwnerSourceId,
      formKey: documentConditionOwnerFieldKey,
    })));
  }, [
    buildTreeRelationFallbackColumns,
    documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId,
    normalizeColumn,
    parsedTreeSourceFields,
    setInspectorTarget,
    setLeftFilterFields,
    setLeftTableColumns,
    setLeftTableConfig,
    treeRelationColumn,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    if (!treeRelationColumn || !documentConditionOwnerSourceId) {
      return;
    }

    const fieldId = Number(documentConditionOwnerSourceId);
    if (!Number.isFinite(fieldId) || fieldId <= 0) {
      return;
    }

    const fallbackFields = parsedTreeSourceFields.length > 0 ? parsedTreeSourceFields : ['node_id', 'node_name', 'parent_id'];
    let isActive = true;

    const applyFallbackColumns = () => {
      setLeftTableColumns((prev) => buildTreeRelationFallbackColumns(fallbackFields, prev));
    };

    const loadSingleTableFieldGridFields = async () => {
      try {
        const rows = await fetchSingleTableFieldGridFields(activeConfigModuleKey, fieldId);
        if (!isActive) {
          return;
        }

        if (!Array.isArray(rows) || rows.length === 0) {
          applyFallbackColumns();
          return;
        }

        const orderedRows = [...rows].sort(
          (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
            - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
        );

        let mappedColumns: any[] = [];
        setLeftTableColumns((prev) => {
          mappedColumns = orderedRows.map((row, index) => {
            const backendId = getRecordFieldValue(row, 'id');
            const fieldName = toRecordText(getRecordFieldValue(row, 'fieldname', 'fieldName'));
            const fieldKey = toRecordText(getRecordFieldValue(row, 'fieldkey', 'fieldKey'));
            const existing = prev.find((item) => (
              (backendId != null && getRecordFieldValue(item, 'backendid', 'backendId') === backendId)
              || (fieldName && item.sourceField === fieldName)
              || (fieldKey && getRecordFieldValue(item, 'backendfieldkey', 'backendFieldKey') === fieldKey)
            ));

            return mapSingleTableGridFieldRecordToColumn(row, index, existing);
          });

          return mappedColumns;
        });
        captureFieldGridFields(fieldId, mappedColumns);
      } catch {
        if (isActive) {
          applyFallbackColumns();
        }
      }
    };

    void loadSingleTableFieldGridFields();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    buildTreeRelationFallbackColumns,
    canLoadSingleTableModuleResources,
    captureFieldGridFields,
    configStep,
    documentConditionOwnerSourceId,
    getRecordFieldValue,
    isConfigOpen,
    mapSingleTableGridFieldRecordToColumn,
    moduleSettingStep,
    parsedTreeSourceFields,
    setLeftTableColumns,
    toRecordNumber,
    toRecordText,
    treeRelationColumn,
    treeResourceScopeKey,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources || !treeRelationColumn || !documentConditionOwnerSourceId) {
      return;
    }

    const fieldId = Number(documentConditionOwnerSourceId);
    if (!Number.isFinite(fieldId) || fieldId <= 0) {
      return;
    }

    let isActive = true;

    const loadSingleTableFieldColors = async () => {
      try {
        const rows = await fetchSingleTableFieldColors(activeConfigModuleKey, fieldId);
        if (!isActive) {
          return;
        }

        const mappedRules = [...rows]
          .sort(
            (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
              - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
          )
          .map((rule, index) => mapSingleTableColorRule(rule, index));

        setLeftTableConfig((prev) => ({
          ...prev,
          colorRulesEnabled: mappedRules.length > 0,
          colorRules: mappedRules,
        }));
        captureFieldColors(fieldId, mappedRules);
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableFieldColors();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureFieldColors,
    configStep,
    documentConditionOwnerSourceId,
    getDashboardErrorMessage,
    getRecordFieldValue,
    isConfigOpen,
    mapSingleTableColorRule,
    moduleSettingStep,
    setLeftTableConfig,
    showToast,
    toRecordNumber,
    treeRelationColumn,
    treeResourceScopeKey,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    if (!treeRelationColumn || !documentConditionOwnerSourceId) {
      setLeftFilterFields([]);
      setSelectedLeftFiltersForDelete([]);
      return;
    }

    const fieldId = Number(documentConditionOwnerSourceId);
    if (!Number.isFinite(fieldId) || fieldId <= 0) {
      return;
    }

    let isActive = true;

    const loadSingleTableFieldConditions = async () => {
      try {
        const rows = await fetchSingleTableFieldConditions(activeConfigModuleKey, fieldId);

        if (!isActive) {
          return;
        }

        const mappedFields = rows.map((condition, index) => mapSingleTableConditionRecordToField(condition, index, {
          sourceid: fieldId,
          formKey: documentConditionOwnerFieldKey,
        }));
        setLeftFilterFields(mappedFields);
        captureFieldConditions(fieldId, mappedFields);
        setSelectedLeftFiltersForDelete([]);
        setInspectorTarget((prev) => {
          if (prev.kind === 'left-filter' && !mappedFields.some((field) => field.id === prev.id)) {
            return { kind: 'left-filter-panel' };
          }

          return prev;
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableFieldConditions();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureFieldConditions,
    configStep,
    documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId,
    getDashboardErrorMessage,
    isConfigOpen,
    mapSingleTableConditionRecordToField,
    moduleSettingStep,
    setInspectorTarget,
    setLeftFilterFields,
    setSelectedLeftFiltersForDelete,
    showToast,
    treeRelationColumn,
    treeResourceScopeKey,
  ]);
}

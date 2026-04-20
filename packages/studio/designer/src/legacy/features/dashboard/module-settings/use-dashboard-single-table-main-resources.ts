import { type Dispatch, type SetStateAction, useEffect } from 'react';

import {
  fetchBillTypeConfig,
  fetchBillTypeDetailFields,
  fetchBillTypeDesignerLayout,
  fetchBillTypeMasterFields,
  fetchSingleTableModuleColors,
  fetchSingleTableModuleConditions,
  fetchSingleTableModuleConfig,
  fetchSingleTableModuleFields,
  fetchSingleTableModuleMenus,
} from '../../../lib/backend-module-config';
import { buildBillHeaderFieldsFromDesignerLayout } from './dashboard-single-table-field-mappers';

export function useDashboardSingleTableMainResources({
  activeConfigModuleKey,
  businessType,
  canLoadSingleTableModuleResources,
  captureMainColors,
  captureMainConditions,
  captureMainFields,
  captureMainMenus,
  configStep,
  getDashboardErrorMessage,
  getRecordFieldValue,
  isConfigOpen,
  mainResourceScopeKey,
  mapSingleTableColorRule,
  mapSingleTableConditionRecordToField,
  mapSingleTableContextMenuItem,
  mapSingleTableDetailGridFieldToColumn,
  mapSingleTableFieldRecordToColumn,
  moduleSettingStep,
  setBillDetailColumns,
  setBillDetailConfig,
  setDetailBoardSortColumnId,
  setInspectorTarget,
  setIsSingleTableFieldsLoading,
  setMainFilterFields,
  setMainTableColumns,
  setMainTableConfig,
  setSelectedMainFiltersForDelete,
  setSelectedMainForDelete,
  setSelectedDetailForDelete,
  showToast,
  toRecordNumber,
  toRecordText,
}: {
  activeConfigModuleKey: string;
  businessType: string;
  canLoadSingleTableModuleResources: boolean;
  captureMainColors: (rules: any[]) => void;
  captureMainConditions: (fields: any[]) => void;
  captureMainFields: (columns: any[]) => void;
  captureMainMenus: (menus: any[]) => void;
  configStep: number;
  getDashboardErrorMessage: (error: unknown) => string;
  getRecordFieldValue: (record: Record<string, unknown> | null | undefined, ...keys: string[]) => unknown;
  isConfigOpen: boolean;
  mainResourceScopeKey: string;
  mapSingleTableColorRule: (rule: any, index: number) => any;
  mapSingleTableConditionRecordToField: (condition: any, index: number, overrides?: Record<string, unknown>) => any;
  mapSingleTableContextMenuItem: (item: any, index: number) => any;
  mapSingleTableDetailGridFieldToColumn: (field: any, index: number) => any;
  mapSingleTableFieldRecordToColumn: (field: any, index: number) => any;
  moduleSettingStep: number;
  setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
  setBillDetailConfig: Dispatch<SetStateAction<Record<string, any>>>;
  setDetailBoardSortColumnId: Dispatch<SetStateAction<string | null>>;
  setInspectorTarget: Dispatch<SetStateAction<any>>;
  setIsSingleTableFieldsLoading: Dispatch<SetStateAction<boolean>>;
  setMainFilterFields: Dispatch<SetStateAction<any[]>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setMainTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
  setSelectedDetailForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainForDelete: Dispatch<SetStateAction<string[]>>;
  showToast: (message: string) => void;
  toRecordNumber: (value: unknown, fallback: number) => number;
  toRecordText: (value: unknown) => string;
}) {
  const canLoadBillTypeResources = (
    businessType === 'table'
    && isConfigOpen
    && configStep === moduleSettingStep
    && Boolean(activeConfigModuleKey)
  );
  const canLoadMainConfigResources = businessType === 'table'
    ? canLoadBillTypeResources
    : canLoadSingleTableModuleResources;

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadMainConfigResources) {
      return;
    }

    let isActive = true;

    const loadSingleTableModuleConfigRecord = async () => {
      try {
        const moduleConfig = businessType === 'table'
          ? await fetchBillTypeConfig(activeConfigModuleKey)
          : await fetchSingleTableModuleConfig(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const normalizedModuleConfig = moduleConfig as Record<string, unknown>;

        if (businessType === 'table') {
          const billDetailCondition = toRecordText(getRecordFieldValue(
            normalizedModuleConfig,
            'detailCond',
            'detailcond',
            'detailCondition',
            'detailcondition',
            'unioncond',
            'unionCond',
            'relatedCondition',
            'relatedcondition',
            'sourceCondition',
            'sourcecondition',
            'defaultQuery',
            'defaultquery',
          ));
          const billDetailSqlPrompt = toRecordText(getRecordFieldValue(
            normalizedModuleConfig,
            'detailSqlPrompt',
            'detailsqlprompt',
            'detailPrompt',
            'detailprompt',
            'sqlPrompt',
            'sqlprompt',
          ));
          setMainTableConfig((prev) => ({
            ...prev,
            backendId: getRecordFieldValue(normalizedModuleConfig, 'id'),
            billSequence: getRecordFieldValue(normalizedModuleConfig, 'billSequence') ?? prev.billSequence,
            dllCoId: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'typeCode')) || activeConfigModuleKey,
            formKey: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'formKey')),
            mainSql: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'masterSql', 'querySql', 'mainSql')),
            moduleName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'typeName')) || prev.moduleName,
            overbackKey: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'overbackKey')),
            remark: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'remark')),
            tableName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'masterTable', 'mainTable')),
            typeCode: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'typeCode')) || activeConfigModuleKey,
            typeName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'typeName')),
          }));
          setBillDetailConfig((prev) => ({
            ...prev,
            backendId: getRecordFieldValue(normalizedModuleConfig, 'id'),
            defaultQuery: billDetailCondition || prev.defaultQuery || '',
            mainSql: toRecordText(getRecordFieldValue(
              normalizedModuleConfig,
              'detailSql',
              'detailsql',
              'detailSQL',
              'DetailSQL',
            )) || prev.mainSql || '',
            sourceCondition: billDetailCondition || prev.sourceCondition || '',
            sqlPrompt: billDetailSqlPrompt || prev.sqlPrompt || '',
            tableName: toRecordText(getRecordFieldValue(
              normalizedModuleConfig,
              'detailTable',
              'detailtable',
              'detailTableName',
              'detailtablename',
              'DetailTable',
            )) || prev.tableName || '',
            typeCode: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'typeCode')) || activeConfigModuleKey,
            typeName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'typeName')),
          }));
          return;
        }

        setMainTableConfig((prev) => ({
          ...prev,
          addDllName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'addDllName')),
          addEnable: toRecordNumber(getRecordFieldValue(normalizedModuleConfig, 'addEnable'), prev.addEnable ?? 1),
          backendId: getRecordFieldValue(normalizedModuleConfig, 'id'),
          conditionKey: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'conditionKey', 'condKey')),
          deleteEnable: toRecordNumber(getRecordFieldValue(normalizedModuleConfig, 'deleteEnable'), prev.deleteEnable ?? 1),
          deleteCond: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'deleteCond')),
          dllCoId: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'dllCoId')) || activeConfigModuleKey,
          dllType: getRecordFieldValue(normalizedModuleConfig, 'dllType') ?? prev.dllType,
          formKey: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'formKey')),
          isReport: getRecordFieldValue(normalizedModuleConfig, 'isReport') ?? prev.isReport,
          mainSql: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'querySql', 'mainSql')),
          modifyEnable: toRecordNumber(getRecordFieldValue(normalizedModuleConfig, 'modifyEnable'), prev.modifyEnable ?? 1),
          modifyCond: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'modifyCond')),
          moduleName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'moduleName')),
          overbackKey: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'overbackKey')),
          tableName: toRecordText(getRecordFieldValue(normalizedModuleConfig, 'mainTable')),
        }));
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableModuleConfigRecord();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    businessType,
    canLoadBillTypeResources,
    canLoadMainConfigResources,
    canLoadSingleTableModuleResources,
    configStep,
    getDashboardErrorMessage,
    getRecordFieldValue,
    isConfigOpen,
    mainResourceScopeKey,
    moduleSettingStep,
    setBillDetailConfig,
    setMainTableConfig,
    showToast,
    toRecordNumber,
    toRecordText,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      setIsSingleTableFieldsLoading(false);
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      setIsSingleTableFieldsLoading(false);
      return;
    }

    let isActive = true;
    setIsSingleTableFieldsLoading(true);

    const loadSingleTableFields = async () => {
      try {
        const rows = await fetchSingleTableModuleFields(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const mappedColumns = rows.map((field, index) => mapSingleTableFieldRecordToColumn(field, index));
        setMainTableColumns(mappedColumns);
        captureMainFields(mappedColumns);
        setSelectedMainForDelete([]);
        setInspectorTarget((prev) => {
          if (prev.kind === 'main-col' && !mappedColumns.some((column) => column.id === prev.id)) {
            return { kind: 'main-grid' };
          }

          return prev;
        });
        setDetailBoardSortColumnId((prev) => (
          prev && mappedColumns.some((column) => column.id === prev) ? prev : mappedColumns[0]?.id ?? null
        ));
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      } finally {
        if (isActive) {
          setIsSingleTableFieldsLoading(false);
        }
      }
    };

    void loadSingleTableFields();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureMainFields,
    configStep,
    getDashboardErrorMessage,
    isConfigOpen,
    mainResourceScopeKey,
    mapSingleTableFieldRecordToColumn,
    moduleSettingStep,
    setDetailBoardSortColumnId,
    setInspectorTarget,
    setIsSingleTableFieldsLoading,
    setMainTableColumns,
    setSelectedMainForDelete,
    showToast,
  ]);

  useEffect(() => {
    if (businessType !== 'table') {
      return;
    }

    if (!canLoadBillTypeResources) {
      return;
    }

    let isActive = true;

    const loadBillDesignerLayout = async () => {
      try {
        const [layoutRows, masterFieldRows] = await Promise.all([
          fetchBillTypeDesignerLayout(activeConfigModuleKey),
          fetchBillTypeMasterFields(activeConfigModuleKey),
        ]);

        if (!isActive) {
          return;
        }

        const { columns } = buildBillHeaderFieldsFromDesignerLayout(layoutRows, masterFieldRows);
        setMainTableColumns(columns);
        captureMainFields(columns);
        setSelectedMainForDelete([]);
        setInspectorTarget((prev) => {
          if (prev.kind === 'main-col' && !columns.some((column) => column.id === prev.id)) {
            return { kind: 'main-grid' };
          }

          return prev;
        });
        setDetailBoardSortColumnId((prev) => (
          prev && columns.some((column) => column.id === prev) ? prev : columns[0]?.id ?? null
        ));
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadBillDesignerLayout();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    businessType,
    canLoadBillTypeResources,
    captureMainFields,
    configStep,
    getDashboardErrorMessage,
    isConfigOpen,
    mainResourceScopeKey,
    moduleSettingStep,
    setDetailBoardSortColumnId,
    setInspectorTarget,
    setMainTableColumns,
    setSelectedMainForDelete,
    showToast,
  ]);

  useEffect(() => {
    if (businessType !== 'table') {
      return;
    }

    if (!canLoadBillTypeResources) {
      return;
    }

    let isActive = true;

    const loadBillDetailFields = async () => {
      try {
        const rows = await fetchBillTypeDetailFields(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const mappedColumns = rows.map((field, index) => mapSingleTableDetailGridFieldToColumn(field, index));
        setBillDetailColumns(mappedColumns);
        setSelectedDetailForDelete([]);
        setInspectorTarget((prev) => {
          if (prev.kind === 'detail-col' && !mappedColumns.some((column) => column.id === prev.id)) {
            return { kind: 'detail-grid' };
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

    void loadBillDetailFields();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    businessType,
    canLoadBillTypeResources,
    canLoadSingleTableModuleResources,
    configStep,
    getDashboardErrorMessage,
    isConfigOpen,
    mainResourceScopeKey,
    mapSingleTableDetailGridFieldToColumn,
    moduleSettingStep,
    setBillDetailColumns,
    setInspectorTarget,
    setSelectedDetailForDelete,
    showToast,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    let isActive = true;

    const loadSingleTableConditions = async () => {
      try {
        const rows = await fetchSingleTableModuleConditions(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const mappedFields = rows.map((condition, index) => mapSingleTableConditionRecordToField(condition, index));
        setMainFilterFields(mappedFields);
        captureMainConditions(mappedFields);
        setSelectedMainFiltersForDelete([]);
        setInspectorTarget((prev) => {
          if (prev.kind === 'main-filter' && !mappedFields.some((field) => field.id === prev.id)) {
            return { kind: 'main-filter-panel' };
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

    void loadSingleTableConditions();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureMainConditions,
    configStep,
    getDashboardErrorMessage,
    isConfigOpen,
    mainResourceScopeKey,
    mapSingleTableConditionRecordToField,
    moduleSettingStep,
    setInspectorTarget,
    setMainFilterFields,
    setSelectedMainFiltersForDelete,
    showToast,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    let isActive = true;

    const loadSingleTableMenus = async () => {
      try {
        const rows = await fetchSingleTableModuleMenus(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const mappedMenus = [...rows]
          .sort(
            (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
              - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
          )
          .map((item, index) => mapSingleTableContextMenuItem(item, index));

        setMainTableConfig((prev) => ({
          ...prev,
          contextMenuEnabled: mappedMenus.length > 0,
          contextMenuItems: mappedMenus,
        }));
        captureMainMenus(mappedMenus);
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableMenus();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureMainMenus,
    configStep,
    getDashboardErrorMessage,
    getRecordFieldValue,
    isConfigOpen,
    mainResourceScopeKey,
    mapSingleTableContextMenuItem,
    moduleSettingStep,
    setMainTableConfig,
    showToast,
    toRecordNumber,
  ]);

  useEffect(() => {
    if (!isConfigOpen || configStep !== moduleSettingStep) {
      return;
    }

    if (!canLoadSingleTableModuleResources) {
      return;
    }

    let isActive = true;

    const loadSingleTableColors = async () => {
      try {
        const rows = await fetchSingleTableModuleColors(activeConfigModuleKey);

        if (!isActive) {
          return;
        }

        const mappedRules = [...rows]
          .sort(
            (left, right) => toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId'), 0)
              - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId'), 0),
          )
          .map((rule, index) => mapSingleTableColorRule(rule, index));

        setMainTableConfig((prev) => ({
          ...prev,
          colorRulesEnabled: mappedRules.length > 0,
          colorRules: mappedRules,
        }));
        captureMainColors(mappedRules);
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast(getDashboardErrorMessage(error));
      }
    };

    void loadSingleTableColors();

    return () => {
      isActive = false;
    };
  }, [
    activeConfigModuleKey,
    canLoadSingleTableModuleResources,
    captureMainColors,
    configStep,
    getDashboardErrorMessage,
    getRecordFieldValue,
    isConfigOpen,
    mainResourceScopeKey,
    mapSingleTableColorRule,
    moduleSettingStep,
    setMainTableConfig,
    showToast,
    toRecordNumber,
  ]);
}

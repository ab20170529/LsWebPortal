import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import {
  type ConditionWorkbenchScope,
  type DocumentConditionWorkbenchConfig,
} from './condition-workbench';

type ConditionWorkbenchConfig = {
  rows: number;
  bulkDraft: string;
};

type UseDocumentConditionWorkbenchOptions = {
  activateConditionPanelSelection: (scope: ConditionWorkbenchScope) => void;
  activateConditionSelection: (scope: 'left' | 'main' | 'detail', conditionId: string | null) => void;
  buildConditionField: (index: number, overrides?: Record<string, any>) => any;
  clampValue: (value: number, min: number, max: number) => number;
  deleteSelectedConditions: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  documentConditionOwnerFieldKey: string;
  documentConditionOwnerSourceId: string;
  documentConditionScope: ConditionWorkbenchScope;
  maxRows: number;
  minRows: number;
  isTreePaneVisible: boolean;
  leftFilterFields: any[];
  mainFilterFields: any[];
  selectedConditionPanelScope: ConditionWorkbenchScope | null;
  selectedLeftFilterId: string | null;
  selectedLeftFiltersForDelete: string[];
  selectedMainFilterId: string | null;
  selectedMainFiltersForDelete: string[];
  setDocumentConditionScope: Dispatch<SetStateAction<ConditionWorkbenchScope>>;
  setLeftFilterFields: Dispatch<SetStateAction<any[]>>;
  setMainFilterFields: Dispatch<SetStateAction<any[]>>;
  setSelectedArchiveNodeId: Dispatch<SetStateAction<string | null>>;
  setSelectedLeftFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  setSelectedMainFiltersForDelete: Dispatch<SetStateAction<string[]>>;
  showToast: (message: string) => void;
  treeRelationColumn: any;
};

function buildConditionWorkbenchConfig(
  overrides: Partial<ConditionWorkbenchConfig> = {},
): ConditionWorkbenchConfig {
  return {
    rows: 1,
    bulkDraft: '',
    ...overrides,
  };
}

function buildConditionSourceFieldKey(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function useDocumentConditionWorkbench({
  activateConditionPanelSelection,
  activateConditionSelection,
  buildConditionField,
  clampValue,
  deleteSelectedConditions,
  documentConditionOwnerFieldKey,
  documentConditionOwnerSourceId,
  documentConditionScope,
  maxRows,
  minRows,
  isTreePaneVisible,
  leftFilterFields,
  mainFilterFields,
  selectedConditionPanelScope,
  selectedLeftFilterId,
  selectedLeftFiltersForDelete,
  selectedMainFilterId,
  selectedMainFiltersForDelete,
  setDocumentConditionScope,
  setLeftFilterFields,
  setMainFilterFields,
  setSelectedArchiveNodeId,
  setSelectedLeftFiltersForDelete,
  setSelectedMainFiltersForDelete,
  showToast,
  treeRelationColumn,
}: UseDocumentConditionWorkbenchOptions) {
  const [mainConditionWorkbenchConfig, setMainConditionWorkbenchConfig] = useState<ConditionWorkbenchConfig>(
    buildConditionWorkbenchConfig({ rows: 1 }),
  );
  const [leftConditionWorkbenchConfig, setLeftConditionWorkbenchConfig] = useState<ConditionWorkbenchConfig>(
    buildConditionWorkbenchConfig({ rows: 1 }),
  );

  const activeDocumentConditionScope = isTreePaneVisible ? documentConditionScope : 'main';

  const getConditionWorkbenchConfig = useCallback((scope: ConditionWorkbenchScope) => (
    scope === 'left' ? leftConditionWorkbenchConfig : mainConditionWorkbenchConfig
  ), [leftConditionWorkbenchConfig, mainConditionWorkbenchConfig]);

  const setConditionWorkbenchConfig = useCallback((
    scope: ConditionWorkbenchScope,
    updater: ConditionWorkbenchConfig | ((prev: ConditionWorkbenchConfig) => ConditionWorkbenchConfig),
  ) => {
    const applyUpdate = (prev: ConditionWorkbenchConfig) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return {
        rows: clampValue(
          Number.isFinite(Number(next.rows)) ? Number(next.rows) : prev.rows,
          minRows,
          maxRows,
        ),
        bulkDraft: next.bulkDraft ?? prev.bulkDraft,
      };
    };

    if (scope === 'left') {
      setLeftConditionWorkbenchConfig((prev) => applyUpdate(prev));
      return;
    }

    setMainConditionWorkbenchConfig((prev) => applyUpdate(prev));
  }, [clampValue, maxRows, minRows]);

  const getConditionWorkbenchRowCount = useCallback((scope: ConditionWorkbenchScope) => (
    scope === 'left' ? leftConditionWorkbenchConfig.rows : mainConditionWorkbenchConfig.rows
  ), [leftConditionWorkbenchConfig.rows, mainConditionWorkbenchConfig.rows]);

  const getNextConditionWorkbenchRow = useCallback((scope: ConditionWorkbenchScope, currentLength: number) => (
    ((currentLength % Math.max(minRows, getConditionWorkbenchRowCount(scope))) + 1)
  ), [getConditionWorkbenchRowCount, minRows]);

  const mainDocumentConditionActivate = useCallback((id: string | null) => {
    setSelectedArchiveNodeId('archive-filter');
    activateConditionSelection('main', id);
  }, [activateConditionSelection, setSelectedArchiveNodeId]);

  const mainDocumentConditionAdd = useCallback(() => {
    const currentLength = mainFilterFields.length;
    const next = buildConditionField(currentLength + 1, {
      panelRow: getNextConditionWorkbenchRow('main', currentLength),
    });
    setMainFilterFields((prev) => [...prev, next]);
    setSelectedMainFiltersForDelete([next.id]);
    setSelectedArchiveNodeId('archive-filter');
    activateConditionSelection('main', next.id);
  }, [
    activateConditionSelection,
    buildConditionField,
    getNextConditionWorkbenchRow,
    mainFilterFields.length,
    setMainFilterFields,
    setSelectedArchiveNodeId,
    setSelectedMainFiltersForDelete,
  ]);

  const mainDocumentConditionDelete = useCallback(() => {
    deleteSelectedConditions('main', selectedMainFiltersForDelete);
  }, [deleteSelectedConditions, selectedMainFiltersForDelete]);

  const mainDocumentConditionConfig = useMemo<DocumentConditionWorkbenchConfig>(() => ({
    fields: mainFilterFields,
    selectedId: selectedMainFilterId,
    selectedIds: selectedMainFiltersForDelete,
    setSelectedIds: setSelectedMainFiltersForDelete,
    setFields: setMainFilterFields,
    scope: 'main',
    rowCount: mainConditionWorkbenchConfig.rows,
    onActivate: mainDocumentConditionActivate,
    onAdd: mainDocumentConditionAdd,
    onDelete: mainDocumentConditionDelete,
  }), [
    mainConditionWorkbenchConfig.rows,
    mainDocumentConditionActivate,
    mainDocumentConditionAdd,
    mainDocumentConditionDelete,
    mainFilterFields,
    selectedMainFilterId,
    selectedMainFiltersForDelete,
    setMainFilterFields,
    setSelectedMainFiltersForDelete,
  ]);

  const leftDocumentConditionActivate = useCallback((id: string | null) => {
    setSelectedArchiveNodeId('archive-left-filter');
    activateConditionSelection('left', id);
  }, [activateConditionSelection, setSelectedArchiveNodeId]);

  const leftDocumentConditionAdd = useCallback(() => {
    const currentLength = leftFilterFields.length;
    const next = buildConditionField(currentLength + 1, {
      name: `左侧条件 ${currentLength + 1}`,
      panelRow: getNextConditionWorkbenchRow('left', currentLength),
      sourceid: documentConditionOwnerSourceId,
      formKey: documentConditionOwnerFieldKey,
    });
    setLeftFilterFields((prev) => [...prev, next]);
    setSelectedLeftFiltersForDelete([next.id]);
    setSelectedArchiveNodeId('archive-left-filter');
    activateConditionSelection('left', next.id);
  }, [
    activateConditionSelection,
    buildConditionField,
    documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId,
    getNextConditionWorkbenchRow,
    leftFilterFields.length,
    setLeftFilterFields,
    setSelectedArchiveNodeId,
    setSelectedLeftFiltersForDelete,
  ]);

  const leftDocumentConditionDelete = useCallback(() => {
    deleteSelectedConditions('left', selectedLeftFiltersForDelete);
  }, [deleteSelectedConditions, selectedLeftFiltersForDelete]);

  const leftDocumentConditionConfig = useMemo<DocumentConditionWorkbenchConfig | null>(() => {
    if (!treeRelationColumn) return null;

    return {
      fields: leftFilterFields,
      selectedId: selectedLeftFilterId,
      selectedIds: selectedLeftFiltersForDelete,
      setSelectedIds: setSelectedLeftFiltersForDelete,
      setFields: setLeftFilterFields,
      scope: 'left',
      rowCount: leftConditionWorkbenchConfig.rows,
      onActivate: leftDocumentConditionActivate,
      onAdd: leftDocumentConditionAdd,
      onDelete: leftDocumentConditionDelete,
    };
  }, [
    leftConditionWorkbenchConfig.rows,
    leftDocumentConditionActivate,
    leftDocumentConditionAdd,
    leftDocumentConditionDelete,
    leftFilterFields,
    selectedLeftFilterId,
    selectedLeftFiltersForDelete,
    setLeftFilterFields,
    setSelectedLeftFiltersForDelete,
    treeRelationColumn,
  ]);

  const parseConditionWorkbenchDraft = useCallback((text: string) => (
    text
      .split(/[\t\n,，;；]/)
      .map((item) => item.trim())
      .filter(Boolean)
  ), []);

  const createScopedConditionFields = useCallback((
    scope: ConditionWorkbenchScope,
    names: string[],
    currentLength: number,
  ) => (
    names.map((name, index) => {
      const rowCount = getConditionWorkbenchRowCount(scope);
      return buildConditionField(currentLength + index + 1, {
        name,
        type: /日期|时间/.test(name) ? '日期框' : '文本',
        placeholder: /日期|时间/.test(name) ? `请选择${name}` : `请输入${name}`,
        sourceField: buildConditionSourceFieldKey(name),
        panelRow: ((currentLength + index) % Math.max(minRows, rowCount)) + 1,
        ...(scope === 'left' && treeRelationColumn ? {
          sourceid: documentConditionOwnerSourceId,
          formKey: documentConditionOwnerFieldKey,
        } : {}),
      });
    })
  ), [
    buildConditionField,
    documentConditionOwnerFieldKey,
    documentConditionOwnerSourceId,
    getConditionWorkbenchRowCount,
    minRows,
    treeRelationColumn,
  ]);

  const applyConditionWorkbenchDraft = useCallback((scope: ConditionWorkbenchScope, replace = false) => {
    const config = getConditionWorkbenchConfig(scope);
    const names = parseConditionWorkbenchDraft(config.bulkDraft);
    if (names.length === 0) {
      showToast('请先粘贴条件名称');
      return;
    }

    const currentFields = scope === 'left' ? leftFilterFields : mainFilterFields;
    const nextFields = createScopedConditionFields(scope, names, replace ? 0 : currentFields.length);
    const mergedFields = replace ? nextFields : [...currentFields, ...nextFields];

    if (scope === 'left') {
      setLeftFilterFields(mergedFields);
      setSelectedLeftFiltersForDelete(nextFields.map((field) => field.id));
      setSelectedArchiveNodeId('archive-left-filter');
    } else {
      setMainFilterFields(mergedFields);
      setSelectedMainFiltersForDelete(nextFields.map((field) => field.id));
      setSelectedArchiveNodeId('archive-filter');
    }

    setConditionWorkbenchConfig(scope, (prev) => ({ ...prev, bulkDraft: '' }));
    activateConditionPanelSelection(scope);
    showToast(replace ? `已重建 ${nextFields.length} 个条件` : `已新增 ${nextFields.length} 个条件`);
  }, [
    activateConditionPanelSelection,
    createScopedConditionFields,
    getConditionWorkbenchConfig,
    leftFilterFields,
    mainFilterFields,
    parseConditionWorkbenchDraft,
    setConditionWorkbenchConfig,
    setLeftFilterFields,
    setMainFilterFields,
    setSelectedArchiveNodeId,
    setSelectedLeftFiltersForDelete,
    setSelectedMainFiltersForDelete,
    showToast,
  ]);

  const handleDocumentConditionScopeSwitch = useCallback((nextScope: ConditionWorkbenchScope) => {
    setDocumentConditionScope(nextScope);
    if (selectedConditionPanelScope) {
      activateConditionPanelSelection(nextScope);
    }
  }, [activateConditionPanelSelection, selectedConditionPanelScope, setDocumentConditionScope]);

  const handleConditionPanelFieldSelect = useCallback((scope: ConditionWorkbenchScope, fieldId: string) => {
    if (scope === 'left') {
      setSelectedArchiveNodeId('archive-left-filter');
      activateConditionSelection('left', fieldId);
      setSelectedLeftFiltersForDelete([fieldId]);
      return;
    }

    setSelectedArchiveNodeId('archive-filter');
    activateConditionSelection('main', fieldId);
    setSelectedMainFiltersForDelete([fieldId]);
  }, [
    activateConditionSelection,
    setSelectedArchiveNodeId,
    setSelectedLeftFiltersForDelete,
    setSelectedMainFiltersForDelete,
  ]);

  const getSelectedConditionPanelContext = useCallback((scope: ConditionWorkbenchScope | null) => {
    if (!scope) return null;

    const isLeftPanel = scope === 'left';
    return {
      kind: 'condition-panel' as const,
      scope: isLeftPanel ? 'left-filter-panel' as const : 'filter-panel' as const,
      title: isLeftPanel ? '左条件总览' : '主条件总览',
      description: '',
      icon: 'filter_alt',
      iconClass: isLeftPanel ? 'bg-indigo-500/12 text-indigo-500' : 'bg-sky-500/12 text-sky-500',
      config: isLeftPanel ? leftConditionWorkbenchConfig : mainConditionWorkbenchConfig,
      fields: isLeftPanel ? leftFilterFields : mainFilterFields,
      setConfig: (updater: ConditionWorkbenchConfig | ((prev: ConditionWorkbenchConfig) => ConditionWorkbenchConfig)) => {
        setConditionWorkbenchConfig(scope, updater);
      },
      appendDraft: () => applyConditionWorkbenchDraft(scope, false),
      replaceDraft: () => applyConditionWorkbenchDraft(scope, true),
    };
  }, [
    applyConditionWorkbenchDraft,
    leftConditionWorkbenchConfig,
    leftFilterFields,
    mainConditionWorkbenchConfig,
    mainFilterFields,
    setConditionWorkbenchConfig,
  ]);

  return {
    activeDocumentConditionScope,
    getSelectedConditionPanelContext,
    handleConditionPanelFieldSelect,
    handleDocumentConditionScopeSwitch,
    leftDocumentConditionConfig,
    mainDocumentConditionConfig,
  };
}

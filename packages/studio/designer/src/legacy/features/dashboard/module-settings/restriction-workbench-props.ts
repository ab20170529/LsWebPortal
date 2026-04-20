import type { CSSProperties, Dispatch, SetStateAction } from 'react';

import type { LongTextEditorState } from './long-text-editor-modal';
import type {
  RestrictionConfigTabId,
  RestrictionMeasureItem,
  RestrictionNumberRuleItem,
  RestrictionProcessDesignItem,
  RestrictionTopStructureItem,
  RestrictionWorkbenchProps,
} from './restriction-workbench';

export type BuildRestrictionWorkbenchPropsInput = {
  buildRestrictionMeasure: (index: number, overrides?: Partial<RestrictionMeasureItem>) => RestrictionMeasureItem;
  buildRestrictionNumberRule: (index: number, overrides?: Partial<RestrictionNumberRuleItem>) => RestrictionNumberRuleItem;
  buildRestrictionProcessDesign: (index: number, overrides?: Partial<RestrictionProcessDesignItem>) => RestrictionProcessDesignItem;
  buildRestrictionTopStructure: (index: number, overrides?: Partial<RestrictionTopStructureItem>) => RestrictionTopStructureItem;
  currentModuleName: string;
  onOpenLongTextEditor: Dispatch<SetStateAction<LongTextEditorState>>;
  onSaveRestrictionTab: (tabId: RestrictionConfigTabId) => void;
  restrictionActiveTab: RestrictionConfigTabId;
  restrictionMeasures: RestrictionMeasureItem[];
  restrictionNumberRules: RestrictionNumberRuleItem[];
  restrictionProcessDesigns: RestrictionProcessDesignItem[];
  restrictionSelection: Record<RestrictionConfigTabId, string | null>;
  restrictionTopStructures: RestrictionTopStructureItem[];
  setRestrictionActiveTab: Dispatch<SetStateAction<RestrictionConfigTabId>>;
  setRestrictionMeasures: Dispatch<SetStateAction<RestrictionMeasureItem[]>>;
  setRestrictionNumberRules: Dispatch<SetStateAction<RestrictionNumberRuleItem[]>>;
  setRestrictionProcessDesigns: Dispatch<SetStateAction<RestrictionProcessDesignItem[]>>;
  setRestrictionSelection: Dispatch<SetStateAction<Record<RestrictionConfigTabId, string | null>>>;
  setRestrictionTopStructures: Dispatch<SetStateAction<RestrictionTopStructureItem[]>>;
  showToast: (message: string) => void;
  workspaceThemeTableSurfaceClass: string;
  workspaceThemeVars: CSSProperties;
};

export function buildRestrictionWorkbenchProps(
  input: BuildRestrictionWorkbenchPropsInput,
): RestrictionWorkbenchProps {
  const setRestrictionSelectedId = (tabId: RestrictionConfigTabId, rowId: string | null) => {
    input.setRestrictionSelection((prev) => ({ ...prev, [tabId]: rowId }));
  };

  const selectedGuardRule = input.restrictionMeasures.find((item) => item.id === input.restrictionSelection.guard) ?? input.restrictionMeasures[0] ?? null;
  const selectedNumberRule = input.restrictionNumberRules.find((item) => item.id === input.restrictionSelection.number) ?? input.restrictionNumberRules[0] ?? null;
  const selectedTopStructure = input.restrictionTopStructures.find((item) => item.id === input.restrictionSelection.structure) ?? input.restrictionTopStructures[0] ?? null;
  const selectedProcessDesign = input.restrictionProcessDesigns.find((item) => item.id === input.restrictionSelection.process) ?? input.restrictionProcessDesigns[0] ?? null;

  const handleAddRestrictionItem = () => {
    if (input.restrictionActiveTab === 'guard') {
      const next = input.buildRestrictionMeasure(input.restrictionMeasures.length + 1, { order: input.restrictionMeasures.length });
      input.setRestrictionMeasures((prev) => [...prev, next]);
      setRestrictionSelectedId('guard', next.id);
      return;
    }
    if (input.restrictionActiveTab === 'number') {
      const next = input.buildRestrictionNumberRule(input.restrictionNumberRules.length + 1);
      input.setRestrictionNumberRules((prev) => [...prev, next]);
      setRestrictionSelectedId('number', next.id);
      return;
    }
    if (input.restrictionActiveTab === 'structure') {
      const next = input.buildRestrictionTopStructure(input.restrictionTopStructures.length + 1, {
        rowId: 150 + input.restrictionTopStructures.length + 1,
      });
      input.setRestrictionTopStructures((prev) => [...prev, next]);
      setRestrictionSelectedId('structure', next.id);
      return;
    }
    if (input.restrictionActiveTab === 'process') {
      const next = input.buildRestrictionProcessDesign(input.restrictionProcessDesigns.length + 1);
      input.setRestrictionProcessDesigns((prev) => [...prev, next]);
      setRestrictionSelectedId('process', next.id);
      return;
    }
    input.showToast('当前页签暂不支持新增。');
  };

  const handleDuplicateRestrictionItem = () => {
    if (input.restrictionActiveTab === 'guard' && selectedGuardRule) {
      const next = input.buildRestrictionMeasure(input.restrictionMeasures.length + 1, {
        ...selectedGuardRule,
        description: `${selectedGuardRule.description || '限制措施'} 副本`,
        order: input.restrictionMeasures.length,
      });
      input.setRestrictionMeasures((prev) => [...prev, next]);
      setRestrictionSelectedId('guard', next.id);
      return;
    }
    if (input.restrictionActiveTab === 'number' && selectedNumberRule) {
      const next = input.buildRestrictionNumberRule(input.restrictionNumberRules.length + 1, {
        ...selectedNumberRule,
        sortOrder: input.restrictionNumberRules.length + 1,
      });
      input.setRestrictionNumberRules((prev) => [...prev, next]);
      setRestrictionSelectedId('number', next.id);
      return;
    }
    if (input.restrictionActiveTab === 'structure' && selectedTopStructure) {
      const next = input.buildRestrictionTopStructure(input.restrictionTopStructures.length + 1, {
        ...selectedTopStructure,
        tableDesc: `${selectedTopStructure.tableDesc || '结构'} 副本`,
        rowId: selectedTopStructure.rowId + 1,
      });
      input.setRestrictionTopStructures((prev) => [...prev, next]);
      setRestrictionSelectedId('structure', next.id);
      return;
    }
    if (input.restrictionActiveTab === 'process' && selectedProcessDesign) {
      const next = input.buildRestrictionProcessDesign(input.restrictionProcessDesigns.length + 1, {
        ...selectedProcessDesign,
        legacyFlowTypeId: undefined,
        planValue: '',
        schemeName: `${selectedProcessDesign.schemeName || '流程方案'} 副本`,
      });
      input.setRestrictionProcessDesigns((prev) => [...prev, next]);
      setRestrictionSelectedId('process', next.id);
      return;
    }
    input.showToast('当前页签没有可复制的数据。');
  };

  const handleDeleteRestrictionItem = () => {
    if (input.restrictionActiveTab === 'guard' && selectedGuardRule) {
      input.setRestrictionMeasures((prev) => prev.filter((item) => item.id !== selectedGuardRule.id));
      return;
    }
    if (input.restrictionActiveTab === 'number' && selectedNumberRule) {
      input.setRestrictionNumberRules((prev) => prev.filter((item) => item.id !== selectedNumberRule.id));
      return;
    }
    if (input.restrictionActiveTab === 'structure' && selectedTopStructure) {
      input.setRestrictionTopStructures((prev) => prev.filter((item) => item.id !== selectedTopStructure.id));
      return;
    }
    if (input.restrictionActiveTab === 'process' && selectedProcessDesign) {
      input.setRestrictionProcessDesigns((prev) => prev.filter((item) => item.id !== selectedProcessDesign.id));
      return;
    }
    input.showToast('当前页签没有可删除的数据。');
  };

  return {
    activeTab: input.restrictionActiveTab,
    currentModuleName: input.currentModuleName,
    onActiveTabChange: input.setRestrictionActiveTab,
    onAddItem: handleAddRestrictionItem,
    onDeleteItem: handleDeleteRestrictionItem,
    onDuplicateItem: handleDuplicateRestrictionItem,
    onOpenLongTextEditor: input.onOpenLongTextEditor,
    onSaveTab: () => input.onSaveRestrictionTab(input.restrictionActiveTab),
    onSelectedIdChange: setRestrictionSelectedId,
    restrictionMeasures: input.restrictionMeasures,
    restrictionNumberRules: input.restrictionNumberRules,
    restrictionProcessDesigns: input.restrictionProcessDesigns,
    restrictionSelection: input.restrictionSelection,
    restrictionTopStructures: input.restrictionTopStructures,
    setRestrictionMeasures: input.setRestrictionMeasures,
    setRestrictionNumberRules: input.setRestrictionNumberRules,
    setRestrictionProcessDesigns: input.setRestrictionProcessDesigns,
    setRestrictionTopStructures: input.setRestrictionTopStructures,
    workspaceThemeTableSurfaceClass: input.workspaceThemeTableSurfaceClass,
    workspaceThemeVars: input.workspaceThemeVars,
  };
}

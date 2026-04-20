import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  listProcessDesignerSchemes,
  saveProcessDesignerScheme,
  type ProcessDesignerSchemeDto,
} from '../../../lib/backend-process-designer';
import { createLinearProcessDesignerDocument } from './process-designer-types';
import type {
  RestrictionConfigTabId,
  RestrictionMeasureItem,
  RestrictionNumberRuleItem,
  RestrictionProcessDesignItem,
  RestrictionTopStructureItem,
} from './restriction-workbench';

type RestrictionWorkbenchBusinessType = 'document' | 'table' | 'tree';

type UseRestrictionWorkbenchStateOptions = {
  businessType: RestrictionWorkbenchBusinessType;
  currentModuleCode: string;
  currentModuleName: string;
  currentPrimaryTableName: string;
  getErrorMessage: (error: unknown) => string;
  isConfigOpen: boolean;
  isMenuInfoBuilt: boolean;
  showToast: (message: string) => void;
};

const RESTRICTION_TAB_LABEL_MAP: Record<RestrictionConfigTabId, string> = {
  guard: '管控限制措施',
  number: '编号规则管理',
  process: '流程设计管理',
  structure: '顶层数据结构',
};

function buildEmptyRestrictionSelection(): Record<RestrictionConfigTabId, string | null> {
  return {
    guard: null,
    number: null,
    process: null,
    structure: null,
  };
}

function buildRestrictionProcessDesignId(value: {
  legacyFlowTypeId?: number;
  planValue?: string;
  schemeCode?: string;
  fallbackIndex?: number;
}) {
  if (typeof value.legacyFlowTypeId === 'number' && Number.isFinite(value.legacyFlowTypeId)) {
    return `process_scheme_${value.legacyFlowTypeId}`;
  }
  if (value.planValue && value.planValue.trim()) {
    return `process_scheme_${value.planValue.trim()}`;
  }
  if (value.schemeCode && value.schemeCode.trim()) {
    return `process_scheme_${value.schemeCode.trim()}`;
  }
  return `process_rule_${Date.now()}_${value.fallbackIndex ?? 0}`;
}

export function useRestrictionWorkbenchState({
  businessType,
  currentModuleCode,
  currentModuleName,
  currentPrimaryTableName,
  getErrorMessage,
  isConfigOpen,
  isMenuInfoBuilt,
  showToast,
}: UseRestrictionWorkbenchStateOptions) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentRestrictionProcessBusinessType = businessType === 'table' ? '单据' : businessType === 'tree' ? '树形单表' : '单表';
  const [restrictionMeasures, setRestrictionMeasures] = useState<RestrictionMeasureItem[]>([]);
  const [restrictionNumberRules, setRestrictionNumberRules] = useState<RestrictionNumberRuleItem[]>([]);
  const [restrictionProcessDesigns, setRestrictionProcessDesigns] = useState<RestrictionProcessDesignItem[]>([]);
  const [restrictionTopStructures, setRestrictionTopStructures] = useState<RestrictionTopStructureItem[]>([]);
  const [restrictionSelection, setRestrictionSelection] = useState<Record<RestrictionConfigTabId, string | null>>(
    () => buildEmptyRestrictionSelection(),
  );
  const [isRestrictionTabSaving, setIsRestrictionTabSaving] = useState(false);

  const buildRestrictionMeasure = useCallback((
    index: number,
    overrides: Partial<RestrictionMeasureItem> = {},
  ): RestrictionMeasureItem => ({
    id: `guard_rule_${Date.now()}_${index}`,
    businessCategory: '业务处理',
    eventType: '保存时',
    stepCode: '0',
    judgeRule: '',
    syncAction: '',
    description: `限制措施 ${index}`,
    hint: '',
    order: index,
    enabled: true,
    confirmRequired: false,
    applyDate: todayIso,
    applyUser: '',
    ...overrides,
  }), [todayIso]);

  const buildRestrictionNumberRule = useCallback((
    index: number,
    overrides: Partial<RestrictionNumberRuleItem> = {},
  ): RestrictionNumberRuleItem => ({
    id: `number_rule_${Date.now()}_${index}`,
    moduleCode: currentModuleCode,
    sortOrder: index,
    enabled: true,
    sequencePermission: true,
    segmentType: '固定字符串',
    segmentValue: '',
    lengthLimit: 2,
    separator: '',
    inputDate: todayIso,
    creator: '',
    ...overrides,
  }), [currentModuleCode, todayIso]);

  const mapProcessDesignerSchemeToItem = useCallback((
    scheme: ProcessDesignerSchemeDto,
    fallbackIndex: number,
  ): RestrictionProcessDesignItem => ({
    id: buildRestrictionProcessDesignId({
      fallbackIndex,
      legacyFlowTypeId: scheme.legacyFlowTypeId,
      planValue: scheme.planValue,
      schemeCode: scheme.schemeCode,
    }),
    legacyFlowTypeId: scheme.legacyFlowTypeId,
    planValue: String(scheme.planValue || scheme.legacyFlowTypeId || ''),
    businessCode: String(scheme.businessCode || currentModuleCode || ''),
    schemeCode: String(scheme.schemeCode || `Q0${fallbackIndex}`),
    schemeName: String(scheme.schemeName || `流程方案 ${fallbackIndex}`),
    permissionScope: String(scheme.permissionScope || ''),
    approvalFamily: scheme.approvalFamily || (businessType === 'table' ? 'bill' : 'archive'),
    businessType: String(scheme.businessType || currentRestrictionProcessBusinessType),
    actionDescription: String(scheme.actionDescription || ''),
    designerDocument: createLinearProcessDesignerDocument(currentModuleName),
    simpleSchema: scheme.simpleSchema,
    simpleSchemaVersion: scheme.simpleSchemaVersion || 'v1',
  }), [businessType, currentModuleCode, currentModuleName, currentRestrictionProcessBusinessType]);

  const buildRestrictionProcessDesign = useCallback((
    index: number,
    overrides: Partial<RestrictionProcessDesignItem> = {},
  ): RestrictionProcessDesignItem => ({
    id: buildRestrictionProcessDesignId({ fallbackIndex: index, schemeCode: `Q0${index}` }),
    planValue: '',
    businessCode: currentModuleCode,
    schemeCode: `Q0${index}`,
    schemeName: `流程方案 ${index}`,
    permissionScope: '',
    approvalFamily: businessType === 'table' ? 'bill' : 'archive',
    businessType: currentRestrictionProcessBusinessType,
    actionDescription: '',
    designerDocument: createLinearProcessDesignerDocument(currentModuleName),
    simpleSchemaVersion: 'v1',
    ...overrides,
  }), [businessType, currentModuleCode, currentModuleName, currentRestrictionProcessBusinessType]);

  const buildRestrictionTopStructure = useCallback((
    index: number,
    overrides: Partial<RestrictionTopStructureItem> = {},
  ): RestrictionTopStructureItem => ({
    id: `top_structure_${Date.now()}_${index}`,
    mainModuleCode: currentModuleCode,
    tableName: currentPrimaryTableName,
    tableDesc: currentModuleName,
    remark: '',
    rowId: 150 + index,
    moduleCode: currentModuleCode,
    moduleType: businessType === 'table' ? '单据' : businessType === 'tree' ? '树形单表' : '单表',
    moduleSchema: businessType === 'table' ? '主从单据' : businessType === 'tree' ? '树表结构' : '单表结构',
    fieldPrefix: businessType === 'table' ? 'bill_' : 'base_',
    sequencePrefix: businessType === 'table' ? 'bd_' : 'main_',
    sequenceRule: businessType === 'table' ? '单据内顺序' : '主表顺序',
    orderLength: 4,
    relationField: businessType === 'table' ? 'bill_id' : 'id',
    ...overrides,
  }), [businessType, currentModuleCode, currentModuleName, currentPrimaryTableName]);

  const selectedRestrictionProcessDesign = useMemo(
    () => restrictionProcessDesigns.find((item) => item.id === restrictionSelection.process) ?? restrictionProcessDesigns[0] ?? null,
    [restrictionProcessDesigns, restrictionSelection.process],
  );

  const updateSelectedRestrictionProcessDesign = useCallback((patch: Partial<RestrictionProcessDesignItem>) => {
    if (!selectedRestrictionProcessDesign) {
      return;
    }

    setRestrictionProcessDesigns((prev) => prev.map((item) => (
      item.id === selectedRestrictionProcessDesign.id
        ? { ...item, ...patch }
        : item
    )));
  }, [selectedRestrictionProcessDesign]);

  const createRestrictionProcessDesignEntry = useCallback(() => {
    const next = buildRestrictionProcessDesign(restrictionProcessDesigns.length + 1);
    setRestrictionProcessDesigns((prev) => [...prev, next]);
    setRestrictionSelection((prev) => ({ ...prev, process: next.id }));
    showToast('已创建流程设计方案');
  }, [buildRestrictionProcessDesign, restrictionProcessDesigns.length, showToast]);

  useEffect(() => {
    if (!isConfigOpen || !isMenuInfoBuilt || !currentModuleCode.trim()) {
      return;
    }

    let active = true;

    const loadRestrictionProcessDesigns = async () => {
      try {
        const schemes = await listProcessDesignerSchemes({
          approvalFamily: businessType === 'table' ? 'bill' : 'archive',
          businessCode: currentModuleCode,
          businessType: currentRestrictionProcessBusinessType,
        });
        if (!active) {
          return;
        }

        const mapped = schemes.map((scheme, index) => mapProcessDesignerSchemeToItem(scheme, index + 1));
        setRestrictionProcessDesigns(mapped);
        setRestrictionSelection((prev) => {
          const nextSelectedId = mapped.some((item) => item.id === prev.process)
            ? prev.process
            : mapped[0]?.id ?? null;
          return nextSelectedId === prev.process ? prev : { ...prev, process: nextSelectedId };
        });
      } catch (error) {
        if (active) {
          showToast(getErrorMessage(error));
        }
      }
    };

    void loadRestrictionProcessDesigns();

    return () => {
      active = false;
    };
  }, [
    businessType,
    currentModuleCode,
    currentRestrictionProcessBusinessType,
    getErrorMessage,
    isConfigOpen,
    isMenuInfoBuilt,
    mapProcessDesignerSchemeToItem,
    showToast,
  ]);

  useEffect(() => {
    const nextModuleType = businessType === 'table' ? '单据' : businessType === 'tree' ? '树形单表' : '单表';
    setRestrictionTopStructures((prev) => {
      const first = prev[0];
      if (!first) {
        return prev;
      }

      if (
        first.mainModuleCode === currentModuleCode
        && first.moduleCode === currentModuleCode
        && first.tableName === currentPrimaryTableName
        && first.tableDesc === currentModuleName
        && first.moduleType === nextModuleType
      ) {
        return prev;
      }

      return prev.map((item, index) => (
        index === 0
          ? {
              ...item,
              mainModuleCode: currentModuleCode,
              moduleCode: currentModuleCode,
              tableName: currentPrimaryTableName,
              tableDesc: currentModuleName,
              moduleType: nextModuleType,
            }
          : item
      ));
    });
  }, [businessType, currentModuleCode, currentModuleName, currentPrimaryTableName]);

  useEffect(() => {
    const rowsByTab: Record<RestrictionConfigTabId, Array<{ id: string }>> = {
      guard: restrictionMeasures,
      number: restrictionNumberRules,
      structure: restrictionTopStructures,
      process: restrictionProcessDesigns,
    };

    setRestrictionSelection((prev) => {
      let changed = false;
      const next = { ...prev };
      (Object.keys(rowsByTab) as RestrictionConfigTabId[]).forEach((tabId) => {
        const rows = rowsByTab[tabId];
        if (!rows.some((row) => row.id === next[tabId])) {
          next[tabId] = rows[0]?.id ?? null;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [
    restrictionMeasures,
    restrictionNumberRules,
    restrictionProcessDesigns,
    restrictionTopStructures,
  ]);

  const handleSaveRestrictionTab = useCallback(async (tabId: RestrictionConfigTabId) => {
    if (tabId !== 'process') {
      showToast(`${RESTRICTION_TAB_LABEL_MAP[tabId]} 已暂存`);
      return true;
    }

    if (!selectedRestrictionProcessDesign) {
      showToast('请先选择一个流程方案');
      return false;
    }

    try {
      setIsRestrictionTabSaving(true);
      const savedScheme = await saveProcessDesignerScheme({
        approvalFamily: selectedRestrictionProcessDesign.approvalFamily,
        actionDescription: selectedRestrictionProcessDesign.actionDescription,
        businessCode: selectedRestrictionProcessDesign.businessCode,
        businessType: selectedRestrictionProcessDesign.businessType,
        legacyFlowTypeId: selectedRestrictionProcessDesign.legacyFlowTypeId,
        permissionScope: selectedRestrictionProcessDesign.permissionScope,
        planValue: selectedRestrictionProcessDesign.planValue,
        schemeCode: selectedRestrictionProcessDesign.schemeCode,
        schemeName: selectedRestrictionProcessDesign.schemeName,
        simpleSchema: selectedRestrictionProcessDesign.simpleSchema,
        simpleSchemaVersion: selectedRestrictionProcessDesign.simpleSchemaVersion,
      });

      const mapped = mapProcessDesignerSchemeToItem(savedScheme, restrictionProcessDesigns.length || 1);
      setRestrictionProcessDesigns((prev) => prev.map((item) => (
        item.id === selectedRestrictionProcessDesign.id ? mapped : item
      )));
      setRestrictionSelection((prev) => ({ ...prev, process: mapped.id }));
      showToast('流程方案已保存');
      return true;
    } catch (error) {
      showToast(getErrorMessage(error));
      return false;
    } finally {
      setIsRestrictionTabSaving(false);
    }
  }, [
    getErrorMessage,
    mapProcessDesignerSchemeToItem,
    restrictionProcessDesigns.length,
    selectedRestrictionProcessDesign,
    showToast,
  ]);

  const resetRestrictionState = useCallback(() => {
    setRestrictionMeasures([]);
    setRestrictionNumberRules([]);
    setRestrictionProcessDesigns([]);
    setRestrictionTopStructures([]);
    setRestrictionSelection(buildEmptyRestrictionSelection());
  }, []);

  return {
    buildRestrictionMeasure,
    buildRestrictionNumberRule,
    buildRestrictionProcessDesign,
    buildRestrictionTopStructure,
    createRestrictionProcessDesignEntry,
    handleSaveRestrictionTab,
    isRestrictionTabSaving,
    resetRestrictionState,
    restrictionMeasures,
    restrictionNumberRules,
    restrictionProcessDesigns,
    restrictionSelection,
    restrictionTopStructures,
    selectedRestrictionProcessDesign,
    setRestrictionMeasures,
    setRestrictionNumberRules,
    setRestrictionProcessDesigns,
    setRestrictionSelection,
    setRestrictionTopStructures,
    updateSelectedRestrictionProcessDesign,
  };
}

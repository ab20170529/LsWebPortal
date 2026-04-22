import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  deleteFunctionFlow,
  fetchFunctionFlowDetail,
  fetchFunctionFlowList,
} from '../../lib/backend-function-flow';
import type { BackendSubsystemNode } from '../../lib/backend-menus';
import {
  createEmptyFunctionFlowGeneratedArtifacts,
  createEmptyFunctionFlowGraphJson,
  type FunctionFlowDetail,
  type FunctionFlowGeneratedArtifacts,
  type FunctionFlowGraphJson,
  type FunctionFlowModuleOption,
  type FunctionFlowSummary,
} from './function-flow-types';
import { FunctionFlowConfirmModal } from './function-flow-confirm-modal';
import { FunctionFlowDrawIoDesigner } from './function-flow-drawio-designer';

type FunctionFlowDesignWorkbenchProps = {
  currentUserName: string;
  initialSubsystemId?: string | null;
  isLoadingSubsystemMenus: boolean;
  menuLoadError?: string | null;
  onExit: () => void;
  onReloadSubsystemMenus?: () => Promise<void>;
  onShowToast?: (message: string) => void;
  subsystemMenus: BackendSubsystemNode[];
};

type FunctionFlowDraft = {
  designerSessionKey: string;
  editorType?: string;
  flowCode: string;
  flowId?: string | null;
  flowName: string;
  generatedArtifacts: FunctionFlowGeneratedArtifacts;
  graphJson: FunctionFlowGraphJson;
  rowVersion?: number | string | null;
  status?: string;
  subsystemId: string;
  updatedAt?: number | string | null;
  updatedBy?: string | null;
  updatedName?: string | null;
  xml: string;
  xmlSize?: number | null;
};

const SUBSYSTEM_ICON_MAP: Record<string, string> = {
  '人力': 'badge',
  '仓': 'inventory_2',
  '制造': 'precision_manufacturing',
  '工程': 'construction',
  '库存': 'inventory_2',
  '技术': 'science',
  '系统': 'dns',
  '营销': 'campaign',
  '行政': 'apartment',
  '设备': 'build',
  '财务': 'account_balance',
  '质量': 'verified',
  '采购': 'shopping_bag',
  '客户': 'groups',
  '检验': 'verified',
  '生产': 'precision_manufacturing',
  '研发': 'science',
  '销售': 'storefront',
  '供应': 'shopping_bag',
};

function normalizeText(value?: string | number | null) {
  return String(value ?? '').trim();
}

function resolveSubsystemApiId(subsystem?: BackendSubsystemNode | null) {
  return normalizeText(subsystem?.subsysId ?? subsystem?.id);
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function slugifySegment(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function createUniqueSuffix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveSubsystemIcon(title: string) {
  for (const [keyword, icon] of Object.entries(SUBSYSTEM_ICON_MAP)) {
    if (title.includes(keyword)) {
      return icon;
    }
  }

  return 'account_tree';
}

function getEnabledMenus<T extends { enabled: boolean }>(menus?: readonly T[] | null) {
  return (menus ?? []).filter((menu): menu is T => menu.enabled !== false);
}

function collectSubsystemModuleOptions(
  subsystem?: BackendSubsystemNode | null,
) {
  if (!subsystem) {
    return [] as FunctionFlowModuleOption[];
  }

  const options: FunctionFlowModuleOption[] = [];

  for (const firstLevel of getEnabledMenus(subsystem.children)) {
    const firstLevelTitle = normalizeText(firstLevel.title) || '未命名目录';

    for (const secondLevel of getEnabledMenus(firstLevel.children)) {
      const moduleCode = normalizeText(secondLevel.purviewId);
      const secondLevelTitle = normalizeText(secondLevel.title) || '未命名模块';
      if (!moduleCode) {
        continue;
      }

      options.push({
        code: moduleCode,
        dllFileName: undefined,
        id: normalizeText(secondLevel.menuId ?? secondLevel.id ?? moduleCode),
        menuId: secondLevel.menuId ?? null,
        moduleKind: (normalizeText(secondLevel.moduleType) || 'module') as FunctionFlowModuleOption['moduleKind'],
        moduleType: normalizeText(secondLevel.moduleType),
        pathLabel: [
          normalizeText(subsystem.title) || '未命名子系统',
          firstLevelTitle,
          secondLevelTitle,
        ].join(' / '),
        title: secondLevelTitle,
      });
    }
  }

  return options;
}

function createBlankDrawIoXml(title: string) {
  const pageName = escapeXml(normalizeText(title) || '流程设计');
  return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Codex" version="24.7.17"><diagram id="function-flow" name="${pageName}"><mxGraphModel dx="1440" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`;
}

function getFlowEditorXml(detail?: FunctionFlowDetail | null) {
  return normalizeText(detail?.editorXml) || normalizeText(detail?.drawioXml);
}

function buildSuggestedFlowName(subsystem: BackendSubsystemNode, existingFlows: FunctionFlowSummary[]) {
  const subsystemTitle = normalizeText(subsystem.title) || '未命名子系统';
  const baseName = `${subsystemTitle} 流程图`;
  const existingNames = new Set(existingFlows.map((flow) => normalizeText(flow.flowName)).filter(Boolean));

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let index = 2;
  while (existingNames.has(`${baseName} ${index}`)) {
    index += 1;
  }

  return `${baseName} ${index}`;
}

function buildNewFunctionFlowDraft(subsystem: BackendSubsystemNode, existingFlows: FunctionFlowSummary[]): FunctionFlowDraft {
  const subsystemId = resolveSubsystemApiId(subsystem);
  const flowName = buildSuggestedFlowName(subsystem, existingFlows);
  const flowCode = `subsystem:${subsystemId}:flow:${slugifySegment(flowName) || 'function-flow'}-${createUniqueSuffix()}`;

  return {
    designerSessionKey: flowCode,
    editorType: 'drawio',
    flowCode,
    flowId: null,
    flowName,
    generatedArtifacts: createEmptyFunctionFlowGeneratedArtifacts(),
    graphJson: createEmptyFunctionFlowGraphJson(),
    rowVersion: null,
    status: 'draft',
    subsystemId,
    updatedAt: Date.now(),
    updatedBy: null,
    updatedName: null,
    xml: createBlankDrawIoXml(flowName),
    xmlSize: null,
  };
}

function draftFromDetail(detail: FunctionFlowDetail): FunctionFlowDraft {
  return {
    designerSessionKey: normalizeText(detail.id) || detail.flowCode,
    editorType: detail.editorType || 'drawio',
    flowCode: detail.flowCode,
    flowId: detail.id,
    flowName: detail.flowName,
    generatedArtifacts: detail.generatedArtifacts
      ? {
          detailSql: detail.generatedArtifacts.detailSql || '',
          gridJson: Array.isArray(detail.generatedArtifacts.gridJson) ? detail.generatedArtifacts.gridJson : [],
          sourceSql: detail.generatedArtifacts.sourceSql || '',
        }
      : createEmptyFunctionFlowGeneratedArtifacts(),
    graphJson: detail.graphJson ?? createEmptyFunctionFlowGraphJson(),
    rowVersion: detail.rowVersion ?? null,
    status: detail.status || 'draft',
    subsystemId: detail.subsystemId,
    updatedAt: detail.updatedAt ?? null,
    updatedBy: detail.updatedBy ?? null,
    updatedName: detail.updatedName ?? null,
    xml: getFlowEditorXml(detail) || createBlankDrawIoXml(detail.flowName),
    xmlSize: detail.xmlSize ?? null,
  };
}

function mergeDraftWithDetail(currentDraft: FunctionFlowDraft, detail: FunctionFlowDetail): FunctionFlowDraft {
  const nextDraft = draftFromDetail(detail);

  return {
    ...currentDraft,
    ...nextDraft,
    designerSessionKey: currentDraft.designerSessionKey,
    generatedArtifacts: nextDraft.generatedArtifacts ?? currentDraft.generatedArtifacts,
    graphJson: nextDraft.graphJson ?? currentDraft.graphJson,
    xml: nextDraft.xml || currentDraft.xml,
  };
}

function upsertFlowSummary(flows: FunctionFlowSummary[], detail: FunctionFlowDetail) {
  const nextSummary: FunctionFlowSummary = {
    editorType: detail.editorType,
    flowCode: detail.flowCode,
    flowName: detail.flowName,
    id: detail.id,
    rowVersion: detail.rowVersion ?? null,
    status: detail.status || 'draft',
    subsystemId: detail.subsystemId,
    updatedAt: detail.updatedAt ?? Date.now(),
    updatedBy: detail.updatedBy ?? null,
    updatedName: detail.updatedName ?? null,
    xmlSize: detail.xmlSize ?? null,
  };

  const existingIndex = flows.findIndex((flow) => flow.id === nextSummary.id);
  if (existingIndex === -1) {
    return [nextSummary, ...flows];
  }

  const nextFlows = [...flows];
  nextFlows[existingIndex] = nextSummary;
  return nextFlows;
}

function toTimestamp(value?: number | string | null) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedNumber = Number(value);
    if (Number.isFinite(parsedNumber)) {
      return parsedNumber < 1_000_000_000_000 ? parsedNumber * 1000 : parsedNumber;
    }

    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) {
      return parsedDate;
    }
  }

  return null;
}

function formatFlowTime(timestamp?: number | string | null) {
  const resolvedTimestamp = toTimestamp(timestamp);
  if (!resolvedTimestamp) {
    return '尚未开始';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(resolvedTimestamp);
}

function countSubsystemModules(
  subsystem?: BackendSubsystemNode | null,
) {
  return collectSubsystemModuleOptions(subsystem).length;
}

export function FunctionFlowDesignWorkbench({
  currentUserName,
  initialSubsystemId,
  isLoadingSubsystemMenus,
  menuLoadError,
  onExit,
  onReloadSubsystemMenus,
  onShowToast,
  subsystemMenus,
}: FunctionFlowDesignWorkbenchProps) {
  const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(initialSubsystemId ?? null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingDraft, setEditingDraft] = useState<FunctionFlowDraft | null>(null);
  const [isRefreshingSubsystems, setIsRefreshingSubsystems] = useState(false);
  const [isOpeningDesigner, setIsOpeningDesigner] = useState(false);
  const [loadingFlowListIds, setLoadingFlowListIds] = useState<Record<string, boolean>>({});
  const [deletingFlowId, setDeletingFlowId] = useState<string | null>(null);
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<{
    flow: FunctionFlowSummary;
    subsystem: BackendSubsystemNode;
  } | null>(null);
  const [flowListsBySubsystem, setFlowListsBySubsystem] = useState<Record<string, FunctionFlowSummary[]>>({});
  const flowListsBySubsystemRef = useRef<Record<string, FunctionFlowSummary[]>>({});
  const loadingFlowListIdsRef = useRef<Record<string, boolean>>({});
  void currentUserName;

  useEffect(() => {
    flowListsBySubsystemRef.current = flowListsBySubsystem;
  }, [flowListsBySubsystem]);

  useEffect(() => {
    loadingFlowListIdsRef.current = loadingFlowListIds;
  }, [loadingFlowListIds]);

  useEffect(() => {
    if (subsystemMenus.length === 0) {
      setActiveSubsystemId(null);
      return;
    }

    if (activeSubsystemId && subsystemMenus.some((subsystem) => subsystem.id === activeSubsystemId)) {
      return;
    }

    const nextSubsystem = subsystemMenus.find((subsystem) => subsystem.id === initialSubsystemId) ?? subsystemMenus[0];
    setActiveSubsystemId(nextSubsystem?.id ?? null);
  }, [activeSubsystemId, initialSubsystemId, subsystemMenus]);

  const filteredSubsystems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return subsystemMenus;
    }

    return subsystemMenus.filter((subsystem) => normalizeText(subsystem.title).toLowerCase().includes(keyword));
  }, [searchKeyword, subsystemMenus]);

  const activeSubsystem = useMemo(
    () => subsystemMenus.find((subsystem) => subsystem.id === activeSubsystemId) ?? null,
    [activeSubsystemId, subsystemMenus],
  );
  const activeSubsystemApiId = useMemo(
    () => resolveSubsystemApiId(activeSubsystem),
    [activeSubsystem],
  );
  const activeFlowList = activeSubsystemApiId ? flowListsBySubsystem[activeSubsystemApiId] ?? [] : [];
  const editingSubsystem = useMemo(
    () => subsystemMenus.find((subsystem) => resolveSubsystemApiId(subsystem) === editingDraft?.subsystemId) ?? null,
    [editingDraft?.subsystemId, subsystemMenus],
  );
  const editingModuleOptions = useMemo(
    () => collectSubsystemModuleOptions(editingSubsystem),
    [editingSubsystem],
  );
  const activeModuleCount = useMemo(
    () => countSubsystemModules(activeSubsystem),
    [activeSubsystem],
  );
  const isActiveFlowListLoading = activeSubsystemApiId ? loadingFlowListIds[activeSubsystemApiId] === true : false;

  const loadFlowList = useCallback(async (
    subsystem?: BackendSubsystemNode | null,
    options?: { force?: boolean },
  ) => {
    const subsystemId = resolveSubsystemApiId(subsystem);
    if (!subsystem || !subsystemId) {
      return [] as FunctionFlowSummary[];
    }

    const shouldForceReload = options?.force === true;
    const cachedFlowLists = flowListsBySubsystemRef.current;
    const loadingFlowLists = loadingFlowListIdsRef.current;

    if (!shouldForceReload && Object.prototype.hasOwnProperty.call(cachedFlowLists, subsystemId)) {
      return cachedFlowLists[subsystemId] ?? [];
    }

    if (loadingFlowLists[subsystemId]) {
      return cachedFlowLists[subsystemId] ?? [];
    }

    loadingFlowListIdsRef.current = {
      ...loadingFlowLists,
      [subsystemId]: true,
    };
    setLoadingFlowListIds((prev) => ({
      ...prev,
      [subsystemId]: true,
    }));

    try {
      const rows = await fetchFunctionFlowList(subsystemId);
      flowListsBySubsystemRef.current = {
        ...flowListsBySubsystemRef.current,
        [subsystemId]: rows,
      };
      setFlowListsBySubsystem((prev) => ({
        ...prev,
        [subsystemId]: rows,
      }));
      return rows;
    } catch (error) {
      flowListsBySubsystemRef.current = {
        ...flowListsBySubsystemRef.current,
        [subsystemId]: [],
      };
      setFlowListsBySubsystem((prev) => ({
        ...prev,
        [subsystemId]: [],
      }));
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '流程图列表读取失败');
      return [];
    } finally {
      loadingFlowListIdsRef.current = {
        ...loadingFlowListIdsRef.current,
        [subsystemId]: false,
      };
      setLoadingFlowListIds((prev) => ({
        ...prev,
        [subsystemId]: false,
      }));
    }
  }, [onShowToast]);

  useEffect(() => {
    if (!activeSubsystem) {
      return;
    }

    void loadFlowList(activeSubsystem, { force: true });
  }, [activeSubsystem, loadFlowList]);

  const handleReloadSubsystems = useCallback(async () => {
    if (!onReloadSubsystemMenus) {
      return;
    }

    setIsRefreshingSubsystems(true);
    try {
      await onReloadSubsystemMenus();
      onShowToast?.('已刷新子系统列表');
    } catch (error) {
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '子系统列表刷新失败');
    } finally {
      setIsRefreshingSubsystems(false);
    }
  }, [onReloadSubsystemMenus, onShowToast]);

  const handleCreateFlow = useCallback(async (targetSubsystem?: BackendSubsystemNode | null) => {
    const subsystem = targetSubsystem ?? activeSubsystem;
    if (!subsystem) {
      return;
    }

    setActiveSubsystemId(subsystem.id);
    setIsOpeningDesigner(true);
    try {
      const existingFlows = await loadFlowList(subsystem);
      setEditingDraft(buildNewFunctionFlowDraft(subsystem, existingFlows));
    } finally {
      setIsOpeningDesigner(false);
    }
  }, [activeSubsystem, loadFlowList]);

  const handleOpenExistingFlow = useCallback(async (
    targetSubsystem: BackendSubsystemNode,
    flow: FunctionFlowSummary,
  ) => {
    if (!flow.id) {
      return;
    }

    setActiveSubsystemId(targetSubsystem.id);
    setIsOpeningDesigner(true);
    try {
      const detail = await fetchFunctionFlowDetail(flow.id);
      setEditingDraft(draftFromDetail(detail));
    } catch (error) {
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '功能流程图读取失败');
    } finally {
      setIsOpeningDesigner(false);
    }
  }, [onShowToast]);

  const handleDeleteFlow = useCallback(async (
    targetSubsystem: BackendSubsystemNode,
    flow: FunctionFlowSummary,
  ) => {
    if (!flow.id || deletingFlowId === flow.id) {
      return;
    }

    if (
      pendingDeleteDraft?.flow.id !== flow.id
      || resolveSubsystemApiId(pendingDeleteDraft.subsystem) !== resolveSubsystemApiId(targetSubsystem)
    ) {
      setPendingDeleteDraft({
        flow,
        subsystem: targetSubsystem,
      });
      return;
    }

    return;
  }, [deletingFlowId, pendingDeleteDraft]);



















  const confirmDeleteFlow = useCallback(async () => {
    if (!pendingDeleteDraft?.flow.id || deletingFlowId === pendingDeleteDraft.flow.id) {
      return;
    }

    const {
      flow,
      subsystem,
    } = pendingDeleteDraft;

    setDeletingFlowId(flow.id);
    try {
      await deleteFunctionFlow(flow.id);
      const subsystemId = resolveSubsystemApiId(subsystem);
      setFlowListsBySubsystem((prev) => ({
        ...prev,
        [subsystemId]: (prev[subsystemId] ?? []).filter((item) => item.id !== flow.id),
      }));
      setPendingDeleteDraft(null);
      onShowToast?.('已删除流程图');
    } catch (error) {
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '流程图删除失败');
    } finally {
      setDeletingFlowId(null);
    }
  }, [deletingFlowId, onShowToast, pendingDeleteDraft]);

  const handleDraftXmlChange = useCallback((nextXml: string) => {
    if (!nextXml.trim()) {
      return;
    }

    setEditingDraft((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        updatedAt: Date.now(),
        xml: nextXml,
      };
    });
  }, []);

  const handleDraftFlowNameChange = useCallback((nextFlowName: string) => {
    const normalizedFlowName = normalizeText(nextFlowName) || '未命名流程图';

    setEditingDraft((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        flowName: normalizedFlowName,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const handleDesignerPersist = useCallback((detail: FunctionFlowDetail) => {
    setEditingDraft((prev) => {
      if (!prev) {
        return prev;
      }

      return mergeDraftWithDetail(prev, detail);
    });

    setFlowListsBySubsystem((prev) => ({
      ...prev,
      [detail.subsystemId]: upsertFlowSummary(prev[detail.subsystemId] ?? [], detail),
    }));
  }, []);

  if (isLoadingSubsystemMenus && subsystemMenus.length === 0) {
    return (
      <div className="flex min-h-[780px] items-center justify-center rounded-[28px] border border-slate-200/70 bg-white/80 text-[14px] text-slate-500 shadow-[0_24px_50px_-36px_rgba(15,23,42,0.3)]">
        <span className="material-symbols-outlined mr-2 animate-spin text-[20px]">progress_activity</span>
        正在加载子系统列表...
      </div>
    );
  }

  if (menuLoadError && subsystemMenus.length === 0) {
    return (
      <div className="flex min-h-[780px] flex-col items-center justify-center rounded-[28px] border border-rose-200/80 bg-white/80 px-6 text-center shadow-[0_24px_50px_-36px_rgba(15,23,42,0.3)]">
        <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <span className="material-symbols-outlined text-[28px]">error</span>
        </div>
        <div className="mt-4 text-[18px] font-bold text-slate-900">子系统列表加载失败</div>
        <div className="mt-2 max-w-[460px] text-[13px] leading-6 text-slate-500">{menuLoadError}</div>
        {onReloadSubsystemMenus ? (
          <button
            type="button"
            onClick={() => {
              void handleReloadSubsystems();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-[16px] bg-primary px-4 py-2 text-[12px] font-bold text-white shadow-[0_18px_36px_-24px_rgba(49,98,255,0.35)] transition-all hover:-translate-y-0.5 hover:bg-erp-blue"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            重新加载子系统</button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/60 bg-[#f8fafc] shadow-sm">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/50">
          <div className="flex h-[72px] items-center justify-between border-b border-slate-200/60 px-6">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <span className="material-symbols-outlined text-[20px]">schema</span>
              </div>
              <span className="text-[15px] font-bold tracking-wide">功能流程设计</span>
            </div>
            {onReloadSubsystemMenus ? (
              <button
                type="button"
                onClick={() => {
                  void handleReloadSubsystems();
                }}
                disabled={isRefreshingSubsystems}
                className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                title="刷新子系统"
              >
                <span className={`material-symbols-outlined text-[18px] ${isRefreshingSubsystems ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>
            ) : null}
          </div>

          <div className="p-4 pb-2">
            <div className="group relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 transition-colors group-focus-within:text-indigo-500">
                search
              </span>
              <input
                type="text"
                placeholder="搜索子系统..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="h-10 w-full rounded-[12px] border border-slate-200/80 bg-white pl-10 pr-4 text-[13px] shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
            {filteredSubsystems.length === 0 ? (
              <div className="py-6 text-center text-[13px] text-slate-400">
                {searchKeyword ? '未找到匹配子系统' : '暂无子系统数据'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSubsystems.map((subsystem) => {
                  const isActive = activeSubsystemId === subsystem.id;
                  const childCount = getEnabledMenus(subsystem.children).length;
                  const flowCount = flowListsBySubsystem[resolveSubsystemApiId(subsystem)]?.length ?? 0;

                  return (
                    <button
                      key={subsystem.id}
                      type="button"
                      onClick={() => setActiveSubsystemId(subsystem.id)}
                      className={`group flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 transition-all ${
                        isActive
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80'
                          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`material-symbols-outlined text-[18px] transition-transform ${
                          isActive ? 'scale-110 font-medium' : 'opacity-70 group-hover:text-indigo-500 group-hover:opacity-100'
                        }`}>
                          {resolveSubsystemIcon(normalizeText(subsystem.title))}
                        </span>
                        <div className="min-w-0">
                          <div className={`truncate text-[13px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                            {normalizeText(subsystem.title) || '未命名子系统'}
                          </div>
                          <div className="truncate text-[11px] text-slate-400">
                            {childCount} 个目录
                          </div>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-slate-200/50 text-slate-500 group-hover:bg-slate-200/80'
                      }`}>
                        {flowCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#fdfdfd]">
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/60 px-8">
            <div className="flex items-center gap-4">
              <h2 className="text-[18px] font-bold text-slate-800">
                {activeSubsystem ? normalizeText(activeSubsystem.title) || '未命名子系统' : '请选择子系统'}
              </h2>
              {activeSubsystem ? (
                <>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-500">
                    <span className="material-symbols-outlined text-[14px]">dataset</span>
                    共 {activeModuleCount} 个模块</span>
                </>
              ) : null}
            </div>
            {activeSubsystem ? (
              <button
                type="button"
                onClick={() => {
                  void handleCreateFlow(activeSubsystem);
                }}
                className="inline-flex items-center gap-2 rounded-[14px] bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white shadow-[0_18px_36px_-24px_rgba(79,70,229,0.45)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                新增流程图</button>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {!activeSubsystem ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="material-symbols-outlined mb-3 text-[48px] opacity-30">folder_open</span>
                <p className="text-[14px]">请在左侧选择子系统</p>
              </div>
            ) : isActiveFlowListLoading && activeFlowList.length === 0 ? (
              <div className="flex items-center gap-2 rounded-[18px] border border-slate-200/70 bg-white px-5 py-4 text-[13px] text-slate-500 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.28)]">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                正在加载流程图列表...
              </div>
            ) : (
              <div className="grid auto-rows-max gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeFlowList.map((flow) => (
                  <div
                    key={flow.id}
                    className="group relative flex min-h-[210px] max-w-[320px] flex-col overflow-hidden rounded-[18px] border border-slate-200/70 bg-white text-left shadow-[0_18px_42px_-34px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_24px_50px_-30px_rgba(49,98,255,0.18)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        void handleOpenExistingFlow(activeSubsystem, flow);
                      }}
                      className="flex flex-1 flex-col p-5 text-left"
                    >
                      <div className="mb-5 flex items-start">
                        <div className="flex size-11 items-center justify-center rounded-[14px] bg-indigo-50 text-indigo-600 transition-all group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                          <span className="material-symbols-outlined text-[22px]">account_tree</span>
                        </div>
                      </div>

                      <div className="line-clamp-2 min-h-[52px] text-[16px] font-bold leading-[26px] text-slate-800 transition-colors group-hover:text-indigo-600">
                        {normalizeText(flow.flowName) || '未命名流程图'}
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 items-center justify-center rounded-[8px] bg-slate-100 text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">history</span>
                          </span>
                          <span className="text-[12px] font-medium text-slate-500">上次编辑</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          {formatFlowTime(flow.updatedAt)}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteFlow(activeSubsystem, flow);
                      }}
                      disabled={deletingFlowId === flow.id}
                      className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-300 opacity-0 shadow-sm transition-all hover:border-rose-100 hover:text-rose-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title="删除流程图"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${deletingFlowId === flow.id ? 'animate-pulse' : ''}`}>
                        delete
                      </span>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    void handleCreateFlow(activeSubsystem);
                  }}
                  className="group flex min-h-[224px] max-w-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-6 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/60"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                    <span className="material-symbols-outlined text-[26px]">add</span>
                  </div>
                  <div className="mt-4 text-[14px] font-bold text-slate-600 transition-colors group-hover:text-indigo-600">
                    新增功能流程图
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      {isOpeningDesigner ? (
        <div className="pointer-events-none fixed inset-0 z-[69] flex items-center justify-center bg-slate-900/12 backdrop-blur-[1px]">
          <div className="rounded-[18px] border border-white/70 bg-white/92 px-5 py-4 text-[13px] font-medium text-slate-600 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.35)]">
            正在加载流程图数据...
          </div>
        </div>
      ) : null}

      <FunctionFlowConfirmModal
        open={pendingDeleteDraft !== null}
        tone="danger"
        icon="delete_forever"
        title="确认删除流程图"
        description="删除后当前流程图和对应的 XML 会一起移除，且无法恢复。"
        detail={pendingDeleteDraft ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="text-[12px] font-bold tracking-[0.16em] text-slate-400">流程名称</span>
              <span className="text-right text-[14px] font-bold text-slate-900">
                {normalizeText(pendingDeleteDraft.flow.flowName) || '未命名流程图'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <span className="text-[12px] font-bold tracking-[0.16em] text-slate-400">所属子系统</span>
              <span className="text-right text-[13px] font-medium text-slate-600">
                {normalizeText(pendingDeleteDraft.subsystem.title) || '未命名子系统'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[12px] font-bold tracking-[0.16em] text-slate-400">最近更新</span>
              <span className="text-right text-[13px] font-medium text-slate-600">
                {formatFlowTime(pendingDeleteDraft.flow.updatedAt)}
              </span>
            </div>
          </div>
        ) : null}
        onClose={() => {
          if (!deletingFlowId) {
            setPendingDeleteDraft(null);
          }
        }}
        actions={[
          {
            key: 'cancel',
            label: '取消',
            onClick: () => setPendingDeleteDraft(null),
            disabled: deletingFlowId !== null,
            variant: 'secondary',
          },
          {
            key: 'confirm',
            label: deletingFlowId ? '删除中...' : '确认删除',
            onClick: () => {
              void confirmDeleteFlow();
            },
            disabled: deletingFlowId !== null,
            icon: deletingFlowId ? 'progress_activity' : 'delete',
            variant: 'danger',
          },
        ]}
      />

      {editingSubsystem && editingDraft ? (
        <div className="fixed inset-0 z-[70] bg-[#edf2f8]">
          <React.Fragment key={editingDraft.designerSessionKey}>
            <FunctionFlowDrawIoDesigner
              flowCode={editingDraft.flowCode}
              flowId={editingDraft.flowId ?? null}
              flowName={editingDraft.flowName}
              initialGeneratedArtifacts={editingDraft.generatedArtifacts}
              initialGraphJson={editingDraft.graphJson}
              initialXml={editingDraft.xml}
              moduleOptions={editingModuleOptions}
              onChange={handleDraftXmlChange}
              onClose={() => setEditingDraft(null)}
              onFlowNameChange={handleDraftFlowNameChange}
              onPersist={handleDesignerPersist}
              onShowToast={onShowToast}
              rowVersion={editingDraft.rowVersion ?? null}
              subsystemId={editingDraft.subsystemId}
              subsystemTitle={normalizeText(editingSubsystem.title) || '未命名子系统'}
            />
          </React.Fragment>
        </div>
      ) : null}

      {!editingSubsystem && editingDraft ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/20">
          <div className="rounded-[20px] border border-white/70 bg-white px-6 py-5 text-center shadow-[0_28px_60px_-36px_rgba(15,23,42,0.35)]">
            <div className="text-[15px] font-semibold text-slate-900">当前子系统已不可用</div>
            <div className="mt-2 text-[12px] leading-6 text-slate-500">
              设计器上下文已丢失，请返回工作台后重新选择子系统。
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingDraft(null);
                onExit();
              }}
              className="mt-5 inline-flex items-center justify-center rounded-[14px] bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-indigo-500"
            >
              返回工作台</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

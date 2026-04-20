import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchFunctionFlowDetail, fetchFunctionFlowModules } from '../../lib/backend-function-flow';
import type { BackendSubsystemNode } from '../../lib/backend-menus';
import {
  createEmptyFunctionFlowGeneratedArtifacts,
  createEmptyFunctionFlowGraphJson,
  type FunctionFlowDetail,
  type FunctionFlowGeneratedArtifacts,
  type FunctionFlowGraphJson,
  type FunctionFlowModuleOption,
} from './function-flow-types';
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
  flowCode: string;
  flowName: string;
  generatedArtifacts: FunctionFlowGeneratedArtifacts;
  graphJson: FunctionFlowGraphJson;
  hydrated: boolean;
  updatedAt: number;
  validationMessages: string[];
  xml: string;
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

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
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
  moduleCatalogByCode?: Record<string, {
    dllFileName?: string;
    menuCaption?: string;
    menuId?: number | null;
    moduleCode: string;
    moduleKind: 'bill' | 'bill_review' | 'module';
  }>,
) {
  if (!subsystem) {
    return [] as FunctionFlowModuleOption[];
  }

  const options: FunctionFlowModuleOption[] = [];

  // 功能流程设计只面向子系统下的二级模块，不把一级目录本身算作可绑定模块。
  for (const firstLevel of getEnabledMenus(subsystem.children)) {
    const firstLevelTitle = normalizeText(firstLevel.title) || '未命名目录';

    for (const secondLevel of getEnabledMenus(firstLevel.children)) {
      const moduleCode = normalizeText(secondLevel.purviewId);
      const secondLevelTitle = normalizeText(secondLevel.title) || '未命名模块';
      if (!moduleCode) {
        continue;
      }

      const catalogItem = moduleCatalogByCode?.[moduleCode];
      options.push({
        code: moduleCode,
        dllFileName: catalogItem?.dllFileName,
        id: normalizeText(secondLevel.menuId ?? secondLevel.id ?? catalogItem?.menuId ?? moduleCode),
        menuId: catalogItem?.menuId ?? secondLevel.menuId ?? null,
        moduleKind: catalogItem?.moduleKind ?? (normalizeText(secondLevel.moduleType) || 'module') as FunctionFlowModuleOption['moduleKind'],
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

function buildSubsystemFlowCode(subsystem: BackendSubsystemNode) {
  return `subsystem:${normalizeText(subsystem.id)}`;
}

function buildFunctionFlowDraft(subsystem: BackendSubsystemNode): FunctionFlowDraft {
  return {
    flowCode: buildSubsystemFlowCode(subsystem),
    flowName: `${normalizeText(subsystem.title) || '未命名子系统'} 流程图`,
    generatedArtifacts: createEmptyFunctionFlowGeneratedArtifacts(),
    graphJson: createEmptyFunctionFlowGraphJson(),
    hydrated: true,
    updatedAt: Date.now(),
    validationMessages: [],
    xml: createBlankDrawIoXml(`${normalizeText(subsystem.title) || '未命名子系统'} 流程图`),
  };
}

function draftFromDetail(subsystem: BackendSubsystemNode, detail: FunctionFlowDetail | null | undefined): FunctionFlowDraft {
  const fallback = buildFunctionFlowDraft(subsystem);
  if (!detail) {
    return fallback;
  }

  return {
    flowCode: detail.flowCode || fallback.flowCode,
    flowName: detail.flowName || fallback.flowName,
    generatedArtifacts: detail.generatedArtifacts
      ? {
          detailSql: detail.generatedArtifacts.detailSql || '',
          gridJson: Array.isArray(detail.generatedArtifacts.gridJson) ? detail.generatedArtifacts.gridJson : [],
          sourceSql: detail.generatedArtifacts.sourceSql || '',
        }
      : fallback.generatedArtifacts,
    graphJson: detail.graphJson ?? fallback.graphJson,
    hydrated: true,
    updatedAt: detail.updatedAt ?? fallback.updatedAt,
    validationMessages: detail.generatedArtifacts?.validationMessages ?? [],
    xml: detail.drawioXml?.trim() ? detail.drawioXml : fallback.xml,
  };
}

function formatDraftTime(timestamp?: number) {
  if (!timestamp) {
    return '尚未开始';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(timestamp);
}

function countSubsystemModules(subsystem?: BackendSubsystemNode | null) {
  return collectSubsystemModuleOptions(subsystem).length;
}

export function FunctionFlowDesignWorkbench({
  currentUserName: _currentUserName,
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
  const [draftsBySubsystem, setDraftsBySubsystem] = useState<Record<string, FunctionFlowDraft>>({});
  const [editingSubsystemId, setEditingSubsystemId] = useState<string | null>(null);
  const [isRefreshingSubsystems, setIsRefreshingSubsystems] = useState(false);
  const [isOpeningDesigner, setIsOpeningDesigner] = useState(false);
  const [loadingDraftIds, setLoadingDraftIds] = useState<Record<string, boolean>>({});
  const [moduleCatalogByCode, setModuleCatalogByCode] = useState<Record<string, {
    dllFileName?: string;
    menuCaption?: string;
    menuId?: number | null;
    moduleCode: string;
    moduleKind: 'bill' | 'bill_review' | 'module';
  }>>({});

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

  useEffect(() => {
    if (editingSubsystemId && !subsystemMenus.some((subsystem) => subsystem.id === editingSubsystemId)) {
      setEditingSubsystemId(null);
    }
  }, [editingSubsystemId, subsystemMenus]);

  useEffect(() => {
    if (subsystemMenus.length === 0) {
      setModuleCatalogByCode({});
      return;
    }

    let cancelled = false;
    void fetchFunctionFlowModules()
      .then((modules) => {
        if (cancelled) {
          return;
        }

        const nextCatalog = modules.reduce<Record<string, {
          dllFileName?: string;
          menuCaption?: string;
          menuId?: number | null;
          moduleCode: string;
          moduleKind: 'bill' | 'bill_review' | 'module';
        }>>((acc, item) => {
          if (!item.moduleCode) {
            return acc;
          }
          acc[item.moduleCode] = item;
          return acc;
        }, {});
        setModuleCatalogByCode(nextCatalog);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '模块目录读取失败，已回退到菜单结构');
        setModuleCatalogByCode({});
      });

    return () => {
      cancelled = true;
    };
  }, [onShowToast, subsystemMenus.length]);

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
  const activeDraft = activeSubsystem ? draftsBySubsystem[activeSubsystem.id] ?? null : null;
  const editingSubsystem = useMemo(
    () => subsystemMenus.find((subsystem) => subsystem.id === editingSubsystemId) ?? null,
    [editingSubsystemId, subsystemMenus],
  );
  const editingDraft = editingSubsystem ? draftsBySubsystem[editingSubsystem.id] ?? null : null;
  const editingModuleOptions = useMemo(
    () => collectSubsystemModuleOptions(editingSubsystem, moduleCatalogByCode),
    [editingSubsystem, moduleCatalogByCode],
  );
  const activeModuleCount = useMemo(
    () => countSubsystemModules(activeSubsystem),
    [activeSubsystem],
  );

  const ensureDraftLoaded = useCallback(async (subsystem?: BackendSubsystemNode | null) => {
    if (!subsystem) {
      return null;
    }

    if (draftsBySubsystem[subsystem.id]?.hydrated) {
      return draftsBySubsystem[subsystem.id];
    }

    if (loadingDraftIds[subsystem.id]) {
      return draftsBySubsystem[subsystem.id] ?? null;
    }

    setLoadingDraftIds((prev) => ({
      ...prev,
      [subsystem.id]: true,
    }));

    try {
      const detail = await fetchFunctionFlowDetail(buildSubsystemFlowCode(subsystem));
      const nextDraft = draftFromDetail(subsystem, detail);
      setDraftsBySubsystem((prev) => ({
        ...prev,
        [subsystem.id]: nextDraft,
      }));
      return nextDraft;
    } catch (error) {
      const fallback = buildFunctionFlowDraft(subsystem);
      setDraftsBySubsystem((prev) => ({
        ...prev,
        [subsystem.id]: fallback,
      }));
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '功能流程图读取失败，已切到空白草稿');
      return fallback;
    } finally {
      setLoadingDraftIds((prev) => ({
        ...prev,
        [subsystem.id]: false,
      }));
    }
  }, [draftsBySubsystem, loadingDraftIds, onShowToast]);

  useEffect(() => {
    if (!activeSubsystem) {
      return;
    }

    void ensureDraftLoaded(activeSubsystem);
  }, [activeSubsystem, ensureDraftLoaded]);

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

  const handleOpenDesigner = useCallback(async (targetSubsystem?: BackendSubsystemNode | null) => {
    const subsystem = targetSubsystem ?? activeSubsystem;
    if (!subsystem) {
      return;
    }

    setActiveSubsystemId(subsystem.id);
    setIsOpeningDesigner(true);
    try {
      await ensureDraftLoaded(subsystem);
      setEditingSubsystemId(subsystem.id);
    } finally {
      setIsOpeningDesigner(false);
    }
  }, [activeSubsystem, ensureDraftLoaded]);

  const handleDraftXmlChange = useCallback((nextXml: string) => {
    if (!editingSubsystem || !nextXml.trim()) {
      return;
    }

    setDraftsBySubsystem((prev) => {
      const currentDraft = prev[editingSubsystem.id] ?? buildFunctionFlowDraft(editingSubsystem);
      return {
        ...prev,
        [editingSubsystem.id]: {
          ...currentDraft,
          hydrated: true,
          updatedAt: Date.now(),
          xml: nextXml,
        },
      };
    });
  }, [editingSubsystem]);

  const handleDesignerPersist = useCallback((detail: FunctionFlowDetail) => {
    if (!editingSubsystem) {
      return;
    }

    setDraftsBySubsystem((prev) => ({
      ...prev,
      [editingSubsystem.id]: draftFromDetail(editingSubsystem, detail),
    }));
  }, [editingSubsystem]);

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
            重新加载子系统
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-[#f8fafc] shadow-sm">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/50">
          <div className="flex h-[72px] items-center justify-between border-b border-slate-200/60 px-6">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <span className="material-symbols-outlined text-[20px]">schema</span>
              </div>
              <span className="font-bold tracking-wide text-[15px]">功能流程设计</span>
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
            <div className="relative group">
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

                  return (
                    <button
                      key={subsystem.id}
                      type="button"
                      onClick={() => setActiveSubsystemId(subsystem.id)}
                      className={`group flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 transition-all ${
                        isActive
                          ? 'bg-white shadow-sm ring-1 ring-slate-200/80 text-indigo-600'
                          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`material-symbols-outlined text-[18px] transition-transform ${
                          isActive ? 'font-medium scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:text-indigo-500'
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
                        {childCount}
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
                    共 {activeModuleCount} 个模块
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {!activeSubsystem ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="material-symbols-outlined mb-3 text-[48px] opacity-30">folder_open</span>
                <p className="text-[14px]">请在左侧选择子系统</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
                {activeDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleOpenDesigner(activeSubsystem);
                    }}
                    className="group relative flex min-h-[224px] max-w-[320px] cursor-pointer flex-col overflow-hidden rounded-[18px] border border-slate-200/70 bg-white text-left shadow-[0_18px_42px_-34px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_24px_50px_-30px_rgba(49,98,255,0.18)]"
                  >
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex size-11 items-center justify-center rounded-[14px] bg-indigo-50 text-indigo-600 transition-all group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                          <span className="material-symbols-outlined text-[22px]">account_tree</span>
                        </div>
                        <div className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-600">
                          草稿
                        </div>
                      </div>

                      <div className="line-clamp-2 min-h-[44px] text-[14px] font-bold leading-[22px] text-slate-800 transition-colors group-hover:text-indigo-600">
                        {normalizeText(activeSubsystem.title) || '当前子系统'} 流程图
                      </div>

                      <div className="mt-3 text-[12px] leading-6 text-slate-500">
                        继续编辑当前子系统的流程图草稿。
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            图
                          </div>
                          <span className="text-[12px] font-medium text-slate-500">上次编辑</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          {formatDraftTime(activeDraft.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    void handleOpenDesigner(activeSubsystem);
                  }}
                  className="group flex min-h-[224px] max-w-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-6 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/60"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                    <span className="material-symbols-outlined text-[26px]">add</span>
                  </div>
                  <div className="mt-4 text-[14px] font-bold text-slate-600 transition-colors group-hover:text-indigo-600">
                    新增功能流程图
                  </div>
                  <p className="mt-1 text-[12px] text-slate-400">
                    新建当前子系统的流程设计
                  </p>
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

      {editingSubsystem && editingDraft ? (
        <div className="fixed inset-0 z-[70] bg-[#edf2f8]">
          <React.Fragment key={editingSubsystem.id}>
            <FunctionFlowDrawIoDesigner
              flowCode={editingDraft.flowCode}
              flowName={editingDraft.flowName}
              initialGeneratedArtifacts={editingDraft.generatedArtifacts}
              initialGraphJson={editingDraft.graphJson}
              initialXml={editingDraft.xml}
              moduleOptions={editingModuleOptions}
              onChange={handleDraftXmlChange}
              onClose={() => setEditingSubsystemId(null)}
              onPersist={handleDesignerPersist}
              onShowToast={onShowToast}
              subsystemTitle={normalizeText(editingSubsystem.title) || '未命名子系统'}
            />
          </React.Fragment>
        </div>
      ) : null}
    </>
  );
}

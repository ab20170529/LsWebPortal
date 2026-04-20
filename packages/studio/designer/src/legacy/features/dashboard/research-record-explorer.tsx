import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSystemDepartments } from '../../lib/backend-departments';
import {
  deleteSurveyMain,
  fetchSurveyDepartmentStats,
  fetchSurveyDetails,
  fetchSurveyMain,
  fetchSurveyMainList,
  saveSurveyDetail,
  saveSurveyMain,
  type SaveSurveyDetailPayload,
  type SaveSurveyMainPayload,
  type SurveyDetailDto,
  type SurveyMainDto,
} from '../../lib/backend-survey';
import { ResearchRecordWorkbench } from './research-record-workbench';

type ResearchRecordExplorerProps = React.ComponentProps<typeof ResearchRecordWorkbench>;

type DepartmentNode = {
  id: number;
  name: string;
  count: number;
  icon: string;
};

const DEPARTMENT_ICON_MAP: Record<string, string> = {
  '质量': 'verified',
  '检验': 'verified',
  '生产': 'precision_manufacturing',
  '制造': 'precision_manufacturing',
  '研发': 'science',
  '技术': 'science',
  '采购': 'shopping_bag',
  '仓储': 'local_shipping',
  '物流': 'local_shipping',
  '销售': 'storefront',
  '市场': 'storefront',
  '财务': 'account_balance',
  '行政': 'groups',
  '人事': 'groups',
  '人力': 'groups',
  '信息': 'dns',
  '安全': 'shield',
  '设备': 'build',
  '工程': 'engineering',
};
const DEFAULT_DEPT_ICON = 'domain';

function resolveDepartmentIcon(name: string): string {
  for (const [keyword, icon] of Object.entries(DEPARTMENT_ICON_MAP)) {
    if (name.includes(keyword)) {
      return icon;
    }
  }
  return DEFAULT_DEPT_ICON;
}

function resolveRecordStatus(main: SurveyMainDto): string {
  const raw = (main.status ?? '').trim();
  if (raw === '已归档') return '已归档';
  return '草稿';
}

function resolveRecordDisplayTitle(main: SurveyMainDto): string {
  const project = (main.project ?? '').trim();
  const version = (main.version ?? '').trim();
  if (project && version) {
    return `${project} ${version}`;
  }
  if (project) {
    return project;
  }
  const title = (main.title ?? '').trim();
  const fileNo = (main.fileNo ?? '').trim();
  return title || fileNo || `调研记录 #${main.id}`;
}

function resolveRecordAuthor(main: SurveyMainDto): string {
  return (main.operatorName ?? main.surveyUsers ?? '').trim() || '未知';
}

function resolveRecordDate(main: SurveyMainDto): string {
  const raw = main.surveyDate ?? main.operateDate ?? '';
  if (!raw) return '';
  return String(raw).slice(0, 10);
}

function buildClonedSurveyMainPayload(main: SurveyMainDto): SaveSurveyMainPayload {
  const payload: SaveSurveyMainPayload = {
    address: main.address ?? '',
    empNames: main.empNames ?? '',
    otherBak: main.otherBak ?? '',
    painsBak: main.painsBak ?? '',
    positionsBak: main.positionsBak ?? '',
    project: main.project ?? '',
    scope: main.scope ?? '',
    specialBak: main.specialBak ?? '',
    surveyDate: main.surveyDate ?? '',
    surveyUsers: main.surveyUsers ?? '',
    title: main.title ?? '',
    toolsBak: main.toolsBak ?? '',
  };

  if (main.departId !== null && main.departId !== undefined && `${main.departId}`.trim()) {
    payload.departId = main.departId;
  }

  return payload;
}

function buildClonedSurveyDetailPayload(detail: SurveyDetailDto): SaveSurveyDetailPayload {
  return {
    moduleId: detail.moduleId ?? '',
    moduleName: detail.moduleName ?? '',
    painsBak: detail.painsBak ?? '',
    position1: detail.position1 ?? '',
    position2: detail.position2 ?? '',
    position3: detail.position3 ?? '',
    suggestionBak: detail.suggestionBak ?? '',
    workingBak: detail.workingBak ?? '',
    workingRate1: detail.workingRate1 ?? '',
    workingRate2: detail.workingRate2 ?? '',
    workingRate3: detail.workingRate3 ?? '',
  };
}

export function ResearchRecordExplorerWorkbench(props: ResearchRecordExplorerProps) {
  const { onShowToast } = props;
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [activeDepartmentId, setActiveDepartmentId] = useState<number | null>(null);
  const [records, setRecords] = useState<SurveyMainDto[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | number | null>(null);
  const [cloningRecordId, setCloningRecordId] = useState<string | number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const activeDepartment = useMemo(
    () => departments.find((d) => d.id === activeDepartmentId) ?? null,
    [departments, activeDepartmentId],
  );

  const filteredDepartments = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(kw));
  }, [departments, searchKeyword]);

  useEffect(() => {
    let disposed = false;

    async function loadDepartments() {
      setIsLoadingDepts(true);
      try {
        const [allDepts, stats] = await Promise.all([
          fetchSystemDepartments(),
          fetchSurveyDepartmentStats(),
        ]);
        if (disposed) return;

        const countMap = new Map<number, number>();
        for (const stat of stats) {
          countMap.set(stat.departId, stat.count);
        }

        const nodes: DepartmentNode[] = allDepts.map((dept) => ({
          id: dept.id,
          name: dept.name,
          count: countMap.get(dept.id) ?? 0,
          icon: resolveDepartmentIcon(dept.name),
        }));

        nodes.sort((a, b) => b.count - a.count);
        setDepartments(nodes);
        if (nodes.length > 0) {
          setActiveDepartmentId((current) => current ?? nodes[0].id);
        }
      } catch {
        if (!disposed) {
          setDepartments([]);
        }
      } finally {
        if (!disposed) setIsLoadingDepts(false);
      }
    }

    void loadDepartments();
    return () => { disposed = true; };
  }, []);

  const loadRecords = useCallback(async (departId: number) => {
    setIsLoadingRecords(true);
    try {
      const mains = await fetchSurveyMainList({ departId });
      setRecords(mains);
    } catch {
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  const refreshDepartmentCounts = useCallback(async () => {
    try {
      const stats = await fetchSurveyDepartmentStats();
      setDepartments((prev) => {
        const countMap = new Map<number, number>();
        for (const stat of stats) {
          countMap.set(stat.departId, stat.count);
        }

        return [...prev]
          .map((department) => ({
            ...department,
            count: countMap.get(department.id) ?? 0,
          }))
          .sort((left, right) => right.count - left.count);
      });
    } catch {
      // Keep the current list visible if count refresh fails.
    }
  }, []);

  useEffect(() => {
    if (activeDepartmentId === null) return;
    void loadRecords(activeDepartmentId);
  }, [activeDepartmentId, loadRecords]);

  const handleRecordSaved = useCallback(() => {
    if (activeDepartmentId !== null) {
      void loadRecords(activeDepartmentId);
    }
    void refreshDepartmentCounts();
  }, [activeDepartmentId, loadRecords, refreshDepartmentCounts]);

  const handleExit = useCallback(() => {
    setEditingRecordId(null);
    handleRecordSaved();
  }, [handleRecordSaved]);

  const handleCloneRecord = useCallback(async (recordId: SurveyMainDto['id']) => {
    if (cloningRecordId !== null) {
      return;
    }

    setCloningRecordId(recordId);
    try {
      const [main, details] = await Promise.all([
        fetchSurveyMain(recordId),
        fetchSurveyDetails(recordId),
      ]);

      const savedMain = await saveSurveyMain(buildClonedSurveyMainPayload(main));

      await Promise.all(
        details.map((detail) => saveSurveyDetail(savedMain.id, buildClonedSurveyDetailPayload(detail))),
      );

      onShowToast?.('已复制为新调研记录');
      void refreshDepartmentCounts();
      setEditingRecordId(savedMain.id);
    } catch (error) {
      onShowToast?.(error instanceof Error ? error.message : '复制新增失败');
    } finally {
      setCloningRecordId(null);
    }
  }, [cloningRecordId, onShowToast, refreshDepartmentCounts]);

  if (editingRecordId !== null) {
    const editingMain = editingRecordId === 'new' ? null : records.find((r) => String(r.id) === String(editingRecordId));
    const isArchived = editingMain ? resolveRecordStatus(editingMain) === '已归档' : false;

    return (
      <div className="flex h-full w-full min-h-0 flex-1 flex-col bg-white dark:bg-slate-950">
        <ResearchRecordWorkbench
          {...props}
          onExit={handleExit}
          explorerDepartmentId={activeDepartmentId}
          explorerDepartmentName={activeDepartment?.name ?? ''}
          explorerMainId={editingRecordId === 'new' ? null : editingRecordId}
          explorerReadOnly={isArchived}
          onRecordSaved={handleRecordSaved}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-1 min-h-0 bg-[#f8fafc] dark:bg-slate-950/50 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
      {/* Sidebar */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-slate-200/60 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/40">
        <div className="flex h-[72px] items-center justify-between border-b border-slate-200/60 px-6 dark:border-slate-800/80">
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <span className="material-symbols-outlined text-[20px]">folder_special</span>
            </div>
            <span className="font-bold tracking-wide text-[15px]">调研档案库</span>
          </div>
        </div>

        <div className="p-4 pb-2">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 transition-colors group-focus-within:text-indigo-500">search</span>
            <input
              type="text"
              placeholder="搜索部门..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="h-10 w-full rounded-[12px] border border-slate-200/80 bg-white pl-10 pr-4 text-[13px] shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {isLoadingDepts ? (
            <div className="flex items-center justify-center py-8 text-[13px] text-slate-400">
              <span className="material-symbols-outlined mr-2 animate-spin text-[18px]">progress_activity</span>
              加载中...
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDepartments.map((dept) => {
                const isActive = activeDepartmentId === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setActiveDepartmentId(dept.id)}
                    className={`group flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 transition-all ${
                      isActive
                        ? 'bg-white shadow-sm ring-1 ring-slate-200/80 text-indigo-600 dark:bg-slate-800 dark:ring-slate-700 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[18px] transition-transform ${
                        isActive ? 'font-medium scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:text-indigo-500'
                      }`}>
                        {dept.icon}
                      </span>
                      <span className={`text-[13px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {dept.name}
                      </span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : 'bg-slate-200/50 text-slate-500 group-hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {dept.count}
                    </span>
                  </button>
                );
              })}
              {filteredDepartments.length === 0 && (
                <div className="py-6 text-center text-[13px] text-slate-400">
                  {searchKeyword ? '未找到匹配部门' : '暂无部门数据'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#fdfdfd] dark:bg-slate-950/80">
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/60 px-8 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <h2 className="text-[18px] font-bold text-slate-800 dark:text-slate-100">
              {activeDepartment?.name ?? '请选择部门'}
            </h2>
            {activeDepartment && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">article</span>
                  共 {records.length} 份调研记录
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoadingRecords ? (
            <div className="flex items-center justify-center py-16 text-[14px] text-slate-400">
              <span className="material-symbols-outlined mr-2 animate-spin text-[20px]">progress_activity</span>
              加载调研记录...
            </div>
          ) : activeDepartmentId === null ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-[48px] mb-3 opacity-30">folder_open</span>
              <p className="text-[14px]">请在左侧选择部门查看调研记录</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
              {records.map((record) => {
                const status = resolveRecordStatus(record);
                const title = resolveRecordDisplayTitle(record);
                const author = resolveRecordAuthor(record);
                const date = resolveRecordDate(record);
                const isCloning = String(cloningRecordId) === String(record.id);

                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setEditingRecordId(record.id)}
                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[16px] border border-slate-200/60 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
                  >
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className={`flex size-12 items-center justify-center rounded-[14px] transition-all group-hover:scale-110 group-hover:shadow-md ${
                          status === '已归档'
                            ? 'bg-slate-100 text-slate-500 group-hover:bg-slate-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400 dark:group-hover:bg-indigo-500 dark:group-hover:text-white'
                        }`}>
                          <span className="material-symbols-outlined text-[24px]">
                            {status === '已归档' ? 'lock' : 'description'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wider ${
                            status === '已归档'
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          }`}>
                            {status}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleCloneRecord(record.id);
                              }}
                              disabled={isCloning || cloningRecordId !== null}
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-sky-100 hover:text-sky-600 ${
                                isCloning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              } ${cloningRecordId !== null && !isCloning ? 'cursor-not-allowed opacity-40' : ''}`}
                              title="复制新增"
                            >
                              <span className={`material-symbols-outlined text-[16px] ${isCloning ? 'animate-spin' : ''}`}>
                                {isCloning ? 'progress_activity' : 'library_add'}
                              </span>
                            </button>
                            {status !== '已归档' && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!window.confirm('确定要删除此调研记录吗？删除后不可恢复。')) return;
                                  try {
                                    await deleteSurveyMain(record.id);
                                    handleRecordSaved();
                                  } catch (error) {
                                    alert(error instanceof Error ? error.message : '删除失败');
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
                                title="删除此调研记录"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="line-clamp-2 min-h-[44px] text-[14px] font-bold leading-[22px] text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                        {title}
                      </div>
                      
                      <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {author.slice(0, 1)}
                          </div>
                          <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{author}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          {date}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Add New Card */}
              <button
                type="button"
                onClick={() => setEditingRecordId('new')}
                className="group flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[16px] border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-6 text-center transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md dark:bg-slate-800 dark:group-hover:bg-indigo-500">
                  <span className="material-symbols-outlined text-[28px]">add</span>
                </div>
                <div className="mt-4 text-[14px] font-bold text-slate-600 transition-colors group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400">
                  新增调研记录
                </div>
                <p className="mt-1 text-[12px] text-slate-400">
                  创建一份新的文档记录
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

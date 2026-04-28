import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

import { getProjectStatusLabel, getProjectStatusTone } from './project-display';
import { useProjectToast } from './project-toast';
import { type SystemUserOption, useSystemUserOptions } from './system-user-directory';
import { SystemUserPicker } from './system-user-picker';

export type ProjectSavePayload = {
  attendanceAddress: string | null;
  attendanceLat: number | null;
  attendanceLng: number | null;
  budgetAmount: number | null;
  businessUnit: string | null;
  managerId: string | null;
  managerName: string | null;
  planEndTime: string | null;
  planStartTime: string | null;
  projectCode: string;
  projectDesc: string | null;
  projectName: string;
  projectTypeId: number | null;
  sourceCode: string | null;
  sourceContent: string | null;
  sourceSystem: string | null;
  status: string | null;
};

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}

type ProjectFormState = {
  attendanceAddress: string;
  attendanceLat: string;
  attendanceLng: string;
  budgetAmount: string;
  businessUnit: string;
  managerId: string;
  managerName: string;
  planEndTime: string;
  planStartTime: string;
  projectCode: string;
  projectDesc: string;
  projectName: string;
  projectTypeId: number | null;
  sourceCode: string;
  sourceContent: string;
  sourceSystem: string;
  status: string;
};

export type ProjectManagementProjectItem = {
  attendanceAddress?: string | null;
  attendanceLat?: number | null;
  attendanceLng?: number | null;
  budgetAmount?: number | null;
  businessUnit?: string | null;
  id: number;
  managerId?: string | null;
  managerName?: string | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  projectCode: string;
  projectDesc?: string | null;
  projectName: string;
  projectTypeId?: number | null;
  sourceCode?: string | null;
  sourceContent?: string | null;
  sourceSystem?: string | null;
  status?: string | null;
};

export type ProjectManagementProjectType = {
  id: number;
  sort?: number | null;
  status?: string | null;
  typeCode: string;
  typeDesc?: string | null;
  typeName: string;
};

export type ProjectManagementProjectDetail = {
  project: ProjectManagementProjectItem;
};

export type ProjectManagementPageProps = {
  canCreateProject: boolean;
  canManageProject: (project: ProjectManagementProjectItem) => boolean;
  detailLoading: boolean;
  keyword: string;
  listError: string | null;
  listLoading: boolean;
  onCreate: (payload: ProjectSavePayload) => Promise<number>;
  onDelete: (projectId: number) => Promise<void>;
  onInitByType: (projectId: number) => Promise<void>;
  onKeywordChange: (value: string) => void;
  onRefresh: () => void;
  onSelectProject: (projectId: number | null) => void;
  onUpdate: (projectId: number, payload: ProjectSavePayload) => Promise<void>;
  projectDetail: ProjectManagementProjectDetail | null;
  projectTypes: ProjectManagementProjectType[];
  projects: ProjectManagementProjectItem[];
  selectedProjectId: number | null;
};

// ─── Statics ───────────────────────────────────────────────────────────────────

type Feedback = { message: string; tone: 'danger' | 'success' } | null;
type DrawerMode = 'create' | 'edit' | null;

const emptyForm: ProjectFormState = {
  attendanceAddress: '',
  attendanceLat: '',
  attendanceLng: '',
  budgetAmount: '',
  businessUnit: '',
  managerId: '',
  managerName: '',
  planEndTime: '',
  planStartTime: '',
  projectCode: '',
  projectDesc: '',
  projectName: '',
  projectTypeId: null,
  sourceCode: '',
  sourceContent: '',
  sourceSystem: '',
  status: 'DRAFT',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toText(value?: string | null) {
  return value ?? '';
}
function toNumber(value: string) {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}
function formatDate(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
function formatRange(start?: string | null, end?: string | null) {
  return !start && !end ? '--' : `${formatDate(start)} - ${formatDate(end)}`;
}
function errorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message : '操作失败，请稍后重试。';
}

function buildForm(project: ProjectManagementProjectItem): ProjectFormState {
  return {
    attendanceAddress: toText(project.attendanceAddress),
    attendanceLat: project.attendanceLat == null ? '' : String(project.attendanceLat),
    attendanceLng: project.attendanceLng == null ? '' : String(project.attendanceLng),
    budgetAmount: project.budgetAmount == null ? '' : String(project.budgetAmount),
    businessUnit: toText(project.businessUnit),
    managerId: toText(project.managerId),
    managerName: toText(project.managerName),
    planEndTime: toDateInput(project.planEndTime),
    planStartTime: toDateInput(project.planStartTime),
    projectCode: toText(project.projectCode),
    projectDesc: toText(project.projectDesc),
    projectName: toText(project.projectName),
    projectTypeId: project.projectTypeId ?? null,
    sourceCode: toText(project.sourceCode),
    sourceContent: toText(project.sourceContent),
    sourceSystem: toText(project.sourceSystem),
    status: toText(project.status) || 'DRAFT',
  };
}

function buildPayload(form: ProjectFormState): ProjectSavePayload {
  return {
    attendanceAddress: form.attendanceAddress.trim() || null,
    attendanceLat: toNumber(form.attendanceLat),
    attendanceLng: toNumber(form.attendanceLng),
    budgetAmount: toNumber(form.budgetAmount),
    businessUnit: form.businessUnit.trim() || null,
    managerId: form.managerId.trim() || null,
    managerName: form.managerName.trim() || null,
    planStartTime: form.planStartTime.trim() ? `${form.planStartTime}T00:00:00` : null,
    planEndTime: form.planEndTime.trim() ? `${form.planEndTime}T23:59:00` : null,
    projectCode: form.projectCode.trim(),
    projectDesc: form.projectDesc.trim() || null,
    projectName: form.projectName.trim(),
    projectTypeId: form.projectTypeId,
    sourceCode: form.sourceCode.trim() || null,
    sourceContent: form.sourceContent.trim() || null,
    sourceSystem: form.sourceSystem.trim() || null,
    status: form.status.trim() || 'DRAFT',
  };
}

function managerOptions(options: SystemUserOption[], managerId: string, managerName: string) {
  if (!managerId || !managerName || options.some((option) => option.userId === managerId))
    return options;
  return [
    {
      departmentId: '',
      employeeId: Number.isFinite(Number(managerId)) ? Number(managerId) : null,
      loginAccount: '',
      py: '',
      searchText: `${managerName} ${managerId}`.toLowerCase(),
      userId: managerId,
      userName: managerName,
    },
    ...options,
  ];
}

function formatBudget(value?: number | null) {
  if (value == null) return '--';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatCurrency(value?: number | null) {
  if (value == null) return '--';
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number; color?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[10px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)]">
      {icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${color?.replace('text-', 'bg-') ?? 'bg-slate-100'}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className={`mt-1 text-[22px] font-bold leading-none ${color ?? 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
  );
}

function DrawerCloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path d="M6 6 14 14M14 6 6 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <span className="shrink-0 text-sm font-medium text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Drawer({
  children,
  mode,
  onClose,
  title,
}: {
  children: ReactNode;
  mode: DrawerMode;
  onClose: () => void;
  title: string;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] animate-slideInRight overflow-hidden bg-white shadow-[-20px_0_60px_-20px_rgba(15,23,42,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
          <div>
            <div className="text-xs font-semibold text-slate-400">
              {mode === 'create' ? '新增项目' : '编辑项目'}
            </div>
            <div className="mt-1 text-[18px] font-bold text-slate-900">{title}</div>
          </div>
          <button
            className="portal-project-shell__icon-button"
            onClick={onClose}
            type="button"
          >
            <DrawerCloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="h-[calc(100%-76px)] overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProjectManagementPage({
  canCreateProject,
  canManageProject,
  detailLoading,
  keyword,
  listError,
  listLoading,
  onCreate,
  onDelete,
  onInitByType,
  onKeywordChange,
  onRefresh,
  onSelectProject,
  onUpdate,
  projectDetail,
  projectTypes,
  projects,
  selectedProjectId,
}: ProjectManagementPageProps) {
  const { error: userError, loading: userLoading, options: users } = useSystemUserOptions();
  const { pushToast } = useProjectToast();
  const [draft, setDraft] = useState<ProjectFormState>(emptyForm);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const typeNameById = useMemo(() => new Map(projectTypes.map((type) => [type.id, type.typeName])), [projectTypes]);
  const availableUsers = useMemo(() => managerOptions(users, draft.managerId, draft.managerName), [draft.managerId, draft.managerName, users]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'RUNNING' || p.status === 'READY' || p.status === 'IN_PROGRESS').length;
    const draft = projects.filter((p) => p.status === 'DRAFT' || p.status === 'WAITING').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED').length;
    return { total, active, draft, completed };
  }, [projects]);

  const drawerTitle = useMemo(() => {
    if (drawerMode === 'create') return '新建项目';
    if (editingProjectId) {
      const project = projects.find((p) => p.id === editingProjectId);
      return project?.projectName ?? '修改项目';
    }
    return '修改项目';
  }, [drawerMode, editingProjectId, projects]);

  // 当 projectDetail 加载完成或 editingProjectId 变化时，更新表单数据
  useEffect(() => {
    if (drawerMode !== 'edit') return;
    
    // 如果 projectDetail 已加载且是当前编辑的项目，使用详情数据
    if (projectDetail?.project && editingProjectId === projectDetail.project.id) {
      setDraft(buildForm(projectDetail.project));
      return;
    }
    
    // 如果 projectDetail 还没加载完成但列表中有该项目数据，使用列表数据作为初始值
    if (editingProjectId !== null) {
      const listProject = projects.find((p) => p.id === editingProjectId);
      if (listProject) {
        setDraft(buildForm(listProject));
      }
    }
  }, [drawerMode, editingProjectId, projectDetail, projects]);

  useEffect(() => {
    if (!feedback) return;
    pushToast({ message: feedback.message, tone: feedback.tone });
    setFeedback(null);
  }, [feedback, pushToast]);

  function update<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    if (!canCreateProject) {
      setFeedback({ message: '当前账号没有新建项目权限。', tone: 'danger' });
      return;
    }
    setDrawerMode('create');
    setEditingProjectId(null);
    setFeedback(null);
    setDraft({ ...emptyForm, projectTypeId: projectTypes[0]?.id ?? null });
  }

  function openEdit(project: ProjectManagementProjectItem) {
    if (!canManageProject(project)) {
      setFeedback({ message: '当前账号没有维护该项目的权限。', tone: 'danger' });
      return;
    }
    setDrawerMode('edit');
    setEditingProjectId(project.id);
    setFeedback(null);
    // 先用列表数据作为初始值，useEffect 会在 projectDetail 加载完成后更新
    setDraft(buildForm(project));
    // 触发加载完整详情
    onSelectProject(project.id);
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingProjectId(null);
  }

  async function submit() {
    if (drawerMode === 'create' && !canCreateProject) {
      setFeedback({ message: '当前账号没有新建项目权限。', tone: 'danger' });
      return;
    }

    if (drawerMode === 'edit' && editingProjectId !== null) {
      const editingProject = projects.find((project) => project.id === editingProjectId);
      if (!editingProject || !canManageProject(editingProject)) {
        setFeedback({ message: '当前账号没有维护该项目的权限。', tone: 'danger' });
        return;
      }
    }

    if (!draft.projectName.trim() || !draft.projectCode.trim())
      return setFeedback({ message: '请填写项目名称和项目编码。', tone: 'danger' });
    if (!draft.projectTypeId)
      return setFeedback({ message: '请选择项目类型。', tone: 'danger' });
    if (draft.budgetAmount.trim() && toNumber(draft.budgetAmount) === null)
      return setFeedback({ message: '预算金额必须是数字。', tone: 'danger' });
    if (draft.attendanceLng.trim() && toNumber(draft.attendanceLng) === null)
      return setFeedback({ message: '经度必须是数字。', tone: 'danger' });
    if (draft.attendanceLat.trim() && toNumber(draft.attendanceLat) === null)
      return setFeedback({ message: '纬度必须是数字。', tone: 'danger' });

    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = buildPayload(draft);
      if (drawerMode === 'create') {
        const id = await onCreate(payload);
        onSelectProject(id);
        setFeedback({ message: '项目已新增。', tone: 'success' });
      }
      if (drawerMode === 'edit' && editingProjectId !== null) {
        await onUpdate(editingProjectId, payload);
        onSelectProject(editingProjectId);
        setFeedback({ message: '项目已更新。', tone: 'success' });
      }
      closeDrawer();
    } catch (error) {
      setFeedback({ message: errorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(projectId: number) {
    const target = projects.find((project) => project.id === projectId);
    if (!target || !canManageProject(target)) {
      setFeedback({ message: '当前账号没有删除该项目的权限。', tone: 'danger' });
      return;
    }
    if (!window.confirm(`确认删除项目"${target?.projectName ?? projectId}"吗？`)) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await onDelete(projectId);
      if (selectedProjectId === projectId) onSelectProject(null);
      if (editingProjectId === projectId) closeDrawer();
      setFeedback({ message: '项目已删除。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: errorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  const currentEditingProject =
    drawerMode === 'edit' && editingProjectId !== null
      ? projects.find((project) => project.id === editingProjectId) ?? {
          id: editingProjectId,
          managerId: draft.managerId || null,
          projectCode: draft.projectCode,
          projectName: draft.projectName,
        }
      : null;

  const canSubmitCurrentDrawer =
    drawerMode === 'create'
      ? canCreateProject
      : currentEditingProject
        ? canManageProject(currentEditingProject)
        : false;
  const selectedProject = useMemo(() => {
    if (selectedProjectId == null) {
      return null;
    }

    if (projectDetail?.project && projectDetail.project.id === selectedProjectId) {
      return projectDetail.project;
    }

    return projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [projectDetail, projects, selectedProjectId]);
  const selectedProjectTypeName = selectedProject?.projectTypeId
    ? typeNameById.get(selectedProject.projectTypeId) ?? '--'
    : '--';
  const canManageSelectedProject = selectedProject ? canManageProject(selectedProject) : false;
  const hasKeyword = keyword.trim().length > 0;
  const isInitializationReady = Boolean(selectedProject?.projectTypeId);

  async function initializeProject(project: ProjectManagementProjectItem) {
    if (!canManageProject(project)) {
      setFeedback({ message: '当前账号没有初始化该项目的权限。', tone: 'danger' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await onInitByType(project.id);
      onSelectProject(project.id);
      setFeedback({ message: '项目已按类型初始化。', tone: 'success' });
    } catch (error) {
      setFeedback({ message: errorMessage(error), tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-slate-400">项目控制</div>
          <h1 className="mt-2 text-[22px] font-bold text-slate-900">项目台账</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            创建、查看并初始化项目，在进入排期与执行工作前先确认项目状态和下一步动作。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="portal-project-shell__search">
            <svg
              className="portal-project-shell__search-icon"
              fill="none"
              viewBox="0 0 20 20"
            >
              <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12.5 12.5 16.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
            </svg>
            <input
              className="portal-project-shell__search-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => onKeywordChange(event.target.value)}
              placeholder="搜索项目名称、编码或负责人"
              value={keyword}
            />
          </label>
          <button
            className="portal-project-shell__secondary-button"
            onClick={onRefresh}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
              <path d="M3.5 10a6.5 6.5 0 1 1 .9 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              <path d="M3 7.5V10h2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
            刷新
          </button>
          <button
            className="portal-project-shell__primary-button"
            disabled={!canCreateProject}
            onClick={openCreate}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
            新增项目
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="项目总数" value={stats.total} color="text-slate-800" />
        <StatCard label="进行中" value={stats.active} color="text-sky-600" />
        <StatCard label="已完成" value={stats.completed} color="text-emerald-600" />
        <StatCard label="草稿 / 待处理" value={stats.draft} color="text-amber-600" />
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.92fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_16px_40px_-34px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-100 px-5 py-4 lg:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold text-slate-400">项目列表</div>
                <div className="mt-1 text-lg font-bold text-slate-900">项目列表</div>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
                共 {projects.length} 个项目
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {listLoading ? (
              <div className="flex h-full min-h-[320px] items-center justify-center px-5 py-8 text-sm text-slate-500">
                正在加载项目台账...
              </div>
            ) : listError ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-5 py-8 text-center">
                <div className="text-base font-semibold text-rose-700">项目台账加载失败</div>
                <div className="max-w-sm text-sm leading-6 text-rose-500">{listError}</div>
                <button
                  className="mt-2 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  onClick={onRefresh}
                  type="button"
                >
                  重试
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-5 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-slate-100">
                  <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24">
                    <path d="M3 7.5C3 6.12 4.12 5 5.5 5h13C19.88 5 21 6.12 21 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-13A2.48 2.48 0 0 1 3 16.5v-9Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 9h8M8 13h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="text-base font-semibold text-slate-700">
                  {hasKeyword ? '没有找到匹配的项目' : '还没有项目台账记录'}
                </div>
                <div className="max-w-sm text-sm leading-6 text-slate-500">
                  {hasKeyword
                    ? '试试调整关键词，或清空搜索后重新查看全部项目。'
                    : '先创建第一个项目，再继续排期、执行和交付管理。'}
                </div>
                {!hasKeyword && canCreateProject ? (
                  <button
                    className="portal-project-shell__primary-button mt-2"
                    onClick={openCreate}
                    type="button"
                  >
                    新增项目
                  </button>
                ) : null}
              </div>
            ) : (
              <table className="w-full min-w-[1260px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[260px]" />
                  <col className="w-[140px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                  <col className="w-[110px]" />
                  <col className="w-[220px]" />
                  <col className="w-[110px]" />
                  <col className="w-[150px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-slate-200">
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">项目名称</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">项目编码</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">类型</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">负责人</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">状态</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">计划周期</th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">预算</th>
                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project) => {
                    const isSelected = project.id === selectedProjectId;
                    const tone = getProjectStatusTone(project.status);
                    const canManageCurrentProject = canManageProject(project);

                    return (
                      <tr
                        key={project.id}
                        className={cx(
                          'group cursor-pointer border-l-4 transition-colors',
                          isSelected
                            ? 'border-l-sky-500 bg-sky-50/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
                            : 'border-l-transparent hover:bg-slate-50/80',
                        )}
                        onClick={() => onSelectProject(project.id)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-slate-900">{project.projectName}</span>
                            <span className="mt-1 line-clamp-1 text-xs text-slate-400">
                              {project.projectDesc || '暂无项目说明'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-slate-600">{project.projectCode}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600">
                            {project.projectTypeId ? typeNameById.get(project.projectTypeId) ?? '--' : '--'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {project.managerName ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                                {project.managerName.slice(0, 1)}
                              </div>
                              <span className="text-sm text-slate-600">{project.managerName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">--</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge tone={tone}>{getProjectStatusLabel(project.status)}</Badge>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-500">{formatRange(project.planStartTime, project.planEndTime)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">
                            {project.budgetAmount != null ? formatCurrency(project.budgetAmount) : '--'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div
                            className={cx(
                              'flex items-center justify-end gap-1 transition-opacity',
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                            )}
                          >
                            <button
                              title="编辑"
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              disabled={!canManageCurrentProject}
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                openEdit(project);
                              }}
                              type="button"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
                                <path d="M11.5 2.5a1.414 1.414 0 1 1 2 2L5 13l-3 .75.75-3L11.5 2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                              </svg>
                            </button>
                            <button
                              title="按类型初始化"
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              disabled={submitting || !canManageCurrentProject}
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                void initializeProject(project);
                              }}
                              type="button"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
                                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                              </svg>
                            </button>
                            <button
                              title="删除"
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              disabled={submitting || !canManageCurrentProject}
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                void remove(project.id);
                              }}
                              type="button"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
                                <path d="M3 4h10M6 4V3h4v1M5 4v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_16px_40px_-34px_rgba(15,23,42,0.22)]">
          {!selectedProject ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-5 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-sky-50 text-sky-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24">
                  <path d="M5 7.75A2.75 2.75 0 0 1 7.75 5h8.5A2.75 2.75 0 0 1 19 7.75v8.5A2.75 2.75 0 0 1 16.25 19h-8.5A2.75 2.75 0 0 1 5 16.25v-8.5Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 12h6M12 9v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="text-base font-semibold text-slate-700">先选择一个项目</div>
              <div className="max-w-sm text-sm leading-6 text-slate-500">
                从左侧列表选择项目后，这里会显示项目关键状态、初始化说明和下一步建议动作。
              </div>
            </div>
          ) : (
            <>
                <div className="border-b border-slate-100 px-5 py-5 lg:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-400">当前项目</div>
                    <h2 className="mt-2 truncate text-[18px] font-bold text-slate-900">
                      {selectedProject.projectName}
                    </h2>
                    <div className="mt-2 text-sm text-slate-500">项目编码：{selectedProject.projectCode}</div>
                  </div>
                  <Badge tone={getProjectStatusTone(selectedProject.status)}>
                    {getProjectStatusLabel(selectedProject.status)}
                  </Badge>
                </div>

                {detailLoading ? (
                  <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 20 20">
                      <circle className="opacity-25" cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                    </svg>
                    正在加载更完整的项目详情，当前先展示列表中的基础信息。
                  </div>
                ) : null}

                {!canManageSelectedProject ? (
                  <div className="mt-4 rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    你可以查看该项目，但当前没有维护和初始化权限。
                  </div>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-5 py-5 lg:px-5">
                <div
                  className={cx(
                    'rounded-[10px] border p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.16)]',
                    isInitializationReady
                      ? 'border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.88),rgba(255,255,255,0.96))]'
                      : 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.96))]',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-bold text-slate-800">初始化准备</div>
                        <span
                          className={cx(
                            'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                            isInitializationReady
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700',
                          )}
                        >
                          {isInitializationReady ? '可初始化' : '待补类型'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedProject.projectTypeId
                          ? `当前项目类型为“${selectedProjectTypeName}”，可以按类型初始化节点与任务模板。`
                          : '当前项目还没有项目类型，初始化前需要先补全项目类型。'}
                      </div>
                    </div>
                    {canManageSelectedProject ? (
                      <button
                        className="portal-project-shell__primary-button shrink-0"
                        disabled={submitting || !selectedProject.projectTypeId}
                        onClick={() => {
                          void initializeProject(selectedProject);
                        }}
                        type="button"
                      >
                        按类型初始化
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 rounded-[10px] border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">
                    项目概览
                  </div>
                  <div className="px-4 py-2">
                    <InfoRow label="项目类型" value={selectedProjectTypeName} />
                    <InfoRow label="项目经理" value={selectedProject.managerName || '--'} />
                    <InfoRow label="计划周期" value={formatRange(selectedProject.planStartTime, selectedProject.planEndTime)} />
                    <InfoRow label="预算金额" value={selectedProject.budgetAmount != null ? `¥ ${formatCurrency(selectedProject.budgetAmount)}` : '--'} />
                    <InfoRow label="业务单元" value={selectedProject.businessUnit || '--'} />
                    <InfoRow label="来源系统" value={selectedProject.sourceSystem || '--'} />
                    <InfoRow label="来源单号" value={selectedProject.sourceCode || '--'} />
                    <InfoRow label="考勤地址" value={selectedProject.attendanceAddress || '--'} />
                    <InfoRow label="项目简介" value={selectedProject.projectDesc || '--'} />
                  </div>
                </div>

                <div className="mt-5 rounded-[10px] border border-slate-100 bg-slate-50/70 p-4">
                  <div className="text-sm font-bold text-slate-800">下一步建议</div>
                  <div className="mt-2 text-sm leading-6 text-slate-500">
                    先确认项目信息和初始化状态，再进入排期协同或成员执行工作区，避免在错误项目上继续推进。
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {canManageSelectedProject ? (
                      <button
                        className="portal-project-shell__secondary-button"
                        onClick={() => {
                          openEdit(selectedProject);
                        }}
                        type="button"
                      >
                        编辑项目
                      </button>
                    ) : null}
                    {canManageSelectedProject ? (
                      <button
                        className="portal-project-shell__secondary-button hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        disabled={submitting}
                        onClick={() => {
                          void remove(selectedProject.id);
                        }}
                        type="button"
                      >
                        删除项目
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Right-side Drawer */}
      {drawerMode ? (
        <Drawer mode={drawerMode} onClose={closeDrawer} title={drawerTitle}>
          {detailLoading && drawerMode === 'edit' ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 20 20">
                <circle className="opacity-25" cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="3"/>
              </svg>
              正在加载项目详情，已先展示当前可编辑信息。
            </div>
          ) : null}

          {/* Basic Info */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--portal-color-brand-500)]" />
              <span className="text-sm font-bold text-slate-700">基本信息</span>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="项目名称" required>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('projectName', event.target.value)}
                    placeholder="输入项目名称"
                    value={draft.projectName}
                  />
                </Field>
                <Field label="项目编码" required>
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('projectCode', event.target.value)}
                    placeholder="输入项目编码"
                    value={draft.projectCode}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="项目类型" required>
                  <select
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => update('projectTypeId', event.target.value ? Number(event.target.value) : null)}
                    value={draft.projectTypeId ?? ''}
                  >
                    <option value="">请选择</option>
                    {projectTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.typeName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="项目状态">
                  <select
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => update('status', event.target.value)}
                    value={draft.status}
                  >
                    <option value="DRAFT">草稿</option>
                    <option value="READY">已就绪</option>
                    <option value="WAITING">待处理</option>
                    <option value="RUNNING">进行中</option>
                    <option value="COMPLETED">已完成</option>
                  </select>
                </Field>
              </div>

              <Field label="项目经理">
                <SystemUserPicker
                  disabled={userLoading}
                  onChange={(nextValue, nextOption) => {
                    update('managerId', nextValue);
                    update('managerName', nextOption?.userName ?? '');
                  }}
                  options={availableUsers}
                  placeholder={userLoading ? '加载中...' : '请选择项目经理'}
                  value={draft.managerId}
                />
                {userError ? <div className="mt-1 text-xs text-rose-500">{userError}</div> : null}
              </Field>
            </div>
          </div>

          {/* Source Info */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="text-sm font-bold text-slate-700">来源信息</span>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="来源系统">
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('sourceSystem', event.target.value)}
                    placeholder="例如 ERP"
                    value={draft.sourceSystem}
                  />
                </Field>
                <Field label="来源单号">
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('sourceCode', event.target.value)}
                    placeholder="关联单据编号"
                    value={draft.sourceCode}
                  />
                </Field>
              </div>
              <Field label="来源说明">
                <textarea
                  className="field-textarea"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => update('sourceContent', event.target.value)}
                  placeholder="补充来源背景说明"
                  rows={3}
                  value={draft.sourceContent}
                />
              </Field>
            </div>
          </div>

          {/* Time & Budget */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold text-slate-700">时间与预算</span>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="计划开始">
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('planStartTime', event.target.value)}
                    type="date"
                    value={draft.planStartTime}
                  />
                </Field>
                <Field label="计划结束">
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('planEndTime', event.target.value)}
                    type="date"
                    value={draft.planEndTime}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="预算金额">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                    <input
                      className="field-input pl-7"
                      inputMode="decimal"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => update('budgetAmount', event.target.value)}
                      placeholder="0.00"
                      value={draft.budgetAmount}
                    />
                  </div>
                </Field>
                <Field label="业务单元">
                  <input
                    className="field-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('businessUnit', event.target.value)}
                    placeholder="所属部门或单元"
                    value={draft.businessUnit}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-sm font-bold text-slate-700">考勤设置</span>
            </div>
            <div className="space-y-4">
              <Field label="考勤地址">
                <input
                  className="field-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => update('attendanceAddress', event.target.value)}
                  placeholder="项目考勤地点"
                  value={draft.attendanceAddress}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="经度">
                  <input
                    className="field-input"
                    inputMode="decimal"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('attendanceLng', event.target.value)}
                    placeholder="121.4737"
                    value={draft.attendanceLng}
                  />
                </Field>
                <Field label="纬度">
                  <input
                    className="field-input"
                    inputMode="decimal"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => update('attendanceLat', event.target.value)}
                    placeholder="31.2304"
                    value={draft.attendanceLat}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <Field label="项目简介">
              <textarea
                className="field-textarea"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => update('projectDesc', event.target.value)}
                placeholder="简述项目目标、范围和背景"
                rows={4}
                value={draft.projectDesc}
              />
            </Field>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white pt-5">
            <div className="text-xs text-slate-400">
              <span className="text-rose-500">*</span> 为必填项
            </div>
            <div className="flex items-center gap-2">
              {drawerMode === 'edit' && editingProjectId !== null && (
                <button
                  className="portal-project-shell__secondary-button"
                  disabled={submitting || !canSubmitCurrentDrawer}
                  onClick={() => { void onInitByType(editingProjectId).catch((error) => setFeedback({ message: errorMessage(error), tone: 'danger' })); }}
                  type="button"
                >
                  按类型初始化
                </button>
              )}
              <button
                className="portal-project-shell__secondary-button"
                onClick={closeDrawer}
                type="button"
              >
                取消
              </button>
              <button
                className="portal-project-shell__primary-button"
                disabled={submitting || !canSubmitCurrentDrawer}
                onClick={() => { void submit(); }}
                type="button"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 20 20">
                      <circle className="opacity-25" cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="3"/>
                    </svg>
                    保存中...
                  </>
                ) : (
                  drawerMode === 'create' ? '确认新增' : '保存修改'
                )}
              </button>
            </div>
          </div>
        </Drawer>
      ) : null}

      <style>{`
        .field-input {
          display: flex;
          height: 40px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--project-control-border);
          background: var(--portal-color-surface-panel);
          padding: 0 14px;
          font-size: 13px;
          color: var(--project-text-strong);
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: var(--portal-color-brand-500);
          background: var(--portal-color-surface-panel);
          box-shadow: 0 0 0 3px var(--project-control-focus-ring);
        }
        .field-input::placeholder {
          color: var(--project-text-muted);
        }
        .field-textarea {
          display: flex;
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--project-control-border);
          background: var(--portal-color-surface-panel);
          padding: 12px 14px;
          font-size: 13px;
          color: var(--project-text-strong);
          outline: none;
          resize: vertical;
          min-height: 88px;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .field-textarea:focus {
          border-color: var(--portal-color-brand-500);
          background: var(--portal-color-surface-panel);
          box-shadow: 0 0 0 3px var(--project-control-focus-ring);
        }
        .field-textarea::placeholder {
          color: var(--project-text-muted);
        }
      `}</style>
    </div>
  );
}

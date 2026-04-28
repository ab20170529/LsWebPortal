import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Badge, Button, Card } from '@lserp/ui';

import { navigate } from '../router';
import {
  portalSystemApi,
  type PortalSystem,
  type PortalSystemSaveRequest,
} from '../features/portal-system/portal-system-api';

// ─────────────────────── 工具函数 ───────────────────────

function toneLabel(tone: string | null) {
  const map: Record<string, string> = {
    brand: '品牌蓝',
    success: '成功绿',
    neutral: '中性灰',
    warning: '警告橙',
    danger: '危险红',
  };
  return tone ? (map[tone] ?? tone) : '中性灰';
}

function resolveBadgeTone(tone: string | null): 'brand' | 'danger' | 'neutral' | 'success' {
  switch (tone) {
    case 'brand':
    case 'danger':
    case 'neutral':
    case 'success':
      return tone;
    case 'warning':
    default:
      return 'neutral';
  }
}

function toneOptions() {
  return [
    { value: 'brand', label: '品牌蓝 (brand)' },
    { value: 'success', label: '成功绿 (success)' },
    { value: 'neutral', label: '中性灰 (neutral)' },
    { value: 'warning', label: '警告橙 (warning)' },
    { value: 'danger', label: '危险红 (danger)' },
  ];
}

function formatDateTime(val: string | null) {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return val;
  }
}

// ─────────────────────── 弹窗表单 ───────────────────────

type FormErrors = Partial<Record<keyof PortalSystemSaveRequest, string>>;

interface SystemFormModalProps {
  initialData: Partial<PortalSystem> | null;
  onClose: () => void;
  onSaved: (system: PortalSystem) => void;
}

function SystemFormModal({ initialData, onClose, onSaved }: SystemFormModalProps) {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState<PortalSystemSaveRequest>({
    systemId: initialData?.systemId ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    shortLabel: initialData?.shortLabel ?? '',
    route: initialData?.route ?? '',
    tone: initialData?.tone ?? 'neutral',
    enabled: initialData?.enabled ?? 1,
    sortOrder: initialData?.sortOrder ?? 0,
    remark: initialData?.remark ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const update = (field: keyof PortalSystemSaveRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.systemId.trim()) errs.systemId = '系统标识不能为空';
    else if (form.systemId.length > 64) errs.systemId = '不超过64个字符';
    if (!form.title.trim()) errs.title = '系统名称不能为空';
    else if (form.title.length > 128) errs.title = '不超过128个字符';
    if (!form.route.trim()) errs.route = '系统地址不能为空';
    else if (form.route.length > 512) errs.route = '不超过512个字符';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const result = isEdit
        ? await portalSystemApi.update(initialData!.id!, form)
        : await portalSystemApi.create(form);
      onSaved(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败，请重试';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-8 shadow-2xl">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div className="text-xl font-black tracking-tight text-slate-900">
            {isEdit ? '编辑系统' : '新建系统'}
          </div>
          <button
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {errorMsg}
          </div>
        )}

        {/* 表单 */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* 系统标识 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              系统标识 <span className="text-red-500">*</span>
            </label>
            <input
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-300 ${errors.systemId ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-sky-400'}`}
              disabled={isEdit}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { update('systemId', e.target.value); }}
              placeholder="如 designer / erp / project"
              value={form.systemId}
            />
            {errors.systemId && <p className="text-xs text-red-500">{errors.systemId}</p>}
            {isEdit && <p className="text-xs text-slate-400">系统标识创建后不可修改</p>}
          </div>

          {/* 系统名称 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              系统名称 <span className="text-red-500">*</span>
            </label>
            <input
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-300 ${errors.title ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-sky-400'}`}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { update('title', e.target.value); }}
              placeholder="如 设计平台"
              value={form.title}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* 短标签 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              短标签
            </label>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { update('shortLabel', e.target.value); }}
              placeholder="如 Studio / PM"
              value={form.shortLabel ?? ''}
            />
          </div>

          {/* 主题色调 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              主题色调
            </label>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => { update('tone', e.target.value); }}
              value={form.tone ?? 'neutral'}
            >
              {toneOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 系统地址 */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              系统地址 <span className="text-red-500">*</span>
            </label>
            <input
              className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-sky-300 ${errors.route ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-sky-400'}`}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { update('route', e.target.value); }}
              placeholder="内部路由如 /project，或外部链接如 https://example.com"
              value={form.route}
            />
            {errors.route && <p className="text-xs text-red-500">{errors.route}</p>}
          </div>

          {/* 系统简介 */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              系统简介
            </label>
            <textarea
              className="min-h-[80px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { update('description', e.target.value); }}
              placeholder="简短描述该系统的用途"
              value={form.description ?? ''}
            />
          </div>

          {/* 排序号 & 状态 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              排序号
            </label>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
              min={0}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { update('sortOrder', Number(e.target.value) || 0); }}
              type="number"
              value={form.sortOrder ?? 0}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              状态
            </label>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => { update('enabled', Number(e.target.value)); }}
              value={form.enabled}
            >
              <option value={1}>启用</option>
              <option value={0}>禁用</option>
            </select>
          </div>

          {/* 备注 */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              备注
            </label>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-300"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { update('remark', e.target.value); }}
              placeholder="可选备注信息"
              value={form.remark ?? ''}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex justify-end gap-3">
          <Button onClick={onClose} tone="ghost">
            取消
          </Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? '保存中...' : isEdit ? '保存修改' : '创建系统'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── 删除确认弹窗 ───────────────────────

interface DeleteConfirmModalProps {
  system: PortalSystem;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

function DeleteConfirmModal({ system, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg(null);
    try {
      await portalSystemApi.remove(system.id);
      onDeleted(system.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除失败，请重试';
      setErrorMsg(msg);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="text-xl font-black tracking-tight text-slate-900">确认删除</div>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          确定要删除系统 <strong>"{system.title}"</strong>（标识：{system.systemId}）吗？
          <br />
          <span className="text-red-500">此操作不可撤销，删除后选系统页面将不再显示该系统。</span>
        </p>
        {errorMsg && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {errorMsg}
          </div>
        )}
        <div className="mt-8 flex justify-end gap-3">
          <Button onClick={onClose} tone="ghost">
            取消
          </Button>
          <button
            className="rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            disabled={deleting}
            onClick={handleDelete}
            type="button"
          >
            {deleting ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── 主页面 ───────────────────────

export function PortalSystemManagerPage() {
  const [systems, setSystems] = useState<PortalSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 弹窗状态
  const [formModal, setFormModal] = useState<{ open: boolean; data: Partial<PortalSystem> | null }>({
    open: false,
    data: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; system: PortalSystem | null }>({
    open: false,
    system: null,
  });

  const loadSystems = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await portalSystemApi.listAll();
      setSystems(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载失败';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSystems();
  }, [loadSystems]);

  const openCreate = () => { setFormModal({ open: true, data: null }); };
  const openEdit = (s: PortalSystem) => { setFormModal({ open: true, data: s }); };
  const openDelete = (s: PortalSystem) => { setDeleteModal({ open: true, system: s }); };
  const enabledCount = systems.filter((system) => system.enabled === 1).length;
  const disabledCount = systems.filter((system) => system.enabled !== 1).length;
  const internalRouteCount = systems.filter((system) => system.route?.startsWith('/')).length;

  const handleSaved = (saved: PortalSystem) => {
    setSystems((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setFormModal({ open: false, data: null });
  };

  const handleDeleted = (id: number) => {
    setSystems((prev) => prev.filter((s) => s.id !== id));
    setDeleteModal({ open: false, system: null });
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              门户配置
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">系统管理</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              这里处理的是真实配置动作：新增系统、编辑系统入口、启用或停用系统，以及维护选系统页的展示顺序。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              onClick={() => { navigate('/systems'); }}
              type="button"
            >
              返回系统选择
            </button>
            <button
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              onClick={loadSystems}
              type="button"
            >
              刷新列表
            </button>
            <Button onClick={openCreate}>新建系统</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] border border-slate-200/80 p-5 shadow-[0_18px_44px_-38px_rgba(15,23,42,0.2)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">系统总数</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{systems.length}</div>
            <div className="mt-1 text-sm text-slate-500">当前系统配置条目</div>
          </Card>
          <Card className="rounded-[24px] border border-slate-200/80 p-5 shadow-[0_18px_44px_-38px_rgba(15,23,42,0.2)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">启用状态</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-black tracking-tight text-emerald-600">{enabledCount}</div>
              <div className="pb-1 text-sm text-slate-400">启用</div>
              <div className="text-2xl font-black tracking-tight text-slate-300">/</div>
              <div className="text-3xl font-black tracking-tight text-slate-500">{disabledCount}</div>
              <div className="pb-1 text-sm text-slate-400">禁用</div>
            </div>
            <div className="mt-1 text-sm text-slate-500">决定选系统页实际可见内容</div>
          </Card>
          <Card className="rounded-[24px] border border-slate-200/80 p-5 shadow-[0_18px_44px_-38px_rgba(15,23,42,0.2)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">入口类型</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-black tracking-tight text-sky-600">{internalRouteCount}</div>
              <div className="pb-1 text-sm text-slate-400">内部路由</div>
            </div>
            <div className="mt-1 text-sm text-slate-500">其余将作为外部系统链接处理</div>
          </Card>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="rounded-[20px] bg-red-50 px-6 py-4 text-sm font-medium text-red-600">
            {errorMsg}
            <button
              className="ml-4 underline hover:no-underline"
              onClick={loadSystems}
              type="button"
            >
              重试
            </button>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="rounded-[28px] bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
            加载中...
          </div>
        )}

        {/* 系统列表 */}
        {!loading && !errorMsg && (
          <Card className="overflow-hidden rounded-[28px] p-0">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    系统列表
                  </div>
                  <div className="mt-1 text-lg font-black tracking-tight text-slate-900">
                    当前系统入口配置
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
                  按排序号和创建顺序展示
                </div>
              </div>
            </div>
            {systems.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-base font-semibold text-slate-700">还没有系统配置</div>
                <div className="mt-2 text-sm text-slate-400">先新增一个系统入口，再回到系统选择页查看效果。</div>
                <div className="mt-4">
                  <Button onClick={openCreate}>新建系统</Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        标识 / 名称
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        地址
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        色调
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        排序
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        状态
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        更新时间
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {systems
                      .slice()
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
                      .map((system) => (
                        <tr
                          key={system.id}
                          className="border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                        >
                          {/* 标识 / 名称 */}
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900">{system.title}</div>
                            <div className="mt-0.5 font-mono text-xs text-slate-400">
                              {system.systemId}
                            </div>
                            {system.shortLabel && (
                              <div className="mt-1">
                                <Badge tone={resolveBadgeTone(system.tone)}>
                                  {system.shortLabel}
                                </Badge>
                              </div>
                            )}
                          </td>

                          {/* 地址 */}
                          <td className="max-w-[200px] px-6 py-4">
                            <div className="truncate font-mono text-xs text-slate-600">
                              {system.route}
                            </div>
                            {system.description && (
                              <div className="mt-1 line-clamp-2 text-xs text-slate-400">
                                {system.description}
                              </div>
                            )}
                          </td>

                          {/* 色调 */}
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {toneLabel(system.tone)}
                          </td>

                          {/* 排序 */}
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {system.sortOrder ?? 0}
                          </td>

                          {/* 状态 */}
                          <td className="px-6 py-4">
                            {system.enabled === 1 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                启用
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                禁用
                              </span>
                            )}
                          </td>

                          {/* 更新时间 */}
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {formatDateTime(system.updateTime ?? system.createTime)}
                          </td>

                          {/* 操作 */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                className="rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 transition-colors hover:bg-sky-100"
                                onClick={() => { openEdit(system); }}
                                type="button"
                              >
                                编辑
                              </button>
                              <button
                                className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-100"
                                onClick={() => { openDelete(system); }}
                                type="button"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-[24px] border border-slate-200/80 p-5 lg:col-span-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">配置规则</div>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-500 md:grid-cols-3">
              <div>
                <strong className="text-slate-700">系统标识</strong> 是唯一键，比如 `designer / erp / project`，创建后不可修改。
              </div>
              <div>
                <strong className="text-slate-700">系统地址</strong> 支持内部路由和外部链接，决定点击系统卡片后的跳转目标。
              </div>
              <div>
                <strong className="text-slate-700">启用状态</strong> 决定系统是否出现在系统选择页，改完刷新页面即可验证。
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 新建/编辑弹窗 */}
      {formModal.open && (
        <SystemFormModal
          initialData={formModal.data}
          onClose={() => { setFormModal({ open: false, data: null }); }}
          onSaved={handleSaved}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteModal.open && deleteModal.system && (
        <DeleteConfirmModal
          system={deleteModal.system}
          onClose={() => { setDeleteModal({ open: false, system: null }); }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from '@lserp/ui';

import { navigate } from '../router';
import {
  platformTenantApi,
  type PlatformTenant,
  type PlatformTenantCreateRequest,
  type PlatformTenantDefaultDb,
  type PlatformTenantUpdateRequest,
  type SaveTenantDefaultDbRequest,
} from '../features/platform-tenant/platform-tenant-api';

const TENANT_TYPE_OPTIONS = [
  { label: '客户租户', value: 'CUSTOMER' },
  { label: '平台租户', value: 'PLATFORM' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
];

type SubmitEventLike = {
  preventDefault: () => void;
};

type ValueEventLike = {
  target: {
    value: string;
  };
};

function text(value: string | null | undefined, fallback = '-') {
  return value?.trim() || fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  try {
    return new Date(value).toLocaleString('zh-CN', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function normalizeEnableFlag(value: number | null | undefined) {
  return value === 0 ? 0 : 1;
}

function isTenantActive(tenant: PlatformTenant) {
  return tenant.status !== 'DISABLED' && normalizeEnableFlag(tenant.enableFlag) === 1;
}

function defaultDbStatus(defaultDb: PlatformTenantDefaultDb | null | undefined) {
  if (!defaultDb) {
    return { label: '未配置', tone: 'neutral' as const };
  }

  if (normalizeEnableFlag(defaultDb.enableFlag) !== 1) {
    return { label: '已停用', tone: 'neutral' as const };
  }

  if (defaultDb.serverip && defaultDb.basename) {
    return { label: '已配置', tone: 'success' as const };
  }

  return { label: '待补全', tone: 'danger' as const };
}

function toDefaultDbForm(defaultDb?: PlatformTenantDefaultDb | null): SaveTenantDefaultDbRequest {
  return {
    title: defaultDb?.title ?? '',
    serverip: defaultDb?.serverip ?? '',
    serverport: defaultDb?.serverport ?? 1433,
    basename: defaultDb?.basename ?? '',
    dbType: defaultDb?.dbType ?? 'SQLSERVER',
    enableFlag: normalizeEnableFlag(defaultDb?.enableFlag),
    sortOrder: defaultDb?.sortOrder ?? 0,
    remark: defaultDb?.remark ?? '',
  };
}

function buildTenantForm(initialData: PlatformTenant | null): PlatformTenantCreateRequest {
  return {
    tenantCode: initialData?.tenantCode ?? '',
    tenantName: initialData?.tenantName ?? '',
    tenantType: initialData?.tenantType ?? 'CUSTOMER',
    status: initialData?.status ?? 'ACTIVE',
    ownerLoginAccount: initialData?.ownerLoginAccount ?? '',
    ownerEmployeeName: initialData?.ownerEmployeeName ?? '',
    contactName: initialData?.contactName ?? '',
    contactPhone: initialData?.contactPhone ?? '',
    remark: initialData?.remark ?? '',
    defaultDb: initialData ? undefined : toDefaultDbForm(null),
  };
}

type TenantFormErrors = Partial<Record<keyof PlatformTenantCreateRequest | 'defaultDb', string>>;

interface TenantFormModalProps {
  initialData: PlatformTenant | null;
  onClose: () => void;
  onSaved: (tenant: PlatformTenant) => void;
}

function TenantFormModal({ initialData, onClose, onSaved }: TenantFormModalProps) {
  const isEdit = Boolean(initialData);
  const [form, setForm] = useState<PlatformTenantCreateRequest>(() => buildTenantForm(initialData));
  const [errors, setErrors] = useState<TenantFormErrors>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (
    field: keyof PlatformTenantCreateRequest,
    value: string | SaveTenantDefaultDbRequest | undefined,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateDefaultDb = (field: keyof SaveTenantDefaultDbRequest, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      defaultDb: {
        ...prev.defaultDb,
        [field]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, defaultDb: undefined }));
  };

  const validate = () => {
    const nextErrors: TenantFormErrors = {};
    if (!isEdit && !form.tenantCode.trim()) {
      nextErrors.tenantCode = '租户编号不能为空';
    }
    if (!form.tenantName.trim()) {
      nextErrors.tenantName = '租户名称不能为空';
    }

    const defaultDb = form.defaultDb;
    const hasDefaultDbInput = Boolean(
      defaultDb?.title?.trim()
      || defaultDb?.serverip?.trim()
      || defaultDb?.basename?.trim(),
    );
    if (!isEdit && hasDefaultDbInput) {
      if (!defaultDb?.serverip?.trim() || !defaultDb?.basename?.trim()) {
        nextErrors.defaultDb = '填写默认库时，服务器地址和数据库名都不能为空';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const result = isEdit
        ? await platformTenantApi.updateTenant(initialData!.tenantCode, {
          tenantName: form.tenantName,
          tenantType: form.tenantType,
          status: form.status,
          ownerLoginAccount: form.ownerLoginAccount,
          ownerEmployeeName: form.ownerEmployeeName,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          enableFlag: form.status === 'DISABLED' ? 0 : 1,
          remark: form.remark,
        } satisfies PlatformTenantUpdateRequest)
        : await platformTenantApi.createTenant({
          ...form,
          defaultDb: form.defaultDb?.serverip || form.defaultDb?.basename || form.defaultDb?.title
            ? form.defaultDb
            : undefined,
        });
      onSaved(result);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '保存租户失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[24px] bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-black tracking-tight text-slate-950">
              {isEdit ? '编辑租户' : '新建租户'}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isEdit ? '租户编号创建后不可修改。' : '可在创建租户时一并配置租户默认库连接。'}
            </p>
          </div>
          <button
            className="rounded-full px-3 py-2 text-lg font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {errorMsg ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">租户编号</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              disabled={isEdit}
              onChange={(event: ValueEventLike) => { update('tenantCode', event.target.value); }}
              placeholder="如 LSERP-CUSTOMER-001"
              value={form.tenantCode}
            />
            {errors.tenantCode ? <span className="text-xs text-red-500">{errors.tenantCode}</span> : null}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">租户名称</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('tenantName', event.target.value); }}
              placeholder="客户或平台名称"
              value={form.tenantName}
            />
            {errors.tenantName ? <span className="text-xs text-red-500">{errors.tenantName}</span> : null}
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">租户类型</span>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('tenantType', event.target.value); }}
              value={form.tenantType}
            >
              {TENANT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">状态</span>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('status', event.target.value); }}
              value={form.status}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">负责人账号</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('ownerLoginAccount', event.target.value); }}
              placeholder="登录账号"
              value={form.ownerLoginAccount}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">负责人姓名</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('ownerEmployeeName', event.target.value); }}
              placeholder="姓名"
              value={form.ownerEmployeeName}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">联系人</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('contactName', event.target.value); }}
              placeholder="联系人姓名"
              value={form.contactName}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">联系电话</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('contactPhone', event.target.value); }}
              placeholder="手机号或座机"
              value={form.contactPhone}
            />
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold text-slate-500">备注</span>
            <textarea
              className="min-h-[76px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('remark', event.target.value); }}
              placeholder="可选备注"
              value={form.remark}
            />
          </label>
        </div>

        {!isEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-black text-slate-900">默认库连接</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500">默认库名称</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-400"
                  onChange={(event: ValueEventLike) => { updateDefaultDb('title', event.target.value); }}
                  placeholder="如 集团默认库"
                  value={form.defaultDb?.title ?? ''}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500">服务器地址</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-400"
                  onChange={(event: ValueEventLike) => { updateDefaultDb('serverip', event.target.value); }}
                  placeholder="IP 或域名"
                  value={form.defaultDb?.serverip ?? ''}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500">端口</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-400"
                  onChange={(event: ValueEventLike) => { updateDefaultDb('serverport', Number(event.target.value) || 1433); }}
                  type="number"
                  value={form.defaultDb?.serverport ?? 1433}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500">数据库名</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-400"
                  onChange={(event: ValueEventLike) => { updateDefaultDb('basename', event.target.value); }}
                  placeholder="basename"
                  value={form.defaultDb?.basename ?? ''}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500">数据库类型</span>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-400"
                  onChange={(event: ValueEventLike) => { updateDefaultDb('dbType', event.target.value); }}
                  value={form.defaultDb?.dbType ?? 'SQLSERVER'}
                />
              </label>
            </div>
            {errors.defaultDb ? <div className="mt-3 text-xs text-red-500">{errors.defaultDb}</div> : null}
          </div>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <Button onClick={onClose} tone="ghost">取消</Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? '保存中...' : isEdit ? '保存修改' : '创建租户'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DefaultDbModalProps {
  tenant: PlatformTenant;
  onClose: () => void;
  onSaved: (tenant: PlatformTenant) => void;
}

function DefaultDbModal({ tenant, onClose, onSaved }: DefaultDbModalProps) {
  const [form, setForm] = useState<SaveTenantDefaultDbRequest>(() => toDefaultDbForm(tenant.defaultDb));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'danger' | 'success' } | null>(null);

  const update = (field: keyof SaveTenantDefaultDbRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.serverip?.trim() || !form.basename?.trim()) {
      setMessage({ text: '服务器地址和数据库名不能为空', tone: 'danger' });
      return false;
    }
    return true;
  };

  const handleTest = async () => {
    if (!validate()) {
      return;
    }

    setTesting(true);
    setMessage(null);
    try {
      const result = await platformTenantApi.testDefaultDb(tenant.tenantCode, form);
      setMessage({ text: result.message, tone: result.success ? 'success' : 'danger' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : '连接测试失败', tone: 'danger' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await platformTenantApi.saveDefaultDb(tenant.tenantCode, form);
      const refreshed = await platformTenantApi.getTenant(tenant.tenantCode);
      onSaved(refreshed);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : '保存默认库失败', tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl rounded-[24px] bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-black tracking-tight text-slate-950">默认库配置</div>
            <p className="mt-2 text-sm text-slate-500">{tenant.tenantName} / {tenant.tenantCode}</p>
          </div>
          <button
            className="rounded-full px-3 py-2 text-lg font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {message ? (
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
            message.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">默认库名称</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('title', event.target.value); }}
              value={form.title ?? ''}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">服务器地址</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('serverip', event.target.value); }}
              value={form.serverip ?? ''}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">端口</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('serverport', Number(event.target.value) || 1433); }}
              type="number"
              value={form.serverport ?? 1433}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">数据库名</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('basename', event.target.value); }}
              value={form.basename ?? ''}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">数据库类型</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('dbType', event.target.value); }}
              value={form.dbType ?? 'SQLSERVER'}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">启用状态</span>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('enableFlag', Number(event.target.value)); }}
              value={form.enableFlag ?? 1}
            >
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">排序</span>
            <input
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('sortOrder', Number(event.target.value) || 0); }}
              type="number"
              value={form.sortOrder ?? 0}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold text-slate-500">备注</span>
            <textarea
              className="min-h-[76px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400"
              onChange={(event: ValueEventLike) => { update('remark', event.target.value); }}
              value={form.remark ?? ''}
            />
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button onClick={onClose} tone="ghost">取消</Button>
          <Button disabled={testing || saving} onClick={handleTest} tone="ghost">
            {testing ? '测试中...' : '测试连接'}
          </Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PortalSystemManagerPage() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tenantModal, setTenantModal] = useState<{ data: PlatformTenant | null; open: boolean }>({
    data: null,
    open: false,
  });
  const [defaultDbModal, setDefaultDbModal] = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await platformTenantApi.listTenants(query);
      setTenants(data);
      setSelectedTenant((current) => {
        if (!data.length) {
          return null;
        }
        if (!current) {
          return data[0]!;
        }
        return data.find((tenant) => tenant.tenantCode === current.tenantCode) ?? data[0]!;
      });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '加载租户列表失败');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const activeCount = useMemo(() => tenants.filter(isTenantActive).length, [tenants]);
  const configuredDefaultDbCount = useMemo(
    () => tenants.filter((tenant) => defaultDbStatus(tenant.defaultDb).label === '已配置').length,
    [tenants],
  );

  const handleSearch = (event: SubmitEventLike) => {
    event.preventDefault();
    setQuery(keyword.trim());
  };

  const handleSaved = (tenant: PlatformTenant) => {
    setTenantModal({ data: null, open: false });
    setDefaultDbModal(false);
    setTenants((prev) => {
      const index = prev.findIndex((item) => item.tenantCode === tenant.tenantCode);
      if (index < 0) {
        return [tenant, ...prev];
      }

      const next = [...prev];
      next[index] = tenant;
      return next;
    });
    setSelectedTenant(tenant);
  };

  const handleDisable = async (tenant: PlatformTenant) => {
    const confirmed = window.confirm(`确定停用租户「${tenant.tenantName}」吗？停用后该租户不能再作为有效租户登录。`);
    if (!confirmed) {
      return;
    }

    try {
      await platformTenantApi.disableTenant(tenant.tenantCode);
      await loadTenants();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '停用租户失败');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="rounded-[28px] p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Badge>平台总管理系统</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">租户管理</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                维护平台库中的租户主档和租户默认库连接。业务库/账套仍在租户默认库内部读取，不在这里管理。
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                onClick={() => { navigate('/systems'); }}
                type="button"
              >
                ← 返回系统选择
              </button>
              <Button onClick={() => { setTenantModal({ data: null, open: true }); }}>+ 新建租户</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] p-5">
            <div className="text-xs font-bold text-slate-400">租户总数</div>
            <div className="mt-2 text-3xl font-black text-slate-950">{tenants.length}</div>
          </Card>
          <Card className="rounded-[24px] p-5">
            <div className="text-xs font-bold text-slate-400">启用租户</div>
            <div className="mt-2 text-3xl font-black text-emerald-600">{activeCount}</div>
          </Card>
          <Card className="rounded-[24px] p-5">
            <div className="text-xs font-bold text-slate-400">默认库已配置</div>
            <div className="mt-2 text-3xl font-black text-sky-600">{configuredDefaultDbCount}</div>
          </Card>
        </div>

        {errorMsg ? (
          <div className="rounded-[20px] bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {errorMsg}
            <button className="ml-4 underline" onClick={loadTenants} type="button">重试</button>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <Card className="overflow-hidden rounded-[28px] p-0">
            <div className="border-b border-slate-100 p-5">
              <form className="flex flex-wrap items-center gap-3" onSubmit={handleSearch}>
                <input
                  className="h-11 min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
                  onChange={(event: ValueEventLike) => { setKeyword(event.target.value); }}
                  placeholder="搜索租户编号、名称、负责人或联系人"
                  value={keyword}
                />
                <Button type="submit">搜索</Button>
                {query ? (
                  <Button
                    onClick={() => {
                      setKeyword('');
                      setQuery('');
                    }}
                    tone="ghost"
                    type="button"
                  >
                    清空
                  </Button>
                ) : null}
              </form>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">正在加载租户...</div>
            ) : tenants.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">暂无租户数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">租户</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">状态</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">负责人</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">联系人</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">默认库</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">更新时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => {
                      const selected = selectedTenant?.tenantCode === tenant.tenantCode;
                      const dbStatus = defaultDbStatus(tenant.defaultDb);
                      return (
                        <tr
                          key={tenant.tenantCode}
                          className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${
                            selected ? 'bg-sky-50/70' : ''
                          }`}
                          onClick={() => { setSelectedTenant(tenant); }}
                        >
                          <td className="px-5 py-4">
                            <div className="font-black text-slate-900">{tenant.tenantName}</div>
                            <div className="mt-0.5 font-mono text-xs text-slate-400">{tenant.tenantCode}</div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={isTenantActive(tenant) ? 'success' : 'neutral'}>
                              {isTenantActive(tenant) ? '启用' : '停用'}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600">
                            <div>{text(tenant.ownerEmployeeName)}</div>
                            <div className="mt-1 font-mono text-slate-400">{text(tenant.ownerLoginAccount)}</div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600">
                            <div>{text(tenant.contactName)}</div>
                            <div className="mt-1 text-slate-400">{text(tenant.contactPhone)}</div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={dbStatus.tone}>{dbStatus.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-400">
                            {formatDateTime(tenant.updatedAt ?? tenant.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="rounded-[28px] p-6">
            {selectedTenant ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone={isTenantActive(selectedTenant) ? 'success' : 'neutral'}>
                      {isTenantActive(selectedTenant) ? '启用' : '停用'}
                    </Badge>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                      {selectedTenant.tenantName}
                    </h2>
                    <div className="mt-1 font-mono text-xs text-slate-400">{selectedTenant.tenantCode}</div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-400">租户基础信息</div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-slate-400">类型</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.tenantType)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">状态</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.status)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">负责人</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.ownerEmployeeName)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">负责人账号</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.ownerLoginAccount)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">联系人</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.contactName)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">联系电话</dt>
                        <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.contactPhone)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 text-xs leading-6 text-slate-500">{text(selectedTenant.remark, '暂无备注')}</div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold text-slate-400">默认库连接</div>
                      <Badge tone={defaultDbStatus(selectedTenant.defaultDb).tone}>
                        {defaultDbStatus(selectedTenant.defaultDb).label}
                      </Badge>
                    </div>
                    {selectedTenant.defaultDb ? (
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-slate-400">名称</dt>
                          <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.defaultDb.title)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">数据库类型</dt>
                          <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.defaultDb.dbType)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">服务器</dt>
                          <dd className="mt-1 font-semibold text-slate-700">{text(selectedTenant.defaultDb.serverip)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">端口</dt>
                          <dd className="mt-1 font-semibold text-slate-700">{selectedTenant.defaultDb.serverport ?? '-'}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-slate-400">数据库名</dt>
                          <dd className="mt-1 font-mono font-semibold text-slate-700">{text(selectedTenant.defaultDb.basename)}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-slate-400">更新时间</dt>
                          <dd className="mt-1 font-semibold text-slate-700">{formatDateTime(selectedTenant.defaultDb.updatedAt)}</dd>
                        </div>
                      </dl>
                    ) : (
                      <div className="mt-3 text-xs leading-6 text-slate-500">尚未配置默认库连接。</div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button onClick={() => { setTenantModal({ data: selectedTenant, open: true }); }}>
                    编辑租户
                  </Button>
                  <Button onClick={() => { setDefaultDbModal(true); }} tone="ghost">
                    配置默认库
                  </Button>
                  <button
                    className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    disabled={!isTenantActive(selectedTenant)}
                    onClick={() => { void handleDisable(selectedTenant); }}
                    type="button"
                  >
                    停用租户
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-400">请选择一个租户查看详情</div>
            )}
          </Card>
        </div>
      </div>

      {tenantModal.open ? (
        <TenantFormModal
          initialData={tenantModal.data}
          onClose={() => { setTenantModal({ data: null, open: false }); }}
          onSaved={handleSaved}
        />
      ) : null}

      {defaultDbModal && selectedTenant ? (
        <DefaultDbModal
          tenant={selectedTenant}
          onClose={() => { setDefaultDbModal(false); }}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}

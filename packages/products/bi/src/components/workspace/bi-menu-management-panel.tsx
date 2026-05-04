import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Button, cx } from '@lserp/ui';

import { biApi, type MenuSavePayload } from '../../api/bi-api';
import type { BiMenu, BiScreen } from '../../types';

type BiMenuManagementPanelProps = {
  archives: BiScreen[];
  isMutating?: boolean;
};

type MenuFormState = {
  archiveId: string;
  linkUrl: string;
  menuCode: string;
  menuName: string;
  openMode: string;
  orderNo: string;
  parentId: string;
  status: string;
  targetType: 'ARCHIVE' | 'URL';
};

function emptyMenuForm(): MenuFormState {
  return {
    archiveId: '',
    linkUrl: '',
    menuCode: '',
    menuName: '',
    openMode: 'iframe',
    orderNo: '0',
    parentId: '',
    status: 'ACTIVE',
    targetType: 'ARCHIVE',
  };
}

function flattenMenus(menus: BiMenu[]): BiMenu[] {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children ?? [])]);
}

function mapMenuForm(menu: BiMenu | null): MenuFormState {
  if (!menu) {
    return emptyMenuForm();
  }
  return {
    archiveId: menu.archiveId ? String(menu.archiveId) : '',
    linkUrl: menu.linkUrl ?? '',
    menuCode: menu.menuCode,
    menuName: menu.menuName,
    openMode: menu.openMode ?? 'iframe',
    orderNo: String(menu.orderNo ?? 0),
    parentId: menu.parentId ? String(menu.parentId) : '',
    status: menu.status ?? 'ACTIVE',
    targetType: menu.targetType === 'URL' ? 'URL' : 'ARCHIVE',
  };
}

function buildMenuPayload(form: MenuFormState): MenuSavePayload {
  return {
    archiveId: form.targetType === 'ARCHIVE' && form.archiveId ? Number(form.archiveId) : null,
    linkUrl: form.targetType === 'URL' ? form.linkUrl.trim() : undefined,
    menuCode: form.menuCode.trim(),
    menuName: form.menuName.trim(),
    openMode: form.openMode,
    orderNo: Number(form.orderNo || 0),
    parentId: form.parentId ? Number(form.parentId) : null,
    status: form.status,
    targetType: form.targetType,
  };
}

function buildArchiveRuntimePath(screenCode?: string | null) {
  return screenCode ? `/bi/screen/${encodeURIComponent(screenCode)}` : null;
}

export function BiMenuManagementPanel({ archives, isMutating = false }: BiMenuManagementPanelProps) {
  const [menus, setMenus] = useState<BiMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuFormState>(emptyMenuForm());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const flatMenus = useMemo(() => flattenMenus(menus), [menus]);
  const selectedMenu = useMemo(
    () => flatMenus.find((menu) => menu.id === selectedMenuId) ?? null,
    [flatMenus, selectedMenuId],
  );
  const previewTargetUrl = useMemo(() => {
    if (form.targetType === 'URL') {
      return form.linkUrl.trim() || null;
    }

    const archive = archives.find((item) => String(item.id) === form.archiveId);
    const fallbackArchiveCode =
      selectedMenu?.archiveId && String(selectedMenu.archiveId) === form.archiveId ? selectedMenu.archiveCode : null;
    return buildArchiveRuntimePath(archive?.screenCode ?? fallbackArchiveCode);
  }, [archives, form.archiveId, form.linkUrl, form.targetType, selectedMenu?.archiveCode, selectedMenu?.archiveId]);

  useEffect(() => {
    let cancelled = false;
    async function loadMenus() {
      setLoading(true);
      setError(null);
      try {
        const nextMenus = await biApi.listMenus();
        if (!cancelled) {
          setMenus(nextMenus);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '菜单加载失败。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadMenus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setForm(mapMenuForm(selectedMenu));
  }, [selectedMenu]);

  async function refreshMenus(nextSelectedMenuId?: number | null) {
    const nextMenus = await biApi.listMenus();
    setMenus(nextMenus);
    setSelectedMenuId(nextSelectedMenuId ?? selectedMenuId);
  }

  async function handleSaveMenu() {
    setSaving(true);
    setError(null);
    try {
      const payload = buildMenuPayload(form);
      const saved = selectedMenu
        ? await biApi.updateMenu(selectedMenu.id, payload)
        : await biApi.createMenu(payload);
      await refreshMenus(saved.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '菜单保存失败。');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMenu() {
    if (!selectedMenu) {
      return;
    }
    const confirmed = window.confirm(`确定删除菜单“${selectedMenu.menuName}”？`);
    if (!confirmed) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await biApi.deleteMenu(selectedMenu.id);
      await refreshMenus(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '菜单删除失败。');
    } finally {
      setSaving(false);
    }
  }

  function handlePreviewTarget() {
    if (!previewTargetUrl) {
      return;
    }
    if (form.targetType === 'URL' && form.openMode === 'self') {
      window.location.assign(previewTargetUrl);
      return;
    }
    window.open(previewTargetUrl, '_blank', 'noopener,noreferrer');
  }

  const canSave =
    form.menuCode.trim().length > 0 &&
    form.menuName.trim().length > 0 &&
    (form.targetType === 'ARCHIVE' ? form.archiveId : form.linkUrl.trim().length > 0);

  return (
    <section className="bi-management-panel">
      <div className="bi-management-header">
        <div>
          <div className="bi-management-title">菜单管理</div>
          <div className="bi-management-subtitle">
            独立维护 BI 内部菜单树，菜单可以绑定 BI 档案，也可以配置 BI 连接地址。
          </div>
        </div>
        <Button
          disabled={isMutating || saving}
          onClick={() => {
            setSelectedMenuId(null);
            setForm(emptyMenuForm());
          }}
          tone="ghost"
          type="button"
        >
          新建菜单
        </Button>
      </div>

      {error ? <div className="bi-workspace-error">{error}</div> : null}

      <div className="bi-management-layout bi-management-layout-wide">
        <section className="bi-panel-card bi-management-column">
          <div className="bi-panel-card-header">
            <div>
              <div className="bi-panel-card-title">菜单树</div>
              <div className="bi-panel-card-subtitle">{loading ? '正在加载菜单...' : `共 ${flatMenus.length} 个菜单`}</div>
            </div>
          </div>
          <div className="bi-stack-list">
            {flatMenus.map((menu) => (
              <button
                key={menu.id}
                className={cx('bi-side-card', menu.id === selectedMenuId ? 'is-selected' : '')}
                onClick={() => setSelectedMenuId(menu.id)}
                type="button"
              >
                <div className="bi-side-card-header">
                  <div>
                    <div className="bi-side-card-title">{menu.menuName}</div>
                    <div className="bi-side-card-subtitle">{menu.menuCode}</div>
                  </div>
                  <Badge tone={menu.targetType === 'URL' ? 'neutral' : 'brand'}>
                    {menu.targetType === 'URL' ? '连接地址' : 'BI档案'}
                  </Badge>
                </div>
                <div className="bi-side-card-meta">
                  {menu.targetType === 'URL' ? menu.linkUrl : menu.archiveName ?? menu.archiveCode ?? '未绑定档案'}
                </div>
              </button>
            ))}
            {!loading && flatMenus.length === 0 ? <div className="bi-panel-empty">还没有 BI 菜单。</div> : null}
          </div>
        </section>

        <section className="bi-panel-scroll">
          <div className="bi-panel-card">
            <div className="bi-panel-card-header">
              <div>
                <div className="bi-panel-card-title">{selectedMenu ? '编辑菜单' : '新建菜单'}</div>
                <div className="bi-panel-card-subtitle">保存时会校验 ARCHIVE 只能绑定档案，URL 必须填写连接地址。</div>
              </div>
            </div>

            <div className="bi-panel-form">
              <div className="bi-form-grid bi-form-grid-2">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">菜单名称</span>
                  <input
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((current) => ({ ...current, menuName: event.target.value }))
                    }
                    value={form.menuName}
                  />
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">菜单编码</span>
                  <input
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((current) => ({ ...current, menuCode: event.target.value }))
                    }
                    value={form.menuCode}
                  />
                </label>
              </div>

              <div className="bi-form-grid bi-form-grid-2">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">上级菜单</span>
                  <select
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setForm((current) => ({ ...current, parentId: event.target.value }))
                    }
                    value={form.parentId}
                  >
                    <option value="">顶级菜单</option>
                    {flatMenus
                      .filter((menu) => menu.id !== selectedMenuId)
                      .map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.menuName}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">目标类型</span>
                  <select
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setForm((current) => ({
                        ...current,
                        targetType: event.target.value === 'URL' ? 'URL' : 'ARCHIVE',
                      }))
                    }
                    value={form.targetType}
                  >
                    <option value="ARCHIVE">绑定 BI 档案</option>
                    <option value="URL">BI 连接地址</option>
                  </select>
                </label>
              </div>

              {form.targetType === 'ARCHIVE' ? (
                <label className="bi-panel-field">
                  <span className="bi-panel-label">绑定档案</span>
                  <select
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setForm((current) => ({ ...current, archiveId: event.target.value }))
                    }
                    value={form.archiveId}
                  >
                    <option value="">请选择 BI 档案</option>
                    {archives.map((archive) => (
                      <option key={archive.id} value={archive.id}>
                        {archive.name} / {archive.screenCode}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="bi-panel-field">
                  <span className="bi-panel-label">连接地址</span>
                  <input
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((current) => ({ ...current, linkUrl: event.target.value }))
                    }
                    placeholder="https://example.com/dashboard"
                    value={form.linkUrl}
                  />
                </label>
              )}

              <div className="bi-form-grid bi-form-grid-3">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">打开方式</span>
                  <select
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setForm((current) => ({ ...current, openMode: event.target.value }))
                    }
                    value={form.openMode}
                  >
                    <option value="iframe">页面内嵌</option>
                    <option value="blank">新标签打开</option>
                    <option value="self">当前页打开</option>
                  </select>
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">排序</span>
                  <input
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((current) => ({ ...current, orderNo: event.target.value }))
                    }
                    type="number"
                    value={form.orderNo}
                  />
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">状态</span>
                  <select
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setForm((current) => ({ ...current, status: event.target.value }))
                    }
                    value={form.status}
                  >
                    <option value="ACTIVE">启用</option>
                    <option value="DISABLED">停用</option>
                  </select>
                </label>
              </div>

              <div className="bi-panel-inline-actions">
                <Button disabled={!canSave || saving || isMutating} onClick={() => void handleSaveMenu()} type="button">
                  保存菜单
                </Button>
                <Button
                  disabled={!selectedMenu || saving || isMutating}
                  onClick={() => void handleDeleteMenu()}
                  tone="ghost"
                  type="button"
                >
                  删除菜单
                </Button>
                <Button
                  disabled={!previewTargetUrl}
                  onClick={handlePreviewTarget}
                  tone="ghost"
                  type="button"
                >
                  {form.targetType === 'URL' ? '打开地址' : '预览档案'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

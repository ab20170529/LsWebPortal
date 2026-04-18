import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

import {
  createProjectPermissionRole,
  deleteProjectPermissionRole,
  fetchProjectPermissionRoles,
  fetchProjectRoleMenuWorkspace,
  saveProjectRoleMenus,
  updateProjectPermissionRole,
  type ProjectPermissionMenuNode,
  type ProjectPermissionRole,
  type ProjectRoleMenuWorkspace,
  type SaveProjectPermissionRoleInput,
} from './project-role-permissions';

const PAGE_SIZE = 20;

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '权限数据加载或保存失败，请稍后重试。';
}

function createEmptyRoleForm(): SaveProjectPermissionRoleInput {
  return {
    roleCode: '',
    roleDescription: '',
    roleName: '',
  };
}

function sortUniqueNumberList(values: Iterable<number>) {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function areNumberListsEqual(left: number[], right: number[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function collectMenuIds(node: ProjectPermissionMenuNode): number[] {
  const currentIds = typeof node.menuId === 'number' ? [node.menuId] : [];
  const childIds = (node.children ?? []).flatMap((child) => collectMenuIds(child));
  return [...currentIds, ...childIds];
}

function collectMenuIdsFromTree(nodes: ProjectPermissionMenuNode[]) {
  return sortUniqueNumberList(nodes.flatMap((node) => collectMenuIds(node)));
}

function MenuTreeNode({
  depth = 0,
  node,
  onToggleBranch,
  selectedMenuIds,
}: {
  depth?: number;
  node: ProjectPermissionMenuNode;
  onToggleBranch: (node: ProjectPermissionMenuNode) => void;
  selectedMenuIds: Set<number>;
}) {
  const branchMenuIds = collectMenuIds(node);
  const selectedCount = branchMenuIds.filter((menuId) => selectedMenuIds.has(menuId)).length;
  const fullySelected = branchMenuIds.length > 0 && selectedCount === branchMenuIds.length;
  const partiallySelected = selectedCount > 0 && selectedCount < branchMenuIds.length;

  return (
    <div className="space-y-2">
      <button
        className={cx(
          'flex w-full items-start gap-3 rounded-[22px] border px-4 py-3 text-left transition',
          fullySelected
            ? 'border-sky-200 bg-sky-50 text-sky-800'
            : partiallySelected
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
          branchMenuIds.length === 0 ? 'cursor-default opacity-70' : '',
        )}
        disabled={branchMenuIds.length === 0}
        onClick={() => {
          onToggleBranch(node);
        }}
        style={{ marginLeft: `${depth * 14}px` }}
        type="button"
      >
        <span
          className={cx(
            'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[12px] font-bold',
            fullySelected
              ? 'border-sky-500 bg-sky-500 text-white'
              : partiallySelected
                ? 'border-amber-300 bg-amber-100 text-amber-700'
                : 'border-slate-300 bg-white text-transparent',
          )}
        >
          {fullySelected ? 'Y' : partiallySelected ? '-' : 'Y'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{node.title}</span>
            <Badge tone="neutral">{node.nodeType === 'subsystem' ? '系统' : '菜单'}</Badge>
            {typeof node.menuId === 'number' ? (
              <span className="text-[11px] text-slate-400">ID {node.menuId}</span>
            ) : null}
          </span>
          {node.code ? (
            <span className="mt-1 block text-[12px] text-slate-500">
              {node.code}
            </span>
          ) : null}
        </span>
      </button>

      {(node.children?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {(node.children ?? []).map((child) => (
            <MenuTreeNode
              key={child.id}
              depth={depth + 1}
              node={child}
              onToggleBranch={onToggleBranch}
              selectedMenuIds={selectedMenuIds}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectRolePermissionManagementPage({
  currentUserName,
}: {
  currentUserName: string;
}) {
  const [roles, setRoles] = useState<ProjectPermissionRole[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [roleDialogState, setRoleDialogState] = useState<{
    mode: 'create' | 'edit';
    roleId: number | null;
    visible: boolean;
  }>({
    mode: 'create',
    roleId: null,
    visible: false,
  });
  const [roleForm, setRoleForm] = useState<SaveProjectPermissionRoleInput>(createEmptyRoleForm);
  const [menuDialogState, setMenuDialogState] = useState<{
    roleId: number | null;
    roleName: string;
    visible: boolean;
  }>({
    roleId: null,
    roleName: '',
    visible: false,
  });
  const [roleMenuWorkspace, setRoleMenuWorkspace] = useState<ProjectRoleMenuWorkspace | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [loadedMenuIds, setLoadedMenuIds] = useState<number[]>([]);

  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();
  const filteredRoles = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return roles;
    }

    return roles.filter((role) =>
      [role.roleCode, role.roleName, role.roleDescription ?? '', role.updatedBy ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchKeyword),
    );
  }, [normalizedSearchKeyword, roles]);
  const pageCount = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const safePageNumber = Math.min(pageNumber, pageCount);
  const pageStart = (safePageNumber - 1) * PAGE_SIZE;
  const pageRoles = filteredRoles.slice(pageStart, pageStart + PAGE_SIZE);
  const allMenuIds = useMemo(
    () => collectMenuIdsFromTree(roleMenuWorkspace?.menuTree ?? []),
    [roleMenuWorkspace],
  );
  const selectedMenuIdSet = useMemo(
    () => new Set(selectedMenuIds),
    [selectedMenuIds],
  );
  const roleMenusDirty = useMemo(
    () => !areNumberListsEqual(selectedMenuIds, loadedMenuIds),
    [loadedMenuIds, selectedMenuIds],
  );

  useEffect(() => {
    setPageNumber(1);
  }, [normalizedSearchKeyword]);

  async function reloadRoles(preferredRoleId?: number | null) {
    const nextRoles = await fetchProjectPermissionRoles();
    setRoles(Array.isArray(nextRoles) ? nextRoles : []);

    if (preferredRoleId && menuDialogState.visible) {
      const matchedRole = nextRoles.find((role) => role.roleId === preferredRoleId);
      if (matchedRole) {
        setMenuDialogState((current) => ({
          ...current,
          roleId: matchedRole.roleId,
          roleName: matchedRole.roleName,
        }));
      }
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(null);

    void fetchProjectPermissionRoles()
      .then((nextRoles) => {
        if (!active) {
          return;
        }

        setRoles(Array.isArray(nextRoles) ? nextRoles : []);
      })
      .catch((error: unknown) => {
        if (active) {
          setRoles([]);
          setErrorMessage(normalizeErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveRole() {
    const payload = {
      roleCode: roleForm.roleCode.trim(),
      roleDescription: roleForm.roleDescription?.trim() ?? '',
      roleName: roleForm.roleName.trim(),
    };

    if (!payload.roleCode || !payload.roleName) {
      setErrorMessage('请先填写角色编码和角色名称。');
      return;
    }

    setBusyAction('save-role');
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const savedRole = roleDialogState.roleId
        ? await updateProjectPermissionRole(roleDialogState.roleId, payload)
        : await createProjectPermissionRole(payload);

      await reloadRoles(savedRole.roleId);
      setRoleDialogState({ mode: 'create', roleId: null, visible: false });
      setRoleForm(createEmptyRoleForm());
      setFeedbackMessage(roleDialogState.roleId ? '角色已更新。' : '角色已创建。');
    } catch (error: unknown) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteRole(role: ProjectPermissionRole) {
    if (!window.confirm(`确定删除角色“${role.roleName}”吗？`)) {
      return;
    }

    setBusyAction('delete-role');
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await deleteProjectPermissionRole(role.roleId);
      await reloadRoles(null);
      if (menuDialogState.roleId === role.roleId) {
        setMenuDialogState({ roleId: null, roleName: '', visible: false });
        setRoleMenuWorkspace(null);
        setSelectedMenuIds([]);
        setLoadedMenuIds([]);
      }
      setFeedbackMessage('角色已删除。');
    } catch (error: unknown) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  function openCreateRoleDialog() {
    setRoleDialogState({ mode: 'create', roleId: null, visible: true });
    setRoleForm(createEmptyRoleForm());
    setErrorMessage(null);
    setFeedbackMessage(null);
  }

  function openEditRoleDialog(role: ProjectPermissionRole) {
    setRoleDialogState({ mode: 'edit', roleId: role.roleId, visible: true });
    setRoleForm({
      roleCode: role.roleCode,
      roleDescription: role.roleDescription ?? '',
      roleName: role.roleName,
    });
    setErrorMessage(null);
    setFeedbackMessage(null);
  }

  async function openMenuDialog(role: ProjectPermissionRole) {
    setBusyAction('load-role-menus');
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const workspace = await fetchProjectRoleMenuWorkspace(role.roleId);
      const nextMenuIds = sortUniqueNumberList(workspace.menuIds ?? []);
      setMenuDialogState({
        roleId: role.roleId,
        roleName: role.roleName,
        visible: true,
      });
      setRoleMenuWorkspace(workspace);
      setSelectedMenuIds(nextMenuIds);
      setLoadedMenuIds(nextMenuIds);
    } catch (error: unknown) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  function handleToggleMenuBranch(node: ProjectPermissionMenuNode) {
    const branchMenuIds = collectMenuIds(node);
    if (!branchMenuIds.length) {
      return;
    }

    setSelectedMenuIds((current) => {
      const next = new Set(current);
      const shouldSelect = branchMenuIds.some((menuId) => !next.has(menuId));

      branchMenuIds.forEach((menuId) => {
        if (shouldSelect) {
          next.add(menuId);
        } else {
          next.delete(menuId);
        }
      });

      return sortUniqueNumberList(next);
    });
  }

  async function handleSaveRoleMenus() {
    if (!menuDialogState.roleId) {
      return;
    }

    setBusyAction('save-role-menus');
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const workspace = await saveProjectRoleMenus(menuDialogState.roleId, selectedMenuIds);
      const nextMenuIds = sortUniqueNumberList(workspace.menuIds ?? []);
      setRoleMenuWorkspace(workspace);
      setSelectedMenuIds(nextMenuIds);
      setLoadedMenuIds(nextMenuIds);
      await reloadRoles(menuDialogState.roleId);
      setFeedbackMessage('角色菜单权限已保存。');
    } catch (error: unknown) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto">
      <Card className="rounded-[32px] p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="theme-text-soft text-xs font-black uppercase tracking-[0.24em]">
              系统管理
            </div>
            <div className="theme-text-strong mt-2 text-3xl font-black tracking-tight">
              角色权限
            </div>
            <div className="theme-text-muted mt-3 max-w-3xl text-sm leading-6">
              角色以表格管理，菜单权限在角色上配置。用户侧只做角色分配，不再把所有操作挤在一个页面里。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">超级管理员</Badge>
            <Badge tone="neutral">{currentUserName}</Badge>
            <Badge tone="neutral">{`角色 ${roles.length}`}</Badge>
          </div>
        </div>

        {feedbackMessage ? (
          <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedbackMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
      </Card>

      <Card className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="theme-text-strong text-xl font-black tracking-tight">角色权限表</div>
            <div className="theme-text-muted mt-2 text-sm">
              角色在这里新增、编辑、删除，并通过“设置菜单”维护菜单权限。
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <input
              className="theme-input h-11 w-full rounded-2xl px-4 md:w-[320px]"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSearchKeyword(event.target.value);
              }}
              placeholder="搜索角色名称、编码或说明"
              value={searchKeyword}
            />
            <Button onClick={openCreateRoleDialog} tone="primary">
              新增角色
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-5 py-4">角色名称</th>
                  <th className="px-5 py-4">角色编码</th>
                  <th className="px-5 py-4">描述</th>
                  <th className="px-5 py-4">员工数</th>
                  <th className="px-5 py-4">菜单数</th>
                  <th className="px-5 py-4">更新人</th>
                  <th className="px-5 py-4 text-right">行工具</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-5 py-10 text-sm text-slate-500" colSpan={7}>
                      正在加载角色列表...
                    </td>
                  </tr>
                ) : pageRoles.length ? (
                  pageRoles.map((role) => (
                    <tr key={role.roleId} className="align-top text-sm text-slate-700">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{role.roleName}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{role.roleCode}</td>
                      <td className="px-5 py-4">
                        <div className="max-w-[320px] leading-6 text-slate-600">
                          {role.roleDescription || '--'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="neutral">{String(role.employeeCount)}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="neutral">{String(role.menuCount)}</Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{role.updatedBy || '--'}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            onClick={() => {
                              openEditRoleDialog(role);
                            }}
                            type="button"
                          >
                            编辑
                          </button>
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                            onClick={() => {
                              void openMenuDialog(role);
                            }}
                            type="button"
                          >
                            设置菜单
                          </button>
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                            onClick={() => {
                              void handleDeleteRole(role);
                            }}
                            type="button"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-sm text-slate-500" colSpan={7}>
                      没有匹配的角色记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>{`第 ${safePageNumber} / ${pageCount} 页，共 ${filteredRoles.length} 条角色记录`}</div>
          <div className="flex items-center gap-2">
            <Button
              disabled={safePageNumber <= 1}
              onClick={() => {
                setPageNumber((current) => Math.max(1, current - 1));
              }}
              tone="ghost"
            >
              上一页
            </Button>
            <Button
              disabled={safePageNumber >= pageCount}
              onClick={() => {
                setPageNumber((current) => Math.min(pageCount, current + 1));
              }}
              tone="ghost"
            >
              下一页
            </Button>
          </div>
        </div>
      </Card>

      {roleDialogState.visible ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  角色权限
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  {roleDialogState.mode === 'create' ? '新增角色' : '编辑角色'}
                </div>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                onClick={() => {
                  setRoleDialogState({ mode: 'create', roleId: null, visible: false });
                  setRoleForm(createEmptyRoleForm());
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  角色编码
                </div>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-sky-300"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setRoleForm((current) => ({
                      ...current,
                      roleCode: event.target.value,
                    }));
                  }}
                  placeholder="例如：role-project-admin"
                  value={roleForm.roleCode}
                />
              </label>

              <label className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  角色名称
                </div>
                <input
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-sky-300"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setRoleForm((current) => ({
                      ...current,
                      roleName: event.target.value,
                    }));
                  }}
                  placeholder="例如：项目权限管理员"
                  value={roleForm.roleName}
                />
              </label>

              <label className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  角色说明
                </div>
                <textarea
                  className="min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-sky-300"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setRoleForm((current) => ({
                      ...current,
                      roleDescription: event.target.value,
                    }));
                  }}
                  placeholder="填写角色用途与适用边界"
                  value={roleForm.roleDescription ?? ''}
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                onClick={() => {
                  setRoleDialogState({ mode: 'create', roleId: null, visible: false });
                  setRoleForm(createEmptyRoleForm());
                }}
                tone="ghost"
              >
                取消
              </Button>
              <Button
                disabled={busyAction === 'save-role'}
                onClick={() => {
                  void handleSaveRole();
                }}
                tone="primary"
              >
                {busyAction === 'save-role' ? '保存中...' : '保存角色'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {menuDialogState.visible ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[28px] bg-white p-6 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  菜单权限
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  {menuDialogState.roleName}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  通过树形菜单批量设置当前角色可访问的菜单项。
                </div>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                onClick={() => {
                  setMenuDialogState({ roleId: null, roleName: '', visible: false });
                  setRoleMenuWorkspace(null);
                  setSelectedMenuIds([]);
                  setLoadedMenuIds([]);
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge tone="neutral">{`已选 ${selectedMenuIds.length}`}</Badge>
              <Badge tone="neutral">{`可授权 ${allMenuIds.length}`}</Badge>
              <Button
                disabled={!allMenuIds.length || Boolean(busyAction)}
                onClick={() => {
                  setSelectedMenuIds(allMenuIds);
                }}
                tone="ghost"
              >
                全选
              </Button>
              <Button
                disabled={!selectedMenuIds.length || Boolean(busyAction)}
                onClick={() => {
                  setSelectedMenuIds([]);
                }}
                tone="ghost"
              >
                清空
              </Button>
            </div>

            <div className="mt-5 min-h-[320px] flex-1 overflow-auto rounded-[24px] border border-slate-200 bg-slate-50/40 p-4">
              {roleMenuWorkspace?.menuTree?.length ? (
                <div className="space-y-3">
                  {roleMenuWorkspace.menuTree.map((node) => (
                    <MenuTreeNode
                      key={node.id}
                      node={node}
                      onToggleBranch={handleToggleMenuBranch}
                      selectedMenuIds={selectedMenuIdSet}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                  当前账套暂无可授权菜单树。
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                onClick={() => {
                  setMenuDialogState({ roleId: null, roleName: '', visible: false });
                  setRoleMenuWorkspace(null);
                  setSelectedMenuIds([]);
                  setLoadedMenuIds([]);
                }}
                tone="ghost"
              >
                关闭
              </Button>
              <Button
                disabled={!roleMenusDirty || busyAction === 'save-role-menus'}
                onClick={() => {
                  void handleSaveRoleMenus();
                }}
                tone="primary"
              >
                {busyAction === 'save-role-menus' ? '保存中...' : '保存菜单权限'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

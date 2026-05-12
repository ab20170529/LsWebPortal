import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { Button, Card, cx } from '@lserp/ui';

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

function MetricCell({
  label,
  tone = 'default',
  value,
}: {
  label: string;
  tone?: 'blue' | 'default' | 'green' | 'orange';
  value: ReactNode;
}) {
  return (
    <div className="flex min-h-[80px] flex-col justify-center px-4 py-3">
      <div className="text-[13px] font-medium text-[#6b7f9e]">{label}</div>
      <div
        className={cx(
          'mt-1 text-2xl font-bold leading-8',
          tone === 'blue' ? 'text-[#1f65e8]' : '',
          tone === 'green' ? 'text-[#16b978]' : '',
          tone === 'orange' ? 'text-[#ff8a00]' : '',
          tone === 'default' ? 'text-[#111c33]' : '',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#f2f6fb] px-2 text-[13px] font-medium text-[#526681]">
      {children}
    </span>
  );
}

function TableActionButton({
  children,
  danger,
  disabled,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        'inline-flex h-7 min-w-[44px] items-center justify-center rounded px-1.5 text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[#dceaff]',
        disabled
          ? 'cursor-not-allowed text-[#b6c4d8]'
          : danger
            ? 'text-[#d64545] hover:bg-[#fff2f2]'
            : 'text-[#1f65e8] hover:bg-[#eaf3ff] hover:text-[#1557d7]',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Notice({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'danger' | 'success';
}) {
  return (
    <div
      className={cx(
        'rounded-md border px-4 py-3 text-[13px] font-medium',
        tone === 'success'
          ? 'border-[#b7ebd1] bg-[#effcf6] text-[#13875b]'
          : 'border-[#ffd0d0] bg-[#fff2f2] text-[#d64545]',
      )}
    >
      {children}
    </div>
  );
}

function DrawerCloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function Field({
  children,
  label,
  required,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-[#6b7f9e]">
        {label}
        {required ? <span className="ml-0.5 text-[#f04444]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function RoleNameCell({ role }: { role: ProjectPermissionRole }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[13px] font-medium text-[#263653]">{role.roleName}</div>
      <div className="mt-0.5 truncate text-[12px] font-medium text-[#6b7f9e]">ID {role.roleId}</div>
    </div>
  );
}

function MenuTypeBadge({ type }: { type: string }) {
  const subsystem = type === 'subsystem';
  return (
    <span
      className={cx(
        'inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium',
        subsystem ? 'bg-[#eaf3ff] text-[#1f65e8]' : 'bg-[#f2f6fb] text-[#526681]',
      )}
    >
      {subsystem ? '系统' : '菜单'}
    </span>
  );
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
          'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition',
          fullySelected
            ? 'border-[#9fc9ff] bg-[#edf6ff]'
            : partiallySelected
              ? 'border-[#ffd59b] bg-[#fff8ed]'
              : 'border-[#e4ebf5] bg-white hover:border-[#cfe1f8] hover:bg-[#f8fbff]',
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
            'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[12px] font-bold',
            fullySelected
              ? 'border-[#1f7cff] bg-[#1f7cff] text-white'
              : partiallySelected
                ? 'border-[#ffb64d] bg-[#fff0d8] text-[#ff8a00]'
                : 'border-[#c9d6e8] bg-white text-transparent',
          )}
        >
          {fullySelected ? '✓' : partiallySelected ? '-' : '✓'}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-[13px] font-medium text-[#263653]">{node.title}</span>
            <MenuTypeBadge type={node.nodeType} />
            {typeof node.menuId === 'number' ? (
              <span className="text-[12px] font-medium text-[#6b7f9e]">ID {node.menuId}</span>
            ) : null}
          </span>
          {node.code ? (
            <span className="mt-1 block truncate text-[12px] font-medium text-[#6b7f9e]">
              {node.code}
            </span>
          ) : null}
        </span>
      </button>

      {(node.children?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {(node.children ?? []).map((child) => (
            <MenuTreeNode
              depth={depth + 1}
              key={child.id}
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
  const totalEmployeeCount = useMemo(
    () => roles.reduce((total, role) => total + (role.employeeCount ?? 0), 0),
    [roles],
  );
  const totalMenuCount = useMemo(
    () => roles.reduce((total, role) => total + (role.menuCount ?? 0), 0),
    [roles],
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
      closeRoleDrawer();
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
        closeMenuDrawer();
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

  function closeRoleDrawer() {
    setRoleDialogState({ mode: 'create', roleId: null, visible: false });
    setRoleForm(createEmptyRoleForm());
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

  function closeMenuDrawer() {
    setMenuDialogState({ roleId: null, roleName: '', visible: false });
    setRoleMenuWorkspace(null);
    setSelectedMenuIds([]);
    setLoadedMenuIds([]);
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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto bg-[#f5f8fc]">
      <div className="mb-2 flex shrink-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[20px] font-bold leading-7 text-[#111c33]">角色权限</h1>
          <p className="mt-1 text-[14px] font-medium text-[#5e7291]">
            维护项目角色信息，并按角色配置可访问菜单权限
          </p>
        </div>
        <div className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#526681] shadow-[0_4px_12px_rgba(24,39,75,0.04)]">
          <span className="h-2 w-2 rounded-full bg-[#1f7cff]" />
          {currentUserName || '未识别当前用户'}
        </div>
      </div>

      <Card className="mb-2 overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
        <div className="grid divide-y divide-[#edf2f8] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <MetricCell label="角色总数" tone="blue" value={roles.length} />
          <MetricCell label="关联员工" tone="green" value={totalEmployeeCount} />
          <MetricCell label="菜单授权" tone="orange" value={totalMenuCount} />
          <MetricCell label="检索结果" value={filteredRoles.length} />
        </div>
      </Card>

      {feedbackMessage ? (
        <div className="mb-2">
          <Notice tone="success">{feedbackMessage}</Notice>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mb-2">
          <Notice tone="danger">{errorMessage}</Notice>
        </div>
      ) : null}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#edf2f8] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-[#111c33]">角色权限表</h2>
            <p className="mt-1 text-[13px] font-medium text-[#6b7f9e]">
              角色在这里新增、编辑、删除，并通过“设置菜单”维护授权范围
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <input
              className="field-input w-full md:w-[320px]"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSearchKeyword(event.target.value);
              }}
              placeholder="搜索角色名称、编码或说明"
              value={searchKeyword}
            />
            <Button
              className="h-8 rounded-md bg-[#1f7cff] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] hover:bg-[#176df0]"
              onClick={openCreateRoleDialog}
              tone="primary"
            >
              + 新增角色
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#f8fbff]">
              <tr className="text-[13px] font-medium text-[#6b7f9e]">
                <th className="px-4 py-3">角色名称</th>
                <th className="px-4 py-3">角色编码</th>
                <th className="px-4 py-3">描述</th>
                <th className="px-4 py-3">员工数</th>
                <th className="px-4 py-3">菜单数</th>
                <th className="px-4 py-3">更新人</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="border-t border-[#edf2f8] px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={7}>
                    正在加载角色列表...
                  </td>
                </tr>
              ) : pageRoles.length ? (
                pageRoles.map((role) => (
                  <tr className="border-t border-[#edf2f8] bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]" key={role.roleId}>
                    <td className="px-4 py-3">
                      <RoleNameCell role={role} />
                    </td>
                    <td className="px-4 py-3 text-[#526681]">{role.roleCode}</td>
                    <td className="max-w-[360px] px-4 py-3 text-[#526681]">
                      <div className="line-clamp-2 leading-6">{role.roleDescription || '--'}</div>
                    </td>
                    <td className="px-4 py-3"><CountBadge>{role.employeeCount}</CountBadge></td>
                    <td className="px-4 py-3"><CountBadge>{role.menuCount}</CountBadge></td>
                    <td className="px-4 py-3 text-[#526681]">{role.updatedBy || '--'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <TableActionButton onClick={() => openEditRoleDialog(role)}>编辑</TableActionButton>
                        <TableActionButton
                          disabled={busyAction === 'load-role-menus'}
                          onClick={() => {
                            void openMenuDialog(role);
                          }}
                        >
                          设置菜单
                        </TableActionButton>
                        <TableActionButton
                          danger
                          disabled={busyAction === 'delete-role'}
                          onClick={() => {
                            void handleDeleteRole(role);
                          }}
                        >
                          删除
                        </TableActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border-t border-[#edf2f8] px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={7}>
                    没有匹配的角色记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[#edf2f8] px-4 py-3 text-[13px] font-medium text-[#6b7f9e] md:flex-row md:items-center md:justify-between">
          <div>{`第 ${safePageNumber} / ${pageCount} 页，共 ${filteredRoles.length} 条角色记录`}</div>
          <div className="flex items-center gap-2">
            <Button
              className="h-8 rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
              disabled={safePageNumber <= 1}
              onClick={() => {
                setPageNumber((current) => Math.max(1, current - 1));
              }}
              tone="ghost"
            >
              上一页
            </Button>
            <Button
              className="h-8 rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-[#111c33]/20">
          <aside className="flex h-full w-full max-w-[420px] flex-col border-l border-[#e4ebf5] bg-white shadow-[-14px_0_30px_rgba(24,39,75,0.08)]">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#edf2f8] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#111c33]">
                  {roleDialogState.mode === 'create' ? '新增角色' : '编辑角色'}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-[#6b7f9e]">维护角色基础信息</p>
              </div>
              <button
                aria-label="关闭角色表单"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7e91b0] transition hover:bg-[#f2f6fb] hover:text-[#263653] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
                onClick={closeRoleDrawer}
                type="button"
              >
                <DrawerCloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
              <Field label="角色编码" required>
                <input
                  className="field-input w-full"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setRoleForm((current) => ({
                      ...current,
                      roleCode: event.target.value,
                    }));
                  }}
                  placeholder="例如：role-project-admin"
                  value={roleForm.roleCode}
                />
              </Field>

              <Field label="角色名称" required>
                <input
                  className="field-input w-full"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setRoleForm((current) => ({
                      ...current,
                      roleName: event.target.value,
                    }));
                  }}
                  placeholder="例如：项目权限管理员"
                  value={roleForm.roleName}
                />
              </Field>

              <Field label="角色说明">
                <textarea
                  className="field-textarea"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setRoleForm((current) => ({
                      ...current,
                      roleDescription: event.target.value,
                    }));
                  }}
                  placeholder="填写角色用途与适用边界"
                  value={roleForm.roleDescription ?? ''}
                />
              </Field>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#edf2f8] px-5 py-4">
              <Button
                className="h-8 rounded-md border border-[#d9e3f1] bg-white px-4 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
                onClick={closeRoleDrawer}
                tone="ghost"
              >
                取消
              </Button>
              <Button
                className="h-8 rounded-md bg-[#1f7cff] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] hover:bg-[#176df0]"
                disabled={busyAction === 'save-role'}
                onClick={() => {
                  void handleSaveRole();
                }}
                tone="primary"
              >
                {busyAction === 'save-role' ? '保存中...' : '保存角色'}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      {menuDialogState.visible ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#111c33]/20">
          <aside className="flex h-full w-full max-w-[560px] flex-col border-l border-[#e4ebf5] bg-white shadow-[-14px_0_30px_rgba(24,39,75,0.08)]">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#edf2f8] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#111c33]">菜单权限</h3>
                <p className="mt-1 text-[13px] font-medium text-[#6b7f9e]">{menuDialogState.roleName}</p>
              </div>
              <button
                aria-label="关闭菜单权限"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7e91b0] transition hover:bg-[#f2f6fb] hover:text-[#263653] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
                onClick={closeMenuDrawer}
                type="button"
              >
                <DrawerCloseIcon />
              </button>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#edf2f8] px-5 py-3">
              <CountBadge>{`已选 ${selectedMenuIds.length}`}</CountBadge>
              <CountBadge>{`可授权 ${allMenuIds.length}`}</CountBadge>
              <Button
                className="h-8 rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
                disabled={!allMenuIds.length || Boolean(busyAction)}
                onClick={() => {
                  setSelectedMenuIds(allMenuIds);
                }}
                tone="ghost"
              >
                全选
              </Button>
              <Button
                className="h-8 rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
                disabled={!selectedMenuIds.length || Boolean(busyAction)}
                onClick={() => {
                  setSelectedMenuIds([]);
                }}
                tone="ghost"
              >
                清空
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[#f8fbff] px-5 py-4">
              {roleMenuWorkspace?.menuTree?.length ? (
                <div className="space-y-2">
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
                <div className="rounded-lg border border-dashed border-[#d9e3f1] bg-white px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]">
                  当前账号暂无可授权菜单树
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#edf2f8] px-5 py-4">
              <Button
                className="h-8 rounded-md border border-[#d9e3f1] bg-white px-4 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
                onClick={closeMenuDrawer}
                tone="ghost"
              >
                关闭
              </Button>
              <Button
                className="h-8 rounded-md bg-[#1f7cff] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] hover:bg-[#176df0]"
                disabled={!roleMenusDirty || busyAction === 'save-role-menus'}
                onClick={() => {
                  void handleSaveRoleMenus();
                }}
                tone="primary"
              >
                {busyAction === 'save-role-menus' ? '保存中...' : '保存菜单权限'}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <style>{`
        .field-input,
        .field-textarea {
          border-radius: 6px;
          border: 1px solid #d9e3f1;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #263653;
          outline: none;
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .field-input {
          height: 36px;
          padding: 0 12px;
        }
        .field-textarea {
          min-height: 104px;
          width: 100%;
          resize: none;
          padding: 10px 12px;
          line-height: 1.6;
        }
        .field-input::placeholder,
        .field-textarea::placeholder {
          color: #9aabc4;
        }
        .field-input:focus,
        .field-textarea:focus {
          border-color: #1f7cff;
          box-shadow: 0 0 0 3px #dceaff;
        }
      `}</style>
    </div>
  );
}

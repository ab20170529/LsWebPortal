import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';

import { Button, Card, cx } from '@lserp/ui';

import {
  fetchProjectEmployeeRoleWorkspace,
  fetchProjectPermissionRoles,
  saveProjectEmployeeRoles,
  type ProjectPermissionRole,
} from './project-role-permissions';
import type { SystemUserOption } from './system-user-directory';
import { useSystemUserOptions } from './system-user-directory';

const PAGE_SIZE = 20;

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '权限数据加载或保存失败，请稍后重试。';
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

function formatRoleNames(roleIds: number[], roles: ProjectPermissionRole[]) {
  if (!roleIds.length) {
    return '未分配角色';
  }

  const roleMap = new Map(roles.map((role) => [role.roleId, role.roleName]));
  return roleIds
    .map((roleId) => roleMap.get(roleId))
    .filter((roleName): roleName is string => Boolean(roleName))
    .join('、') || '未分配角色';
}

function buildSearchText(employee: SystemUserOption) {
  return [
    employee.userName,
    employee.loginAccount,
    employee.departmentId,
    employee.py,
    employee.userId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getUserInitial(name: string) {
  const trimmedName = name.trim();
  return trimmedName ? trimmedName.slice(0, 1) : '-';
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

function UserCell({ employee }: { employee: SystemUserOption }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-[13px] font-bold text-[#1f65e8]">
        {getUserInitial(employee.userName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-[#263653]">{employee.userName}</span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-[#6b7f9e]">ID {employee.userId}</span>
      </span>
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
  disabled,
  onClick,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      className={cx(
        'inline-flex h-7 min-w-[64px] items-center justify-center rounded px-1.5 text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[#dceaff]',
        disabled
          ? 'cursor-not-allowed text-[#b6c4d8]'
          : 'text-[#1f65e8] hover:bg-[#eaf3ff] hover:text-[#1557d7]',
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
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

export function ProjectUserPermissionManagementPage({
  currentUserName,
}: {
  currentUserName: string;
}) {
  const {
    error: userDirectoryError,
    loading: userDirectoryLoading,
    options: userOptions,
  } = useSystemUserOptions();
  const [roles, setRoles] = useState<ProjectPermissionRole[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [roleIdsByUserId, setRoleIdsByUserId] = useState<Record<string, number[]>>({});
  const [loadingUserIds, setLoadingUserIds] = useState<string[]>([]);
  const [dialogUser, setDialogUser] = useState<SystemUserOption | null>(null);
  const [dialogRoleIds, setDialogRoleIds] = useState<number[]>([]);
  const [loadedDialogRoleIds, setLoadedDialogRoleIds] = useState<number[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return userOptions;
    }

    return userOptions.filter((employee) =>
      buildSearchText(employee).includes(normalizedSearchKeyword),
    );
  }, [normalizedSearchKeyword, userOptions]);

  const { pageCount, pageEmployees, safePageNumber } = useMemo(() => {
    const nextPageCount = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
    const nextSafePageNumber = Math.min(pageNumber, nextPageCount);
    const pageStart = (nextSafePageNumber - 1) * PAGE_SIZE;

    return {
      pageCount: nextPageCount,
      pageEmployees: filteredEmployees.slice(pageStart, pageStart + PAGE_SIZE),
      safePageNumber: nextSafePageNumber,
    };
  }, [filteredEmployees, pageNumber]);

  const assignedEmployeeCount = useMemo(
    () => Object.values(roleIdsByUserId).filter((roleIds) => roleIds.length > 0).length,
    [roleIdsByUserId],
  );
  const pageAssignedRoleCount = useMemo(
    () => pageEmployees.reduce((total, employee) => total + (roleIdsByUserId[employee.userId]?.length ?? 0), 0),
    [pageEmployees, roleIdsByUserId],
  );
  const dialogDirty = !areNumberListsEqual(dialogRoleIds, loadedDialogRoleIds);

  useEffect(() => {
    setPageNumber(1);
  }, [normalizedSearchKeyword]);

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

  useEffect(() => {
    let active = true;

    const employeesToLoad = pageEmployees.filter(
      (employee) => typeof employee.employeeId === 'number' && Number.isFinite(employee.employeeId),
    );

    if (!employeesToLoad.length) {
      setLoadingUserIds([]);
      return;
    }

    const userIds = employeesToLoad.map((employee) => employee.userId);
    setLoadingUserIds(userIds);

    void Promise.all(
      employeesToLoad.map(async (employee) => {
        const workspace = await fetchProjectEmployeeRoleWorkspace(employee.employeeId as number);
        return [employee.userId, sortUniqueNumberList(workspace.roleIds ?? [])] as const;
      }),
    )
      .then((entries) => {
        if (!active) {
          return;
        }

        setRoleIdsByUserId((current) => {
          const next = { ...current };
          entries.forEach(([userId, roleIds]) => {
            next[userId] = roleIds;
          });
          return next;
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(normalizeErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) {
          setLoadingUserIds([]);
        }
      });

    return () => {
      active = false;
    };
  }, [pageEmployees]);

  async function openRoleDialog(employee: SystemUserOption) {
    if (employee.employeeId === null || employee.employeeId === undefined) {
      setErrorMessage('当前员工缺少 employeeId，无法设置角色。');
      return;
    }

    if (loading) {
      return;
    }

    if (!roles.length) {
      setErrorMessage('角色目录加载失败或暂无可分配角色，请先检查角色接口。');
      return;
    }

    setBusyAction('load-dialog');
    setDialogUser(employee);
    setFeedbackMessage(null);
    setErrorMessage(null);

    try {
      const workspace = await fetchProjectEmployeeRoleWorkspace(employee.employeeId);
      const nextRoleIds = sortUniqueNumberList(workspace.roleIds ?? []);
      setDialogRoleIds(nextRoleIds);
      setLoadedDialogRoleIds(nextRoleIds);
    } catch (error: unknown) {
      setDialogUser(null);
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveUserRoles() {
    if (dialogUser?.employeeId === null || dialogUser?.employeeId === undefined) {
      return;
    }

    setBusyAction('save-user-roles');
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const workspace = await saveProjectEmployeeRoles(dialogUser.employeeId, dialogRoleIds);
      const nextRoleIds = sortUniqueNumberList(workspace.roleIds ?? []);

      setRoleIdsByUserId((current) => ({
        ...current,
        [dialogUser.userId]: nextRoleIds,
      }));
      setDialogRoleIds(nextRoleIds);
      setLoadedDialogRoleIds(nextRoleIds);
      setDialogUser(null);
      setFeedbackMessage('员工角色已保存。');
    } catch (error: unknown) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  function closeRoleDrawer() {
    setDialogUser(null);
    setDialogRoleIds([]);
    setLoadedDialogRoleIds([]);
  }

  function handleToggleDialogRole(roleId: number) {
    setDialogRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((item) => item !== roleId);
      }

      return sortUniqueNumberList([...current, roleId]);
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto bg-[#f5f8fc]">
      <div className="mb-2 flex shrink-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[20px] font-bold leading-7 text-[#111c33]">用户权限</h1>
          <p className="mt-1 text-[14px] font-medium text-[#5e7291]">
            按员工维护项目角色分配，角色本身在角色权限工作区维护
          </p>
        </div>
        <div className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d9e3f1] bg-white px-3 text-[13px] font-medium text-[#526681] shadow-[0_4px_12px_rgba(24,39,75,0.04)]">
          <span className="h-2 w-2 rounded-full bg-[#1f7cff]" />
          {currentUserName || '未识别当前用户'}
        </div>
      </div>

      <Card className="mb-2 overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
        <div className="grid divide-y divide-[#edf2f8] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <MetricCell label="员工总数" tone="blue" value={userOptions.length} />
          <MetricCell label="角色总数" tone="green" value={roles.length} />
          <MetricCell label="已加载分配" value={assignedEmployeeCount} />
          <MetricCell label="当前页角色项" tone="orange" value={pageAssignedRoleCount} />
        </div>
      </Card>

      {feedbackMessage ? (
        <div className="mb-2">
          <Notice tone="success">{feedbackMessage}</Notice>
        </div>
      ) : null}
      {errorMessage || userDirectoryError ? (
        <div className="mb-2">
          <Notice tone="danger">{errorMessage ?? userDirectoryError}</Notice>
        </div>
      ) : null}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e4ebf5] bg-white p-0 shadow-[0_10px_24px_rgba(24,39,75,0.045)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#edf2f8] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-[#111c33]">员工角色表</h2>
            <p className="mt-1 text-[13px] font-medium text-[#6b7f9e]">
              每页 {PAGE_SIZE} 条，可按员工姓名、账号、拼音或编号检索
            </p>
          </div>
          <input
            className="field-input w-full xl:w-[340px]"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setSearchKeyword(event.target.value);
            }}
            placeholder="搜索员工姓名、账号或拼音"
            value={searchKeyword}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-[#f8fbff]">
              <tr className="text-[13px] font-medium text-[#6b7f9e]">
                <th className="px-4 py-3">员工姓名</th>
                <th className="px-4 py-3">登录账号</th>
                <th className="px-4 py-3">已分配角色</th>
                <th className="px-4 py-3">角色数量</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {userDirectoryLoading || loading ? (
                <tr>
                  <td className="border-t border-[#edf2f8] px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={5}>
                    正在加载员工权限数据...
                  </td>
                </tr>
              ) : pageEmployees.length ? (
                pageEmployees.map((employee) => {
                  const roleIds = roleIdsByUserId[employee.userId] ?? [];
                  const roleNames = formatRoleNames(roleIds, roles);
                  const rowLoading = loadingUserIds.includes(employee.userId);

                  return (
                    <tr className="border-t border-[#edf2f8] bg-white text-[13px] font-medium transition hover:bg-[#f8fbff]" key={employee.userId}>
                      <td className="px-4 py-3">
                        <UserCell employee={employee} />
                      </td>
                      <td className="px-4 py-3 text-[#526681]">{employee.loginAccount || '--'}</td>
                      <td className="max-w-[460px] px-4 py-3">
                        <div className={cx('line-clamp-2 leading-6', rowLoading ? 'text-[#8da0bd]' : 'text-[#526681]')}>
                          {rowLoading ? '角色加载中...' : roleNames}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CountBadge>{rowLoading ? '--' : roleIds.length}</CountBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <TableActionButton
                            disabled={rowLoading || loading || !roles.length}
                            onClick={() => {
                              void openRoleDialog(employee);
                            }}
                            title={!roles.length ? '角色目录不可用，暂时无法设置角色' : undefined}
                          >
                            设置角色
                          </TableActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="border-t border-[#edf2f8] px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]" colSpan={5}>
                    没有匹配的员工记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[#edf2f8] px-4 py-3 text-[13px] font-medium text-[#6b7f9e] md:flex-row md:items-center md:justify-between">
          <div>{`第 ${safePageNumber} / ${pageCount} 页，共 ${filteredEmployees.length} 条员工记录`}</div>
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

      {dialogUser ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#111c33]/20">
          <aside className="flex h-full w-full max-w-[420px] flex-col border-l border-[#e4ebf5] bg-white shadow-[-14px_0_30px_rgba(24,39,75,0.08)]">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#edf2f8] px-5 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#111c33]">设置角色</h3>
                <p className="mt-1 text-[13px] font-medium text-[#6b7f9e]">为员工分配项目角色权限</p>
              </div>
              <button
                aria-label="关闭角色设置"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7e91b0] transition hover:bg-[#f2f6fb] hover:text-[#263653] focus:outline-none focus:ring-2 focus:ring-[#dceaff]"
                onClick={closeRoleDrawer}
                type="button"
              >
                <DrawerCloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
              <div className="mb-3 rounded-lg border border-[#e4ebf5] bg-[#f8fbff] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-[13px] font-bold text-[#1f65e8]">
                    {getUserInitial(dialogUser.userName)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-[#263653]">{dialogUser.userName}</div>
                    <div className="mt-0.5 truncate text-[13px] font-medium text-[#526681]">
                      {dialogUser.loginAccount || `ID ${dialogUser.userId}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {roles.length ? (
                  roles.map((role) => {
                    const checked = dialogRoleIds.includes(role.roleId);
                    return (
                      <label
                        className={cx(
                          'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition',
                          checked
                            ? 'border-[#9fc9ff] bg-[#edf6ff]'
                            : 'border-[#e4ebf5] bg-white hover:border-[#cfe1f8] hover:bg-[#f8fbff]',
                        )}
                        key={`dialog-role-${role.roleId}`}
                      >
                        <input
                          checked={checked}
                          className="mt-1 h-4 w-4 rounded border-[#c9d6e8] text-[#1f7cff] focus:ring-[#dceaff]"
                          onChange={() => {
                            handleToggleDialogRole(role.roleId);
                          }}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-[#263653]">{role.roleName}</span>
                          <span className="mt-1 block text-[12px] font-medium text-[#6b7f9e]">{role.roleCode}</span>
                          {role.roleDescription ? (
                            <span className="mt-2 block text-[13px] font-medium leading-5 text-[#526681]">
                              {role.roleDescription}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-[#d9e3f1] px-4 py-8 text-center text-[13px] font-medium text-[#8da0bd]">
                    当前还没有可分配的角色，请先到角色权限工作区创建角色
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#edf2f8] px-5 py-4">
              <div className="text-[13px] font-medium text-[#6b7f9e]">{`已选 ${dialogRoleIds.length} 个角色`}</div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-8 rounded-md border border-[#d9e3f1] bg-white px-4 text-[13px] font-medium text-[#526681] hover:bg-[#f8fbff]"
                  onClick={closeRoleDrawer}
                  tone="ghost"
                >
                  取消
                </Button>
                <Button
                  className="h-8 rounded-md bg-[#1f7cff] px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,124,255,0.22)] hover:bg-[#176df0]"
                  disabled={!dialogDirty || busyAction === 'save-user-roles'}
                  onClick={() => {
                    void handleSaveUserRoles();
                  }}
                  tone="primary"
                >
                  {busyAction === 'save-user-roles' ? '保存中...' : '保存角色'}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
      <style>{`
        .field-input {
          height: 36px;
          border-radius: 6px;
          border: 1px solid #d9e3f1;
          background: #fff;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 500;
          color: #263653;
          outline: none;
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .field-input::placeholder {
          color: #9aabc4;
        }
        .field-input:focus {
          border-color: #1f7cff;
          box-shadow: 0 0 0 3px #dceaff;
        }
      `}</style>
    </div>
  );
}

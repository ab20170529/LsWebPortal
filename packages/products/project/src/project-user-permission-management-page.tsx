import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { Badge, Button, Card, cx } from '@lserp/ui';

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
    if (!dialogUser?.employeeId) {
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

  function handleToggleDialogRole(roleId: number) {
    setDialogRoleIds((current) => {
      if (current.includes(roleId)) {
        return current.filter((item) => item !== roleId);
      }

      return sortUniqueNumberList([...current, roleId]);
    });
  }

  const dialogDirty = !areNumberListsEqual(dialogRoleIds, loadedDialogRoleIds);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto">
      {false ? <Card className="rounded-[32px] p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="theme-text-soft text-xs font-black uppercase tracking-[0.24em]">
              系统管理
            </div>
            <div className="theme-text-strong mt-2 text-3xl font-black tracking-tight">
              用户权限
            </div>
            <div className="theme-text-muted mt-3 max-w-3xl text-sm leading-6">
              以员工列表方式管理角色分配。角色本身在角色权限工作区维护，用户侧只负责按人设置角色。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">超级管理员</Badge>
            <Badge tone="neutral">{currentUserName}</Badge>
            <Badge tone="neutral">{`员工 ${userOptions.length}`}</Badge>
            <Badge tone="neutral">{`角色 ${roles.length}`}</Badge>
          </div>
        </div>

        {feedbackMessage ? (
          <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedbackMessage}
          </div>
        ) : null}
        {errorMessage || userDirectoryError ? (
          <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage ?? userDirectoryError}
          </div>
        ) : null}
      </Card> : null}

      <Card className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="theme-text-strong text-xl font-black tracking-tight">员工角色表</div>
            <div className="theme-text-muted mt-2 text-sm">
              默认前端分页，每页 20 条，可直接按行进入角色设置。
            </div>
          </div>

          <div className="flex w-full max-w-[360px] items-center gap-3">
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSearchKeyword(event.target.value);
              }}
              placeholder="搜索员工姓名、账号或拼音"
              value={searchKeyword}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone="neutral">{`鍛樺伐 ${userOptions.length}`}</Badge>
          <Badge tone="neutral">{`瑙掕壊 ${roles.length}`}</Badge>
        </div>

        {feedbackMessage ? (
          <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedbackMessage}
          </div>
        ) : null}
        {errorMessage || userDirectoryError ? (
          <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage ?? userDirectoryError}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-5 py-4">员工姓名</th>
                  <th className="px-5 py-4">登录账号</th>
                  <th className="px-5 py-4">已分配角色</th>
                  <th className="px-5 py-4">角色数量</th>
                  <th className="px-5 py-4 text-right">行工具</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userDirectoryLoading || loading ? (
                  <tr>
                    <td className="px-5 py-10 text-sm text-slate-500" colSpan={5}>
                      正在加载员工权限数据...
                    </td>
                  </tr>
                ) : pageEmployees.length ? (
                  pageEmployees.map((employee) => {
                    const roleIds = roleIdsByUserId[employee.userId] ?? [];
                    const roleNames = formatRoleNames(roleIds, roles);
                    const rowLoading = loadingUserIds.includes(employee.userId);

                    return (
                      <tr key={employee.userId} className="align-top text-sm text-slate-700">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{employee.userName}</div>
                          <div className="mt-1 text-xs text-slate-400">{employee.userId}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {employee.loginAccount || '--'}
                        </td>
                        <td className="px-5 py-4">
                          <div className={cx('max-w-[420px] leading-6', rowLoading ? 'text-slate-400' : 'text-slate-600')}>
                            {rowLoading ? '角色加载中...' : roleNames}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="neutral">{rowLoading ? '--' : String(roleIds.length)}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            className={cx(
                              'inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition',
                              rowLoading || loading || !roles.length
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                : 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100',
                            )}
                            disabled={rowLoading || loading || !roles.length}
                            onClick={() => {
                              void openRoleDialog(employee);
                            }}
                            title={!roles.length ? '角色目录不可用，暂时无法设置角色' : undefined}
                            type="button"
                          >
                            设置角色
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-5 py-10 text-sm text-slate-500" colSpan={5}>
                      没有匹配的员工记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>{`第 ${safePageNumber} / ${pageCount} 页，共 ${filteredEmployees.length} 条员工记录`}</div>
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

      {dialogUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  用户权限
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  设置角色
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {dialogUser.userName}
                  {dialogUser.loginAccount ? ` / ${dialogUser.loginAccount}` : ''}
                </div>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                onClick={() => {
                  setDialogUser(null);
                  setDialogRoleIds([]);
                  setLoadedDialogRoleIds([]);
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid max-h-[420px] gap-3 overflow-auto pr-1">
              {roles.length ? (
                roles.map((role) => (
                  <label
                    key={`dialog-role-${role.roleId}`}
                    className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <input
                      checked={dialogRoleIds.includes(role.roleId)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      onChange={() => {
                        handleToggleDialogRole(role.roleId);
                      }}
                      type="checkbox"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {role.roleName}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {role.roleCode}
                      </span>
                      {role.roleDescription ? (
                        <span className="mt-2 block text-xs leading-5 text-slate-500">
                          {role.roleDescription}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                  当前还没有可分配的角色，请先到角色权限工作区创建角色。
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <div className="text-sm text-slate-500">
                {`已选 ${dialogRoleIds.length} 个角色`}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setDialogUser(null);
                    setDialogRoleIds([]);
                    setLoadedDialogRoleIds([]);
                  }}
                  tone="ghost"
                >
                  取消
                </Button>
                <Button
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

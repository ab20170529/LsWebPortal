import { useEffect, useMemo, useState } from 'react';

import type { BackendMenuNode, BackendSubsystemNode } from '../../lib/backend-menus';
import {
  createPermissionRole,
  deletePermissionRole,
  fetchEmployeeRoleWorkspace,
  fetchPermissionRoles,
  fetchRoleMenuWorkspace,
  saveEmployeeRoles,
  saveRoleMenus,
  type EmployeeRoleWorkspace,
  type PermissionRole,
  type RoleMenuWorkspace,
  type SavePermissionRoleInput,
  updatePermissionRole,
} from '../../lib/backend-role-permissions';
import { fetchEmployeeOptions, type EmployeeOption } from '../../shared/api/auth';
import { ApiError } from '../../shared/api/http';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Request failed. Please try again.';
}

function emptyRoleForm(): SavePermissionRoleInput {
  return { roleCode: '', roleDescription: '', roleName: '' };
}

function sortIds(values: Iterable<number>) {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function collectMenuIds(node: BackendSubsystemNode | BackendMenuNode): number[] {
  const result: number[] = typeof node.menuId === 'number' ? [node.menuId] : [];
  for (const child of node.children ?? []) {
    result.push(...collectMenuIds(child));
  }
  return result;
}

function MenuTreeNode({
  node,
  onToggle,
  selectedMenuIds,
  depth = 0,
}: {
  depth?: number;
  node: BackendSubsystemNode | BackendMenuNode;
  onToggle: (node: BackendSubsystemNode | BackendMenuNode) => void;
  selectedMenuIds: Set<number>;
}) {
  const branchMenuIds = collectMenuIds(node);
  const selectedCount = branchMenuIds.filter((menuId) => selectedMenuIds.has(menuId)).length;
  const checked = branchMenuIds.length > 0 && selectedCount === branchMenuIds.length;
  const partial = selectedCount > 0 && selectedCount < branchMenuIds.length;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onToggle(node)}
        disabled={branchMenuIds.length === 0}
        className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors ${
          checked
            ? 'border-primary/30 bg-primary/5'
            : partial
              ? 'border-amber-200 bg-amber-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
        style={{ marginLeft: `${depth * 14}px` }}
      >
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[12px] font-bold ${
            checked
              ? 'border-primary bg-primary text-white'
              : partial
                ? 'border-amber-300 bg-amber-100 text-amber-700'
                : 'border-slate-300 bg-white text-transparent'
          }`}
        >
          {checked ? 'Y' : partial ? '-' : 'Y'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{node.title}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
              {node.nodeType === 'subsystem' ? 'Subsystem' : 'Menu'}
            </span>
            {typeof node.menuId === 'number' ? <span className="text-[11px] text-slate-400">ID {node.menuId}</span> : null}
          </div>
          {node.code ? <p className="mt-1 text-[12px] text-slate-400">Code: {node.code}</p> : null}
        </div>
      </button>

      {(node.children?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {node.children.map((child) => (
            <MenuTreeNode key={child.id} depth={depth + 1} node={child} onToggle={onToggle} selectedMenuIds={selectedMenuIds} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RolePermissionWorkbench({ currentUserName }: { currentUserName: string }) {
  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [roleForm, setRoleForm] = useState<SavePermissionRoleInput>(emptyRoleForm);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeWorkspace, setEmployeeWorkspace] = useState<EmployeeRoleWorkspace | null>(null);
  const [selectedEmployeeRoleIds, setSelectedEmployeeRoleIds] = useState<number[]>([]);
  const [roleMenuWorkspace, setRoleMenuWorkspace] = useState<RoleMenuWorkspace | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const selectedRole = useMemo(() => roles.find((role) => role.roleId === selectedRoleId) ?? null, [roles, selectedRoleId]);
  const selectedEmployeeRoleIdSet = useMemo(() => new Set(selectedEmployeeRoleIds), [selectedEmployeeRoleIds]);
  const selectedMenuIdSet = useMemo(() => new Set(selectedMenuIds), [selectedMenuIds]);
  const initialEmployeeRoleIds = useMemo(() => sortIds(employeeWorkspace?.roleIds ?? []), [employeeWorkspace]);
  const initialMenuIds = useMemo(() => sortIds(roleMenuWorkspace?.menuIds ?? []), [roleMenuWorkspace]);

  async function reloadRoles(preferredRoleId?: number | null) {
    const data = await fetchPermissionRoles();
    const nextRoles = Array.isArray(data) ? data : [];
    setRoles(nextRoles);
    const nextRoleId = preferredRoleId ?? nextRoles[0]?.roleId ?? null;
    setSelectedRoleId(nextRoleId && nextRoles.some((role) => role.roleId === nextRoleId) ? nextRoleId : nextRoles[0]?.roleId ?? null);
  }

  useEffect(() => {
    let active = true;
    Promise.all([fetchPermissionRoles(), fetchEmployeeOptions()])
      .then(([roleData, employeeData]) => {
        if (!active) {
          return;
        }

        const nextRoles = Array.isArray(roleData) ? roleData : [];
        setRoles(nextRoles);
        setSelectedRoleId(nextRoles[0]?.roleId ?? null);
        setEmployees(Array.isArray(employeeData) ? employeeData : []);
      })
      .catch((error) => active && setErrorMessage(getErrorMessage(error)));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setRoleForm(emptyRoleForm());
      return;
    }

    setRoleForm({
      roleCode: selectedRole.roleCode,
      roleDescription: selectedRole.roleDescription ?? '',
      roleName: selectedRole.roleName,
    });
  }, [selectedRole]);

  useEffect(() => {
    let active = true;
    if (!selectedEmployeeId) {
      setEmployeeWorkspace(null);
      setSelectedEmployeeRoleIds([]);
      return;
    }

    fetchEmployeeRoleWorkspace(selectedEmployeeId)
      .then((workspace) => {
        if (!active) {
          return;
        }
        setEmployeeWorkspace(workspace);
        setSelectedEmployeeRoleIds(sortIds(workspace.roleIds));
      })
      .catch((error) => active && setErrorMessage(getErrorMessage(error)));
    return () => {
      active = false;
    };
  }, [selectedEmployeeId]);

  useEffect(() => {
    let active = true;
    if (!selectedRoleId) {
      setRoleMenuWorkspace(null);
      setSelectedMenuIds([]);
      return;
    }

    fetchRoleMenuWorkspace(selectedRoleId)
      .then((workspace) => {
        if (!active) {
          return;
        }
        setRoleMenuWorkspace(workspace);
        setSelectedMenuIds(sortIds(workspace.menuIds));
      })
      .catch((error) => active && setErrorMessage(getErrorMessage(error)));
    return () => {
      active = false;
    };
  }, [selectedRoleId]);

  const employeeRoleDirty = sortIds(selectedEmployeeRoleIds).join(',') !== initialEmployeeRoleIds.join(',');
  const roleMenuDirty = sortIds(selectedMenuIds).join(',') !== initialMenuIds.join(',');

  const handleSaveRole = async () => {
    const payload = {
      roleCode: roleForm.roleCode.trim(),
      roleDescription: roleForm.roleDescription?.trim() ?? '',
      roleName: roleForm.roleName.trim(),
    };

    if (!payload.roleCode || !payload.roleName) {
      setErrorMessage('Role code and role name are required.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const savedRole = selectedRoleId ? await updatePermissionRole(selectedRoleId, payload) : await createPermissionRole(payload);
      await reloadRoles(savedRole.roleId);
      setFeedbackMessage(selectedRoleId ? 'Role updated.' : 'Role created.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleId || !selectedRole || !window.confirm(`Delete role "${selectedRole.roleName}"?`)) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      await deletePermissionRole(selectedRoleId);
      await reloadRoles(null);
      setRoleMenuWorkspace(null);
      setSelectedMenuIds([]);
      setFeedbackMessage('Role deleted.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveEmployeeRoles = async () => {
    if (!selectedEmployeeId) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const workspace = await saveEmployeeRoles(selectedEmployeeId, selectedEmployeeRoleIds);
      setEmployeeWorkspace(workspace);
      setSelectedEmployeeRoleIds(sortIds(workspace.roleIds));
      setFeedbackMessage('Employee roles saved.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleMenuBranch = (node: BackendSubsystemNode | BackendMenuNode) => {
    const branchMenuIds = collectMenuIds(node);
    setSelectedMenuIds((current) => {
      const currentSet = new Set(current);
      const shouldSelect = branchMenuIds.some((menuId) => !currentSet.has(menuId));
      for (const menuId of branchMenuIds) {
        if (shouldSelect) {
          currentSet.add(menuId);
        } else {
          currentSet.delete(menuId);
        }
      }
      return sortIds(currentSet);
    });
  };

  const handleSaveRoleMenus = async () => {
    if (!selectedRoleId) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const workspace = await saveRoleMenus(selectedRoleId, selectedMenuIds);
      setRoleMenuWorkspace(workspace);
      setSelectedMenuIds(sortIds(workspace.menuIds));
      await reloadRoles(selectedRoleId);
      setFeedbackMessage('Role menu permissions saved.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">Roles</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">User Roles</h3>
            </div>
            <button type="button" onClick={() => { setSelectedRoleId(null); setRoleForm(emptyRoleForm()); }} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white">New Role</button>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <input value={roleForm.roleCode} onChange={(event) => setRoleForm((current) => ({ ...current, roleCode: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none" placeholder="Role code" />
            <input value={roleForm.roleName} onChange={(event) => setRoleForm((current) => ({ ...current, roleName: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none" placeholder="Role name" />
            <textarea value={roleForm.roleDescription} onChange={(event) => setRoleForm((current) => ({ ...current, roleDescription: event.target.value }))} className="min-h-[88px] resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none" placeholder="Role description" />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void handleSaveRole()} disabled={isBusy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{selectedRoleId ? 'Update Role' : 'Create Role'}</button>
              {selectedRoleId ? <button type="button" onClick={() => void handleDeleteRole()} disabled={isBusy} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-60">Delete Role</button> : null}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {roles.map((role) => (
              <button key={role.roleId} type="button" onClick={() => setSelectedRoleId(role.roleId)} className={`w-full rounded-2xl border px-4 py-3 text-left ${role.roleId === selectedRoleId ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{role.roleName}</p>
                    <p className="mt-1 text-[12px] text-slate-400">{role.roleCode}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>{role.employeeCount} users</div>
                    <div>{role.menuCount} menus</div>
                  </div>
                </div>
              </button>
            ))}
            {!roles.length ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">No roles yet. Create one first.</div> : null}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-700">Employee Roles</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Employee Assignment</h3>
          <p className="mt-2 text-sm text-slate-500">Current admin: {currentUserName}</p>
          <select value={selectedEmployeeId ?? ''} onChange={(event) => setSelectedEmployeeId(event.target.value ? Number(event.target.value) : null)} className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none">
            <option value="">Select an employee</option>
            {employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeName} / {employee.loginAccount || 'No account'}</option>)}
          </select>
          <div className="mt-4 space-y-2">
            {roles.map((role) => (
              <label key={`assign-${role.roleId}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <input type="checkbox" checked={selectedEmployeeRoleIdSet.has(role.roleId)} onChange={() => setSelectedEmployeeRoleIds((current) => current.includes(role.roleId) ? current.filter((item) => item !== role.roleId) : sortIds([...current, role.roleId]))} disabled={!selectedEmployeeId} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{role.roleName}</p>
                  <p className="text-[12px] text-slate-400">{role.roleCode}</p>
                </div>
              </label>
            ))}
          </div>
          <button type="button" onClick={() => void handleSaveEmployeeRoles()} disabled={!selectedEmployeeId || !employeeRoleDirty || isBusy} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save Employee Roles</button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-violet-700">Role Menus</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Menu Permissions</h3>
            <p className="mt-2 text-sm text-slate-500">{selectedRole ? `Selected role: ${selectedRole.roleName}` : 'Select a role first.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setSelectedMenuIds(sortIds(collectMenuIds({ children: roleMenuWorkspace?.menuTree ?? [], code: '', enabled: true, id: 'root', nodeType: 'subsystem', subsysId: 0, title: 'All menus' } as BackendSubsystemNode)))} disabled={!roleMenuWorkspace || isBusy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-60">Grant All</button>
            <button type="button" onClick={() => setSelectedMenuIds([])} disabled={!roleMenuWorkspace || isBusy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-60">Clear All</button>
            <button type="button" onClick={() => void handleSaveRoleMenus()} disabled={!selectedRoleId || !roleMenuDirty || isBusy} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save Menu Permissions</button>
          </div>
        </div>

        {feedbackMessage ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</div> : null}
        {errorMessage ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}

        <div className="mt-5 max-h-[1200px] space-y-3 overflow-y-auto pr-2">
          {roleMenuWorkspace?.menuTree?.length ? roleMenuWorkspace.menuTree.map((subsystem) => (
            <MenuTreeNode key={subsystem.id} node={subsystem} onToggle={handleToggleMenuBranch} selectedMenuIds={selectedMenuIdSet} />
          )) : <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">No menu tree available for the current account set.</div>}
        </div>
      </div>
    </section>
  );
}

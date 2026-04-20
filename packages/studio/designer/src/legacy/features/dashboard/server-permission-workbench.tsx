import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createServerCompany,
  fetchServerPermissionWorkspace,
  saveServerPermissionWorkspace,
  type CreateServerCompanyInput,
  type ServerPermissionWorkspace,
} from '../../lib/backend-server-permissions';
import { fetchEmployeeOptions, type EmployeeOption } from '../../shared/api/auth';
import { ApiError } from '../../shared/api/http';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '请求失败，请稍后重试。';
}

function formatServerAddress(serverip: string, serverport: number, basename: string) {
  return `${serverip}:${serverport} / ${basename}`;
}

function createEmptyCompanyDraft(): CreateServerCompanyInput {
  return {
    baseName: '',
    serverIp: '',
    serverPort: 16890,
    title: '',
  };
}

function matchCompanyKeyword(
  keyword: string,
  company: NonNullable<ServerPermissionWorkspace['companies']>[number],
) {
  if (!keyword) {
    return true;
  }

  return [
    company.title,
    company.serverip,
    company.basename,
    String(company.serverport),
  ]
    .join(' ')
    .toLowerCase()
    .includes(keyword);
}

export function ServerPermissionWorkbench({
  currentUserName,
}: {
  currentUserName: string;
}) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeKeyword, setEmployeeKeyword] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCompanyCreatorOpen, setIsCompanyCreatorOpen] = useState(false);
  const [workspace, setWorkspace] = useState<ServerPermissionWorkspace | null>(null);
  const [selectedCompanyKeys, setSelectedCompanyKeys] = useState<string[]>([]);
  const [companyKeyword, setCompanyKeyword] = useState('');
  const [companyDraft, setCompanyDraft] = useState<CreateServerCompanyInput>(createEmptyCompanyDraft);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const employeeSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (employeeSelectorRef.current && !employeeSelectorRef.current.contains(event.target as Node)) {
        setIsEmployeeOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === null) {
      return null;
    }

    return employees.find((employee) => employee.employeeId === selectedEmployeeId) ?? null;
  }, [employees, selectedEmployeeId]);

  const employeeSuggestions = useMemo(() => {
    const keyword = employeeKeyword.trim().toLowerCase();
    if (!keyword) {
      return employees.slice(0, 12);
    }

    return employees.filter((employee) => (
      [employee.employeeName, employee.loginAccount, employee.py]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    )).slice(0, 12);
  }, [employeeKeyword, employees]);

  useEffect(() => {
    const keyword = employeeKeyword.trim().toLowerCase();
    if (!keyword) {
      return;
    }

    const matchedEmployee = employees.find((employee) => {
      return [employee.employeeName, employee.loginAccount, employee.py]
        .map((value) => value.trim().toLowerCase())
        .includes(keyword);
    }) ?? null;

    if (!matchedEmployee) {
      return;
    }

    if (matchedEmployee.employeeId !== selectedEmployeeId) {
      setSelectedEmployeeId(matchedEmployee.employeeId);
    }
  }, [employeeKeyword, employees, selectedEmployeeId]);

  const activePermissionKeys = useMemo(() => new Set(selectedCompanyKeys), [selectedCompanyKeys]);
  const initialPermissionKeys = useMemo(() => new Set(
    workspace?.companies.filter((company) => company.permissionEnabled).map((company) => company.companyKey) ?? [],
  ), [workspace]);
  const filteredCompanies = useMemo(() => {
    const keyword = companyKeyword.trim().toLowerCase();
    return (workspace?.companies ?? []).filter((company) => matchCompanyKeyword(keyword, company));
  }, [companyKeyword, workspace]);
  const visibleCompanyKeys = useMemo(() => filteredCompanies.map((company) => company.companyKey), [filteredCompanies]);
  const visibleCompanyKeySet = useMemo(() => new Set(visibleCompanyKeys), [visibleCompanyKeys]);
  const totalCompanyCount = workspace?.companies.length ?? 0;
  const enabledCompanyCount = selectedCompanyKeys.length;
  const visibleEnabledCompanyCount = filteredCompanies.filter((company) => activePermissionKeys.has(company.companyKey)).length;
  const hasCustomPermissions = workspace?.hasCustomPermissions ?? false;
  const isDirty = useMemo(() => {
    if (!workspace) {
      return false;
    }

    if (initialPermissionKeys.size !== activePermissionKeys.size) {
      return true;
    }

    for (const companyKey of activePermissionKeys) {
      if (!initialPermissionKeys.has(companyKey)) {
        return true;
      }
    }

    return false;
  }, [activePermissionKeys, initialPermissionKeys, workspace]);

  useEffect(() => {
    let isActive = true;

    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      setErrorMessage(null);

      try {
        const data = await fetchEmployeeOptions();
        if (!isActive) {
          return;
        }

        const nextEmployees = Array.isArray(data) ? data : [];
        setEmployees(nextEmployees);
        setSelectedEmployeeId((prev) => (
          prev !== null && nextEmployees.some((employee) => employee.employeeId === prev)
            ? prev
            : null
        ));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
        setEmployees([]);
      } finally {
        if (isActive) {
          setIsLoadingEmployees(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadWorkspace = async () => {
      if (!selectedEmployeeId) {
        setWorkspace(null);
        setSelectedCompanyKeys([]);
        return;
      }

      setIsLoadingWorkspace(true);
      setErrorMessage(null);

      try {
        const data = await fetchServerPermissionWorkspace(selectedEmployeeId);
        if (!isActive) {
          return;
        }

        setWorkspace(data);
        setSelectedCompanyKeys(data.companies.filter((company) => company.permissionEnabled).map((company) => company.companyKey));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setWorkspace(null);
        setSelectedCompanyKeys([]);
        setErrorMessage(getErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoadingWorkspace(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      isActive = false;
    };
  }, [selectedEmployeeId]);

  const toggleCompanyPermission = (companyKey: string) => {
    setSelectedCompanyKeys((prev) => (
      prev.includes(companyKey)
        ? prev.filter((item) => item !== companyKey)
        : [...prev, companyKey]
    ));
  };

  const grantVisibleCompanies = () => {
    setSelectedCompanyKeys((prev) => {
      const nextKeys = new Set(prev);
      for (const companyKey of visibleCompanyKeys) {
        nextKeys.add(companyKey);
      }

      return Array.from(nextKeys);
    });
  };

  const revokeVisibleCompanies = () => {
    setSelectedCompanyKeys((prev) => prev.filter((companyKey) => !visibleCompanyKeySet.has(companyKey)));
  };

  const restoreSavedPermissions = () => {
    setSelectedCompanyKeys(Array.from(initialPermissionKeys));
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      setErrorMessage('请先选择要配置权限的员工。');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const nextWorkspace = await saveServerPermissionWorkspace(selectedEmployeeId, selectedCompanyKeys);
      setWorkspace(nextWorkspace);
      setSelectedCompanyKeys(nextWorkspace.companies.filter((company) => company.permissionEnabled).map((company) => company.companyKey));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCompany = async () => {
    const normalizedTitle = companyDraft.title.trim();
    const normalizedServerIp = companyDraft.serverIp.trim();
    const normalizedBaseName = companyDraft.baseName.trim();
    const normalizedServerPort = Number(companyDraft.serverPort);

    if (!normalizedTitle || !normalizedServerIp || !normalizedBaseName || !Number.isFinite(normalizedServerPort)) {
      setErrorMessage('请完整填写新增帐套所需的名称、地址、端口和数据库。');
      return;
    }

    setIsCreatingCompany(true);
    setErrorMessage(null);

    try {
      const createdCompany = await createServerCompany({
        baseName: normalizedBaseName,
        serverIp: normalizedServerIp,
        serverPort: normalizedServerPort,
        title: normalizedTitle,
      });

      setCompanyDraft(createEmptyCompanyDraft());
      setIsCompanyCreatorOpen(false);
      setCompanyKeyword(createdCompany.title);

      if (selectedEmployeeId) {
        const nextWorkspace = await fetchServerPermissionWorkspace(selectedEmployeeId);
        setWorkspace(nextWorkspace);
        setSelectedCompanyKeys((prev) => {
          const nextKeys = new Set(prev);
          for (const company of nextWorkspace.companies) {
            if (company.permissionEnabled) {
              nextKeys.add(company.companyKey);
            }
          }

          nextKeys.add(createdCompany.companyKey);
          return Array.from(nextKeys);
        });
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsCreatingCompany(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_22px_46px_-40px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(300px,1.15fr)_minmax(260px,0.85fr)]">
              <div ref={employeeSelectorRef} className="relative min-w-0">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">选择员工</label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    disabled={isLoadingEmployees}
                    placeholder={isLoadingEmployees ? '正在加载员工...' : '搜索员工姓名或登录账号'}
                    type="text"
                    value={employeeKeyword}
                    onChange={(event) => {
                      setEmployeeKeyword(event.target.value);
                      setSelectedEmployeeId(null);
                      setIsEmployeeOpen(true);
                    }}
                    onFocus={() => setIsEmployeeOpen(true)}
                  />
                  <button
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-primary"
                    disabled={isLoadingEmployees}
                    type="button"
                    onClick={() => setIsEmployeeOpen((open) => !open)}
                  >
                    <span className={`material-symbols-outlined transition-transform ${isEmployeeOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>

                <AnimatePresence>
                  {isEmployeeOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-[24px] border border-white/80 bg-white/92 shadow-[0_28px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl"
                    >
                      <div className="max-h-72 overflow-y-auto p-2">
                        {employeeSuggestions.length > 0 ? (
                          employeeSuggestions.map((employee) => {
                            const isActive = employee.employeeId === selectedEmployeeId;

                            return (
                              <button
                                key={employee.employeeId}
                                className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-all ${
                                  isActive
                                    ? 'bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(255,255,255,0.92))] text-slate-900 shadow-[0_16px_28px_-24px_rgba(14,116,144,0.95)]'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                                type="button"
                                onClick={() => {
                                  setSelectedEmployeeId(employee.employeeId);
                                  setEmployeeKeyword(employee.employeeName);
                                  setIsEmployeeOpen(false);
                                }}
                              >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                                  isActive ? 'border-primary/20 bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-400'
                                }`}>
                                  <span className="material-symbols-outlined text-[18px]">{isActive ? 'check' : 'person'}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-semibold">{employee.employeeName}</div>
                                  <div className="truncate text-xs text-slate-400">{employee.loginAccount || '未配置登录账号'}</div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-5 text-sm text-slate-400">没有找到匹配的员工</div>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">筛选帐套</label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    placeholder="按帐套名称、IP 或数据库搜索"
                    type="text"
                    value={companyKeyword}
                    onChange={(event) => setCompanyKeyword(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
                type="button"
                onClick={() => setIsCompanyCreatorOpen((open) => !open)}
              >
                {isCompanyCreatorOpen ? '收起新增帐套' : '新增帐套'}
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!workspace || isLoadingWorkspace || filteredCompanies.length === 0}
                type="button"
                onClick={grantVisibleCompanies}
              >
                授权当前结果
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!workspace || isLoadingWorkspace || filteredCompanies.length === 0}
                type="button"
                onClick={revokeVisibleCompanies}
              >
                取消当前结果
              </button>
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!workspace || isLoadingWorkspace || !isDirty}
                type="button"
                onClick={restoreSavedPermissions}
              >
                恢复已保存
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-erp-blue disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                disabled={!workspace || !selectedEmployee || !isDirty || isSaving || isLoadingWorkspace}
                type="button"
                onClick={() => void handleSave()}
              >
                <span className="material-symbols-outlined text-[18px]">{isSaving ? 'progress_activity' : 'save'}</span>
                {isSaving ? '保存中...' : '保存权限'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              当前管理员：{currentUserName}
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {selectedEmployee
                ? `当前员工：${selectedEmployee.employeeName} / ${selectedEmployee.loginAccount || '未配置账号'}`
                : '未选择员工，登录页会先展示全部帐套'}
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              总帐套 {totalCompanyCount}
            </div>
            <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              已勾选 {enabledCompanyCount}
            </div>
            <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              当前结果 {filteredCompanies.length} / 已授权 {visibleEnabledCompanyCount}
            </div>
            {selectedEmployee ? (
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {hasCustomPermissions ? '当前员工已启用自定义帐套范围' : '当前员工尚未授权任何帐套，登录页将不显示可选帐套'}
              </div>
            ) : null}
          </div>

          <AnimatePresence>
            {isCompanyCreatorOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-[24px] border border-cyan-100 bg-cyan-50/60 p-4"
              >
                <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_160px_1fr_auto]">
                  <input
                    className="h-11 rounded-2xl border border-cyan-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="帐套名称"
                    type="text"
                    value={companyDraft.title}
                    onChange={(event) => setCompanyDraft((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <input
                    className="h-11 rounded-2xl border border-cyan-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="服务器地址"
                    type="text"
                    value={companyDraft.serverIp}
                    onChange={(event) => setCompanyDraft((prev) => ({ ...prev, serverIp: event.target.value }))}
                  />
                  <input
                    className="h-11 rounded-2xl border border-cyan-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="端口"
                    type="number"
                    value={companyDraft.serverPort}
                    onChange={(event) => setCompanyDraft((prev) => ({ ...prev, serverPort: Number(event.target.value || 0) }))}
                  />
                  <input
                    className="h-11 rounded-2xl border border-cyan-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="数据库名"
                    type="text"
                    value={companyDraft.baseName}
                    onChange={(event) => setCompanyDraft((prev) => ({ ...prev, baseName: event.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-erp-blue disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                      disabled={isCreatingCompany}
                      type="button"
                      onClick={() => void handleCreateCompany()}
                    >
                      {isCreatingCompany ? '新增中...' : '确认新增'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/92 shadow-[0_22px_46px_-40px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h4 className="text-base font-bold text-slate-950">客户帐套授权清单</h4>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
            数据源：p_systemAllServerTab
          </div>
        </div>

        {isLoadingWorkspace ? (
          <div className="flex h-[420px] items-center justify-center text-slate-400">
            正在加载权限数据...
          </div>
        ) : workspace ? (
          <div className="h-full overflow-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <tr className="text-left text-[12px] uppercase tracking-[0.22em] text-slate-400">
                  <th className="border-b border-slate-200 px-6 py-4 font-bold">帐套名称</th>
                  <th className="border-b border-slate-200 px-6 py-4 font-bold">数据库地址</th>
                  <th className="border-b border-slate-200 px-6 py-4 font-bold">状态</th>
                  <th className="border-b border-slate-200 px-6 py-4 font-bold">授权</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => {
                  const isEnabled = activePermissionKeys.has(company.companyKey);

                  return (
                    <tr
                      key={company.companyKey}
                      className="group cursor-pointer hover:bg-slate-50/80"
                      onClick={() => toggleCompanyPermission(company.companyKey)}
                    >
                      <td className="border-b border-slate-100 px-6 py-4 align-middle">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                            isEnabled ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">{isEnabled ? 'verified_user' : 'domain'}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{company.title}</div>
                            <div className="mt-1 text-xs text-slate-400">{company.companyKey}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 align-middle">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                          {formatServerAddress(company.serverip, company.serverport, company.basename)}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 align-middle">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                          isEnabled
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          {isEnabled ? '已授权' : '未授权'}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 align-middle">
                        <button
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                            isEnabled ? 'bg-primary' : 'bg-slate-200'
                          }`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleCompanyPermission(company.companyKey);
                          }}
                        >
                          <span
                            className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                              isEnabled ? 'translate-x-9' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td className="px-6 py-14 text-center text-sm text-slate-400" colSpan={4}>
                      当前筛选条件下没有匹配的帐套
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl text-slate-300">manage_accounts</span>
            <div className="text-lg font-semibold text-slate-500">请选择员工后配置权限</div>
            <p className="max-w-md text-sm leading-6 text-slate-400">新增帐套后，可以先在上面选择员工，再给他勾选可登录的客户帐套。</p>
          </div>
        )}
      </section>
    </div>
  );
}

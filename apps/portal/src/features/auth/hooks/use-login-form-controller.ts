import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';

import { fetchEmployeeOptions, fetchServerOptions, loginWithIdentity } from '../services/auth-service';
import { resolvePortalBootstrapPayload } from '../services/portal-bootstrap-service';
import {
  clearRememberedLoginState,
  getRememberedLoginState,
  persistAuthSession,
  persistLegacyDesignerLoginContext,
  persistRememberedLoginState,
} from '../services/storage-service';
import type { AuthSession, EmployeeOption, ServerOption } from '../types';

type UseLoginFormControllerOptions = {
  onSuccess: (session: AuthSession) => void;
};

type LoginFormState = {
  companyKey: string;
  employeeId: number | null;
  employeeKeyword: string;
  password: string;
  rememberCredentials: boolean;
  showPassword: boolean;
};

function normalizeErrorMessage(error: unknown): string {
  console.error('登录失败:', error);

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    error
    && typeof error === 'object'
    && 'message' in error
    && typeof error.message === 'string'
    && error.message.trim()
  ) {
    return error.message;
  }

  return '请求失败，请稍后重试。';
}

export function useLoginFormController({ onSuccess }: UseLoginFormControllerOptions) {
  const { applyAuthBootstrap } = usePortalAuth();
  const [form, setForm] = useState<LoginFormState>(() => {
    const remembered = getRememberedLoginState();

    return {
      companyKey: remembered?.organizationKey ?? '',
      employeeId: remembered?.employeeId ?? null,
      employeeKeyword: remembered?.employeeName ?? '',
      password: remembered?.password ?? '',
      rememberCredentials: Boolean(remembered),
      showPassword: false,
    };
  });
  const [companies, setCompanies] = useState<ServerOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.companyKey === form.companyKey) ?? null,
    [companies, form.companyKey],
  );

  const selectedEmployee = useMemo(() => {
    if (form.employeeId == null) {
      return null;
    }

    return employees.find((employee) => employee.employeeId === form.employeeId) ?? null;
  }, [employees, form.employeeId]);

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      setErrorMessage(null);

      try {
        const nextCompanies = await fetchServerOptions();
        if (!active) {
          return;
        }

        const normalizedCompanies = Array.isArray(nextCompanies) ? nextCompanies : [];
        const remembered = getRememberedLoginState();
        const rememberedCompany = remembered?.organizationKey
          ? normalizedCompanies.find((company) => company.companyKey === remembered.organizationKey)
          : null;
        const defaultCompany = rememberedCompany ?? normalizedCompanies[0] ?? null;

        setCompanies(normalizedCompanies);
        setForm((current) => ({
          ...current,
          companyKey: current.companyKey || defaultCompany?.companyKey || '',
        }));
      } catch (error) {
        if (active) {
          setCompanies([]);
          setErrorMessage(normalizeErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoadingCompanies(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      if (!selectedCompany) {
        setEmployees([]);
        setIsLoadingEmployees(false);
        return;
      }

      setIsLoadingEmployees(true);
      setErrorMessage(null);

      try {
        const nextEmployees = await fetchEmployeeOptions(selectedCompany);
        if (!active) {
          return;
        }

        const normalizedEmployees = Array.isArray(nextEmployees) ? nextEmployees : [];
        const remembered = getRememberedLoginState();
        const rememberedMatchesCompany = remembered?.organizationKey === selectedCompany.companyKey;

        setEmployees(normalizedEmployees);
        setForm((current) => {
          const rememberedEmployee = rememberedMatchesCompany
            ? normalizedEmployees.find((employee) => employee.employeeId === remembered.employeeId)
            : null;
          const currentEmployee = normalizedEmployees.find(
            (employee) => employee.employeeId === current.employeeId,
          );
          const nextEmployee = rememberedEmployee ?? currentEmployee ?? null;

          return {
            ...current,
            employeeId: nextEmployee?.employeeId ?? null,
            employeeKeyword: nextEmployee?.employeeName ?? '',
          };
        });
      } catch (error) {
        if (active) {
          setEmployees([]);
          setErrorMessage(normalizeErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoadingEmployees(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      active = false;
    };
  }, [selectedCompany]);

  const companyHelperText = isLoadingCompanies
    ? '正在加载业务库...'
    : companies.length
      ? `当前可选 ${companies.length} 个业务库。`
      : '暂未获取到可用业务库。';

  const employeeHelperText = isLoadingEmployees
    ? '正在加载可登录人员...'
    : employees.length
      ? `当前可选 ${employees.length} 位人员，支持按姓名、账号或拼音搜索。`
      : '暂未获取到可登录人员。';

  const submit = useCallback(async () => {
    if (!selectedCompany) {
      setErrorMessage('请选择业务库。');
      return;
    }

    if (!selectedEmployee) {
      setErrorMessage('请选择登录人员。');
      return;
    }

    if (!form.password.trim()) {
      setErrorMessage('请输入登录密码。');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = await loginWithIdentity({
        basename: selectedCompany.basename,
        employeeId: selectedEmployee.employeeId,
        password: form.password,
        serverip: selectedCompany.serverip,
        serverport: selectedCompany.serverport,
      });

      const normalizedSession: AuthSession = {
        ...session,
        activeCompany: session.activeCompany ?? {
          companyKey: session.companyKey ?? selectedCompany.companyKey,
          datasourceCode: session.datasourceCode,
          title: session.companyTitle ?? selectedCompany.title,
        },
        companyKey: session.companyKey ?? selectedCompany.companyKey,
        companyTitle: session.companyTitle ?? selectedCompany.title,
        departmentId: selectedEmployee.departmentId || session.departmentId,
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.employeeName || session.employeeName,
        username: selectedEmployee.loginAccount || session.username,
      };

      persistAuthSession(normalizedSession, form.rememberCredentials);
      persistLegacyDesignerLoginContext({
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.employeeName,
        password: form.password,
        remember: form.rememberCredentials,
      });

      if (form.rememberCredentials) {
        persistRememberedLoginState({
          employeeId: selectedEmployee.employeeId,
          employeeName: selectedEmployee.employeeName,
          organizationKey: selectedCompany.companyKey,
          password: form.password,
        });
      } else {
        clearRememberedLoginState();
      }

      const bootstrapPayload = await resolvePortalBootstrapPayload(normalizedSession);
      applyAuthBootstrap(bootstrapPayload);
      onSuccess(normalizedSession);
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    applyAuthBootstrap,
    form.password,
    form.rememberCredentials,
    onSuccess,
    selectedCompany,
    selectedEmployee,
  ]);

  const selectCompany = useCallback((companyKey: string) => {
    setForm((current) => ({
      ...current,
      companyKey,
      employeeId: null,
      employeeKeyword: '',
    }));
    setErrorMessage(null);
  }, []);

  const selectEmployee = useCallback((employeeId: number, employeeName: string) => {
    setForm((current) => ({
      ...current,
      employeeId,
      employeeKeyword: employeeName,
    }));
    setErrorMessage(null);
  }, []);

  const setEmployeeKeyword = useCallback((employeeKeyword: string) => {
    setForm((current) => ({
      ...current,
      employeeKeyword,
    }));
  }, []);

  const setPassword = useCallback((password: string) => {
    setForm((current) => ({
      ...current,
      password,
    }));
  }, []);

  const toggleRememberCredentials = useCallback(() => {
    setForm((current) => ({
      ...current,
      rememberCredentials: !current.rememberCredentials,
    }));
  }, []);

  const toggleShowPassword = useCallback(() => {
    setForm((current) => ({
      ...current,
      showPassword: !current.showPassword,
    }));
  }, []);

  return {
    actions: {
      selectCompany,
      selectEmployee,
      setEmployeeKeyword,
      setPassword,
      submit,
      toggleRememberCredentials,
      toggleShowPassword,
    },
    companies,
    companyHelperText,
    employeeHelperText,
    employees,
    errorMessage,
    form,
    isLoadingCompanies,
    isLoadingEmployees,
    isSubmitting,
    selectedCompany,
    selectedEmployee,
  };
}

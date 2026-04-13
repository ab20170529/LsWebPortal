import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';

import {
  fetchEmployeeOptions,
  fetchServerOptions,
  loginWithPassword,
} from '../services/auth-service';
import { resolvePortalBootstrapPayload } from '../services/portal-bootstrap-service';
import {
  clearRememberedLoginState,
  getRememberedLoginState,
  persistAuthSession,
  persistRememberedLoginState,
} from '../services/storage-service';
import type { AuthSession, EmployeeOption, ServerOption } from '../types';

type UseLoginFormControllerOptions = {
  onSuccess: (session: AuthSession) => void;
};

type LoginFormState = {
  employeeId: number | null;
  employeeKeyword: string;
  organizationKey: string;
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
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return '请求失败，请稍后重试。';
}

export function useLoginFormController({
  onSuccess,
}: UseLoginFormControllerOptions) {
  const { applyAuthBootstrap } = usePortalAuth();
  const [form, setForm] = useState<LoginFormState>(() => {
    const remembered = getRememberedLoginState();

    return {
      employeeId: remembered?.employeeId ?? null,
      employeeKeyword: remembered?.employeeName ?? '',
      organizationKey: remembered?.organizationKey ?? '',
      password: remembered?.password ?? '',
      rememberCredentials: Boolean(remembered),
      showPassword: false,
    };
  });
  const [organizations, setOrganizations] = useState<ServerOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = useMemo(() => {
    if (form.employeeId == null) {
      return null;
    }

    return employees.find((employee) => employee.employeeId === form.employeeId) ?? null;
  }, [employees, form.employeeId]);

  const selectedOrganization = useMemo(() => {
    if (!form.organizationKey) {
      return null;
    }

    return (
      organizations.find(
        (organization) => organization.companyKey === form.organizationKey,
      ) ?? null
    );
  }, [form.organizationKey, organizations]);

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      setErrorMessage(null);

      try {
        const nextEmployees = await fetchEmployeeOptions();
        if (!active) {
          return;
        }

        const normalizedEmployees = Array.isArray(nextEmployees) ? nextEmployees : [];
        setEmployees(normalizedEmployees);

        const remembered = getRememberedLoginState();
        if (!remembered) {
          return;
        }

        const rememberedEmployee = normalizedEmployees.find(
          (employee) => employee.employeeId === remembered.employeeId,
        );

        if (!rememberedEmployee) {
          return;
        }

        setForm((current) => ({
          ...current,
          employeeId: rememberedEmployee.employeeId,
          employeeKeyword: rememberedEmployee.employeeName,
        }));
      } catch (error) {
        if (active) {
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
  }, []);

  useEffect(() => {
    let active = true;

    const loadOrganizations = async () => {
      if (form.employeeId == null) {
        setOrganizations([]);
        setForm((current) => ({
          ...current,
          organizationKey: '',
        }));
        return;
      }

      setIsLoadingOrganizations(true);
      setErrorMessage(null);

      try {
        const nextOrganizations = await fetchServerOptions(form.employeeId);
        if (!active) {
          return;
        }

        const normalizedOrganizations = Array.isArray(nextOrganizations)
          ? nextOrganizations
          : [];

        setOrganizations(normalizedOrganizations);

        setForm((current) => {
          const hasCurrentSelection = normalizedOrganizations.some(
            (organization) => organization.companyKey === current.organizationKey,
          );

          if (hasCurrentSelection) {
            return current;
          }

          const remembered = getRememberedLoginState();
          const rememberedKey =
            remembered?.employeeId === current.employeeId
              ? remembered.organizationKey
              : '';
          const fallbackOrganization =
            normalizedOrganizations.find(
              (organization) => organization.companyKey === rememberedKey,
            ) ?? normalizedOrganizations[0];

          return {
            ...current,
            organizationKey: fallbackOrganization?.companyKey ?? '',
          };
        });
      } catch (error) {
        if (active) {
          setErrorMessage(normalizeErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoadingOrganizations(false);
        }
      }
    };

    void loadOrganizations();

    return () => {
      active = false;
    };
  }, [form.employeeId]);

  const employeeHelperText = isLoadingEmployees
    ? '正在加载可登录人员...'
    : employees.length
      ? `当前可选 ${employees.length} 位人员，支持按姓名、账号或拼音搜索。`
      : '暂未获取到可登录人员。';

  const organizationHelperText = isLoadingOrganizations
    ? '正在加载可用账套...'
    : selectedEmployee
      ? organizations.length
        ? `已按 ${selectedEmployee.employeeName} 的权限匹配到 ${organizations.length} 个账套。`
        : '当前人员没有可登录的账套。'
      : '请先选择登录人员。';

  const submit = useCallback(async () => {
    if (!selectedEmployee) {
      setErrorMessage('请选择登录人员。');
      return;
    }

    if (!selectedOrganization) {
      setErrorMessage('请选择登录账套。');
      return;
    }

    if (!form.password.trim()) {
      setErrorMessage('请输入登录密码。');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = await loginWithPassword({
        basename: selectedOrganization.basename,
        employeeId: selectedEmployee.employeeId,
        password: form.password,
        serverip: selectedOrganization.serverip,
        serverport: selectedOrganization.serverport,
      });

      const normalizedSession: AuthSession = {
        ...session,
        companyKey: selectedOrganization.companyKey,
        companyTitle: selectedOrganization.title,
        departmentId: selectedEmployee.departmentId || session.departmentId,
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.employeeName || session.employeeName,
        username: selectedEmployee.loginAccount || session.username,
      };

      persistAuthSession(normalizedSession, form.rememberCredentials);

      if (form.rememberCredentials) {
        persistRememberedLoginState({
          employeeId: selectedEmployee.employeeId,
          employeeName: selectedEmployee.employeeName,
          organizationKey: selectedOrganization.companyKey,
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
    selectedEmployee,
    selectedOrganization,
  ]);

  const selectEmployee = useCallback((employeeId: number, employeeName: string) => {
    setForm((current) => ({
      ...current,
      employeeId,
      employeeKeyword: employeeName,
      organizationKey: '',
    }));
    setErrorMessage(null);
  }, []);

  const setEmployeeKeyword = useCallback((employeeKeyword: string) => {
    setForm((current) => ({
      ...current,
      employeeKeyword,
    }));
  }, []);

  const setOrganizationKey = useCallback((organizationKey: string) => {
    setForm((current) => ({
      ...current,
      organizationKey,
    }));
    setErrorMessage(null);
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
      selectEmployee,
      setEmployeeKeyword,
      setOrganizationKey,
      setPassword,
      submit,
      toggleRememberCredentials,
      toggleShowPassword,
    },
    employeeHelperText,
    employees,
    errorMessage,
    form,
    isLoadingEmployees,
    isLoadingOrganizations,
    isSubmitting,
    organizationHelperText,
    organizations,
    selectedEmployee,
    selectedOrganization,
  };
}

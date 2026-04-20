import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';

import { fetchEmployeeOptions, loginWithIdentity } from '../services/auth-service';
import { resolvePortalBootstrapPayload } from '../services/portal-bootstrap-service';
import {
  clearRememberedLoginState,
  getRememberedLoginState,
  persistAuthSession,
  persistLegacyDesignerLoginContext,
  persistRememberedLoginState,
} from '../services/storage-service';
import type { AuthSession, EmployeeOption } from '../types';

type UseLoginFormControllerOptions = {
  onSuccess: (session: AuthSession) => void;
};

type LoginFormState = {
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
      employeeId: remembered?.employeeId ?? null,
      employeeKeyword: remembered?.employeeName ?? '',
      password: remembered?.password ?? '',
      rememberCredentials: Boolean(remembered),
      showPassword: false,
    };
  });
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = useMemo(() => {
    if (form.employeeId == null) {
      return null;
    }

    return employees.find((employee) => employee.employeeId === form.employeeId) ?? null;
  }, [employees, form.employeeId]);

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

  const employeeHelperText = isLoadingEmployees
    ? '正在加载可登录人员...'
    : employees.length
      ? `当前可选 ${employees.length} 位人员，支持按姓名、账号或拼音搜索。`
      : '暂未获取到可登录人员。';

  const submit = useCallback(async () => {
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
        employeeId: selectedEmployee.employeeId,
        password: form.password,
      });

      const normalizedSession: AuthSession = {
        ...session,
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
  ]);

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
      selectEmployee,
      setEmployeeKeyword,
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
    isSubmitting,
    selectedEmployee,
  };
}

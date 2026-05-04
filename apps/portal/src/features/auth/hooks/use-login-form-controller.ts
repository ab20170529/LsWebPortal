import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePortalAuth } from '@lserp/auth';

import {
  fetchAccessibleCompanies,
  fetchTenantOptions,
  loginWithIdentity,
} from '../services/auth-service';
import { resolvePortalBootstrapPayload } from '../services/portal-bootstrap-service';
import {
  clearRememberedLoginState,
  getRememberedLoginState,
  persistAuthSession,
  persistLegacyDesignerLoginContext,
  persistRememberedLoginState,
} from '../services/storage-service';
import type { AuthSession, TenantOption } from '../types';

type LoginSuccessTarget = '/business-dbs' | '/systems';

type UseLoginFormControllerOptions = {
  onSuccess: (session: AuthSession, target: LoginSuccessTarget) => void;
};

type LoginFormState = {
  loginAccount: string;
  password: string;
  rememberCredentials: boolean;
  showPassword: boolean;
  tenantCode: string;
};

const PLATFORM_DEFAULT_TENANT: TenantOption = {
  tenantCode: '',
  tenantName: '平台默认库',
  tenantType: 'PLATFORM',
  status: 'ACTIVE',
  enableFlag: 1,
  remark: '不进入租户库，使用平台默认库登录',
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
      loginAccount: remembered?.loginAccount ?? remembered?.employeeName ?? '',
      password: remembered?.password ?? '',
      rememberCredentials: Boolean(remembered),
      showPassword: false,
      tenantCode: remembered?.tenantCode ?? '',
    };
  });
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.tenantCode === form.tenantCode) ?? null,
    [form.tenantCode, tenants],
  );
  const isSingleDatabaseMode = !isLoadingTenants && tenants.length === 0;

  useEffect(() => {
    let active = true;

    const loadTenants = async () => {
      setIsLoadingTenants(true);
      setErrorMessage(null);

      try {
        const nextTenants = await fetchTenantOptions();
        if (!active) {
          return;
        }

        const normalizedTenants = Array.isArray(nextTenants) ? nextTenants : [];
        const tenantOptions = [PLATFORM_DEFAULT_TENANT, ...normalizedTenants];
        const remembered = getRememberedLoginState();
        const rememberedTenant = remembered?.tenantCode
          ? tenantOptions.find((tenant) => tenant.tenantCode === remembered.tenantCode)
          : null;
        const defaultTenant = rememberedTenant ?? PLATFORM_DEFAULT_TENANT;

        setTenants(tenantOptions);
        setForm((current) => ({
          ...current,
          tenantCode: current.tenantCode || defaultTenant?.tenantCode || '',
        }));
      } catch (error) {
        if (active) {
          setTenants([]);
          setErrorMessage(normalizeErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoadingTenants(false);
        }
      }
    };

    void loadTenants();

    return () => {
      active = false;
    };
  }, []);

  const tenantHelperText = isLoadingTenants
    ? '正在加载平台租户...'
    : tenants.length
      ? `当前可选 ${Math.max(tenants.length - 1, 0)} 个租户，也可进入平台默认库。`
      : '未配置租户，当前使用平台默认库单库模式。';

  const submit = useCallback(async () => {
    const loginAccount = form.loginAccount.trim();

    if (tenants.length > 0 && !selectedTenant) {
      setErrorMessage('请选择租户。');
      return;
    }

    if (!loginAccount) {
      setErrorMessage('请输入姓名或工号。');
      return;
    }

    if (!form.password.trim()) {
      setErrorMessage('请输入登录密码。');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const activeTenantCode = selectedTenant?.tenantCode || undefined;
      const isTenantDatabaseLogin = Boolean(activeTenantCode);
      const session = await loginWithIdentity({
        loginAccount,
        password: form.password,
        tenantCode: activeTenantCode,
      });

      const normalizedSession: AuthSession = {
        ...session,
        activeCompany: session.loginStage === 'company' ? session.activeCompany : null,
        businessDbRequired: session.businessDbRequired,
        loginStage: session.loginStage ?? (isTenantDatabaseLogin ? 'tenant' : 'company'),
        tenantCode: session.tenantCode ?? activeTenantCode,
        tenantName: session.tenantName ?? (isTenantDatabaseLogin ? selectedTenant?.tenantName : undefined),
        username: session.username || loginAccount,
      };

      persistAuthSession(normalizedSession, form.rememberCredentials);
      persistLegacyDesignerLoginContext({
        employeeId: normalizedSession.employeeId,
        employeeName: normalizedSession.employeeName,
        password: form.password,
        remember: form.rememberCredentials,
      });

      if (form.rememberCredentials) {
        persistRememberedLoginState({
          employeeId: normalizedSession.employeeId,
          employeeName: normalizedSession.employeeName,
          loginAccount,
          password: form.password,
          tenantCode: activeTenantCode,
        });
      } else {
        clearRememberedLoginState();
      }

      const businessDbs = isTenantDatabaseLogin && normalizedSession.accessToken
        ? await fetchAccessibleCompanies(normalizedSession.accessToken)
        : [];
      const nextSession = {
        ...normalizedSession,
        businessDbRequired: isTenantDatabaseLogin ? businessDbs.length > 0 : false,
      };

      persistAuthSession(nextSession, form.rememberCredentials);
      const bootstrapPayload = await resolvePortalBootstrapPayload(nextSession);
      applyAuthBootstrap(bootstrapPayload);
      onSuccess(nextSession, businessDbs.length > 0 ? '/business-dbs' : '/systems');
    } catch (error) {
      setErrorMessage(normalizeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    applyAuthBootstrap,
    form.loginAccount,
    form.password,
    form.rememberCredentials,
    onSuccess,
    selectedTenant,
    tenants.length,
  ]);

  const selectTenant = useCallback((tenantCode: string) => {
    setForm((current) => ({
      ...current,
      tenantCode,
    }));
    setErrorMessage(null);
  }, []);

  const setLoginAccount = useCallback((loginAccount: string) => {
    setForm((current) => ({
      ...current,
      loginAccount,
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
      selectTenant,
      setLoginAccount,
      setPassword,
      submit,
      toggleRememberCredentials,
      toggleShowPassword,
    },
    errorMessage,
    form,
    isLoadingTenants,
    isSingleDatabaseMode,
    isSubmitting,
    selectedTenant,
    tenantHelperText,
    tenants,
  };
}

import { apiConfig, appConfig } from '../../../config';
import type {
  AuthActiveCompany,
  AuthLoginStage,
  AuthSession,
  CompanySessionPayload,
  EmployeeOption,
  IdentityLoginPayload,
  ServerOption,
  TenantOption,
} from '../types';
import { apiRequest } from './http-client';

const FIXED_EMPLOYEE_DIRECTORY_QUERY = {
  basename: 'lserp_yw_jt',
  serverip: '114.116.152.217',
  serverport: 16890,
} as const;

type EmployeeDirectoryQuery = Pick<ServerOption, 'basename' | 'serverip' | 'serverport'>;

const FALLBACK_EMPLOYEES: EmployeeOption[] = [
  {
    departmentId: 'dept-platform',
    employeeId: 1,
    employeeName: '张伟',
    loginAccount: 'zhangwei',
    py: 'zw',
  },
  {
    departmentId: 'dept-project',
    employeeId: 2,
    employeeName: '王秀娟',
    loginAccount: 'wangxiujuan',
    py: 'wxj',
  },
  {
    departmentId: 'dept-project',
    employeeId: 3,
    employeeName: '李明',
    loginAccount: 'liming',
    py: 'lm',
  },
  {
    departmentId: 'dept-platform',
    employeeId: 4,
    employeeName: '张又新',
    loginAccount: 'zhangyouxin',
    py: 'zyx',
  },
];

type AuthSessionResponse = Omit<AuthSession, 'activeCompany' | 'admin' | 'loginStage'> & {
  activeCompany?: AuthActiveCompany | null;
  admin?: boolean;
  isAdmin?: boolean;
  loginStage?: AuthLoginStage;
};

function normalizeActiveCompany(session: AuthSessionResponse): AuthActiveCompany | null {
  if (session.loginStage === 'tenant') {
    return null;
  }

  if (session.activeCompany?.companyKey) {
    return session.activeCompany;
  }

  if (!session.companyKey && !session.datasourceCode && !session.companyTitle) {
    return null;
  }

  return {
    companyKey: session.companyKey ?? '',
    datasourceCode: session.datasourceCode,
    title: session.companyTitle,
  };
}

function normalizeSession(session: AuthSessionResponse): AuthSession {
  const activeCompany = normalizeActiveCompany(session);

  return {
    ...session,
    activeCompany,
    admin: session.admin ?? session.isAdmin,
    companyKey: activeCompany?.companyKey ?? session.companyKey,
    companyTitle: activeCompany?.title ?? session.companyTitle,
    datasourceCode: activeCompany?.datasourceCode ?? session.datasourceCode,
    employeeName: session.employeeName,
    loginStage:
      session.loginStage
      ?? (activeCompany?.companyKey || activeCompany?.datasourceCode ? 'company' : 'identity'),
  };
}

export async function fetchEmployeeOptions(query: EmployeeDirectoryQuery = FIXED_EMPLOYEE_DIRECTORY_QUERY): Promise<EmployeeOption[]> {
  try {
    const employees = await apiRequest<EmployeeOption[]>(apiConfig.auth.employees, {
      method: 'GET',
      query,
    });

    if (Array.isArray(employees) && employees.length > 0) {
      return employees;
    }

    return appConfig.features.enableMockData ? FALLBACK_EMPLOYEES : employees;
  } catch (error) {
    if (!appConfig.features.enableMockData) {
      throw error;
    }

    console.warn('员工目录接口不可用，已启用本地预览人员。', error);
    return FALLBACK_EMPLOYEES;
  }
}

export async function fetchServerOptions(employeeId?: number): Promise<ServerOption[]> {
  return apiRequest<ServerOption[]>(apiConfig.system.allServers, {
    method: 'GET',
    query: employeeId ? { employeeId } : undefined,
  });
}

export async function fetchTenantOptions(): Promise<TenantOption[]> {
  return apiRequest<TenantOption[]>(apiConfig.auth.tenants, {
    method: 'GET',
  });
}

export async function fetchAccessibleCompanies(accessToken: string): Promise<ServerOption[]> {
  return apiRequest<ServerOption[]>(apiConfig.auth.businessDbs, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'GET',
  });
}

export async function loginWithIdentity(payload: IdentityLoginPayload): Promise<AuthSession> {
  try {
    return await loginWithPassword(payload);
  } catch (error) {
    if (!appConfig.features.enableMockData) {
      throw error;
    }

    const fallbackEmployee = FALLBACK_EMPLOYEES.find(
      (employee) =>
        employee.employeeId === payload.employeeId
        || employee.loginAccount === payload.loginAccount
        || employee.employeeName === payload.loginAccount,
    );

    if (!fallbackEmployee) {
      throw error;
    }

    console.warn('身份登录接口不可用，已启用本地预览登录。', error);
    return normalizeSession({
      accessToken: '',
      activeCompany: {
        companyKey: 'demo-company',
        datasourceCode: 'demo-company',
        title: '朗速科技演示库',
      },
      admin: fallbackEmployee.employeeId === 1 || fallbackEmployee.employeeId === 4,
      companyKey: 'demo-company',
      companyTitle: '朗速科技演示库',
      datasourceCode: 'demo-company',
      departmentId: fallbackEmployee.departmentId,
      employeeId: fallbackEmployee.employeeId,
      employeeName: fallbackEmployee.employeeName,
      expiresAt: '',
      loginStage: payload.tenantCode ? 'tenant' : 'company',
      tenantCode: payload.tenantCode,
      tokenType: 'Preview',
      tokenVersion: 1,
      username: fallbackEmployee.loginAccount,
    });
  }
}

export async function activateCompanySession(
  accessToken: string,
  payload: CompanySessionPayload,
): Promise<AuthSession> {
  const response = await apiRequest<AuthSessionResponse>(apiConfig.auth.businessDbSession, {
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });

  return normalizeSession(response);
}

export async function loginWithPassword(payload: {
  basename?: string;
  employeeId?: number | null;
  loginAccount?: string;
  password: string;
  serverip?: string;
  serverport?: number;
  tenantCode?: string;
}): Promise<AuthSession> {
  const response = await apiRequest<AuthSessionResponse>(apiConfig.auth.login, {
    body: payload,
    method: 'POST',
  });

  return normalizeSession(response);
}

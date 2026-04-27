import { apiConfig } from '../../../config';
import type {
  AuthActiveCompany,
  AuthLoginStage,
  AuthSession,
  CompanySessionPayload,
  EmployeeOption,
  IdentityLoginPayload,
  ServerOption,
} from '../types';
import { apiRequest } from './http-client';

const FIXED_EMPLOYEE_DIRECTORY_QUERY = {
  basename: 'lserp_yw_jt',
  serverip: '114.116.152.217',
  serverport: 16890,
} as const;

type EmployeeDirectoryQuery = Pick<ServerOption, 'basename' | 'serverip' | 'serverport'>;

type AuthSessionResponse = Omit<AuthSession, 'activeCompany' | 'admin' | 'loginStage'> & {
  activeCompany?: AuthActiveCompany | null;
  admin?: boolean;
  isAdmin?: boolean;
  loginStage?: AuthLoginStage;
};

function normalizeActiveCompany(session: AuthSessionResponse): AuthActiveCompany | null {
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
  return apiRequest<EmployeeOption[]>(apiConfig.auth.employees, {
    method: 'GET',
    query,
  });
}

export async function fetchServerOptions(employeeId?: number): Promise<ServerOption[]> {
  return apiRequest<ServerOption[]>(apiConfig.system.allServers, {
    method: 'GET',
    query: employeeId ? { employeeId } : undefined,
  });
}

export async function fetchAccessibleCompanies(accessToken: string): Promise<ServerOption[]> {
  return apiRequest<ServerOption[]>(apiConfig.auth.companies, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'GET',
  });
}

export async function loginWithIdentity(payload: IdentityLoginPayload): Promise<AuthSession> {
  return loginWithPassword(payload);
}

export async function activateCompanySession(
  accessToken: string,
  payload: CompanySessionPayload,
): Promise<AuthSession> {
  const response = await apiRequest<AuthSessionResponse>(apiConfig.auth.companySession, {
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });

  return normalizeSession(response);
}

export async function loginWithPassword(payload: {
  basename: string;
  employeeId: number;
  password: string;
  serverip: string;
  serverport: number;
}): Promise<AuthSession> {
  const response = await apiRequest<AuthSessionResponse>(apiConfig.auth.login, {
    body: payload,
    method: 'POST',
  });

  return normalizeSession(response);
}

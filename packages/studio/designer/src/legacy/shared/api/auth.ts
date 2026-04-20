import { apiRequest } from './http';

const FIXED_EMPLOYEE_DIRECTORY_QUERY = {
  basename: 'lserp_yw_jt',
  serverip: '114.116.152.217',
  serverport: 16890,
} as const;

export interface AuthActiveCompany {
  companyKey: string;
  datasourceCode?: string;
  title?: string;
}

export interface ServerOption {
  basename: string;
  companyKey: string;
  serverip: string;
  serverport: number;
  title: string;
}

export interface EmployeeOption {
  departmentId: string;
  employeeId: number;
  employeeName: string;
  loginAccount: string;
  py: string;
}

export interface LoginPayload {
  basename: string;
  employeeId: number;
  password: string;
  serverip: string;
  serverport: number;
}

export interface AuthSession {
  accessToken: string;
  activeCompany?: AuthActiveCompany | null;
  companyKey?: string;
  companyTitle?: string;
  datasourceCode?: string;
  departmentId?: string;
  employeeId: number;
  employeeName: string;
  expiresAt?: string;
  isAdmin?: boolean;
  loginStage: 'identity' | 'company';
  selectedCompanyOptionKey?: string;
  tokenType?: string;
  tokenVersion?: number;
  username: string;
}

export interface AuthMeProfile {
  activeCompany?: AuthActiveCompany | null;
  companyKey?: string;
  companyTitle?: string;
  datasourceCode?: string;
  departmentId?: string;
  employeeId: number;
  employeeName: string;
  isAdmin?: boolean;
  loginStage?: 'identity' | 'company';
  tokenVersion?: number;
  username: string;
}

type AuthSessionResponse = Omit<AuthSession, 'activeCompany' | 'loginStage' | 'isAdmin'> & {
  activeCompany?: AuthActiveCompany | null;
  admin?: boolean;
  isAdmin?: boolean;
  loginStage?: 'identity' | 'company';
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
    companyKey: activeCompany?.companyKey ?? session.companyKey,
    companyTitle: activeCompany?.title ?? session.companyTitle,
    datasourceCode: activeCompany?.datasourceCode ?? session.datasourceCode,
    isAdmin: session.isAdmin ?? session.admin,
    loginStage:
      session.loginStage
      ?? (activeCompany?.companyKey || activeCompany?.datasourceCode ? 'company' : 'identity'),
    selectedCompanyOptionKey: activeCompany?.companyKey ?? session.companyKey,
  };
}

async function requestEmployeeOptions() {
  return apiRequest<EmployeeOption[]>('/api/auth/employees', {
    method: 'GET',
    query: FIXED_EMPLOYEE_DIRECTORY_QUERY,
  });
}

export async function fetchServerOptions(employeeId?: number | null) {
  return apiRequest<ServerOption[]>('/api/system/all-servers', {
    method: 'GET',
    query: {
      employeeId,
    },
  });
}

export async function fetchAccessibleCompanies() {
  return apiRequest<ServerOption[]>('/api/auth/companies', {
    auth: true,
    method: 'GET',
  });
}

export async function fetchEmployeeOptions() {
  return requestEmployeeOptions();
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await apiRequest<AuthSessionResponse>('/api/auth/login', {
    body: payload,
    method: 'POST',
  });

  return normalizeSession(response);
}

export async function switchCompanySession(companyKey: string) {
  const response = await apiRequest<AuthSessionResponse>('/api/auth/company-session', {
    auth: true,
    body: {
      companyKey,
    },
    method: 'POST',
  });

  return normalizeSession(response);
}

export async function fetchCurrentUserProfile() {
  return apiRequest<AuthMeProfile>('/api/auth/me', {
    auth: true,
    method: 'GET',
  });
}

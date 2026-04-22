import { apiRequest } from './http';

const FIXED_EMPLOYEE_DIRECTORY_QUERY = {
  basename: 'lserp_yw_jt',
  serverip: '114.116.152.217',
  serverport: 16890,
} as const;

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
  companyKey: string;
  companyTitle: string;
  datasourceCode: string;
  departmentId: string;
  employeeId: number;
  employeeName: string;
  expiresAt: string;
  tokenType: string;
  tokenVersion: number;
  username: string;
  isAdmin?: boolean;
  selectedCompanyOptionKey?: string;
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

export async function fetchEmployeeOptions() {
  return requestEmployeeOptions();
}

export async function loginWithPassword(payload: LoginPayload) {
  return apiRequest<AuthSession>('/api/auth/login', {
    body: payload,
    method: 'POST',
  });
}

import { apiRequest } from './http-client';
import type { ServerOption, EmployeeOption, LoginPayload, AuthSession } from '../types';
import { apiConfig } from '../../../config';

const FIXED_EMPLOYEE_DIRECTORY_QUERY = {
  basename: 'lserp_yw_jt',
  serverip: '114.116.152.217',
  serverport: 16890,
} as const;

export async function fetchEmployeeOptions(): Promise<EmployeeOption[]> {
  return apiRequest<EmployeeOption[]>(apiConfig.auth.employees, {
    method: 'GET',
    query: FIXED_EMPLOYEE_DIRECTORY_QUERY,
  });
}

export async function fetchServerOptions(employeeId?: number): Promise<ServerOption[]> {
  return apiRequest<ServerOption[]>(apiConfig.system.allServers, {
    method: 'GET',
    query: employeeId ? { employeeId } : undefined,
  });
}

export async function loginWithPassword(payload: LoginPayload): Promise<AuthSession> {
  return apiRequest<AuthSession>(apiConfig.auth.login, {
    method: 'POST',
    body: payload,
  });
}
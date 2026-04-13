export interface ServerOption {
  companyKey: string;
  title: string;
  basename: string;
  serverip: string;
  serverport: number;
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
  admin?: boolean;
  companyKey: string;
  companyTitle: string;
  datasourceCode?: string;
  departmentId: string;
  employeeId: number;
  employeeName: string;
  expiresAt: string;
  tokenType: string;
  tokenVersion: number;
  username: string;
}

export interface RememberedLoginState {
  employeeId: number;
  employeeName: string;
  organizationKey: string;
  password: string;
}

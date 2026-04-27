export type AuthLoginStage = 'identity' | 'company';

export interface AuthActiveCompany {
  companyKey: string;
  datasourceCode?: string;
  title?: string;
}

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

export interface IdentityLoginPayload {
  basename: string;
  employeeId: number;
  password: string;
  serverip: string;
  serverport: number;
}

export interface CompanySessionPayload {
  companyKey: string;
}

export interface AuthSession {
  accessToken: string;
  activeCompany?: AuthActiveCompany | null;
  admin?: boolean;
  companyKey?: string;
  companyTitle?: string;
  datasourceCode?: string;
  departmentId?: string;
  employeeId: number;
  employeeName: string;
  expiresAt?: string;
  isAdmin?: boolean;
  loginStage: AuthLoginStage;
  tokenType?: string;
  tokenVersion?: number;
  username: string;
}

export interface RememberedLoginState {
  employeeId: number;
  employeeName: string;
  organizationKey?: string;
  password: string;
}

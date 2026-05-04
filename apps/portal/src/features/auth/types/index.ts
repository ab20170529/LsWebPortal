export type AuthLoginStage = 'identity' | 'tenant' | 'company';

export interface AuthActiveCompany {
  companyKey: string;
  datasourceCode?: string;
  title?: string;
}

export interface ServerOption {
  companyKey: string;
  dbGroupId?: string;
  title: string;
  basename: string;
  serverip: string;
  serverport: number;
  dbType?: string;
  runtimeRole?: string;
  schemaVersion?: string | null;
  upgradeStatus?: string | null;
  enableFlag?: number;
  sortOrder?: number;
}

export interface TenantOption {
  tenantCode: string;
  tenantName: string;
  tenantType?: string;
  status?: string;
  enableFlag?: number;
  remark?: string;
}

export interface EmployeeOption {
  departmentId: string;
  employeeId: number;
  employeeName: string;
  loginAccount: string;
  py: string;
}

export interface IdentityLoginPayload {
  employeeId?: number | null;
  loginAccount?: string;
  password: string;
  tenantCode?: string;
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
  businessDbRequired?: boolean;
  isAdmin?: boolean;
  loginStage: AuthLoginStage;
  tenantCode?: string;
  tenantName?: string;
  tokenType?: string;
  tokenVersion?: number;
  username: string;
}

export interface RememberedLoginState {
  employeeId?: number;
  employeeName?: string;
  loginAccount?: string;
  organizationKey?: string;
  password: string;
  tenantCode?: string;
}

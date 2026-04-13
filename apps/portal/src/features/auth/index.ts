// 导出类型
export type {
  ServerOption,
  EmployeeOption,
  LoginPayload,
  AuthSession,
  RememberedLoginState,
} from './types';

// 导出组件
export { OrganizationSelector } from './components/organization-selector';
export { EmployeeSelector } from './components/employee-selector';
export { PasswordInput } from './components/password-input';
export { RememberCredentials } from './components/remember-credentials';

// 导出服务
export {
  fetchEmployeeOptions,
  fetchServerOptions,
  loginWithPassword,
} from './services/auth-service';

export {
  getRememberedLoginState,
  persistRememberedLoginState,
  clearRememberedLoginState,
  getAuthSession,
  persistAuthSession,
  clearAuthSession,
  getAccessToken,
} from './services/storage-service';

export {
  navigateToDesigner,
  verifyAuthFromPortal,
  isFromPortal,
  getBackToPortalUrl,
} from './services/designer-navigation';

// 导出Hook
export { useLoginFormController } from './hooks/use-login-form-controller';

// 导出页面组件
export { PortalLoginPage } from './portal-login-page';
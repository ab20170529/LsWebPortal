/**
 * 应用配置管理
 */

function normalizeApiBaseUrl(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return '';
    }
  } catch {
    return trimmed.replace(/\/+$/, '');
  }

  return trimmed.replace(/\/+$/, '');
}

const env = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  authEndpoint: import.meta.env.VITE_AUTH_ENDPOINT || '/api/auth',
  systemEndpoint: import.meta.env.VITE_SYSTEM_ENDPOINT || '/api/system',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  appName: import.meta.env.VITE_APP_NAME || 'LsERPPortal',
} as const;

export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  auth: {
    bootstrap: `${env.authEndpoint}/portal/bootstrap`,
    businessDbs: `${env.authEndpoint}/business-dbs`,
    businessDbSession: `${env.authEndpoint}/business-db-session`,
    companies: `${env.authEndpoint}/companies`,
    companySession: `${env.authEndpoint}/company-session`,
    employees: `${env.authEndpoint}/employees`,
    identityLogin: `${env.authEndpoint}/login/identity`,
    login: `${env.authEndpoint}/login`,
    logout: `${env.authEndpoint}/logout`,
    me: `${env.authEndpoint}/me`,
    ssoExchange: `${env.authEndpoint}/portal/sso/exchange`,
    tenants: `${env.authEndpoint}/tenants`,
  },
  system: {
    allServers: `${env.systemEndpoint}/all-servers`,
  },
  buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${this.baseUrl}${path}`;
    }

    return `${this.baseUrl}/${path}`;
  },
} as const;

export const appConfig = {
  env: env.appEnv,
  features: {
    enableAnalytics: env.appEnv === 'production',
    enableDebugLogs: env.appEnv !== 'production',
    enableMockData: env.appEnv === 'development',
  },
  isDevelopment: env.appEnv === 'development',
  isProduction: env.appEnv === 'production',
  isStaging: env.appEnv === 'staging',
  name: env.appName,
  version: '1.0.0',
} as const;

export default {
  api: apiConfig,
  app: appConfig,
  env,
};

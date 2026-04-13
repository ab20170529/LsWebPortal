import type { AuthSession as PortalAuthSession } from '@lserp/auth';

type DesignerBridgeSession = PortalAuthSession & {
  accessToken?: string;
  companyKey?: string;
  companyTitle?: string;
  departmentId?: string;
  employeeId?: number;
  employeeName?: string;
  expiresAt?: string;
  tokenType?: string;
  tokenVersion?: number;
};

type DesignerSharedAuthPayload = {
  accessToken: string;
  companyKey: string;
  companyTitle: string;
  departmentId: string;
  employeeId: number;
  employeeName: string;
  expiresAt: string;
  tokenType: string;
  tokenVersion: number;
  username: string;
};

const DESIGNER_BASE_URL =
  (import.meta.env.VITE_DESIGNER_BASE_URL as string | undefined)?.trim() ||
  'http://localhost:3000';

export function navigateToDesigner(
  session: DesignerBridgeSession,
  systemId: string = 'designer',
): void {
  const sharedAuthKey = `ls_auth_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const authData = {
    accessToken: session.accessToken ?? '',
    companyKey: session.companyKey ?? '',
    companyTitle: session.companyTitle ?? '',
    departmentId: session.departmentId ?? '',
    employeeId: session.employeeId ?? 0,
    employeeName: session.employeeName ?? session.displayName,
    expiresAt: session.expiresAt ?? '',
    timestamp: Date.now(),
    tokenType: session.tokenType ?? 'Bearer',
    tokenVersion: session.tokenVersion ?? 1,
    username: session.username,
  };

  localStorage.setItem(sharedAuthKey, JSON.stringify(authData));

  window.setTimeout(() => {
    localStorage.removeItem(sharedAuthKey);
  }, 5 * 60 * 1000);

  const designerUrl = new URL(DESIGNER_BASE_URL);
  designerUrl.searchParams.set('authKey', sharedAuthKey);
  designerUrl.searchParams.set('source', 'portal');
  designerUrl.searchParams.set('systemId', systemId);

  window.location.href = designerUrl.toString();
}

export function verifyAuthFromPortal(): DesignerSharedAuthPayload | null {
  const urlParams = new URLSearchParams(window.location.search);
  const authKey = urlParams.get('authKey');

  if (!authKey) {
    return null;
  }

  try {
    const authDataStr = localStorage.getItem(authKey);
    if (!authDataStr) {
      return null;
    }

    const authData = JSON.parse(authDataStr) as Partial<
      DesignerSharedAuthPayload & { timestamp: number }
    >;

    if (!authData.accessToken || !authData.employeeId || !authData.companyKey) {
      localStorage.removeItem(authKey);
      return null;
    }

    const timestamp = authData.timestamp ?? 0;
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(authKey);
      return null;
    }

    localStorage.removeItem(authKey);

    return {
      accessToken: authData.accessToken,
      companyKey: authData.companyKey,
      companyTitle: authData.companyTitle ?? '',
      departmentId: authData.departmentId ?? '',
      employeeId: authData.employeeId,
      employeeName: authData.employeeName ?? '',
      expiresAt: authData.expiresAt ?? '',
      tokenType: authData.tokenType ?? 'Bearer',
      tokenVersion: authData.tokenVersion ?? 1,
      username: authData.username ?? '',
    };
  } catch (error) {
    console.error('校验 Portal 认证信息失败:', error);
    return null;
  }
}

export function isFromPortal(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('source') === 'portal';
}

export function getBackToPortalUrl(
  portalBaseUrl: string = window.location.origin,
): string {
  const url = new URL(portalBaseUrl);
  url.pathname = '/systems';
  return url.toString();
}

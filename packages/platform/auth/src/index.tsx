import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { platformSystemEntries, type PlatformSystemId } from '@lserp/contracts';
import { createApiClient } from '@lserp/http';

export type AuthLoginStage = 'identity' | 'company';

export type AuthActiveCompany = {
  companyKey: string;
  datasourceCode?: string;
  title?: string;
};

export type AuthRoleAssignment = {
  id: string;
  label: string;
};

export type AuthSystemGrant = {
  source: 'role' | 'user';
  sourceId: string;
  sourceLabel: string;
  systemId: PlatformSystemId;
};

export type AuthSession = {
  accessToken?: string;
  activeCompany?: AuthActiveCompany | null;
  admin?: boolean;
  companyKey?: string;
  companyTitle?: string;
  datasourceCode?: string;
  defaultSystemId?: PlatformSystemId;
  departmentId?: string;
  displayName: string;
  employeeId: number;
  employeeName?: string;
  expiresAt?: string;
  loginStage: AuthLoginStage;
  roleAssignments: AuthRoleAssignment[];
  systemGrants: AuthSystemGrant[];
  tokenType?: string;
  tokenVersion?: number;
  username: string;
};

export type PortalAuthBootstrapUser = {
  displayName: string;
  employeeId: number;
  username: string;
};

export type PortalAuthBootstrapPayload = {
  defaultSystemId?: PlatformSystemId;
  roleAssignments: AuthRoleAssignment[];
  sessionContext?: {
    accessToken?: string;
    activeCompany?: AuthActiveCompany | null;
    admin?: boolean;
    companyKey?: string;
    companyTitle?: string;
    datasourceCode?: string;
    departmentId?: string;
    employeeName?: string;
    expiresAt?: string;
    loginStage?: AuthLoginStage;
    tokenType?: string;
    tokenVersion?: number;
  };
  systemGrants: AuthSystemGrant[];
  user: PortalAuthBootstrapUser;
};

type AuthContextValue = {
  applyAuthBootstrap: (payload: PortalAuthBootstrapPayload) => AuthSession;
  isAuthenticated: boolean;
  session: AuthSession | null;
  signInAsDemo: () => AuthSession;
  signOut: () => void;
};

const STORAGE_KEY = 'lserp.portal.auth.v2';
const RAW_STORAGE_KEY = 'lserp.portal.auth.session';
const LEGACY_DESIGNER_STORAGE_KEY = 'ls-ai-tool-auth-session';

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessionFromStorage(storage: Storage | null) {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  return readSessionFromStorage(window.sessionStorage) ?? readSessionFromStorage(window.localStorage);
}

function resolvePreferredStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (
    window.sessionStorage.getItem(STORAGE_KEY)
    || window.sessionStorage.getItem(RAW_STORAGE_KEY)
  ) {
    return window.sessionStorage;
  }

  return window.localStorage;
}

function toLegacyDesignerSession(session: AuthSession) {
  return {
    ...session,
    isAdmin: session.admin,
    selectedCompanyOptionKey: session.activeCompany?.companyKey ?? session.companyKey,
  };
}

function clearSessionFrom(storage: Storage | null) {
  if (!storage) {
    return;
  }

  storage.removeItem(RAW_STORAGE_KEY);
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_DESIGNER_STORAGE_KEY);
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  clearSessionFrom(window.localStorage);
  clearSessionFrom(window.sessionStorage);

  if (!session) {
    return;
  }

  const targetStorage = resolvePreferredStorage() ?? window.localStorage;
  targetStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  targetStorage.setItem(LEGACY_DESIGNER_STORAGE_KEY, JSON.stringify(toLegacyDesignerSession(session)));
}

function dedupeRoleAssignments(roleAssignments: AuthRoleAssignment[]) {
  const uniqueRoles = new Map<string, AuthRoleAssignment>();

  for (const role of roleAssignments) {
    uniqueRoles.set(role.id, role);
  }

  return Array.from(uniqueRoles.values());
}

function dedupeSystemGrants(systemGrants: AuthSystemGrant[]) {
  const uniqueGrants = new Map<string, AuthSystemGrant>();

  for (const grant of systemGrants) {
    uniqueGrants.set(`${grant.systemId}:${grant.source}:${grant.sourceId}`, grant);
  }

  return Array.from(uniqueGrants.values());
}

function deriveActiveCompany(
  sessionContext?: PortalAuthBootstrapPayload['sessionContext'],
): AuthActiveCompany | null {
  if (sessionContext?.activeCompany?.companyKey) {
    return sessionContext.activeCompany;
  }

  if (!sessionContext?.companyKey && !sessionContext?.datasourceCode && !sessionContext?.companyTitle) {
    return null;
  }

  return {
    companyKey: sessionContext?.companyKey ?? '',
    datasourceCode: sessionContext?.datasourceCode,
    title: sessionContext?.companyTitle,
  };
}

function deriveLoginStage(
  sessionContext?: PortalAuthBootstrapPayload['sessionContext'],
  activeCompany?: AuthActiveCompany | null,
): AuthLoginStage {
  if (sessionContext?.loginStage === 'identity' || sessionContext?.loginStage === 'company') {
    return sessionContext.loginStage;
  }

  return activeCompany?.companyKey || activeCompany?.datasourceCode ? 'company' : 'identity';
}

export function normalizeAuthSession(payload: PortalAuthBootstrapPayload): AuthSession {
  const activeCompany = deriveActiveCompany(payload.sessionContext);

  return {
    accessToken: payload.sessionContext?.accessToken,
    activeCompany,
    admin: payload.sessionContext?.admin,
    companyKey: activeCompany?.companyKey ?? payload.sessionContext?.companyKey,
    companyTitle: activeCompany?.title ?? payload.sessionContext?.companyTitle,
    datasourceCode: activeCompany?.datasourceCode ?? payload.sessionContext?.datasourceCode,
    defaultSystemId: payload.defaultSystemId,
    departmentId: payload.sessionContext?.departmentId,
    displayName: payload.user.displayName,
    employeeId: payload.user.employeeId,
    employeeName: payload.sessionContext?.employeeName ?? payload.user.displayName,
    expiresAt: payload.sessionContext?.expiresAt,
    loginStage: deriveLoginStage(payload.sessionContext, activeCompany),
    roleAssignments: dedupeRoleAssignments(payload.roleAssignments),
    systemGrants: dedupeSystemGrants(payload.systemGrants),
    tokenType: payload.sessionContext?.tokenType,
    tokenVersion: payload.sessionContext?.tokenVersion,
    username: payload.user.username,
  };
}

export function createDemoAuthBootstrapPayload(): PortalAuthBootstrapPayload {
  return {
    defaultSystemId: 'designer',
    roleAssignments: [
      {
        id: 'role-platform-admin',
        label: 'Platform Admin',
      },
      {
        id: 'role-erp-operator',
        label: 'ERP Operator',
      },
      {
        id: 'role-project-manager',
        label: 'Project Manager',
      },
    ],
    systemGrants: [
      {
        source: 'role',
        sourceId: 'role-platform-admin',
        sourceLabel: 'Platform Admin',
        systemId: 'designer',
      },
      {
        source: 'role',
        sourceId: 'role-platform-admin',
        sourceLabel: 'Platform Admin',
        systemId: 'bi',
      },
      {
        source: 'role',
        sourceId: 'role-platform-admin',
        sourceLabel: 'Platform Admin',
        systemId: 'bi-display',
      },
      {
        source: 'user',
        sourceId: 'user-1',
        sourceLabel: 'Direct user grant',
        systemId: 'erp',
      },
      {
        source: 'role',
        sourceId: 'role-project-manager',
        sourceLabel: 'Project Manager',
        systemId: 'project',
      },
    ],
    sessionContext: {
      activeCompany: {
        companyKey: 'demo-company',
        datasourceCode: 'demo-company',
        title: 'Demo Company',
      },
      admin: true,
      companyKey: 'demo-company',
      companyTitle: 'Demo Company',
      datasourceCode: 'demo-company',
      loginStage: 'company',
    },
    user: {
      displayName: 'Portal Demo Admin',
      employeeId: 1,
      username: 'portal.demo',
    },
  };
}

export function getGrantedSystemIds(session: AuthSession | null) {
  if (!session) {
    return [] as PlatformSystemId[];
  }

  // Portal system access is currently opened for every authenticated user.
  // Keep the session grant payload for compatibility, but do not gate the
  // secondary system-entry page or route access on it.
  return platformSystemEntries.map((entry) => entry.id);
}

export function resolveDefaultSystemId(session: AuthSession | null) {
  if (!session) {
    return null;
  }

  if (session.defaultSystemId && hasSystemAccess(session, session.defaultSystemId)) {
    return session.defaultSystemId;
  }

  return getGrantedSystemIds(session)[0] ?? null;
}

export function hasSystemAccess(session: AuthSession | null, systemId: PlatformSystemId) {
  return (
    Boolean(session)
    && platformSystemEntries.some((entry) => entry.id === systemId)
    && getGrantedSystemIds(session).includes(systemId)
  );
}

export function hasActiveCompanySession(session: AuthSession | null) {
  return Boolean(
    session
      && session.loginStage === 'company'
      && (session.activeCompany?.companyKey || session.activeCompany?.datasourceCode),
  );
}

export function createPortalAuthBootstrapClient(config: { baseUrl: string; path?: string }) {
  const client = createApiClient(config.baseUrl);

  return {
    load: () =>
      client.request<PortalAuthBootstrapPayload>(config.path ?? '/auth/portal/bootstrap', {
        method: 'GET',
      }),
  };
}

export function PortalAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  const applyAuthBootstrap = useCallback((payload: PortalAuthBootstrapPayload) => {
    const nextSession = normalizeAuthSession(payload);
    setSession(nextSession);
    writeStoredSession(nextSession);
    return nextSession;
  }, []);

  const signInAsDemo = useCallback(() => {
    return applyAuthBootstrap(createDemoAuthBootstrapPayload());
  }, [applyAuthBootstrap]);

  const signOut = useCallback(() => {
    setSession(null);
    writeStoredSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      applyAuthBootstrap,
      isAuthenticated: Boolean(session),
      session,
      signInAsDemo,
      signOut,
    }),
    [applyAuthBootstrap, session, signInAsDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePortalAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('usePortalAuth must be used within PortalAuthProvider.');
  }

  return context as AuthContextValue;
}

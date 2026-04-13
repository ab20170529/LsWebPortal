import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  platformSystemEntries,
  type PlatformSystemId,
} from '@lserp/contracts';
import { createApiClient } from '@lserp/http';

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
    admin?: boolean;
    companyKey?: string;
    companyTitle?: string;
    datasourceCode?: string;
    departmentId?: string;
    employeeName?: string;
    expiresAt?: string;
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

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
    uniqueGrants.set(
      `${grant.systemId}:${grant.source}:${grant.sourceId}`,
      grant,
    );
  }

  return Array.from(uniqueGrants.values());
}

export function normalizeAuthSession(
  payload: PortalAuthBootstrapPayload,
): AuthSession {
  return {
    accessToken: payload.sessionContext?.accessToken,
    admin: payload.sessionContext?.admin,
    companyKey: payload.sessionContext?.companyKey,
    companyTitle: payload.sessionContext?.companyTitle,
    datasourceCode: payload.sessionContext?.datasourceCode,
    defaultSystemId: payload.defaultSystemId,
    departmentId: payload.sessionContext?.departmentId,
    displayName: payload.user.displayName,
    employeeId: payload.user.employeeId,
    employeeName:
      payload.sessionContext?.employeeName ?? payload.user.displayName,
    expiresAt: payload.sessionContext?.expiresAt,
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

  const grantedIds = new Set<PlatformSystemId>();

  session.systemGrants.forEach((grant) => {
    grantedIds.add(grant.systemId);
  });

  return platformSystemEntries
    .map((entry) => entry.id)
    .filter((systemId) => grantedIds.has(systemId));
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

export function hasSystemAccess(
  session: AuthSession | null,
  systemId: PlatformSystemId,
) {
  return (
    Boolean(session) &&
    platformSystemEntries.some((entry) => entry.id === systemId) &&
    getGrantedSystemIds(session).includes(systemId)
  );
}

export function createPortalAuthBootstrapClient(config: {
  baseUrl: string;
  path?: string;
}) {
  const client = createApiClient(config.baseUrl);

  return {
    load: () =>
      client.request<PortalAuthBootstrapPayload>(
        config.path ?? '/auth/portal/bootstrap',
        {
          method: 'GET',
        },
      ),
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

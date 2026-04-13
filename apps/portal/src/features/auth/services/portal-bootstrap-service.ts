import type {
  AuthRoleAssignment,
  AuthSystemGrant,
  PortalAuthBootstrapPayload,
} from '@lserp/auth';
import { getPlatformSystemEntry, platformSystemEntries } from '@lserp/contracts';

import { apiConfig } from '../../../config';
import type { AuthSession } from '../types';
import { ApiError, apiRequest } from './http-client';

function buildFallbackRoleAssignments(session: AuthSession): AuthRoleAssignment[] {
  if (session.admin) {
    return [
      {
        id: 'role-portal-admin',
        label: '门户管理员',
      },
    ];
  }

  return [
    {
      id: 'role-portal-user',
      label: '门户用户',
    },
  ];
}

function buildFallbackSystemGrants(session: AuthSession): AuthSystemGrant[] {
  const source = session.admin ? 'role' : 'user';
  const sourceId = session.admin ? 'role-portal-admin' : `user-${session.employeeId}`;
  const sourceLabel = session.admin ? '门户管理员' : '门户用户';

  return platformSystemEntries.map((entry) => ({
    source,
    sourceId,
    sourceLabel,
    systemId: entry.id,
  }));
}

function resolveFallbackDefaultSystemId(session: AuthSession) {
  const candidateKeys = [
    session.datasourceCode,
    session.companyTitle,
    session.companyKey,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (candidateKeys.includes('project') || candidateKeys.includes('项目')) {
    return 'project' as const;
  }

  if (session.admin) {
    return 'designer' as const;
  }

  if (getPlatformSystemEntry('erp')) {
    return 'erp' as const;
  }

  return platformSystemEntries[0]?.id;
}

export function buildFallbackPortalBootstrapPayload(
  session: AuthSession,
): PortalAuthBootstrapPayload {
  return {
    defaultSystemId: resolveFallbackDefaultSystemId(session),
    roleAssignments: buildFallbackRoleAssignments(session),
    sessionContext: {
      accessToken: session.accessToken,
      admin: session.admin,
      companyKey: session.companyKey,
      companyTitle: session.companyTitle,
      datasourceCode: session.datasourceCode,
      departmentId: session.departmentId,
      employeeName: session.employeeName,
      expiresAt: session.expiresAt,
      tokenType: session.tokenType,
      tokenVersion: session.tokenVersion,
    },
    systemGrants: buildFallbackSystemGrants(session),
    user: {
      displayName: session.employeeName,
      employeeId: session.employeeId,
      username: session.username,
    },
  };
}

export async function fetchPortalBootstrap(
  accessToken: string,
): Promise<PortalAuthBootstrapPayload> {
  return apiRequest<PortalAuthBootstrapPayload>(apiConfig.auth.bootstrap, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'GET',
  });
}

export async function resolvePortalBootstrapPayload(
  session: AuthSession,
): Promise<PortalAuthBootstrapPayload> {
  try {
    if (!session.accessToken.trim()) {
      return buildFallbackPortalBootstrapPayload(session);
    }

    const payload = await fetchPortalBootstrap(session.accessToken);

    return {
      ...payload,
      sessionContext: {
        accessToken: session.accessToken,
        admin: session.admin,
        companyKey: session.companyKey,
        companyTitle: session.companyTitle,
        datasourceCode: session.datasourceCode,
        departmentId: session.departmentId,
        employeeName: session.employeeName,
        expiresAt: session.expiresAt,
        tokenType: session.tokenType,
        tokenVersion: session.tokenVersion,
        ...payload.sessionContext,
      },
      user: {
        displayName: payload.user.displayName || session.employeeName,
        employeeId: payload.user.employeeId || session.employeeId,
        username: payload.user.username || session.username,
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status !== 0) {
      console.warn('门户 bootstrap 接口不可用，回退到本地授权推导。', error);
    } else {
      console.warn('门户 bootstrap 失败，回退到本地授权推导。', error);
    }

    return buildFallbackPortalBootstrapPayload(session);
  }
}

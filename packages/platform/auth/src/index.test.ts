import { describe, expect, it } from 'vitest';

import {
  createDemoAuthBootstrapPayload,
  getGrantedSystemIds,
  hasSystemAccess,
  normalizeAuthSession,
  resolveDefaultSystemId,
  type AuthSession,
} from './index';

const sessionFixture: AuthSession = {
  defaultSystemId: 'designer',
  displayName: 'Test User',
  employeeId: 7,
  roleAssignments: [
    {
      id: 'role-platform-admin',
      label: 'Platform Admin',
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
      sourceId: 'user-7',
      sourceLabel: 'Direct user grant',
      systemId: 'erp',
    },
    {
      source: 'user',
      sourceId: 'user-7',
      sourceLabel: 'Duplicate user grant',
      systemId: 'erp',
    },
  ],
  username: 'test.user',
};

describe('getGrantedSystemIds', () => {
  it('returns all platform systems for authenticated sessions', () => {
    expect(getGrantedSystemIds(sessionFixture)).toEqual(['bi', 'bi-display', 'designer', 'erp', 'project']);
  });

  it('returns an empty list for guest sessions', () => {
    expect(getGrantedSystemIds(null)).toEqual([]);
  });
});

describe('hasSystemAccess', () => {
  it('allows all platform systems for authenticated sessions', () => {
    expect(hasSystemAccess(sessionFixture, 'designer')).toBe(true);
    expect(hasSystemAccess(sessionFixture, 'erp')).toBe(true);
    expect(hasSystemAccess(sessionFixture, 'bi-display')).toBe(true);
    expect(hasSystemAccess(sessionFixture, 'project')).toBe(true);
  });

  it('still blocks non-platform systems', () => {
    expect(hasSystemAccess(sessionFixture, 'mes')).toBe(false);
  });
});

describe('normalizeAuthSession', () => {
  it('maps the bootstrap payload into the session shape', () => {
    const session = normalizeAuthSession(createDemoAuthBootstrapPayload());

    expect(session.displayName).toBe('Portal Demo Admin');
    expect(session.username).toBe('portal.demo');
    expect(getGrantedSystemIds(session)).toEqual(['bi', 'bi-display', 'designer', 'erp', 'project']);
  });

  it('falls back to the first granted system when the default is not granted', () => {
    const session = normalizeAuthSession({
      defaultSystemId: 'mes',
      roleAssignments: sessionFixture.roleAssignments,
      systemGrants: sessionFixture.systemGrants,
      user: {
        displayName: sessionFixture.displayName,
        employeeId: sessionFixture.employeeId,
        username: sessionFixture.username,
      },
    });

    expect(resolveDefaultSystemId(session)).toBe('designer');
  });
});

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
  it('deduplicates user and role grants into a stable system id list', () => {
    expect(getGrantedSystemIds(sessionFixture)).toEqual(['designer', 'erp']);
  });

  it('returns an empty list for guest sessions', () => {
    expect(getGrantedSystemIds(null)).toEqual([]);
  });
});

describe('hasSystemAccess', () => {
  it('recognizes granted systems from merged user and role bindings', () => {
    expect(hasSystemAccess(sessionFixture, 'designer')).toBe(true);
    expect(hasSystemAccess(sessionFixture, 'erp')).toBe(true);
  });

  it('blocks systems that are not in the merged grant list', () => {
    expect(hasSystemAccess(sessionFixture, 'mes')).toBe(false);
  });
});

describe('normalizeAuthSession', () => {
  it('maps the bootstrap payload into the session shape', () => {
    const session = normalizeAuthSession(createDemoAuthBootstrapPayload());

    expect(session.displayName).toBe('Portal Demo Admin');
    expect(session.username).toBe('portal.demo');
    expect(getGrantedSystemIds(session)).toEqual(['designer', 'erp']);
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

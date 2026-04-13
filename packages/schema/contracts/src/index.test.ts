import { describe, expect, it } from 'vitest';

import { platformSystemEntries, portalNavItems } from './index';

describe('portalNavItems', () => {
  it('keeps stable top-level entries for the portal shell', () => {
    expect(portalNavItems.map((item) => item.to)).toEqual([
      '/',
      '/systems',
      '/designer',
      '/erp',
      '/settings',
    ]);
  });
});

describe('platformSystemEntries', () => {
  it('exposes the active system routes that can be granted to users and roles', () => {
    expect(platformSystemEntries.map((entry) => entry.route)).toEqual([
      '/designer',
      '/erp',
    ]);
  });
});

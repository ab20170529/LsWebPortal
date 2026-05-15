import { describe, expect, it } from 'vitest';

import { buildBiPublicScreenPath, readBiPublicRuntimeOptions } from './bi-public-runtime';

describe('bi public runtime options', () => {
  it('adds tenant code to public screen links', () => {
    expect(buildBiPublicScreenPath('sales-board', 12, 'company-a', 'tenant-a')).toBe(
      '/bi/public/screen/sales-board?versionId=12&datasourceCode=company-a&tenantCode=tenant-a',
    );
  });

  it('reads tenant code from public screen query params', () => {
    expect(readBiPublicRuntimeOptions('?tenantCode=tenant-a&datasourceCode=company-a&versionId=12')).toEqual({
      datasourceCode: 'company-a',
      tenantCode: 'tenant-a',
      versionId: 12,
    });
  });
});

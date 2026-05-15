import type { TenantOption } from '../types';

export const PLATFORM_TENANT_CODE = '__platform__';

export function isPlatformTenantOption(tenant?: TenantOption | null): boolean {
  if (!tenant) {
    return false;
  }

  const tenantType = tenant.tenantType?.trim().toUpperCase();
  return tenant.tenantCode === PLATFORM_TENANT_CODE
    || tenantType === 'PLATFORM_DB';
}

export function buildPlatformTenantOption(): TenantOption {
  return {
    tenantCode: PLATFORM_TENANT_CODE,
    tenantName: '平台库',
    tenantType: 'PLATFORM_DB',
    status: 'ACTIVE',
    enableFlag: 1,
    remark: '不进入租户库，使用平台默认库登录',
  };
}

export function ensurePlatformTenantOption(items: TenantOption[]) {
  const platformItems = items.filter(isPlatformTenantOption);
  const tenantItems = items.filter((tenant) => !isPlatformTenantOption(tenant));
  const platforms = platformItems.length > 0 ? platformItems : [buildPlatformTenantOption()];
  return [...platforms, ...tenantItems];
}

export function getTenantOptionLabel(tenant: TenantOption) {
  if (isPlatformTenantOption(tenant)) {
    return tenant.tenantName === '平台库' ? '平台库' : `平台库（${tenant.tenantName}）`;
  }

  return `${tenant.tenantName}（租户库）`;
}

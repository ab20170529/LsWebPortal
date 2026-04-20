export type PlatformId = 'design' | 'runtime' | 'mes';
export type PlatformKind = 'studio' | 'runtime' | 'business';
export type PlatformRouteMode = 'fixed' | 'dynamic' | 'mixed';
export type PlatformLoginMode = 'shared' | 'independent';
export type PlatformStatus = 'active' | 'planned';

export interface PlatformDefinition {
  id: PlatformId;
  name: string;
  description: string;
  kind: PlatformKind;
  basePath: `/${string}`;
  loginPath: `/${string}`;
  routeMode: PlatformRouteMode;
  loginMode: PlatformLoginMode;
  status: PlatformStatus;
}

export const PLATFORM_REGISTRY: readonly PlatformDefinition[] = [
  {
    id: 'design',
    name: '设计平台',
    description: '用于模块设计、布局设计和平台级配置。',
    kind: 'studio',
    basePath: '/design',
    loginPath: '/design/login',
    routeMode: 'fixed',
    loginMode: 'shared',
    status: 'active',
  },
  {
    id: 'runtime',
    name: '运行平台',
    description: '用于低代码运行时和动态页面入口。',
    kind: 'runtime',
    basePath: '/runtime',
    loginPath: '/runtime/login',
    routeMode: 'mixed',
    loginMode: 'shared',
    status: 'planned',
  },
  {
    id: 'mes',
    name: 'MES 平台',
    description: '用于业务端独立入口与后续 MES 功能。',
    kind: 'business',
    basePath: '/mes',
    loginPath: '/mes/login',
    routeMode: 'fixed',
    loginMode: 'independent',
    status: 'planned',
  },
] as const;

export function getDefaultPlatform() {
  return PLATFORM_REGISTRY[0];
}

export function getPlatformById(id: PlatformId) {
  return PLATFORM_REGISTRY.find((platform) => platform.id === id) ?? getDefaultPlatform();
}

export function getPlatformByBasePath(pathname: string) {
  return PLATFORM_REGISTRY.find((platform) => pathname === platform.basePath || pathname.startsWith(`${platform.basePath}/`)) ?? null;
}

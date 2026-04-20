import type { PlatformId } from '../registry/platform-registry';

export type MenuRouteType = 'fixed' | 'dynamic' | 'external';
export type PlatformPageType = 'designer' | 'fixed-page' | 'runtime-page' | 'report' | 'iframe';
export type PermissionMode = 'page' | 'runtime';

export interface PlatformMenuDescriptor {
  platformId: PlatformId;
  menuCode: string;
  title: string;
  routeType: MenuRouteType;
  pageType: PlatformPageType;
  permissionMode: PermissionMode;
  path: string;
  schemaId?: string;
  componentKey?: string;
}

export type DesignRouteKey = 'workspace' | 'module' | 'bill' | 'settings';

export interface DesignRouteContext {
  menuCode?: string;
  moduleCode?: string;
  subsystemCode?: string;
}

const DESIGN_ROUTE_META: Record<
  DesignRouteKey,
  {
    pageType: PlatformPageType;
    summary: string;
    title: string;
  }
> = {
  workspace: {
    pageType: 'designer',
    summary: 'Current home for the existing design workspace and dashboard shell.',
    title: 'Workspace',
  },
  module: {
    pageType: 'designer',
    summary: 'Reserved fixed route for the module designer entry and related tools.',
    title: 'Module Designer',
  },
  bill: {
    pageType: 'designer',
    summary: 'Reserved fixed route for bill design, form composition, and layout editing.',
    title: 'Bill Designer',
  },
  settings: {
    pageType: 'fixed-page',
    summary: 'Reserved fixed route for studio-level settings, publish rules, and governance.',
    title: 'Studio Settings',
  },
};

export interface DesignFixedRoute {
  kind: 'design-fixed';
  context: DesignRouteContext;
  pageType: PlatformPageType;
  pathname: string;
  permissionMode: 'page';
  platformId: 'design';
  routeKey: DesignRouteKey;
  segments: string[];
  summary: string;
  title: string;
}

function decodeRouteSegment(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function resolveDesignRoute(pathname: string, segments: string[]): DesignFixedRoute | null {
  let routeKey: DesignRouteKey;
  let context: DesignRouteContext = {};

  if (
    segments.length === 0
    || (segments[0] === 'workspace' && segments.length <= 3)
  ) {
    routeKey = 'workspace';
    context = {
      subsystemCode: segments[0] === 'workspace' ? decodeRouteSegment(segments[1]) : undefined,
      menuCode: segments[0] === 'workspace' ? decodeRouteSegment(segments[2]) : undefined,
    };
  } else if (segments[0] === 'module' && segments.length <= 4) {
    routeKey = 'module';
    context = {
      subsystemCode: decodeRouteSegment(segments[1]),
      menuCode: decodeRouteSegment(segments[2]),
      moduleCode: decodeRouteSegment(segments[3]),
    };
  } else if (segments[0] === 'bill' && segments.length <= 2) {
    routeKey = 'bill';
    context = {
      moduleCode: decodeRouteSegment(segments[1]),
    };
  } else if (segments.length === 1 && segments[0] === 'settings') {
    routeKey = 'settings';
  } else {
    return null;
  }

  const meta = DESIGN_ROUTE_META[routeKey];

  return {
    kind: 'design-fixed',
    context,
    pageType: meta.pageType,
    pathname,
    permissionMode: 'page',
    platformId: 'design',
    routeKey,
    segments,
    summary: meta.summary,
    title: meta.title,
  };
}

export type RuntimeRouteKind = 'runtime-home' | 'runtime-menu' | 'runtime-page' | 'runtime-unknown';

interface RuntimeRouteBase {
  kind: RuntimeRouteKind;
  pageType: 'runtime-page';
  pathname: string;
  permissionMode: 'runtime';
  platformId: 'runtime';
  segments: string[];
  summary: string;
  title: string;
}

export interface RuntimeHomeRoute extends RuntimeRouteBase {
  kind: 'runtime-home';
}

export interface RuntimeMenuRoute extends RuntimeRouteBase {
  kind: 'runtime-menu';
  menuCode: string;
  subsystemCode: string;
}

export interface RuntimePageRoute extends RuntimeRouteBase {
  kind: 'runtime-page';
  pageId: string;
}

export interface RuntimeUnknownRoute extends RuntimeRouteBase {
  kind: 'runtime-unknown';
}

export type RuntimeResolvedRoute =
  | RuntimeHomeRoute
  | RuntimeMenuRoute
  | RuntimePageRoute
  | RuntimeUnknownRoute;

export function resolveRuntimeRoute(pathname: string, segments: string[]): RuntimeResolvedRoute {
  if (segments.length === 0) {
    return {
      kind: 'runtime-home',
      pageType: 'runtime-page',
      pathname,
      permissionMode: 'runtime',
      platformId: 'runtime',
      segments,
      summary: 'Reserved home shell for the low-code runtime platform.',
      title: 'Runtime Home',
    };
  }

  if (segments[0] === 'app' && segments.length >= 3) {
    return {
      kind: 'runtime-menu',
      menuCode: segments[2],
      pageType: 'runtime-page',
      pathname,
      permissionMode: 'runtime',
      platformId: 'runtime',
      segments,
      subsystemCode: segments[1],
      summary: `Dynamic menu slot for subsystem=${segments[1]} and menu=${segments[2]}.`,
      title: 'Dynamic Menu Route',
    };
  }

  if (segments[0] === 'page' && segments[1]) {
    return {
      kind: 'runtime-page',
      pageId: segments[1],
      pageType: 'runtime-page',
      pathname,
      permissionMode: 'runtime',
      platformId: 'runtime',
      segments,
      summary: `Schema runtime slot for pageId=${segments[1]}.`,
      title: 'Schema Runtime Route',
    };
  }

  return {
    kind: 'runtime-unknown',
    pageType: 'runtime-page',
    pathname,
    permissionMode: 'runtime',
    platformId: 'runtime',
    segments,
    summary: 'The runtime shell is active, but the current path does not match a registered runtime contract yet.',
    title: 'Unknown Runtime Route',
  };
}

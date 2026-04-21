export type PlatformTone = 'brand' | 'success' | 'neutral';

export type PlatformSystemId = 'app' | 'bi' | 'bi-display' | 'designer' | 'erp' | 'mes' | 'project';

export type PlatformId = 'systems' | 'bi' | 'bi-display' | 'designer' | 'erp' | 'project' | 'settings';

export type PortalNavKind = 'shell' | 'system';

export type PlatformSystemEntry = {
  description: string;
  id: PlatformSystemId;
  route: string;
  shortLabel: string;
  title: string;
  tone: PlatformTone;
};

export type PortalNavItem = {
  description: string;
  id: PlatformId;
  kind: PortalNavKind;
  requiresAuth?: boolean;
  shortLabel: string;
  systemId?: PlatformSystemId;
  title: string;
  to: string;
  tone: PlatformTone;
};

export type PlatformTemplateKind = 'basic' | 'bill' | 'dashboard' | 'query';

export type PlatformViewNodeKind =
  | 'action'
  | 'field'
  | 'grid'
  | 'page'
  | 'section'
  | 'slot'
  | 'text';

export type PlatformViewBinding = {
  source: string;
  type: 'computed' | 'field' | 'slot' | 'static';
};

export type PlatformViewActionRef = {
  actionId: string;
  trigger: 'change' | 'click' | 'submit';
};

export type PlatformViewNode = {
  actionRefs?: PlatformViewActionRef[];
  bindings?: Record<string, PlatformViewBinding>;
  children?: PlatformViewNode[];
  component: string;
  id: string;
  kind: PlatformViewNodeKind;
  props?: Record<string, unknown>;
  slots?: Record<string, PlatformViewNode[]>;
  styleTokens?: Record<string, string>;
  visibleWhen?: string;
};

export type PlatformTemplateViewModel = {
  root: PlatformViewNode;
  templateKind: PlatformTemplateKind | string;
  version: string;
};

export type PlatformBehaviorRule = {
  condition: string;
  effect: string;
  id: string;
};

export type PlatformActionSchema =
  | {
      id: string;
      kind: 'notify';
      messageTemplate: string;
      permission?: PlatformActionPermissionSchema;
    }
  | {
      id: string;
      kind: 'reset';
      messageTemplate?: string;
      permission?: PlatformActionPermissionSchema;
    }
  | {
      id: string;
      kind: 'submit';
      messageTemplate: string;
      permission?: PlatformActionPermissionSchema;
    };

export type PlatformDatasourceOption = {
  label: string;
  value: string;
  when?: string;
};

export type PlatformDatasourceSchema = {
  id: string;
  kind: 'static-options';
  options: PlatformDatasourceOption[];
};

export type PlatformValidationRule =
  | {
      id: string;
      kind: 'expression';
      expression: string;
      message?: string;
      when?: string;
    }
  | {
      id: string;
      kind: 'max' | 'min';
      message?: string;
      value: number;
      when?: string;
    }
  | {
      id: string;
      kind: 'required';
      message?: string;
      when?: string;
    };

export type PlatformActionPermissionSchema = {
  enabledWhen?: string;
  visibleWhen?: string;
};

export type PlatformFieldPermissionSchema = {
  editableWhen?: string;
  visibleWhen?: string;
};

export type PlatformFieldSchema = {
  control?: 'input' | 'select';
  datasourceId?: string;
  field: string;
  initialValue?: unknown;
  label: string;
  permission?: PlatformFieldPermissionSchema;
  validations?: PlatformValidationRule[];
  valueType: 'boolean' | 'date' | 'number' | 'object' | 'string';
};

export type PlatformPageSchema = {
  actions?: PlatformActionSchema[];
  behaviorRules: PlatformBehaviorRule[];
  datasources?: PlatformDatasourceSchema[];
  fields: PlatformFieldSchema[];
  id: string;
  template: PlatformTemplateKind | string;
  title: string;
  view: PlatformTemplateViewModel;
};

export const platformSystemEntries: PlatformSystemEntry[] = [
  {
    description: 'BI workspace, runtime dashboards, and share access.',
    id: 'bi',
    route: '/bi',
    shortLabel: 'BI',
    title: 'BI \u5206\u6790\u5e73\u53f0',
    tone: 'brand',
  },
  {
    description: 'Organization-driven display screens powered by the existing BI runtime.',
    id: 'bi-display',
    route: '/bi-display/platform/langsu',
    shortLabel: 'Display',
    title: 'BI \u5c55\u793a\u7cfb\u7edf',
    tone: 'brand',
  },
  {
    description: 'Metadata design, preview orchestration, and platform contract governance.',
    id: 'designer',
    route: '/designer',
    shortLabel: 'Studio',
    title: '\u8bbe\u8ba1\u5e73\u53f0',
    tone: 'brand',
  },
  {
    description: 'Business runtime, workflow collaboration, and execution operations.',
    id: 'erp',
    route: '/erp',
    shortLabel: 'Runtime',
    title: 'ERP \u5e73\u53f0',
    tone: 'success',
  },
  {
    description: 'Project execution, team collaboration, reports, and delivery management.',
    id: 'project',
    route: '/project',
    shortLabel: 'PM',
    title: '\u9879\u76ee\u7ba1\u7406\u7cfb\u7edf',
    tone: 'neutral',
  },
];

export function getPlatformSystemEntry(systemId: PlatformSystemId) {
  return platformSystemEntries.find((entry) => entry.id === systemId) ?? null;
}

export const portalNavItems: PortalNavItem[] = [
  {
    description: 'The authenticated system gateway that decides which business systems can be entered.',
    id: 'systems',
    kind: 'shell',
    requiresAuth: true,
    shortLabel: 'Gate',
    title: '\u7cfb\u7edf\u9009\u62e9',
    to: '/systems',
    tone: 'neutral',
  },
  {
    description: 'BI workspace, runtime dashboards, and share access.',
    id: 'bi',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'BI',
    systemId: 'bi',
    title: 'BI \u5206\u6790\u5e73\u53f0',
    to: '/bi',
    tone: 'brand',
  },
  {
    description: 'Organization-driven display screens powered by the existing BI runtime.',
    id: 'bi-display',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'Display',
    systemId: 'bi-display',
    title: 'BI \u5c55\u793a\u7cfb\u7edf',
    to: '/bi-display/platform/langsu',
    tone: 'brand',
  },
  {
    description: 'Metadata design, preview orchestration, and platform contract governance.',
    id: 'designer',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'Studio',
    systemId: 'designer',
    title: '\u8bbe\u8ba1\u5e73\u53f0',
    to: '/designer',
    tone: 'brand',
  },
  {
    description: 'Business runtime, workflow collaboration, and execution operations.',
    id: 'erp',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'Runtime',
    systemId: 'erp',
    title: 'ERP \u5e73\u53f0',
    to: '/erp',
    tone: 'success',
  },
  {
    description: 'Project execution, team collaboration, reports, and delivery management.',
    id: 'project',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'PM',
    systemId: 'project',
    title: '\u9879\u76ee\u7ba1\u7406\u7cfb\u7edf',
    to: '/project',
    tone: 'neutral',
  },
  {
    description: 'Themes, layout presets, tenants, and platform governance entrypoints.',
    id: 'settings',
    kind: 'shell',
    requiresAuth: true,
    shortLabel: 'Ops',
    title: '\u5e73\u53f0\u8bbe\u7f6e',
    to: '/settings',
    tone: 'neutral',
  },
];

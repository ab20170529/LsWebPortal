export type PlatformTone = 'brand' | 'success' | 'neutral';

export type PlatformSystemId = 'app' | 'designer' | 'erp' | 'mes' | 'project';

export type PlatformId = 'systems' | 'designer' | 'erp' | 'project' | 'settings';

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
    description: '负责元数据设计、页面预览和平台契约治理。',
    id: 'designer',
    route: '/designer',
    shortLabel: 'Studio',
    title: '设计平台',
    tone: 'brand',
  },
  {
    description: '面向业务运行、流程协作和交付执行。',
    id: 'erp',
    route: '/erp',
    shortLabel: 'Runtime',
    title: 'ERP 平台',
    tone: 'success',
  },
  {
    description: '项目全过程、团队执行、报表和交付管理入口。',
    id: 'project',
    route: '/project',
    shortLabel: 'PM',
    title: '项目管理系统',
    tone: 'neutral',
  },
];

export function getPlatformSystemEntry(systemId: PlatformSystemId) {
  return platformSystemEntries.find((entry) => entry.id === systemId) ?? null;
}

export const portalNavItems: PortalNavItem[] = [
  {
    description: '统一登录后的二级网关，由平台层决定可进入的业务域。',
    id: 'systems',
    kind: 'shell',
    requiresAuth: true,
    shortLabel: 'Gate',
    title: '系统选择',
    to: '/systems',
    tone: 'neutral',
  },
  {
    description: '负责元数据设计、页面预览和平台契约治理。',
    id: 'designer',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'Studio',
    systemId: 'designer',
    title: '设计平台',
    to: '/designer',
    tone: 'brand',
  },
  {
    description: '面向业务运行、流程协作和交付执行。',
    id: 'erp',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'Runtime',
    systemId: 'erp',
    title: 'ERP 平台',
    to: '/erp',
    tone: 'success',
  },
  {
    description: '项目全过程、团队执行、报表和交付管理入口。',
    id: 'project',
    kind: 'system',
    requiresAuth: true,
    shortLabel: 'PM',
    systemId: 'project',
    title: '项目管理系统',
    to: '/project',
    tone: 'neutral',
  },
  {
    description: '主题、布局、租户和平台治理入口。',
    id: 'settings',
    kind: 'shell',
    requiresAuth: true,
    shortLabel: 'Ops',
    title: '平台设置',
    to: '/settings',
    tone: 'neutral',
  },
];

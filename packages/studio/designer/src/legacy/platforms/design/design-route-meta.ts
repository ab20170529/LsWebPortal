import type { DesignRouteKey } from '../../app/contracts/platform-routing';

export type DesignRouteMeta = {
  href: string;
  key: DesignRouteKey;
  migrationTargets: string[];
  summary: string;
  title: string;
};

export const DESIGN_FIXED_ROUTE_META: readonly DesignRouteMeta[] = [
  {
    href: '/designer/workspace',
    key: 'workspace',
    migrationTargets: [
      'Keep the existing dashboard online as the active production workbench.',
      'Continue reducing orchestration logic inside Dashboard.tsx.',
      'Use this route as the compatibility entry while feature pages are carved out.',
    ],
    summary: '通过 Design 平台迁移壳承接旧 Dashboard，统一入口状态与遗留工作台边界。',
    title: '旧工作区',
  },
  {
    href: '/designer/module',
    key: 'module',
    migrationTargets: [
      'Move module overview, module settings, and condition workbench flows here.',
      'Promote dashboard/module-settings building blocks into dedicated design pages.',
      'Use this route as the landing page for table, tree, and single-table module design.',
    ],
    summary: '模块配置、字段结构和模块级设计入口。',
    title: '模块设计',
  },
  {
    href: '/designer/bill',
    key: 'bill',
    migrationTargets: [
      'Move bill document layout, bill header workbench, and detail-board editing here.',
      'Treat bill design as its own product surface instead of a dashboard mode.',
      'Keep room for bill-specific publish, preview, and validation workflows.',
    ],
    summary: '表单布局、分组设计和页面生成入口。',
    title: '布局设计',
  },
  {
    href: '/designer/settings',
    key: 'settings',
    migrationTargets: [
      'Collect studio-level publish rules, governance toggles, and naming conventions.',
      'Keep shared settings outside of module and bill workbenches.',
      'Prepare a stable home for future platform-level preferences and release policies.',
    ],
    summary: '平台级设置、命名规则和发布参数入口。',
    title: '平台设置',
  },
] as const;

export function getDesignRouteMeta(routeKey: DesignRouteKey) {
  return DESIGN_FIXED_ROUTE_META.find((item) => item.key === routeKey);
}

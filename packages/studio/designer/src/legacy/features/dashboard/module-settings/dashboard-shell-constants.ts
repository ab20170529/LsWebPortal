export const MODULE_SETTING_STEP = 5;
export const RESTRICTION_STEP = 6;
export const PROCESS_DESIGN_STEP = 7;
export const MODULE_PREVIEW_STEP = 8;
export const MAX_CONFIG_STEP = MODULE_PREVIEW_STEP;

export const TABLE_COLUMN_MIN_WIDTH = 48;
export const TABLE_COLUMN_COLLAPSED_RENDER_WIDTH = 1;
export const TABLE_COLUMN_RESIZE_MIN_WIDTH = 0;
export const TABLE_COLUMN_AUTO_FIT_MAX_WIDTH = 680;
export const TABLE_COLUMN_RESIZE_MAX_WIDTH = 2000;

export const BILL_HEADER_WORKBENCH_MIN_ROWS = 1;
export const BILL_HEADER_WORKBENCH_MAX_ROWS = 6;

export const COMMON_FUNCTION_OPTIONS = [
  { id: 'import', name: '数据导入', icon: 'upload_file' },
  { id: 'export', name: '数据导出', icon: 'download' },
  { id: 'print', name: '打印模板', icon: 'print' },
  { id: 'approve', name: '审批流', icon: 'verified' },
  { id: 'attach', name: '附件管理', icon: 'attachment' },
];

export const DASHBOARD_CONFIG_STEPS = [
  { id: 1, title: '类型选择', desc: '先确定本次创建的是单表还是单据' },
  { id: 2, title: '菜单信息', desc: '基础路由、菜单与功能树映射' },
  { id: 3, title: '模块介绍', desc: '功能概述与使用说明' },
  { id: 4, title: '调研过程', desc: 'AI 深度业务需求分析' },
  { id: MODULE_SETTING_STEP, title: '模块设置', desc: '字段、表单与流程编排' },
  { id: RESTRICTION_STEP, title: '限制措施', desc: '规则、流程与限制配置' },
  { id: PROCESS_DESIGN_STEP, title: '流程设计', desc: '独立流程设计器与审批向导配置' },
  { id: MODULE_PREVIEW_STEP, title: '模块预览', desc: '实时交互效果演示' },
];

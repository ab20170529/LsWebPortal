export type WorkspaceMode =
  | 'project-management'
  | 'project-gantt-workspace'
  | 'task-submission'
  | 'plan-log'
  | 'delay-application'
  | 'milestone-template-management'
  | 'project-analysis-dashboard'
  | 'project-user-permission-management'
  | 'project-role-permission-management';

export type ProjectWorkspaceItem = {
  description: string;
  groupId: string;
  id: WorkspaceMode;
  label: string;
  shortLabel: string;
};

export type ProjectWorkspaceGroup = {
  id: string;
  itemIds: WorkspaceMode[];
  label: string;
};

export const projectWorkspaceGroups: ProjectWorkspaceGroup[] = [
  {
    id: 'delivery',
    itemIds: [
      'project-management',
      'project-gantt-workspace',
      'task-submission',
      'plan-log',
      'delay-application',
    ],
    label: '项目执行',
  },
  {
    id: 'template',
    itemIds: ['milestone-template-management'],
    label: '基础配置',
  },
  {
    id: 'analysis',
    itemIds: ['project-analysis-dashboard'],
    label: '分析中心',
  },
  {
    id: 'system',
    itemIds: [
      'project-user-permission-management',
      'project-role-permission-management',
    ],
    label: '系统管理',
  },
];

export const projectWorkspaceItems: ProjectWorkspaceItem[] = [
  {
    id: 'project-management',
    groupId: 'delivery',
    label: '项目台账',
    shortLabel: '台账',
    description: '按表格维护项目主档，支持新增、修改、删除和按类型初始化项目。',
  },
  {
    id: 'project-gantt-workspace',
    groupId: 'delivery',
    label: '排期协同',
    shortLabel: '排期',
    description: '承接管理员排期、节点任务搭建、分配与甘特调整。',
  },
  {
    id: 'task-submission',
    groupId: 'delivery',
    label: '任务填报',
    shortLabel: '填报',
    description: '承接任务接收、完成说明和任务延期申请等成员执行填报。',
  },
  {
    id: 'plan-log',
    groupId: 'delivery',
    label: '计划与日志',
    shortLabel: '计划',
    description: '承接月计划、周计划、日计划、总结和日志录入。',
  },
  {
    id: 'delay-application',
    groupId: 'delivery',
    label: '延期申请',
    shortLabel: '延期',
    description: '统一管理节点延期、任务延期及其申请处理记录。',
  },
  {
    id: 'milestone-template-management',
    groupId: 'template',
    label: '里程碑模板管理',
    shortLabel: '模板',
    description: '维护项目类型、节点模板、任务模板和模板排期。',
  },
  {
    id: 'project-analysis-dashboard',
    groupId: 'analysis',
    label: '项目分析看板',
    shortLabel: '分析',
    description: '建设上半展示型甘特、下半图表分析的项目分析中心。',
  },
  {
    id: 'project-user-permission-management',
    groupId: 'system',
    label: '用户权限',
    shortLabel: '用户权限',
    description: '以员工表格管理角色分配，可按用户直接设置角色。',
  },
  {
    id: 'project-role-permission-management',
    groupId: 'system',
    label: '角色权限',
    shortLabel: '角色权限',
    description: '以角色表格维护角色信息，并在角色上配置菜单权限。',
  },
];

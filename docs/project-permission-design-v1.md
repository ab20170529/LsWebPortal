# 项目管理权限设计方案 v1

## 1. 目标

本方案用于规划 `project` 系统内的人员权限，明确：

- 哪些人可以进入项目管理平台
- 哪些人可以看到哪些模块
- 哪些人可以查看全部项目，哪些人只能查看自己相关项目
- 哪些人可以执行模板维护、排期制定、任务填报、延期申请等操作

本方案基于当前已有代码能力整理，优先复用现有字段和模型，避免先设计一套过重权限体系再返工。

## 2. 现有代码基础

### 2.1 Portal 授权基座

当前 portal 已有系统级授权模型，位置：

- `LsERPPortal/packages/platform/auth/src/index.tsx`
- `LsERPPortal/apps/portal/src/features/auth/services/portal-bootstrap-service.ts`

当前已具备：

- `roleAssignments`：角色集合
- `systemGrants`：系统授权集合
- `defaultSystemId`：默认系统入口

当前已实现的是“系统级”访问控制，即：

- 是否能进入 `project` 系统
- 尚未实现 `project` 系统内的模块级权限和数据范围权限

### 2.2 项目业务侧已有字段

当前 `project` 前后端已具备以下与权限相关的业务字段：

- 项目成员：`userId`、`userName`
- 项目成员角色：`roleCode`、`roleName`
- 项目负责人标识：`isManager`
- 任务负责人：`responsibleUserId`、`responsibleName`
- 任务参与人：`participantMembers`

这意味着当前项目系统已经天然具备三类业务关系：

1. 是否属于项目团队
2. 是否为项目负责人
3. 是否为具体任务负责人 / 参与人

这三类关系足够支撑第一版权限体系。

## 3. 权限模型建议

建议采用三层权限模型：

### 3.1 第一层：系统入口权限

控制用户是否可以进入 `project` 系统。

实现方式：

- 继续沿用 portal 现有 `systemGrants`
- `systemId = project` 时表示允许进入项目管理平台

### 3.2 第二层：模块可见权限

控制进入 `project` 后，可以看到哪些菜单和页面。

这一层建议以“角色”为主控制。

### 3.3 第三层：项目数据范围权限

控制在同一个模块中，可以看哪些项目、操作哪些数据。

这一层建议以“项目关系”为主控制：

- 是否为平台管理员
- 是否为模板管理员 / PMO / 项目管理管理员
- 是否为项目负责人
- 是否为项目团队成员
- 是否为任务负责人 / 任务参与人

## 4. 推荐角色定义

第一版建议先收敛为 6 类角色。

### 4.1 平台管理员

定位：

- 拥有 `project` 系统全局权限
- 可查看全部模块、全部项目、全部模板

建议角色编码：

- `role-project-admin`

### 4.2 模板管理员

定位：

- 负责维护里程碑模板
- 不一定参与项目执行

建议角色编码：

- `role-project-template-admin`

### 4.3 项目管理管理员 / PMO

定位：

- 负责项目台账、排期制定、项目整体管理
- 可查看和管理全部项目

建议角色编码：

- `role-project-pmo`

### 4.4 项目经理

定位：

- 管理自己负责的项目
- 制定排期、分配任务、调整节点计划

建议角色编码：

- `role-project-manager`

说明：

- 角色层面允许进入执行模块
- 数据范围层面默认只看自己负责或参与的项目

### 4.5 项目成员

定位：

- 参与项目执行
- 主要做任务接收、完成说明、计划日志填报、延期申请

建议角色编码：

- `role-project-member`

### 4.6 项目观察者 / 只读分析人员

定位：

- 主要查看项目情况和分析数据
- 不参与模板维护和执行管理

建议角色编码：

- `role-project-viewer`

## 5. 模块划分与权限矩阵

当前项目系统模块如下：

- 项目台账 `project-management`
- 排期协同 `project-gantt-workspace`
- 任务填报 `task-submission`
- 计划与日志 `plan-log`
- 延期申请 `delay-application`
- 里程碑模板管理 `milestone-template-management`
- 项目分析看板 `project-analysis-dashboard`

### 5.1 模块可见矩阵

| 模块 | 平台管理员 | 模板管理员 | PMO | 项目经理 | 项目成员 | 观察者 |
| --- | --- | --- | --- | --- | --- | --- |
| 项目台账 | 是 | 否 | 是 | 是 | 否 | 是 |
| 排期协同 | 是 | 否 | 是 | 是 | 否 | 否 |
| 任务填报 | 是 | 否 | 是 | 是 | 是 | 否 |
| 计划与日志 | 是 | 否 | 是 | 是 | 是 | 否 |
| 延期申请 | 是 | 否 | 是 | 是 | 是 | 否 |
| 里程碑模板管理 | 是 | 是 | 是 | 否 | 否 | 否 |
| 项目分析看板 | 是 | 否 | 是 | 是 | 否 | 是 |

### 5.2 设计说明

#### 项目台账

适合：

- 平台管理员
- PMO
- 项目经理
- 观察者

说明：

- 项目成员不需要从台账管理项目主档
- 项目经理默认只看自己负责或参与的项目
- 观察者默认只读

#### 排期协同

适合：

- 平台管理员
- PMO
- 项目经理

说明：

- 这是管理员制定计划的主界面
- 普通成员不进入该模块做日常填报

#### 任务填报 / 计划与日志 / 延期申请

适合：

- 项目成员
- 项目经理
- PMO
- 平台管理员

说明：

- 项目成员主要只看与自己相关的任务和填报数据
- 项目经理 / PMO 可以查看本项目全部数据

#### 里程碑模板管理

适合：

- 平台管理员
- 模板管理员
- PMO

说明：

- 该模块是基础配置，不应对项目成员和项目经理默认开放

#### 项目分析看板

适合：

- 平台管理员
- PMO
- 项目经理
- 观察者

说明：

- 分析看板更偏展示与决策，不承担执行填报

## 6. 数据范围规则

同一个模块里，不同角色看到的数据范围也不同。

### 6.1 平台管理员

- 查看全部项目
- 查看全部模板
- 查看全部成员、日志、计划、延期申请
- 可执行全部管理操作

### 6.2 模板管理员

- 只需要查看和维护模板数据
- 不默认进入项目执行数据范围

### 6.3 PMO

- 查看全部项目
- 查看全部项目执行数据
- 维护项目台账、排期协同、延期申请、分析
- 可进入模板管理

### 6.4 项目经理

默认项目范围：

- 自己是项目负责人 `isManager = true` 的项目
- 或者自己属于该项目团队的项目

默认模块操作：

- 可维护自己项目的排期协同
- 可查看自己项目成员提交的填报
- 可查看自己项目的计划、日志、延期申请
- 不默认进入模板管理

### 6.5 项目成员

默认项目范围：

- 自己属于项目团队的项目

默认任务范围：

- 自己负责的任务
- 自己参与的任务

默认模块操作：

- 任务填报：看自己相关任务
- 计划与日志：填自己项目下自己的计划和日志
- 延期申请：提交自己任务的延期申请
- 不进入排期协同和模板管理

### 6.6 观察者

默认项目范围：

- 可按授权范围查看项目
- 默认只读

默认模块操作：

- 只读查看项目台账
- 只读查看分析看板

## 7. 第一版推荐判定规则

为了和现有代码最贴合，第一版建议按以下优先级判定权限。

### 7.1 系统级

判断是否存在：

- `systemGrants` 中 `systemId = project`

### 7.2 模块级

新增 `project` 模块权限映射，按 `roleAssignments` 控制菜单显示。

建议增加一份前端模块权限映射表，例如：

- 角色 -> 可见工作区列表

### 7.3 项目范围级

基于当前项目数据动态判断：

- 平台管理员：全部
- PMO：全部
- 项目经理：自己负责或参与的项目
- 项目成员：自己参与的项目
- 任务填报：只看自己负责/参与的任务

## 8. 与现有页面的落地对应

### 8.1 `ProjectWorkspaceShell`

位置：

- `packages/products/project/src/project-workspace-shell.tsx`

建议职责：

- 根据“可见工作区列表”决定左侧菜单和顶部 tab 显示哪些项

### 8.2 `project-workspace-config.ts`

位置：

- `packages/products/project/src/project-workspace-config.ts`

建议职责：

- 保持工作区定义
- 新增每个工作区对应的权限标识

### 8.3 `packages/platform/auth/src/index.tsx`

建议扩展：

- 在 `AuthSession` 基础上增加 `projectModuleGrants` 或者由角色动态推导模块可见性

第一版建议：

- 先不改后端协议
- 直接在前端通过 `roleAssignments` 推导模块权限

### 8.4 `ProjectHomePage / index.tsx`

位置：

- `packages/products/project/src/index.tsx`

建议职责：

- 在选择工作区前先过滤可见工作区
- 非授权工作区不渲染、不允许切换
- 数据请求也按工作区权限和项目范围做前置限制

## 9. 实施计划

建议分 3 步落地。

### 第一步：前端菜单可见控制

目标：

- 用户进入 `project` 后，只看到自己有权限的模块菜单

实现项：

- 定义项目角色到模块的权限映射
- 在 `ProjectWorkspaceShell` 过滤左侧菜单和 tab
- 默认工作区切换到该用户第一个可用模块

### 第二步：前端数据范围控制

目标：

- 不同角色在同模块中默认看到不同范围的数据

实现项：

- 项目经理默认只显示自己负责/参与的项目
- 项目成员默认只显示自己参与项目、自己负责/参与任务
- 观察者默认只读

### 第三步：后端接口权限收口

目标：

- 不只做前端显示限制，还要做接口层安全控制

实现项：

- 对项目台账、排期协同、任务填报、计划日志、延期申请、模板管理分别增加接口权限校验
- 对项目范围做服务端校验
- 对任务负责人 / 参与人做服务端校验

## 10. 第一版落地建议

第一版推荐先做下面这套，投入小、收益高、和现有代码最贴合：

1. 保留现有 `systemGrants` 作为系统入口控制
2. 新增一份前端 `project role -> workspace` 权限映射
3. 左侧菜单、tab、默认工作区按该映射过滤
4. 项目经理和项目成员增加项目范围过滤
5. 第二轮再把后端接口权限补齐

## 11. 推荐的第一版角色与模块映射

```ts
const projectWorkspacePermissionMap = {
  'role-project-admin': ['*'],
  'role-project-template-admin': ['milestone-template-management'],
  'role-project-pmo': [
    'project-management',
    'project-gantt-workspace',
    'task-submission',
    'plan-log',
    'delay-application',
    'milestone-template-management',
    'project-analysis-dashboard',
  ],
  'role-project-manager': [
    'project-management',
    'project-gantt-workspace',
    'task-submission',
    'plan-log',
    'delay-application',
    'project-analysis-dashboard',
  ],
  'role-project-member': [
    'task-submission',
    'plan-log',
    'delay-application',
  ],
  'role-project-viewer': [
    'project-management',
    'project-analysis-dashboard',
  ],
};
```

## 12. 结论

当前项目系统最适合采用：

- `systemGrants` 控制是否进入 `project`
- `roleAssignments` 控制模块可见性
- 项目成员 / 项目负责人 / 任务负责人关系控制数据范围

这样做的好处是：

- 和现有 portal 授权基座一致
- 和当前项目成员、任务负责人模型一致
- 不需要先重做一套复杂 RBAC
- 可以先前端落地，再逐步补后端安全校验

---

建议下一步直接进入实现：

1. 先在前端补 `project` 模块级菜单权限过滤
2. 再补项目经理 / 项目成员的数据范围过滤
3. 最后补后端接口权限校验

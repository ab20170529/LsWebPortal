# 任务依赖关系功能设计方案

## 一、概述

为项目管理甘特图添加任务依赖关系功能，支持：
- 任务间的前驱/后继关系
- 四种依赖类型（FS/FF/SS/SF）
- 依赖连线可视化
- 拖拽时的自动日期连锁调整

## 二、数据模型设计

### 2.1 数据库表

```sql
CREATE TABLE `p_pm_taskdependencytab` (
  `p_pm_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `p_pm_projectid` BIGINT NOT NULL COMMENT '项目ID',
  `p_pm_predecessortaskid` BIGINT NOT NULL COMMENT '前驱任务ID',
  `p_pm_successortaskid` BIGINT NOT NULL COMMENT '后继任务ID',
  `p_pm_dependencytype` VARCHAR(10) DEFAULT 'FS' COMMENT '依赖类型: FS/FF/SS/SF',
  `p_pm_lagdays` INT DEFAULT 0 COMMENT '滞后天数(正数)/提前天数(负数)',
  `p_pm_remark` VARCHAR(500) COMMENT '备注',
  `p_pm_createtime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `p_pm_updatetime` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_projectid` (`p_pm_projectid`),
  INDEX `idx_predecessor` (`p_pm_predecessortaskid`),
  INDEX `idx_successor` (`p_pm_successortaskid`),
  UNIQUE KEY `uk_dependency` (`p_pm_projectid`, `p_pm_predecessortaskid`, `p_pm_successortaskid`)
) COMMENT='任务依赖关系表';
```

### 2.2 依赖类型说明

| 类型 | 含义 | 说明 |
|------|------|------|
| FS | Finish-Start | 前驱任务完成，后继任务才能开始（最常用） |
| FF | Finish-Finish | 前驱任务完成，后继任务才能完成 |
| SS | Start-Start | 前驱任务开始，后继任务才能开始 |
| SF | Start-Finish | 前驱任务开始，后继任务才能完成 |

### 2.3 实体类

```java
// ProjectTaskDependencyEntity.java
@Data
@TableName("p_pm_taskdependencytab")
public class ProjectTaskDependencyEntity {
    @TableId(value = "p_pm_id", type = IdType.AUTO)
    private Long id;
    
    @TableField("p_pm_projectid")
    private Long projectId;
    
    @TableField("p_pm_predecessortaskid")
    private Long predecessorTaskId;
    
    @TableField("p_pm_successortaskid")
    private Long successorTaskId;
    
    @TableField("p_pm_dependencytype")
    private String dependencyType; // FS/FF/SS/SF
    
    @TableField("p_pm_lagdays")
    private Integer lagDays; // 默认0
    
    @TableField("p_pm_remark")
    private String remark;
    
    @TableField("p_pm_createtime")
    private LocalDateTime createTime;
    
    @TableField("p_pm_updatetime")
    private LocalDateTime updateTime;
}
```

## 三、前端类型定义

### 3.1 依赖关系类型

```typescript
// 依赖关系类型
type TaskDependency = {
  id: number;
  predecessorTaskId: number;  // 前驱任务ID
  successorTaskId: number;     // 后继任务ID
  dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
  lagDays: number;             // 滞后天数
};

// 扩展TaskItem
type TaskItem = {
  // ... 现有字段
  dependencies?: TaskDependency[]; // 该任务的依赖关系
};
```

### 3.2 连线计算

```typescript
type DependencyEndpoint = {
  x: number;      // 相对于甘特图起点的X坐标
  y: number;      // 相对于甘特图起点的Y坐标
  type: 'start' | 'end';
};

type DependencyLine = {
  id: string;
  predecessorId: string;  // 前驱任务rowId
  successorId: string;    // 后继任务rowId
  dependencyType: 'FS' | 'FF' | 'SS' | 'SF';
  from: DependencyEndpoint;
  to: DependencyEndpoint;
  lagDays: number;
};
```

### 3.3 连线位置计算逻辑

```typescript
function calculateDependencyEndpoints(
  predecessor: TimelineRow,
  successor: TimelineRow,
  dependencyType: string,
  lagDays: number
): { from: DependencyEndpoint; to: DependencyEndpoint } {
  // FS: 前驱结束点 -> 后继开始点
  // FF: 前驱结束点 -> 后继结束点  
  // SS: 前驱开始点 -> 后继开始点
  // SF: 前驱开始点 -> 后继结束点
  
  const predecessorRowY = getRowY(predecessor);
  const successorRowY = getRowY(successor);
  
  let fromX: number, toX: number;
  
  switch (dependencyType) {
    case 'FS':
      fromX = getBarRight(predecessor);  // 前驱结束
      toX = getBarLeft(successor);       // 后继开始
      break;
    case 'FF':
      fromX = getBarRight(predecessor);
      toX = getBarRight(successor);
      break;
    case 'SS':
      fromX = getBarLeft(predecessor);
      toX = getBarLeft(successor);
      break;
    case 'SF':
      fromX = getBarLeft(predecessor);
      toX = getBarRight(successor);
      break;
  }
  
  // 应用滞后天数
  toX += lagDays * DAY_COLUMN_WIDTH;
  
  return {
    from: { x: fromX, y: predecessorRowY, type: dependencyType[0] === 'F' ? 'end' : 'start' },
    to: { x: toX, y: successorRowY, type: dependencyType[1] === 'S' ? 'start' : 'end' }
  };
}
```

## 四、UI交互设计

### 4.1 连线样式

- 默认样式：蓝色虚线箭头
- 悬停样式：实线 + 高亮
- 关键路径上的连线：红色实线

### 4.2 创建依赖

**方式1：右键菜单**
- 点击任务条 → 右键 → "添加前驱任务" / "添加后继任务"
- 弹出任务选择列表

**方式2：拖拽创建**
- 按住Alt键，从任务条边缘拖拽 → 松开到另一任务条上

### 4.3 依赖管理模态框

- 列出当前任务的所有前驱和后继
- 支持添加、删除依赖
- 设置依赖类型和滞后天数

## 五、连锁日期调整

当移动/调整任务时，自动更新后继任务的日期：

```typescript
function propagateScheduleChange(
  changedTask: TimelineRow,
  deltaDays: number,
  allDependencies: TaskDependency[],
  allRows: TimelineRow[]
) {
  // 找到所有以该任务为前驱的依赖
  const outgoingDeps = allDependencies.filter(d => d.predecessorTaskId === changedTask.entityId);
  
  for (const dep of outgoingDeps) {
    const successor = allRows.find(r => r.entityId === dep.successorTaskId);
    if (!successor) continue;
    
    switch (dep.dependencyType) {
      case 'FS':
        // 前驱结束日期变化，后继开始日期随之移动
        successor.startDate = addDays(successor.startDate!, deltaDays);
        break;
      case 'FF':
        successor.endDate = addDays(successor.endDate!, deltaDays);
        break;
      case 'SS':
        successor.startDate = addDays(successor.startDate!, deltaDays);
        break;
      case 'SF':
        successor.endDate = addDays(successor.endDate!, deltaDays);
        break;
    }
    
    // 递归传播（如果有更后继的任务）
    propagateScheduleChange(successor, deltaDays, allDependencies, allRows);
  }
}
```

## 六、API设计

### 6.1 获取项目依赖关系

```
GET /api/project/projects/{projectId}/dependencies
Response: {
  code: 0,
  data: TaskDependency[]
}
```

### 6.2 创建依赖关系

```
POST /api/project/projects/{projectId}/dependencies
Body: {
  predecessorTaskId: number,
  successorTaskId: number,
  dependencyType: 'FS' | 'FF' | 'SS' | 'SF',
  lagDays: number
}
```

### 6.3 删除依赖关系

```
DELETE /api/project/projects/{projectId}/dependencies/{dependencyId}
```

### 6.4 批量更新依赖（用于连锁调整）

```
PUT /api/project/projects/{projectId}/tasks/schedule
Body: {
  taskId: number,
  newStartDate: string,
  newEndDate: string,
  propagate: boolean  // 是否连锁调整后继任务
}
```

## 七、实现计划

### Phase 1: 数据层（后端）
- [ ] 创建ProjectTaskDependencyEntity
- [ ] 创建ProjectTaskDependencyMapper
- [ ] 创建ProjectTaskDependencyService
- [ ] 创建ProjectTaskDependencyController
- [ ] 实现CRUD API

### Phase 2: 前端类型和API
- [ ] 添加TaskDependency类型
- [ ] 扩展TaskItem类型
- [ ] 添加API调用函数
- [ ] 更新数据获取逻辑

### Phase 3: 连线渲染
- [ ] 添加SVG连线组件
- [ ] 计算连线端点位置
- [ ] 实现连线样式
- [ ] 添加悬停交互

### Phase 4: 依赖管理UI
- [ ] 添加依赖管理按钮
- [ ] 创建依赖选择模态框
- [ ] 实现依赖创建/删除功能

### Phase 5: 连锁调整
- [ ] 实现日期传播逻辑
- [ ] 添加配置开关（是否自动连锁）
- [ ] 优化性能（批量更新）

### Phase 6: 增强功能
- [ ] 关键路径高亮
- [ ] 循环依赖检测
- [ ] 导出依赖关系

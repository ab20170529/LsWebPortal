import { Badge, Button, Card } from '@lserp/ui';

import type { ProgressNodeTemplate, ProgressProjectType } from './types';

type ProgressConfigSidebarProps = {
  expandedIds: Record<string, boolean>;
  onQuickAdd: (typeId: string, nodeId: string, taskId: string) => void;
  onSelectTask: (typeId: string, nodeId: string, taskId: string) => void;
  onToggle: (id: string) => void;
  projectTypes: ProgressProjectType[];
  selectedTaskId: string | null;
};

function getNodeTaskCount(node: ProgressNodeTemplate) {
  return node.tasks.length;
}

export function ProgressConfigSidebar({
  expandedIds,
  onQuickAdd,
  onSelectTask,
  onToggle,
  projectTypes,
  selectedTaskId,
}: ProgressConfigSidebarProps) {
  return (
    <Card className="rounded-[32px] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.22em]">
            模板树
          </div>
          <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
            项目类型与节点模板
          </div>
        </div>
        <Badge tone="brand">{projectTypes.length}</Badge>
      </div>

      <div className="mt-5 space-y-4">
        {projectTypes.map((projectType) => {
          const typeExpanded = expandedIds[projectType.id] ?? true;

          return (
            <div
              key={projectType.id}
              className="rounded-[26px] border p-4"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--portal-color-surface-panel) 86%, white)',
                borderColor:
                  'color-mix(in srgb, var(--portal-color-border-soft) 74%, white)',
              }}
            >
              <button
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => {
                  onToggle(projectType.id);
                }}
                type="button"
              >
                <div>
                  <div className="theme-text-strong text-sm font-black tracking-tight">
                    {projectType.title}
                  </div>
                  <div className="theme-text-muted mt-2 text-sm leading-6">
                    {projectType.description}
                  </div>
                </div>
                <Badge tone="neutral">{projectType.code}</Badge>
              </button>

              {typeExpanded ? (
                <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
                  {projectType.nodes.map((node) => {
                    const nodeExpanded = expandedIds[node.id] ?? true;

                    return (
                      <div key={node.id} className="theme-surface-subtle rounded-[22px] p-4">
                        <button
                          className="flex w-full items-center justify-between gap-3 text-left"
                          onClick={() => {
                            onToggle(node.id);
                          }}
                          type="button"
                        >
                          <div>
                            <div className="theme-text-strong text-sm font-semibold">
                              {node.title}
                            </div>
                            <div className="theme-text-muted mt-1 text-xs uppercase tracking-[0.16em]">
                              {node.code}
                            </div>
                          </div>
                          <Badge tone="neutral">{getNodeTaskCount(node)} 个任务</Badge>
                        </button>

                        {nodeExpanded ? (
                          <div className="mt-3 space-y-2">
                            {node.tasks.length ? node.tasks.map((task) => {
                              const isSelected = selectedTaskId === task.id;

                              return (
                                <div
                                  key={task.id}
                                  className="rounded-[18px] border px-4 py-3 transition-transform hover:-translate-y-0.5"
                                  style={{
                                    backgroundColor: isSelected
                                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 8%, white)'
                                      : 'white',
                                    borderColor: isSelected
                                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 30%, white)'
                                      : 'color-mix(in srgb, var(--portal-color-border-soft) 74%, white)',
                                  }}
                                >
                                  <button
                                    className="w-full text-left"
                                    onClick={() => {
                                      onSelectTask(projectType.id, node.id, task.id);
                                    }}
                                    type="button"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="theme-text-strong text-sm font-semibold">
                                        {task.title}
                                      </div>
                                      <Badge tone={isSelected ? 'brand' : 'neutral'}>
                                        {task.schedules.length}
                                      </Badge>
                                    </div>
                                    <div className="theme-text-muted mt-2 text-xs leading-6">
                                      {task.code} / {task.leadRole}
                                    </div>
                                  </button>

                                  <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className="theme-text-muted text-xs">
                                      {task.planDay
                                        ? `计划工期 ${task.planDay} 天`
                                        : '暂未配置排期块'}
                                    </div>
                                    <Button
                                      onClick={() => {
                                        onQuickAdd(projectType.id, node.id, task.id);
                                      }}
                                      tone="ghost"
                                    >
                                      新增排期
                                    </Button>
                                  </div>
                                </div>
                              );
                            }) : (
                              <div className="rounded-[18px] border border-dashed px-4 py-5 text-sm theme-text-muted">
                                当前节点还没有任务模板，先在右侧编辑区新增任务，再回来配置排期。
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

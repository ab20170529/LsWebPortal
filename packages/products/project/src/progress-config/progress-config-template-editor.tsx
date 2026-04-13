import type { ChangeEvent } from 'react';

import { Button, Card } from '@lserp/ui';

type TemplateOption = {
  id: string;
  label: string;
};

type TypeFormState = {
  sort: string;
  status: string;
  typeCode: string;
  typeDesc: string;
  typeName: string;
};

type NodeFormState = {
  needAudit: boolean;
  needCheck: boolean;
  nodeCode: string;
  nodeName: string;
  planDay: string;
  remark: string;
};

type TaskFormState = {
  needAudit: boolean;
  needCheck: boolean;
  needFile: boolean;
  needSettle: boolean;
  planDay: string;
  remark: string;
  taskCode: string;
  taskContent: string;
  taskTitle: string;
};

type ProgressConfigTemplateEditorProps = {
  activeNodeId: string | null;
  activeTaskTitle?: string | null;
  activeTypeId: string | null;
  errorMessage?: string | null;
  message?: string | null;
  onCreateType: () => void;
  onDeleteType: () => void;
  nodeBusy: boolean;
  nodeForm: NodeFormState;
  nodeOptions: TemplateOption[];
  onActiveNodeChange: (value: string) => void;
  onActiveTypeChange: (value: string) => void;
  onCreateNode: () => void;
  onCreateTask: () => void;
  onDeleteNode: () => void;
  onDeleteTask: () => void;
  onTypeFormChange: (patch: Partial<TypeFormState>) => void;
  onNodeFormChange: (patch: Partial<NodeFormState>) => void;
  onTaskFormChange: (patch: Partial<TaskFormState>) => void;
  onUpdateType: () => void;
  onUpdateNode: () => void;
  onUpdateTask: () => void;
  taskBusy: boolean;
  taskForm: TaskFormState;
  typeBusy: boolean;
  typeForm: TypeFormState;
  typeOptions: TemplateOption[];
};

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm">
      <input
        checked={checked}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange(event.target.checked);
        }}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function RequiredLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="theme-text-soft flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em]">
      <span>{children}</span>
      {required ? <span className="text-rose-500">*</span> : null}
    </span>
  );
}

export function ProgressConfigTemplateEditor({
  activeNodeId,
  activeTaskTitle,
  activeTypeId,
  errorMessage,
  message,
  onCreateType,
  onDeleteType,
  nodeBusy,
  nodeForm,
  nodeOptions,
  onActiveNodeChange,
  onActiveTypeChange,
  onCreateNode,
  onCreateTask,
  onDeleteNode,
  onDeleteTask,
  onTypeFormChange,
  onNodeFormChange,
  onTaskFormChange,
  onUpdateType,
  onUpdateNode,
  onUpdateTask,
  taskBusy,
  taskForm,
  typeBusy,
  typeForm,
  typeOptions,
}: ProgressConfigTemplateEditorProps) {
  const disableTypeActions = typeBusy;
  const disableNodeActions = !activeTypeId || nodeBusy;
  const disableTaskActions = !activeTypeId || !activeNodeId || taskBusy;

  return (
    <Card className="rounded-[32px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
            模板编辑区
          </div>
          <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
            统一维护类型、节点与任务模板
          </div>
          <div className="theme-text-muted mt-3 text-sm leading-7">
            在同一个工作台里维护模板结构：先选择项目类型，再维护节点模板，最后维护节点下的任务模板。
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <RequiredLabel>当前项目类型</RequiredLabel>
          <select
            className="theme-input h-12 w-full rounded-2xl px-4"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              onActiveTypeChange(event.target.value);
            }}
            value={activeTypeId ?? ''}
          >
            <option value="">请选择项目类型</option>
            {typeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
            当前节点模板
          </span>
          <select
            className="theme-input h-12 w-full rounded-2xl px-4"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              onActiveNodeChange(event.target.value);
            }}
            value={activeNodeId ?? ''}
          >
            <option value="">请选择节点模板</option>
            {nodeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? (
        <div className="mt-5 rounded-[20px] border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-[20px] border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <div className="theme-surface-subtle rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="theme-text-strong text-lg font-black tracking-tight">项目类型</div>
            <div className="theme-text-muted text-xs uppercase tracking-[0.16em]">
              {typeBusy ? '保存中' : '可编辑'}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <RequiredLabel required>类型编码</RequiredLabel>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onTypeFormChange({ typeCode: event.target.value });
                }}
                placeholder="例如：DESIGN_STANDARD"
                value={typeForm.typeCode}
              />
            </label>

            <label className="block space-y-2">
              <RequiredLabel required>类型名称</RequiredLabel>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onTypeFormChange({ typeName: event.target.value });
                }}
                placeholder="例如：设计项目标准模板"
                value={typeForm.typeName}
              />
            </label>

            <label className="block space-y-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                状态
              </span>
              <select
                className="theme-input h-12 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  onTypeFormChange({ status: event.target.value });
                }}
                value={typeForm.status}
              >
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                排序
              </span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onTypeFormChange({ sort: event.target.value });
                }}
                placeholder="默认 0"
                type="number"
                value={typeForm.sort}
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                类型说明
              </span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onTypeFormChange({ typeDesc: event.target.value });
                }}
                placeholder="补充说明该类型适用范围或交付特点"
                value={typeForm.typeDesc}
              />
            </label>
          </div>

          {!activeTypeId ? (
            <div className="theme-text-muted mt-4 text-sm leading-6">
              还没有选中项目类型时，可以直接填写上面的表单并点击“新增类型”。
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={disableTypeActions} onClick={onCreateType}>
              新增类型
            </Button>
            <Button
              disabled={disableTypeActions || !activeTypeId}
              onClick={onUpdateType}
              tone="ghost"
            >
              保存类型
            </Button>
            <Button
              disabled={disableTypeActions || !activeTypeId}
              onClick={onDeleteType}
              tone="ghost"
            >
              删除类型
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="theme-surface-subtle rounded-[28px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="theme-text-strong text-lg font-black tracking-tight">节点模板</div>
              <div className="theme-text-muted text-xs uppercase tracking-[0.16em]">
                {nodeBusy ? '保存中' : '可编辑'}
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block space-y-2">
                <RequiredLabel required>节点编码</RequiredLabel>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onNodeFormChange({ nodeCode: event.target.value });
                  }}
                  placeholder="例如：NODE_DISCOVERY"
                  value={nodeForm.nodeCode}
                />
              </label>

              <label className="block space-y-2">
                <RequiredLabel required>节点名称</RequiredLabel>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onNodeFormChange({ nodeName: event.target.value });
                  }}
                  placeholder="例如：需求调研"
                  value={nodeForm.nodeName}
                />
              </label>

              <label className="block space-y-2">
                <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                  计划天数
                </span>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onNodeFormChange({ planDay: event.target.value });
                  }}
                  placeholder="例如：5"
                  type="number"
                  value={nodeForm.planDay}
                />
              </label>

              <label className="block space-y-2">
                <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                  备注
                </span>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onNodeFormChange({ remark: event.target.value });
                  }}
                  placeholder="补充节点目标、输出物或注意事项"
                  value={nodeForm.remark}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <CheckboxField
                  checked={nodeForm.needCheck}
                  label="需要验收"
                  onChange={(checked) => {
                    onNodeFormChange({ needCheck: checked });
                  }}
                />
                <CheckboxField
                  checked={nodeForm.needAudit}
                  label="需要审核"
                  onChange={(checked) => {
                    onNodeFormChange({ needAudit: checked });
                  }}
                />
              </div>
            </div>

            {!activeTypeId ? (
              <div className="theme-text-muted mt-4 text-sm leading-6">
                请先选择一个项目类型，节点模板会挂在该类型下面。
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button disabled={disableNodeActions} onClick={onCreateNode}>
                新增节点
              </Button>
              <Button
                disabled={disableNodeActions || !activeNodeId}
                onClick={onUpdateNode}
                tone="ghost"
              >
                保存节点
              </Button>
              <Button
                disabled={disableNodeActions || !activeNodeId}
                onClick={onDeleteNode}
                tone="ghost"
              >
                删除节点
              </Button>
            </div>
          </div>

          <div className="theme-surface-subtle rounded-[28px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="theme-text-strong text-lg font-black tracking-tight">
                  任务模板
                </div>
                <div className="theme-text-muted mt-1 text-sm">
                  {activeTaskTitle ??
                    '请选择一个任务模板，或在当前节点下新增任务模板。'}
                </div>
              </div>
              <div className="theme-text-muted text-xs uppercase tracking-[0.16em]">
                {taskBusy ? '保存中' : '可编辑'}
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block space-y-2">
                <RequiredLabel required>任务编码</RequiredLabel>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onTaskFormChange({ taskCode: event.target.value });
                  }}
                  placeholder="例如：TASK_LAYOUT"
                  value={taskForm.taskCode}
                />
              </label>

              <label className="block space-y-2">
                <RequiredLabel required>任务标题</RequiredLabel>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onTaskFormChange({ taskTitle: event.target.value });
                  }}
                  placeholder="例如：完成平面布局草案"
                  value={taskForm.taskTitle}
                />
              </label>

              <label className="block space-y-2">
                <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                  计划天数
                </span>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onTaskFormChange({ planDay: event.target.value });
                  }}
                  placeholder="例如：3"
                  type="number"
                  value={taskForm.planDay}
                />
              </label>

              <label className="block space-y-2">
                <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                  任务内容
                </span>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onTaskFormChange({ taskContent: event.target.value });
                  }}
                  placeholder="填写任务执行内容、交付件或说明"
                  value={taskForm.taskContent}
                />
              </label>

              <label className="block space-y-2">
                <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.16em]">
                  备注
                </span>
                <input
                  className="theme-input h-12 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onTaskFormChange({ remark: event.target.value });
                  }}
                  placeholder="补充注意事项、依赖条件等"
                  value={taskForm.remark}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <CheckboxField
                  checked={taskForm.needCheck}
                  label="需要验收"
                  onChange={(checked) => {
                    onTaskFormChange({ needCheck: checked });
                  }}
                />
                <CheckboxField
                  checked={taskForm.needAudit}
                  label="需要审核"
                  onChange={(checked) => {
                    onTaskFormChange({ needAudit: checked });
                  }}
                />
                <CheckboxField
                  checked={taskForm.needFile}
                  label="需要资料"
                  onChange={(checked) => {
                    onTaskFormChange({ needFile: checked });
                  }}
                />
                <CheckboxField
                  checked={taskForm.needSettle}
                  label="需要结算"
                  onChange={(checked) => {
                    onTaskFormChange({ needSettle: checked });
                  }}
                />
              </div>
            </div>

            {!activeTypeId ? (
              <div className="theme-text-muted mt-4 text-sm leading-6">
                请先选择项目类型和节点模板，再新增或编辑任务模板。
              </div>
            ) : !activeNodeId ? (
              <div className="theme-text-muted mt-4 text-sm leading-6">
                当前还没有选中节点模板，任务模板需要挂在具体节点下面。
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button disabled={disableTaskActions} onClick={onCreateTask}>
                新增任务
              </Button>
              <Button
                disabled={disableTaskActions || !activeTaskTitle}
                onClick={onUpdateTask}
                tone="ghost"
              >
                保存任务
              </Button>
              <Button
                disabled={disableTaskActions || !activeTaskTitle}
                onClick={onDeleteTask}
                tone="ghost"
              >
                删除任务
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { startTransition, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { createApiClient } from '@lserp/http';
import { Badge, Button, Card } from '@lserp/ui';

import { ProgressConfigModal } from './progress-config-modal';
import { useProjectToast } from '../project-toast';
import { ProgressConfigSidebar } from './progress-config-sidebar';
import { ProgressConfigTemplateEditor } from './progress-config-template-editor';
import { ProgressConfigTimeline } from './progress-config-timeline';
import type {
  ProgressProjectType,
  ProgressSchedule,
  ScheduleColor,
  SelectedSchedule,
} from './types';
import {
  countScheduleBlocks,
  countTaskTemplates,
  createScheduleId,
  fromDayIndex,
  getCurrentDayIndex,
  getScheduleEndIndex,
  getScheduleStartIndex,
  toDayIndex,
} from './utils';

type BasicProjectType = {
  id: number;
  sort?: number | null;
  status?: string | null;
  typeCode: string;
  typeDesc?: string | null;
  typeName: string;
};

type ApiProjectTypeNode = {
  id: number;
  needAudit?: boolean | null;
  needCheck?: boolean | null;
  nodeCode: string;
  nodeName: string;
  planDay?: number | null;
  remark?: string | null;
  sort?: number | null;
};

type ApiProjectTypeTask = {
  id: number;
  needAudit?: boolean | null;
  needCheck?: boolean | null;
  needFile?: boolean | null;
  needSettle?: boolean | null;
  nodeId: number;
  planDay?: number | null;
  remark?: string | null;
  sort?: number | null;
  taskCode: string;
  taskContent?: string | null;
  taskTitle: string;
};

type ApiProjectTypeTaskSchedule = {
  color?: string | null;
  endDay: number;
  endMonth: number;
  id: number;
  nodeId: number;
  ownerName?: string | null;
  projectTypeId: number;
  projectTypeTaskId: number;
  remark?: string | null;
  sort?: number | null;
  startDay: number;
  startMonth: number;
};

type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

type PagedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

const projectApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

type ProgressConfigPageProps = {
  projectTypes: BasicProjectType[];
};

type TemplateTypeFormState = {
  sort: string;
  status: string;
  typeCode: string;
  typeDesc: string;
  typeName: string;
};

type TemplateNodeFormState = {
  needAudit: boolean;
  needCheck: boolean;
  nodeCode: string;
  nodeName: string;
  planDay: string;
  remark: string;
};

type TemplateTaskFormState = {
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

const initialNodeFormState: TemplateNodeFormState = {
  needAudit: false,
  needCheck: false,
  nodeCode: '',
  nodeName: '',
  planDay: '',
  remark: '',
};

const initialTypeFormState: TemplateTypeFormState = {
  sort: '0',
  status: 'ACTIVE',
  typeCode: '',
  typeDesc: '',
  typeName: '',
};

const initialTaskFormState: TemplateTaskFormState = {
  needAudit: false,
  needCheck: false,
  needFile: false,
  needSettle: false,
  planDay: '',
  remark: '',
  taskCode: '',
  taskContent: '',
  taskTitle: '',
};

function buildExpandedState(projectTypes: ProgressProjectType[]) {
  return projectTypes.reduce<Record<string, boolean>>((accumulator, projectType) => {
    accumulator[projectType.id] = true;
    projectType.nodes.forEach((node) => {
      accumulator[node.id] = true;
    });
    return accumulator;
  }, {});
}

function findTask(projectTypes: ProgressProjectType[], selection: SelectedSchedule | null) {
  if (!selection) {
    return null;
  }

  for (const projectType of projectTypes) {
    if (projectType.id !== selection.typeId) {
      continue;
    }

    for (const node of projectType.nodes) {
      if (node.id !== selection.nodeId) {
        continue;
      }

      for (const task of node.tasks) {
        if (task.id === selection.taskId) {
          return task;
        }
      }
    }
  }

  return null;
}

function findTaskById(projectTypes: ProgressProjectType[], taskId: string | null) {
  if (!taskId) {
    return null;
  }

  for (const projectType of projectTypes) {
    for (const node of projectType.nodes) {
      for (const task of node.tasks) {
        if (task.id === taskId) {
          return task;
        }
      }
    }
  }

  return null;
}

function findTypeById(projectTypes: ProgressProjectType[], typeId: string | null) {
  if (!typeId) {
    return null;
  }

  return projectTypes.find((projectType) => projectType.id === typeId) ?? null;
}

function findNodeById(projectTypes: ProgressProjectType[], typeId: string | null, nodeId: string | null) {
  const projectType = findTypeById(projectTypes, typeId);
  if (!projectType || !nodeId) {
    return null;
  }

  return projectType.nodes.find((node) => node.id === nodeId) ?? null;
}

function findSchedule(projectTypes: ProgressProjectType[], selection: SelectedSchedule | null) {
  const task = findTask(projectTypes, selection);
  return task?.schedules.find((schedule) => schedule.id === selection?.scheduleId) ?? null;
}

function replaceTaskSchedules(
  projectTypes: ProgressProjectType[],
  selection: SelectedSchedule,
  schedules: ProgressSchedule[],
) {
  return projectTypes.map((projectType) => {
    if (projectType.id !== selection.typeId) {
      return projectType;
    }

    return {
      ...projectType,
      nodes: projectType.nodes.map((node) => {
        if (node.id !== selection.nodeId) {
          return node;
        }

        return {
          ...node,
          tasks: node.tasks.map((task) => {
            if (task.id !== selection.taskId) {
              return task;
            }

            return {
              ...task,
              schedules,
            };
          }),
        };
      }),
    };
  });
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '加载模板数据失败，请稍后重试。';
}

async function requestData<T>(path: string, query?: Record<string, string | number>) {
  const response = await projectApiClient.request<CommonResult<T>>(path, {
    method: 'GET',
    query,
  });
  return response.data;
}

async function mutateData<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: object) {
  const response = await projectApiClient.request<CommonResult<T>>(path, {
    body,
    method,
  });
  return response.data;
}

function numberToNull(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeScheduleColor(color: string | null | undefined): ScheduleColor {
  if (color === 'emerald' || color === 'violet') {
    return color;
  }

  return 'blue';
}

function mapSchedule(schedule: ApiProjectTypeTaskSchedule): ProgressSchedule {
  return {
    color: normalizeScheduleColor(schedule.color),
    endDay: schedule.endDay,
    endMonth: schedule.endMonth,
    id: `schedule-${schedule.id}`,
    owner: schedule.ownerName ?? '',
    remark: schedule.remark ?? undefined,
    sourceId: schedule.id,
    sort: schedule.sort ?? 0,
    startDay: schedule.startDay,
    startMonth: schedule.startMonth,
  };
}

function buildProjectTypeTree(
  baseProjectType: BasicProjectType,
  nodes: ApiProjectTypeNode[],
  tasks: ApiProjectTypeTask[],
  schedules: ApiProjectTypeTaskSchedule[],
): ProgressProjectType {
  const sortedNodes = [...nodes].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0));
  const sortedTasks = [...tasks].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0));
  const schedulesByTaskId = schedules.reduce<Record<number, ProgressSchedule[]>>(
    (accumulator, schedule) => {
      const taskId = schedule.projectTypeTaskId;
      const taskSchedules = accumulator[taskId] ?? [];
      taskSchedules.push(mapSchedule(schedule));
      accumulator[taskId] = taskSchedules.sort((left, right) => {
        const leftSort = left.sort ?? 0;
        const rightSort = right.sort ?? 0;
        if (leftSort !== rightSort) {
          return leftSort - rightSort;
        }
        return getScheduleStartIndex(left) - getScheduleStartIndex(right);
      });
      return accumulator;
    },
    {},
  );

  return {
    code: baseProjectType.typeCode,
    description: baseProjectType.typeDesc?.trim()
      ? baseProjectType.typeDesc
      : `${baseProjectType.typeName}，当前已配置 ${sortedNodes.length} 个节点模板。`,
    id: `type-${baseProjectType.id}`,
    nodes: sortedNodes.map((node) => ({
      code: node.nodeCode,
      description: node.remark ?? undefined,
      id: `node-${node.id}`,
      needAudit: Boolean((node as ApiProjectTypeNode & { needAudit?: boolean | null }).needAudit),
      needCheck: Boolean((node as ApiProjectTypeNode & { needCheck?: boolean | null }).needCheck),
      planDay: node.planDay,
      sourceId: node.id,
      tasks: sortedTasks
        .filter((task) => task.nodeId === node.id)
        .map((task) => ({
          code: task.taskCode,
          description: task.taskContent ?? task.remark ?? undefined,
          id: `task-${task.id}`,
          leadRole: task.needCheck ? '需验收' : task.needAudit ? '需审核' : '普通模板任务',
          needAudit: Boolean(task.needAudit),
          needCheck: Boolean(task.needCheck),
          needFile: Boolean((task as ApiProjectTypeTask & { needFile?: boolean | null }).needFile),
          needSettle: Boolean((task as ApiProjectTypeTask & { needSettle?: boolean | null }).needSettle),
          planDay: task.planDay,
          remark: task.remark ?? undefined,
          schedules: schedulesByTaskId[task.id] ?? [],
          sourceId: task.id,
          taskContent: task.taskContent ?? undefined,
          title: task.taskTitle,
        })),
      title: node.nodeName,
    })),
    sourceId: baseProjectType.id,
    sort: baseProjectType.sort ?? 0,
    status: baseProjectType.status ?? 'ACTIVE',
    typeDesc: baseProjectType.typeDesc ?? undefined,
    title: baseProjectType.typeName,
  };
}

function normalizeScheduleDraft(schedule: ProgressSchedule): ProgressSchedule {
  const startIndex = toDayIndex(schedule.startMonth, schedule.startDay);
  const endIndex = toDayIndex(schedule.endMonth, schedule.endDay);
  const normalizedStart = fromDayIndex(startIndex);
  const normalizedEnd = fromDayIndex(endIndex >= startIndex ? endIndex : startIndex);

  return {
    ...schedule,
    endDay: normalizedEnd.day,
    endMonth: normalizedEnd.month,
    owner: schedule.owner.trim(),
    remark: schedule.remark?.trim() || undefined,
    startDay: normalizedStart.day,
    startMonth: normalizedStart.month,
  };
}

function buildSchedulePayload(schedules: ProgressSchedule[]) {
  return {
    schedules: schedules.map((schedule, index) => ({
      color: schedule.color,
      endDay: schedule.endDay,
      endMonth: schedule.endMonth,
      ownerName: schedule.owner.trim() || null,
      remark: schedule.remark?.trim() || null,
      sort: index,
      startDay: schedule.startDay,
      startMonth: schedule.startMonth,
    })),
  };
}

function isNumericFieldValid(value: string) {
  const normalized = value.trim();
  return !normalized || Number.isFinite(Number(normalized));
}

function validateTypeForm(form: TemplateTypeFormState) {
  if (!form.typeCode.trim()) {
    return '请填写项目类型编码。';
  }

  if (!form.typeName.trim()) {
    return '请填写项目类型名称。';
  }

  if (!isNumericFieldValid(form.sort)) {
    return '项目类型排序必须是数字。';
  }

  return null;
}

function validateNodeForm(form: TemplateNodeFormState) {
  if (!form.nodeCode.trim()) {
    return '请填写节点模板编码。';
  }

  if (!form.nodeName.trim()) {
    return '请填写节点模板名称。';
  }

  if (!isNumericFieldValid(form.planDay)) {
    return '节点计划天数必须是数字。';
  }

  return null;
}

function validateTaskForm(form: TemplateTaskFormState) {
  if (!form.taskCode.trim()) {
    return '请填写任务模板编码。';
  }

  if (!form.taskTitle.trim()) {
    return '请填写任务模板标题。';
  }

  if (!isNumericFieldValid(form.planDay)) {
    return '任务计划天数必须是数字。';
  }

  return null;
}

function validateScheduleDraft(schedule: ProgressSchedule) {
  const startIndex = toDayIndex(schedule.startMonth, schedule.startDay);
  const endIndex = toDayIndex(schedule.endMonth, schedule.endDay);

  if (endIndex < startIndex) {
    return '结束日期不能早于开始日期。';
  }

  return null;
}

function confirmAction(message: string) {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.confirm(message);
}

export function ProgressConfigPage({ projectTypes: basicProjectTypes }: ProgressConfigPageProps) {
  const { pushToast } = useProjectToast();
  const [typeHeaders, setTypeHeaders] = useState<BasicProjectType[]>(basicProjectTypes);
  const [projectTypes, setProjectTypes] = useState<ProgressProjectType[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [editingSelection, setEditingSelection] = useState<SelectedSchedule | null>(null);
  const [draftSchedule, setDraftSchedule] = useState<ProgressSchedule | null>(null);
  const [typeForm, setTypeForm] = useState<TemplateTypeFormState>(initialTypeFormState);
  const [nodeForm, setNodeForm] = useState<TemplateNodeFormState>(initialNodeFormState);
  const [taskForm, setTaskForm] = useState<TemplateTaskFormState>(initialTaskFormState);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [structureMessage, setStructureMessage] = useState<string | null>(null);
  const [templateActionLoading, setTemplateActionLoading] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    pushToast({
      message: saveMessage,
      tone: 'success',
    });
    setSaveMessage(null);
  }, [pushToast, saveMessage]);

  useEffect(() => {
    if (!structureMessage) {
      return;
    }

    pushToast({
      message: structureMessage,
      tone: 'success',
    });
    setStructureMessage(null);
  }, [pushToast, structureMessage]);

  useEffect(() => {
    if (!saveError) {
      return;
    }

    pushToast({
      message: saveError,
      tone: 'danger',
    });
    setSaveError(null);
  }, [pushToast, saveError]);

  useEffect(() => {
    if (!structureError) {
      return;
    }

    pushToast({
      message: structureError,
      tone: 'danger',
    });
    setStructureError(null);
  }, [pushToast, structureError]);

  useEffect(() => {
    setTypeHeaders(basicProjectTypes);
  }, [basicProjectTypes]);

  useEffect(() => {
    let active = true;

    const loadTemplateData = async () => {
      if (!typeHeaders.length) {
        if (!active) {
          return;
        }
        setProjectTypes([]);
        setExpandedIds({});
        setLoadError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const trees = await Promise.all(
          typeHeaders.map(async (projectType) => {
            const [nodes, tasks, schedules] = await Promise.all([
              requestData<ApiProjectTypeNode[]>(`/api/project/types/${projectType.id}/nodes`),
              requestData<ApiProjectTypeTask[]>(`/api/project/types/${projectType.id}/tasks`),
              requestData<ApiProjectTypeTaskSchedule[]>(
                `/api/project/types/${projectType.id}/task-schedules`,
              ),
            ]);

            return buildProjectTypeTree(projectType, nodes, tasks, schedules);
          }),
        );

        if (!active) {
          return;
        }

        setProjectTypes(trees);
        setExpandedIds(buildExpandedState(trees));
        setSelectedTaskId((current) => (findTaskById(trees, current) ? current : null));
      } catch (error) {
        if (!active) {
          return;
        }
        setProjectTypes([]);
        setExpandedIds({});
        setLoadError(normalizeErrorMessage(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTemplateData();

    return () => {
      active = false;
    };
  }, [reloadNonce, typeHeaders]);

  useEffect(() => {
    const nextType = findTypeById(projectTypes, activeTypeId) ?? projectTypes[0] ?? null;
    if (nextType?.id !== activeTypeId) {
      setActiveTypeId(nextType?.id ?? null);
    }
  }, [activeTypeId, projectTypes]);

  useEffect(() => {
    const nextNode = findNodeById(projectTypes, activeTypeId, activeNodeId)
      ?? findTypeById(projectTypes, activeTypeId)?.nodes[0]
      ?? null;
    if (nextNode?.id !== activeNodeId) {
      setActiveNodeId(nextNode?.id ?? null);
    }
  }, [activeNodeId, activeTypeId, projectTypes]);

  useEffect(() => {
    const currentNode = findNodeById(projectTypes, activeTypeId, activeNodeId);
    if (!currentNode) {
      if (selectedTaskId !== null) {
        setSelectedTaskId(null);
      }
      return;
    }

    const nextTask = currentNode.tasks.find((task) => task.id === selectedTaskId) ?? currentNode.tasks[0] ?? null;
    if (nextTask?.id !== selectedTaskId) {
      setSelectedTaskId(nextTask?.id ?? null);
    }
  }, [activeNodeId, activeTypeId, projectTypes, selectedTaskId]);

  const filteredProjectTypes = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return projectTypes;
    }

    return projectTypes
      .map((projectType) => ({
        ...projectType,
        nodes: projectType.nodes
          .map((node) => ({
            ...node,
            tasks: node.tasks.filter((task) => {
              const haystack =
                `${projectType.title} ${node.title} ${task.title} ${task.code}`.toLowerCase();
              return haystack.includes(normalized);
            }),
          }))
          .filter((node) => node.tasks.length > 0),
      }))
      .filter((projectType) => projectType.nodes.length > 0);
  }, [projectTypes, searchValue]);

  const activeType = findTypeById(projectTypes, activeTypeId);
  const activeNode = findNodeById(projectTypes, activeTypeId, activeNodeId);
  const selectedTask =
    findTask(projectTypes, editingSelection) ?? findTaskById(projectTypes, selectedTaskId);
  const selectedTaskInActiveNode =
    selectedTask && activeNode?.tasks.some((task) => task.id === selectedTask.id) ? selectedTask : null;
  const typeOptions = projectTypes.map((projectType) => ({
    id: projectType.id,
    label: `${projectType.title} (${projectType.code})`,
  }));
  const nodeOptions = (activeType?.nodes ?? []).map((node) => ({
    id: node.id,
    label: `${node.title} (${node.code})`,
  }));

  useEffect(() => {
    if (!activeType) {
      setTypeForm(initialTypeFormState);
      return;
    }

    setTypeForm({
      sort: activeType.sort == null ? '0' : String(activeType.sort),
      status: activeType.status ?? 'ACTIVE',
      typeCode: activeType.code,
      typeDesc: activeType.typeDesc ?? '',
      typeName: activeType.title,
    });
  }, [activeType]);

  useEffect(() => {
    if (!activeNode) {
      setNodeForm(initialNodeFormState);
      return;
    }

    setNodeForm({
      needAudit: Boolean(activeNode.needAudit),
      needCheck: Boolean(activeNode.needCheck),
      nodeCode: activeNode.code,
      nodeName: activeNode.title,
      planDay: activeNode.planDay == null ? '' : String(activeNode.planDay),
      remark: activeNode.description ?? '',
    });
  }, [activeNode]);

  useEffect(() => {
    if (!selectedTaskInActiveNode) {
      setTaskForm(initialTaskFormState);
      return;
    }

    setTaskForm({
      needAudit: Boolean(selectedTaskInActiveNode.needAudit),
      needCheck: Boolean(selectedTaskInActiveNode.needCheck),
      needFile: Boolean(selectedTaskInActiveNode.needFile),
      needSettle: Boolean(selectedTaskInActiveNode.needSettle),
      planDay: selectedTaskInActiveNode.planDay == null ? '' : String(selectedTaskInActiveNode.planDay),
      remark: selectedTaskInActiveNode.remark ?? '',
      taskCode: selectedTaskInActiveNode.code,
      taskContent: selectedTaskInActiveNode.taskContent ?? '',
      taskTitle: selectedTaskInActiveNode.title,
    });
  }, [selectedTaskInActiveNode]);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value);
  }

  function handleToggle(id: string) {
    setExpandedIds((current) => ({
      ...current,
      [id]: !(current[id] ?? true),
    }));
  }

  function handleSelectTask(typeId: string, nodeId: string, taskId: string) {
    startTransition(() => {
      setActiveTypeId(typeId);
      setActiveNodeId(nodeId);
      setSelectedTaskId(taskId);
      setStructureError(null);
      setStructureMessage(null);
    });
  }

  function handleActiveTypeChange(value: string) {
    startTransition(() => {
      setActiveTypeId(value || null);
      setActiveNodeId(null);
      setSelectedTaskId(null);
      setStructureError(null);
      setStructureMessage(null);
    });
  }

  function handleActiveNodeChange(value: string) {
    startTransition(() => {
      setActiveNodeId(value || null);
      setSelectedTaskId((current) => {
        const nextNode = findNodeById(projectTypes, activeTypeId, value || null);
        return nextNode?.tasks.some((task) => task.id === current) ? current : null;
      });
      setStructureError(null);
      setStructureMessage(null);
    });
  }

  async function refreshTypeHeaders() {
    const response = await requestData<PagedResult<BasicProjectType>>('/api/project/types', {
      pageNumber: 1,
      pageSize: 200,
    });
    setTypeHeaders(response.items);
    return response.items;
  }

  async function handleCreateType() {
    const validationMessage = validateTypeForm(typeForm);
    if (validationMessage) {
      setStructureError(validationMessage);
      setStructureMessage(null);
      return;
    }

    setTemplateActionLoading('create-type');
    setStructureError(null);
    setStructureMessage(null);

    try {
      const created = await mutateData<BasicProjectType>('/api/project/types', 'POST', {
        sort: numberToNull(typeForm.sort) ?? 0,
        status: typeForm.status.trim() || 'ACTIVE',
        typeCode: typeForm.typeCode.trim(),
        typeDesc: typeForm.typeDesc.trim() || null,
        typeName: typeForm.typeName.trim(),
      });

      const items = await refreshTypeHeaders();
      startTransition(() => {
        setActiveTypeId(`type-${created.id}`);
        setActiveNodeId(null);
        setSelectedTaskId(null);
        setReloadNonce((current) => current + 1);
        setStructureMessage('项目类型已新增。');
        if (!items.some((item) => item.id === created.id)) {
          setTypeHeaders((current) => [...current, created]);
        }
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleUpdateType() {
    if (!activeType?.sourceId) {
      setStructureError('请先选择项目类型。');
      return;
    }

    const validationMessage = validateTypeForm(typeForm);
    if (validationMessage) {
      setStructureError(validationMessage);
      setStructureMessage(null);
      return;
    }

    setTemplateActionLoading('update-type');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<BasicProjectType>(`/api/project/types/${activeType.sourceId}`, 'PUT', {
        sort: numberToNull(typeForm.sort) ?? 0,
        status: typeForm.status.trim() || 'ACTIVE',
        typeCode: typeForm.typeCode.trim(),
        typeDesc: typeForm.typeDesc.trim() || null,
        typeName: typeForm.typeName.trim(),
      });

      await refreshTypeHeaders();
      startTransition(() => {
        setReloadNonce((current) => current + 1);
        setStructureMessage('项目类型已更新。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleDeleteType() {
    if (!activeType?.sourceId) {
      setStructureError('请先选择项目类型。');
      return;
    }

    if (!confirmAction(`确认删除项目类型“${activeType.title}”吗？此操作会同时删除其模板结构和排期配置。`)) {
      return;
    }

    setTemplateActionLoading('delete-type');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<boolean>(`/api/project/types/${activeType.sourceId}`, 'DELETE');

      const items = await refreshTypeHeaders();
      startTransition(() => {
        const fallbackType = items[0] ?? null;
        setActiveTypeId(fallbackType ? `type-${fallbackType.id}` : null);
        setActiveNodeId(null);
        setSelectedTaskId(null);
        setReloadNonce((current) => current + 1);
        setStructureMessage('项目类型已删除。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  function handleQuickAdd(typeId: string, nodeId: string, taskId: string) {
    const currentDayIndex = getCurrentDayIndex();
    const startValue = fromDayIndex(currentDayIndex);
    const endValue = fromDayIndex(Math.min(currentDayIndex + 2, 364));
    const nextSchedule: ProgressSchedule = {
      color: 'blue',
      endDay: endValue.day,
      endMonth: endValue.month,
      id: createScheduleId(),
      owner: '',
      startDay: startValue.day,
      startMonth: startValue.month,
    };

    startTransition(() => {
      setActiveTypeId(typeId);
      setActiveNodeId(nodeId);
      setEditingSelection({
        nodeId,
        scheduleId: nextSchedule.id,
        taskId,
        typeId,
      });
      setDraftSchedule(nextSchedule);
      setSelectedTaskId(taskId);
      setSaveError(null);
      setSaveMessage(null);
      setExpandedIds((current) => ({
        ...current,
        [nodeId]: true,
        [typeId]: true,
      }));
    });
  }

  function openScheduleEditor(selection: SelectedSchedule) {
    const schedule = findSchedule(projectTypes, selection);
    if (!schedule) {
      return;
    }

    startTransition(() => {
      setActiveTypeId(selection.typeId);
      setActiveNodeId(selection.nodeId);
      setEditingSelection(selection);
      setDraftSchedule({ ...schedule });
      setSelectedTaskId(selection.taskId);
      setSaveError(null);
      setSaveMessage(null);
    });
  }

  async function persistTaskSchedules(selection: SelectedSchedule, schedules: ProgressSchedule[]) {
    const task = findTask(projectTypes, selection);
    const type = projectTypes.find((projectType) => projectType.id === selection.typeId);
    if (!task?.sourceId || !type?.sourceId) {
      throw new Error('当前任务模板缺少源数据标识，暂时无法保存排期。');
    }

    const response = await mutateData<ApiProjectTypeTaskSchedule[]>(
      `/api/project/types/${type.sourceId}/tasks/${task.sourceId}/schedules`,
      'PUT',
      buildSchedulePayload(schedules),
    );

    setProjectTypes((current) =>
      replaceTaskSchedules(
        current,
        selection,
        response.map((schedule) => mapSchedule(schedule)),
      ),
    );
  }

  async function handleSaveSchedule() {
    if (!editingSelection || !draftSchedule) {
      return;
    }

    const task = findTask(projectTypes, editingSelection);
    if (!task) {
      return;
    }

    const validationMessage = validateScheduleDraft(draftSchedule);
    if (validationMessage) {
      setSaveError(validationMessage);
      setSaveMessage(null);
      return;
    }

    const normalizedDraft = normalizeScheduleDraft(draftSchedule);
    const isExistingSchedule = task.schedules.some(
      (schedule) => schedule.id === editingSelection.scheduleId,
    );
    const nextSchedules = isExistingSchedule
      ? task.schedules.map((schedule) =>
          schedule.id === editingSelection.scheduleId ? normalizedDraft : schedule,
        )
      : [...task.schedules, normalizedDraft];

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      await persistTaskSchedules(editingSelection, nextSchedules);
      startTransition(() => {
        setEditingSelection(null);
        setDraftSchedule(null);
        setSaveMessage('排期块已保存。');
      });
    } catch (error) {
      setSaveError(normalizeErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSchedule() {
    if (!editingSelection) {
      return;
    }

    const task = findTask(projectTypes, editingSelection);
    if (!task) {
      return;
    }

    if (!confirmAction('确认删除当前排期块吗？删除后不可恢复。')) {
      return;
    }

    const scheduleExists = task.schedules.some(
      (schedule) => schedule.id === editingSelection.scheduleId,
    );
    if (!scheduleExists) {
      startTransition(() => {
        setEditingSelection(null);
        setDraftSchedule(null);
        setSaveError(null);
      });
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      await persistTaskSchedules(
        editingSelection,
        task.schedules.filter((schedule) => schedule.id !== editingSelection.scheduleId),
      );
      startTransition(() => {
        setEditingSelection(null);
        setDraftSchedule(null);
        setSaveMessage('排期块已删除。');
      });
    } catch (error) {
      setSaveError(normalizeErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNode() {
    if (!activeType?.sourceId) {
      setStructureError('请先选择项目类型。');
      return;
    }

    const validationMessage = validateNodeForm(nodeForm);
    if (validationMessage) {
      setStructureError(validationMessage);
      setStructureMessage(null);
      return;
    }

    setTemplateActionLoading('create-node');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<ApiProjectTypeNode>(
        `/api/project/types/${activeType.sourceId}/nodes`,
        'POST',
        {
          needAudit: nodeForm.needAudit,
          needCheck: nodeForm.needCheck,
          nodeCode: nodeForm.nodeCode.trim(),
          nodeName: nodeForm.nodeName.trim(),
          planDay: numberToNull(nodeForm.planDay),
          remark: nodeForm.remark.trim() || null,
        },
      );

      startTransition(() => {
        setReloadNonce((current) => current + 1);
        setStructureMessage('节点模板已新增。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleUpdateNode() {
    if (!activeType?.sourceId || !activeNode?.sourceId) {
      setStructureError('请先选择节点模板。');
      return;
    }

    const validationMessage = validateNodeForm(nodeForm);
    if (validationMessage) {
      setStructureError(validationMessage);
      setStructureMessage(null);
      return;
    }

    setTemplateActionLoading('update-node');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<ApiProjectTypeNode>(
        `/api/project/types/${activeType.sourceId}/nodes/${activeNode.sourceId}`,
        'PUT',
        {
          needAudit: nodeForm.needAudit,
          needCheck: nodeForm.needCheck,
          nodeCode: nodeForm.nodeCode.trim(),
          nodeName: nodeForm.nodeName.trim(),
          planDay: numberToNull(nodeForm.planDay),
          remark: nodeForm.remark.trim() || null,
        },
      );

      startTransition(() => {
        setReloadNonce((current) => current + 1);
        setStructureMessage('节点模板已更新。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleDeleteNode() {
    if (!activeType?.sourceId || !activeNode?.sourceId) {
      setStructureError('请先选择节点模板。');
      return;
    }

    if (!confirmAction(`确认删除节点模板“${activeNode.title}”吗？`)) {
      return;
    }

    setTemplateActionLoading('delete-node');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<boolean>(
        `/api/project/types/${activeType.sourceId}/nodes/${activeNode.sourceId}`,
        'DELETE',
      );

      startTransition(() => {
        setActiveNodeId(null);
        setSelectedTaskId(null);
        setReloadNonce((current) => current + 1);
        setStructureMessage('节点模板已删除。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleCreateTask() {
    if (!activeType?.sourceId || !activeNode?.sourceId) {
      setStructureError('请先选择节点模板。');
      return;
    }

    const validationMessage = validateTaskForm(taskForm);
    if (validationMessage) {
      setStructureError(validationMessage);
      setStructureMessage(null);
      return;
    }

    setTemplateActionLoading('create-task');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<ApiProjectTypeTask>(
        `/api/project/types/${activeType.sourceId}/tasks`,
        'POST',
        {
          needAudit: taskForm.needAudit,
          needCheck: taskForm.needCheck,
          needFile: taskForm.needFile,
          needSettle: taskForm.needSettle,
          nodeId: activeNode.sourceId,
          planDay: numberToNull(taskForm.planDay),
          remark: taskForm.remark.trim() || null,
          taskCode: taskForm.taskCode.trim(),
          taskContent: taskForm.taskContent.trim() || null,
          taskTitle: taskForm.taskTitle.trim(),
        },
      );

      startTransition(() => {
        setReloadNonce((current) => current + 1);
        setStructureMessage('任务模板已新增。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleUpdateTask() {
    if (!activeType?.sourceId || !activeNode?.sourceId || !selectedTaskInActiveNode?.sourceId) {
      setStructureError('请先选择任务模板。');
      return;
    }

    const validationMessage = validateTaskForm(taskForm);
    if (validationMessage) {
      setStructureError(validationMessage);
      setStructureMessage(null);
      return;
    }

    setTemplateActionLoading('update-task');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<ApiProjectTypeTask>(
        `/api/project/types/${activeType.sourceId}/tasks/${selectedTaskInActiveNode.sourceId}`,
        'PUT',
        {
          needAudit: taskForm.needAudit,
          needCheck: taskForm.needCheck,
          needFile: taskForm.needFile,
          needSettle: taskForm.needSettle,
          nodeId: activeNode.sourceId,
          planDay: numberToNull(taskForm.planDay),
          remark: taskForm.remark.trim() || null,
          taskCode: taskForm.taskCode.trim(),
          taskContent: taskForm.taskContent.trim() || null,
          taskTitle: taskForm.taskTitle.trim(),
        },
      );

      startTransition(() => {
        setReloadNonce((current) => current + 1);
        setStructureMessage('任务模板已更新。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  async function handleDeleteTask() {
    if (!activeType?.sourceId || !selectedTaskInActiveNode?.sourceId) {
      setStructureError('请先选择任务模板。');
      return;
    }

    if (!confirmAction(`确认删除任务模板“${selectedTaskInActiveNode.title}”吗？`)) {
      return;
    }

    setTemplateActionLoading('delete-task');
    setStructureError(null);
    setStructureMessage(null);

    try {
      await mutateData<boolean>(
        `/api/project/types/${activeType.sourceId}/tasks/${selectedTaskInActiveNode.sourceId}`,
        'DELETE',
      );

      startTransition(() => {
        setSelectedTaskId(null);
        setReloadNonce((current) => current + 1);
        setStructureMessage('任务模板已删除。');
      });
    } catch (error) {
      setStructureError(normalizeErrorMessage(error));
    } finally {
      setTemplateActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[32px] p-7 lg:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_70%)] lg:block" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <Badge tone="neutral">项目类型管理</Badge>
            <div className="theme-text-strong mt-4 text-3xl font-black tracking-tight lg:text-4xl">
              统一维护项目类型、节点模板、任务模板和排期模板。
            </div>
            <div className="theme-text-muted mt-4 text-sm leading-8">
              当前界面已接入真实的项目类型、节点模板、任务模板和排期接口，可直接支撑正式配置工作。
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="block min-w-[260px]">
              <span className="sr-only">搜索项目类型配置</span>
              <input
                className="theme-input h-12 w-full rounded-2xl px-4"
                onChange={handleSearchChange}
                placeholder="搜索项目类型、节点模板或任务模板"
                value={searchValue}
              />
            </label>
            <Button
              onClick={() => {
                startTransition(() => {
                  setReloadNonce((current) => current + 1);
                  setSaveMessage(null);
                });
              }}
              tone="ghost"
            >
              刷新
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="theme-surface-subtle rounded-[24px] p-5">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.18em]">
              项目类型
            </div>
            <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">
              {filteredProjectTypes.length}
            </div>
            <div className="theme-text-muted mt-2 text-sm">当前筛选结果中的项目类型数量</div>
          </div>
          <div className="theme-surface-subtle rounded-[24px] p-5">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.18em]">
              任务模板
            </div>
            <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">
              {countTaskTemplates(filteredProjectTypes)}
            </div>
            <div className="theme-text-muted mt-2 text-sm">当前项目类型下的任务模板数量</div>
          </div>
          <div className="theme-surface-subtle rounded-[24px] p-5">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.18em]">
              排期块
            </div>
            <div className="theme-text-strong mt-3 text-3xl font-black tracking-tight">
              {countScheduleBlocks(filteredProjectTypes)}
            </div>
            <div className="theme-text-muted mt-2 text-sm">已持久化的可视化排期块数量</div>
          </div>
        </div>

      </Card>

      {loading ? (
        <Card className="rounded-[32px] p-6">
          <div className="theme-surface-subtle rounded-[24px] p-4 text-sm">
            正在加载项目类型、节点模板和任务模板...
          </div>
        </Card>
      ) : loadError ? (
        <Card className="rounded-[32px] p-6">
          <div className="rounded-[24px] border border-rose-100 bg-rose-50/90 p-4 text-sm text-rose-700">
            {loadError}
          </div>
        </Card>
      ) : filteredProjectTypes.length ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <ProgressConfigSidebar
            expandedIds={expandedIds}
            onQuickAdd={handleQuickAdd}
            onSelectTask={handleSelectTask}
            onToggle={handleToggle}
            projectTypes={filteredProjectTypes}
            selectedTaskId={selectedTaskId}
          />

          <div className="space-y-6">
            <ProgressConfigTimeline
              onQuickAdd={handleQuickAdd}
              onSelectBlock={(typeId, nodeId, taskId, scheduleId) => {
                openScheduleEditor({
                  nodeId,
                  scheduleId,
                  taskId,
                  typeId,
                });
              }}
              projectTypes={filteredProjectTypes}
              selectedTaskId={selectedTaskId}
            />

            <Card className="rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.18em]">
                    当前选中
                  </div>
                  <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
                    {selectedTask?.title ?? '请选择任务模板'}
                  </div>
                </div>
                <Badge tone="neutral">{selectedTask?.code ?? '任务'}</Badge>
              </div>
              <div className="theme-text-muted mt-4 text-sm leading-7">
                {selectedTask?.description ??
                  '可在左侧模板树或中间甘特画布中选择任务模板，然后在这里继续维护排期块。'}
              </div>
              {!activeType ? (
                <div className="theme-text-muted mt-4 text-sm leading-7">
                  先选择一个项目类型后，系统会自动将焦点切到该类型下的第一个节点和任务模板。
                </div>
              ) : !activeNode ? (
                <div className="theme-text-muted mt-4 text-sm leading-7">
                  当前项目类型下还没有节点模板，新增节点后会自动回到可编辑状态。
                </div>
              ) : !selectedTask ? (
                <div className="theme-text-muted mt-4 text-sm leading-7">
                  当前节点下还没有任务模板，新增任务后会自动选中第一条任务供继续配置。
                </div>
              ) : null}
            </Card>

            <ProgressConfigTemplateEditor
              activeNodeId={activeNodeId}
              activeTaskTitle={selectedTaskInActiveNode?.title ?? null}
              activeTypeId={activeTypeId}
              errorMessage={null}
              message={null}
              onCreateType={() => {
                void handleCreateType();
              }}
              onDeleteType={() => {
                void handleDeleteType();
              }}
              nodeBusy={templateActionLoading === 'create-node' || templateActionLoading === 'update-node' || templateActionLoading === 'delete-node'}
              nodeForm={nodeForm}
              nodeOptions={nodeOptions}
              onActiveNodeChange={handleActiveNodeChange}
              onActiveTypeChange={handleActiveTypeChange}
              onCreateNode={() => {
                void handleCreateNode();
              }}
              onCreateTask={() => {
                void handleCreateTask();
              }}
              onDeleteNode={() => {
                void handleDeleteNode();
              }}
              onDeleteTask={() => {
                void handleDeleteTask();
              }}
              onTypeFormChange={(patch) => {
                setTypeForm((current) => ({ ...current, ...patch }));
              }}
              onNodeFormChange={(patch) => {
                setNodeForm((current) => ({ ...current, ...patch }));
              }}
              onTaskFormChange={(patch) => {
                setTaskForm((current) => ({ ...current, ...patch }));
              }}
              onUpdateType={() => {
                void handleUpdateType();
              }}
              onUpdateNode={() => {
                void handleUpdateNode();
              }}
              onUpdateTask={() => {
                void handleUpdateTask();
              }}
              taskBusy={templateActionLoading === 'create-task' || templateActionLoading === 'update-task' || templateActionLoading === 'delete-task'}
              taskForm={taskForm}
              typeBusy={templateActionLoading === 'create-type' || templateActionLoading === 'update-type' || templateActionLoading === 'delete-type'}
              typeForm={typeForm}
              typeOptions={typeOptions}
            />
          </div>
        </div>
      ) : (
        <Card className="rounded-[32px] p-6">
          <div className="theme-surface-subtle rounded-[24px] p-4 text-sm">
            当前还没有可用模板数据，请先配置项目类型、节点模板和任务模板。
          </div>
        </Card>
      )}

      <ProgressConfigModal
        canDelete={Boolean(findSchedule(projectTypes, editingSelection))}
        errorMessage={null}
        onChange={setDraftSchedule}
        onClose={() => {
          if (saving) {
            return;
          }
          startTransition(() => {
            setEditingSelection(null);
            setDraftSchedule(null);
            setSaveError(null);
          });
        }}
        onDelete={() => {
          void handleDeleteSchedule();
        }}
        onSave={() => {
          void handleSaveSchedule();
        }}
        open={Boolean(editingSelection && draftSchedule)}
        saving={saving}
        schedule={draftSchedule}
        taskTitle={selectedTask?.title ?? null}
      />
    </div>
  );
}

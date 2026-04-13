import {
  startTransition,
  useEffect,
  useState,
  type ChangeEvent,
  type PropsWithChildren,
} from 'react';
import { createApiClient } from '@lserp/http';
import { Badge, Button, Card } from '@lserp/ui';

import {
  getCheckinResultLabel,
  getFileCategoryLabel,
} from './project-display';
import { useProjectToast } from './project-toast';
import { useSystemUserOptions } from './system-user-directory';
import { SystemUserPicker } from './system-user-picker';

type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

type TextInputChangeEvent = ChangeEvent<HTMLInputElement>;
type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
type TextareaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

type ProjectTypeOption = {
  id: number;
  typeCode: string;
  typeName: string;
};

type MemberOption = {
  id: number;
  isManager?: boolean | null;
  userId: string;
  userName: string;
};

type NodeOption = {
  id: number;
  nodeName: string;
};

type TaskOption = {
  id: number;
  taskTitle: string;
};

type ProjectCreateResp = {
  id: number;
};

type ActionFeedback = {
  message: string;
  tone: 'danger' | 'success';
} | null;

type ActionConsoleProps = {
  memberOptions: MemberOption[];
  nodeOptions: NodeOption[];
  onProjectCreated: (projectId: number) => void;
  onRefresh: () => void;
  projectTypes: ProjectTypeOption[];
  selectedProjectId: number | null;
  taskOptions: TaskOption[];
};

type ProjectFormState = {
  attendanceAddress: string;
  businessUnit: string;
  budgetAmount: string;
  managerId: string;
  managerName: string;
  planEndTime: string;
  planStartTime: string;
  projectCode: string;
  projectName: string;
  sourceContent: string;
  status: string;
  typeId: string;
};

type MemberFormState = {
  dutyContent: string;
  isManager: boolean;
  roleName: string;
  userId: string;
  userName: string;
};

type BudgetFormState = {
  actualAmount: string;
  feeItem: string;
  feeType: string;
  planAmount: string;
};

type PlanFormState = {
  managerId: string;
  managerName: string;
  planContent: string;
  planEndDate: string;
  planStartDate: string;
  planType: string;
};

type ReportFormState = {
  delayFlag: boolean;
  finishContent: string;
  projectNodeId: string;
  projectTaskId: string;
  reportContent: string;
  reportDate: string;
  reportType: string;
  userId: string;
  userName: string;
};

type CheckInFormState = {
  address: string;
  checkInTime: string;
  lat: string;
  lng: string;
  result: string;
  userId: string;
  userName: string;
};

type AttachmentFormState = {
  file: File | null;
  fileCategory: string;
  projectNodeId: string;
  projectTaskId: string;
  remark: string;
  uploaderId: string;
  uploaderName: string;
};

type NodeActionFormState = {
  nodeId: string;
  progressRate: string;
  remark: string;
  status: string;
};

type TaskStatusFormState = {
  auditStatus: string;
  checkStatus: string;
  finishDesc: string;
  progressRate: string;
  status: string;
  taskId: string;
};

type TaskAssignmentFormState = {
  participantUserIds: string[];
  responsibleUserId: string;
  taskId: string;
};

const PLAN_TYPE_OPTIONS = ['MONTH', 'WEEK', 'DAY'];
const REPORT_TYPE_OPTIONS = ['DAY', 'WEEK', 'MONTH'];
const CHECKIN_RESULT_OPTIONS = ['NORMAL', 'LATE', 'ABSENT', 'FIELD'];
const EXECUTION_STATUS_OPTIONS = ['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED'];
const REVIEW_STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];
const FILE_CATEGORY_OPTIONS = ['MILESTONE', 'DELIVERABLE', 'CONTRACT', 'REPORT', 'OTHER'];

const initialProjectFormState: ProjectFormState = {
  attendanceAddress: '',
  businessUnit: '',
  budgetAmount: '',
  managerId: '',
  managerName: '',
  planEndTime: '',
  planStartTime: '',
  projectCode: '',
  projectName: '',
  sourceContent: '',
  status: 'DRAFT',
  typeId: '',
};

const initialMemberFormState: MemberFormState = {
  dutyContent: '',
  isManager: false,
  roleName: '',
  userId: '',
  userName: '',
};

const initialBudgetFormState: BudgetFormState = {
  actualAmount: '',
  feeItem: '',
  feeType: 'IMPLEMENT',
  planAmount: '',
};

const initialPlanFormState: PlanFormState = {
  managerId: '',
  managerName: '',
  planContent: '',
  planEndDate: '',
  planStartDate: '',
  planType: 'MONTH',
};

const initialReportFormState: ReportFormState = {
  delayFlag: false,
  finishContent: '',
  projectNodeId: '',
  projectTaskId: '',
  reportContent: '',
  reportDate: '',
  reportType: 'DAY',
  userId: '',
  userName: '',
};

const initialCheckInFormState: CheckInFormState = {
  address: '',
  checkInTime: '',
  lat: '',
  lng: '',
  result: 'NORMAL',
  userId: '',
  userName: '',
};

const initialAttachmentFormState: AttachmentFormState = {
  file: null,
  fileCategory: 'MILESTONE',
  projectNodeId: '',
  projectTaskId: '',
  remark: '',
  uploaderId: '',
  uploaderName: '',
};

const initialNodeActionFormState: NodeActionFormState = {
  nodeId: '',
  progressRate: '',
  remark: '',
  status: 'IN_PROGRESS',
};

const initialTaskStatusFormState: TaskStatusFormState = {
  auditStatus: 'PENDING',
  checkStatus: 'PENDING',
  finishDesc: '',
  progressRate: '',
  status: 'IN_PROGRESS',
  taskId: '',
};

const initialTaskAssignmentFormState: TaskAssignmentFormState = {
  participantUserIds: [],
  responsibleUserId: '',
  taskId: '',
};

const projectApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

function FieldBlock({ children, label }: PropsWithChildren<{ label: string }>) {
  return (
    <label className="block space-y-2">
      <span className="theme-text-soft text-[11px] font-bold uppercase tracking-[0.18em]">
        {label}
      </span>
      {children}
    </label>
  );
}

function trimToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberToNull(value: string) {
  const normalized = trimToNull(value);
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Request failed.');
  }
  return 'Request failed.';
}

async function mutateData<T>(path: string, method: 'POST' | 'PUT', body?: object | FormData) {
  const response = await projectApiClient.request<CommonResult<T>>(path, {
    body,
    method,
  });
  return response.data;
}

export function ActionConsole({
  memberOptions,
  nodeOptions,
  onProjectCreated,
  onRefresh,
  projectTypes,
  selectedProjectId,
  taskOptions,
}: ActionConsoleProps) {
  const { loading: systemUserLoading, options: systemUsers } = useSystemUserOptions();
  const { pushToast } = useProjectToast();
  const [feedback, setFeedback] = useState<ActionFeedback>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(initialProjectFormState);
  const [memberForm, setMemberForm] = useState<MemberFormState>(initialMemberFormState);
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(initialBudgetFormState);
  const [planForm, setPlanForm] = useState<PlanFormState>(initialPlanFormState);
  const [reportForm, setReportForm] = useState<ReportFormState>(initialReportFormState);
  const [checkInForm, setCheckInForm] = useState<CheckInFormState>(initialCheckInFormState);
  const [attachmentForm, setAttachmentForm] = useState<AttachmentFormState>(initialAttachmentFormState);
  const [nodeActionForm, setNodeActionForm] = useState<NodeActionFormState>(initialNodeActionFormState);
  const [taskStatusForm, setTaskStatusForm] = useState<TaskStatusFormState>(initialTaskStatusFormState);
  const [taskAssignmentForm, setTaskAssignmentForm] = useState<TaskAssignmentFormState>(initialTaskAssignmentFormState);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    pushToast({
      message: feedback.message,
      tone: feedback.tone,
    });
    setFeedback(null);
  }, [feedback, pushToast]);

  useEffect(() => {
    setProjectForm((current) => ({
      ...current,
      typeId: current.typeId || String(projectTypes[0]?.id ?? ''),
    }));
  }, [projectTypes]);

  useEffect(() => {
    const manager =
      systemUsers[0]
        ? { userId: systemUsers[0].userId, userName: systemUsers[0].userName }
        : memberOptions.find((member) => member.isManager) ?? memberOptions[0];
    if (!manager) {
      return;
    }

    startTransition(() => {
      setPlanForm((current) => ({
        ...current,
        managerId: current.managerId || manager.userId,
        managerName: current.managerName || manager.userName,
      }));
      setReportForm((current) => ({
        ...current,
        userId: current.userId || manager.userId,
        userName: current.userName || manager.userName,
      }));
      setCheckInForm((current) => ({
        ...current,
        userId: current.userId || manager.userId,
        userName: current.userName || manager.userName,
      }));
      setAttachmentForm((current) => ({
        ...current,
        uploaderId: current.uploaderId || manager.userId,
        uploaderName: current.uploaderName || manager.userName,
      }));
      setTaskAssignmentForm((current) => ({
        ...current,
        responsibleUserId:
          current.responsibleUserId && systemUsers.some((user) => user.userId === current.responsibleUserId)
            ? current.responsibleUserId
            : manager.userId,
      }));
    });
  }, [memberOptions, systemUsers]);

  useEffect(() => {
    startTransition(() => {
      setNodeActionForm((current) => ({
        ...current,
        nodeId:
          current.nodeId && nodeOptions.some((node) => String(node.id) === current.nodeId)
            ? current.nodeId
            : String(nodeOptions[0]?.id ?? ''),
      }));
      setTaskStatusForm((current) => ({
        ...current,
        taskId:
          current.taskId && taskOptions.some((task) => String(task.id) === current.taskId)
            ? current.taskId
            : String(taskOptions[0]?.id ?? ''),
      }));
      setTaskAssignmentForm((current) => ({
        ...current,
        taskId:
          current.taskId && taskOptions.some((task) => String(task.id) === current.taskId)
            ? current.taskId
            : String(taskOptions[0]?.id ?? ''),
        participantUserIds: current.participantUserIds.filter((userId) =>
          systemUsers.some((user) => user.userId === userId),
        ),
      }));
      setReportForm((current) => ({
        ...current,
        projectNodeId:
          current.projectNodeId && nodeOptions.some((node) => String(node.id) === current.projectNodeId)
            ? current.projectNodeId
            : '',
        projectTaskId:
          current.projectTaskId && taskOptions.some((task) => String(task.id) === current.projectTaskId)
            ? current.projectTaskId
            : '',
      }));
      setAttachmentForm((current) => ({
        ...current,
        projectNodeId:
          current.projectNodeId && nodeOptions.some((node) => String(node.id) === current.projectNodeId)
            ? current.projectNodeId
            : '',
        projectTaskId:
          current.projectTaskId && taskOptions.some((task) => String(task.id) === current.projectTaskId)
            ? current.projectTaskId
            : '',
      }));
    });
  }, [memberOptions, nodeOptions, systemUsers, taskOptions]);

  function syncMemberFields<T extends { userId: string; userName: string }>(
    userId: string,
    setter: (updater: (current: T) => T) => void,
  ) {
    const nextMember = memberOptions.find((member) => member.userId === userId);
    setter((current: T) => ({
      ...current,
      userId,
      userName: userId ? nextMember?.userName ?? current.userName : '',
    }));
  }

  function syncSystemUserFields<T extends { userId: string; userName: string }>(
    userId: string,
    setter: (updater: (current: T) => T) => void,
  ) {
    const nextUser = systemUsers.find((user) => user.userId === userId);
    setter((current: T) => ({
      ...current,
      userId,
      userName: userId ? nextUser?.userName ?? current.userName : '',
    }));
  }

  function syncManagerSelection<T extends { managerId: string; managerName: string }>(
    userId: string,
    setter: (updater: (current: T) => T) => void,
  ) {
    const nextUser = systemUsers.find((user) => user.userId === userId);
    setter((current: T) => ({
      ...current,
      managerId: userId,
      managerName: userId ? nextUser?.userName ?? current.managerName : '',
    }));
  }

  function ensureSelectedProject() {
    if (!selectedProjectId) {
      throw new Error('Select a project first.');
    }
    return selectedProjectId;
  }

  function toggleParticipant(userId: string) {
    setTaskAssignmentForm((current) => ({
      ...current,
      participantUserIds: current.participantUserIds.includes(userId)
        ? current.participantUserIds.filter((item) => item !== userId)
        : [...current.participantUserIds, userId],
    }));
  }

  async function runAction(actionKey: string, task: () => Promise<void>) {
    setActionLoading(actionKey);
    setFeedback(null);
    try {
      await task();
      setFeedback({ message: 'Saved successfully.', tone: 'success' });
      onRefresh();
    } catch (error: unknown) {
      setFeedback({ message: normalizeErrorMessage(error), tone: 'danger' });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Card className="rounded-[32px] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            Action Console
          </div>
          <div className="theme-text-strong mt-2 text-2xl font-black tracking-tight">
            First delivery controls stay inside the same portal language
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Create</Badge>
          <Badge tone="neutral">Maintain</Badge>
          <Badge tone="success">Execute</Badge>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Card className="rounded-[28px] p-6">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Create Project
            </div>
            <div className="mt-4 grid gap-4">
              <FieldBlock label="Project Type">
                <select
                  className="theme-input h-11 w-full rounded-2xl px-4"
                  onChange={(event: SelectChangeEvent) => {
                    setProjectForm((current) => ({ ...current, typeId: event.target.value }));
                  }}
                  value={projectForm.typeId}
                >
                  <option value="">Select type</option>
                  {projectTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {type.typeName}
                    </option>
                  ))}
                </select>
              </FieldBlock>
              <FieldBlock label="Project Code">
                <input
                  className="theme-input h-11 w-full rounded-2xl px-4"
                  onChange={(event: TextInputChangeEvent) => {
                    setProjectForm((current) => ({ ...current, projectCode: event.target.value }));
                  }}
                  value={projectForm.projectCode}
                />
              </FieldBlock>
              <FieldBlock label="Project Name">
                <input
                  className="theme-input h-11 w-full rounded-2xl px-4"
                  onChange={(event: TextInputChangeEvent) => {
                    setProjectForm((current) => ({ ...current, projectName: event.target.value }));
                  }}
                  value={projectForm.projectName}
                />
              </FieldBlock>
              <FieldBlock label="Project Manager">
                <SystemUserPicker
                  disabled={systemUserLoading}
                  onChange={(nextValue) => {
                    syncManagerSelection(nextValue, setProjectForm);
                  }}
                  options={systemUsers}
                  placeholder={systemUserLoading ? 'Loading users...' : 'Select manager'}
                  value={projectForm.managerId}
                />
              </FieldBlock>
              <FieldBlock label="Business Unit / Attendance">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="theme-input h-11 rounded-2xl px-4"
                    onChange={(event: TextInputChangeEvent) => {
                      setProjectForm((current) => ({ ...current, businessUnit: event.target.value }));
                    }}
                    placeholder="Business unit"
                    value={projectForm.businessUnit}
                  />
                  <input
                    className="theme-input h-11 rounded-2xl px-4"
                    onChange={(event: TextInputChangeEvent) => {
                      setProjectForm((current) => ({ ...current, attendanceAddress: event.target.value }));
                    }}
                    placeholder="Attendance address"
                    value={projectForm.attendanceAddress}
                  />
                </div>
              </FieldBlock>
              <FieldBlock label="Plan Range">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="theme-input h-11 rounded-2xl px-4"
                    onChange={(event: TextInputChangeEvent) => {
                      setProjectForm((current) => ({ ...current, planStartTime: event.target.value }));
                    }}
                    type="datetime-local"
                    value={projectForm.planStartTime}
                  />
                  <input
                    className="theme-input h-11 rounded-2xl px-4"
                    onChange={(event: TextInputChangeEvent) => {
                      setProjectForm((current) => ({ ...current, planEndTime: event.target.value }));
                    }}
                    type="datetime-local"
                    value={projectForm.planEndTime}
                  />
                </div>
              </FieldBlock>
              <FieldBlock label="Budget / Source Content">
                <div className="grid gap-3">
                  <input
                    className="theme-input h-11 rounded-2xl px-4"
                    onChange={(event: TextInputChangeEvent) => {
                      setProjectForm((current) => ({ ...current, budgetAmount: event.target.value }));
                    }}
                    placeholder="Budget amount"
                    value={projectForm.budgetAmount}
                  />
                  <textarea
                    className="theme-input min-h-[76px] rounded-2xl px-4 py-3"
                    onChange={(event: TextareaChangeEvent) => {
                      setProjectForm((current) => ({ ...current, sourceContent: event.target.value }));
                    }}
                    placeholder="Source content"
                    value={projectForm.sourceContent}
                  />
                </div>
              </FieldBlock>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                disabled={actionLoading === 'create-project'}
                onClick={() => {
                  void runAction('create-project', async () => {
                    if (!trimToNull(projectForm.typeId)) {
                      throw new Error('Project type is required.');
                    }
                    const created = await mutateData<ProjectCreateResp>('/api/project/projects', 'POST', {
                      attendanceAddress: trimToNull(projectForm.attendanceAddress),
                      budgetAmount: numberToNull(projectForm.budgetAmount),
                      businessUnit: trimToNull(projectForm.businessUnit),
                      managerId: trimToNull(projectForm.managerId),
                      managerName: trimToNull(projectForm.managerName),
                      planEndTime: trimToNull(projectForm.planEndTime),
                      planStartTime: trimToNull(projectForm.planStartTime),
                      projectCode: projectForm.projectCode,
                      projectName: projectForm.projectName,
                      projectTypeId: Number(projectForm.typeId),
                      sourceContent: trimToNull(projectForm.sourceContent),
                      status: trimToNull(projectForm.status) ?? 'DRAFT',
                    });
                    startTransition(() => {
                      onProjectCreated(created.id);
                      setProjectForm({
                        ...initialProjectFormState,
                        typeId: projectForm.typeId,
                      });
                    });
                  });
                }}
              >
                {actionLoading === 'create-project' ? 'Creating...' : 'Create project'}
              </Button>
              <Button
                disabled={!selectedProjectId || actionLoading === 'init-project'}
                onClick={() => {
                  void runAction('init-project', async () => {
                    if (!selectedProjectId) {
                      throw new Error('Select a project first.');
                    }
                    await mutateData(`/api/project/projects/${selectedProjectId}/init-by-type`, 'POST');
                  });
                }}
                tone="ghost"
              >
                {actionLoading === 'init-project' ? 'Initializing...' : 'Init by type'}
              </Button>
            </div>
          </Card>

          <Card className="rounded-[28px] p-6">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Team And Budget
            </div>
            <div className="mt-4 grid gap-6">
              <div className="grid gap-4">
                <FieldBlock label="Member">
                  <SystemUserPicker
                    disabled={systemUserLoading}
                    onChange={(nextValue) => {
                      syncSystemUserFields(nextValue, setMemberForm);
                    }}
                    options={systemUsers}
                    placeholder={systemUserLoading ? 'Loading users...' : 'Select member'}
                    value={memberForm.userId}
                  />
                </FieldBlock>
                <FieldBlock label="Role / Duty">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setMemberForm((current) => ({ ...current, roleName: event.target.value })); }} placeholder="Role name" value={memberForm.roleName} />
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setMemberForm((current) => ({ ...current, dutyContent: event.target.value })); }} placeholder="Duty content" value={memberForm.dutyContent} />
                  </div>
                </FieldBlock>
                <label className="flex items-center gap-3 text-sm">
                  <input checked={memberForm.isManager} onChange={(event: TextInputChangeEvent) => { setMemberForm((current) => ({ ...current, isManager: event.target.checked })); }} type="checkbox" />
                  <span className="theme-text-muted">Set as project manager</span>
                </label>
                <Button
                  disabled={!selectedProjectId || actionLoading === 'create-member'}
                  onClick={() => {
                    void runAction('create-member', async () => {
                      if (!selectedProjectId) {
                        throw new Error('Select a project first.');
                      }
                      await mutateData(`/api/project/projects/${selectedProjectId}/members`, 'POST', {
                        dutyContent: trimToNull(memberForm.dutyContent),
                        isManager: memberForm.isManager,
                        roleName: trimToNull(memberForm.roleName),
                        userId: memberForm.userId,
                        userName: memberForm.userName,
                      });
                      startTransition(() => {
                        setMemberForm(initialMemberFormState);
                      });
                    });
                  }}
                >
                  {actionLoading === 'create-member' ? 'Saving...' : 'Add member'}
                </Button>
              </div>

              <div className="grid gap-4">
                <FieldBlock label="Budget Type / Item">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setBudgetForm((current) => ({ ...current, feeType: event.target.value })); }} value={budgetForm.feeType} />
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setBudgetForm((current) => ({ ...current, feeItem: event.target.value })); }} value={budgetForm.feeItem} />
                  </div>
                </FieldBlock>
                <FieldBlock label="Plan / Actual Amount">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setBudgetForm((current) => ({ ...current, planAmount: event.target.value })); }} value={budgetForm.planAmount} />
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setBudgetForm((current) => ({ ...current, actualAmount: event.target.value })); }} value={budgetForm.actualAmount} />
                  </div>
                </FieldBlock>
                <Button
                  disabled={!selectedProjectId || actionLoading === 'create-budget'}
                  onClick={() => {
                    void runAction('create-budget', async () => {
                      if (!selectedProjectId) {
                        throw new Error('Select a project first.');
                      }
                      await mutateData(`/api/project/projects/${selectedProjectId}/budgets`, 'POST', {
                        actualAmount: numberToNull(budgetForm.actualAmount),
                        feeItem: budgetForm.feeItem,
                        feeType: budgetForm.feeType,
                        planAmount: numberToNull(budgetForm.planAmount),
                      });
                      startTransition(() => {
                        setBudgetForm(initialBudgetFormState);
                      });
                    });
                  }}
                >
                  {actionLoading === 'create-budget' ? 'Saving...' : 'Add budget'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] p-6">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Plans And Reports
            </div>
            <div className="mt-4 grid gap-6">
              <div className="grid gap-4">
                <FieldBlock label="Plan Type / Manager">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="theme-input h-11 rounded-2xl px-4"
                      onChange={(event: SelectChangeEvent) => {
                        setPlanForm((current) => ({ ...current, planType: event.target.value }));
                      }}
                      value={planForm.planType}
                    >
                      {PLAN_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="theme-input h-11 rounded-2xl px-4"
                      disabled={memberOptions.length === 0}
                      onChange={(event: SelectChangeEvent) => {
                        const nextManager = memberOptions.find((member) => member.userId === event.target.value);
                        setPlanForm((current) => ({
                          ...current,
                          managerId: event.target.value,
                          managerName: event.target.value
                            ? nextManager?.userName ?? current.managerName
                            : '',
                        }));
                      }}
                      value={planForm.managerId}
                    >
                      <option value="">{memberOptions.length ? 'Select manager' : 'Add team members first'}</option>
                      {memberOptions.map((member) => (
                        <option key={member.id} value={member.userId}>
                          {member.userName}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldBlock>
                <FieldBlock label="Plan Date Range">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setPlanForm((current) => ({ ...current, planStartDate: event.target.value })); }} type="date" value={planForm.planStartDate} />
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setPlanForm((current) => ({ ...current, planEndDate: event.target.value })); }} type="date" value={planForm.planEndDate} />
                  </div>
                </FieldBlock>
                <FieldBlock label="Plan Content">
                  <textarea className="theme-input min-h-[84px] rounded-2xl px-4 py-3" onChange={(event: TextareaChangeEvent) => { setPlanForm((current) => ({ ...current, planContent: event.target.value })); }} placeholder="Project manager plan content" value={planForm.planContent} />
                </FieldBlock>
                <Button
                  disabled={!selectedProjectId || memberOptions.length === 0 || actionLoading === 'create-plan'}
                  onClick={() => {
                    void runAction('create-plan', async () => {
                      const projectId = ensureSelectedProject();
                      await mutateData(`/api/project/projects/${projectId}/plans`, 'POST', {
                        managerId: trimToNull(planForm.managerId),
                        managerName: trimToNull(planForm.managerName),
                        planContent: trimToNull(planForm.planContent),
                        planEndDate: trimToNull(planForm.planEndDate),
                        planStartDate: trimToNull(planForm.planStartDate),
                        planType: planForm.planType,
                        status: 'DRAFT',
                      });
                      startTransition(() => {
                        setPlanForm((current) => ({ ...initialPlanFormState, managerId: current.managerId, managerName: current.managerName }));
                      });
                    });
                  }}
                >
                  {actionLoading === 'create-plan' ? 'Saving...' : 'Create plan'}
                </Button>
              </div>

              <div className="grid gap-4">
                <FieldBlock label="Reporter / Type">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="theme-input h-11 rounded-2xl px-4" disabled={memberOptions.length === 0} onChange={(event: SelectChangeEvent) => { syncMemberFields(event.target.value, setReportForm); }} value={reportForm.userId}>
                      <option value="">{memberOptions.length ? 'Select reporter' : 'Add team members first'}</option>
                      {memberOptions.map((member) => (
                        <option key={member.id} value={member.userId}>
                          {member.userName}
                        </option>
                      ))}
                    </select>
                    <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setReportForm((current) => ({ ...current, reportType: event.target.value })); }} value={reportForm.reportType}>
                      {REPORT_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldBlock>
                <FieldBlock label="Report Date / Related Task">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setReportForm((current) => ({ ...current, reportDate: event.target.value })); }} type="date" value={reportForm.reportDate} />
                    <select className="theme-input h-11 rounded-2xl px-4" disabled={taskOptions.length === 0} onChange={(event: SelectChangeEvent) => { setReportForm((current) => ({ ...current, projectTaskId: event.target.value })); }} value={reportForm.projectTaskId}>
                      <option value="">{taskOptions.length ? 'Project level' : 'No tasks yet'}</option>
                      {taskOptions.map((task) => (
                        <option key={task.id} value={String(task.id)}>
                          {task.taskTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldBlock>
                <FieldBlock label="Report Content / Finished Content">
                  <div className="grid gap-3">
                    <textarea className="theme-input min-h-[76px] rounded-2xl px-4 py-3" onChange={(event: TextareaChangeEvent) => { setReportForm((current) => ({ ...current, reportContent: event.target.value })); }} placeholder="Report content" value={reportForm.reportContent} />
                    <textarea className="theme-input min-h-[76px] rounded-2xl px-4 py-3" onChange={(event: TextareaChangeEvent) => { setReportForm((current) => ({ ...current, finishContent: event.target.value })); }} placeholder="Finished content" value={reportForm.finishContent} />
                  </div>
                </FieldBlock>
                <label className="flex items-center gap-3 text-sm">
                  <input checked={reportForm.delayFlag} onChange={(event: TextInputChangeEvent) => { setReportForm((current) => ({ ...current, delayFlag: event.target.checked })); }} type="checkbox" />
                  <span className="theme-text-muted">Contains delay or blocking issue</span>
                </label>
                <Button
                  disabled={!selectedProjectId || memberOptions.length === 0 || actionLoading === 'create-report'}
                  onClick={() => {
                    void runAction('create-report', async () => {
                      const projectId = ensureSelectedProject();
                      await mutateData(`/api/project/projects/${projectId}/reports`, 'POST', {
                        delayFlag: reportForm.delayFlag,
                        finishContent: trimToNull(reportForm.finishContent),
                        projectNodeId: numberToNull(reportForm.projectNodeId),
                        projectTaskId: numberToNull(reportForm.projectTaskId),
                        reportContent: trimToNull(reportForm.reportContent),
                        reportDate: trimToNull(reportForm.reportDate),
                        reportType: reportForm.reportType,
                        userId: reportForm.userId,
                        userName: reportForm.userName,
                      });
                      startTransition(() => {
                        setReportForm((current) => ({ ...initialReportFormState, userId: current.userId, userName: current.userName }));
                      });
                    });
                  }}
                >
                  {actionLoading === 'create-report' ? 'Saving...' : 'Submit report'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] p-6">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Check-In
            </div>
            <div className="mt-4 grid gap-4">
              <FieldBlock label="User / Result">
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="theme-input h-11 rounded-2xl px-4" disabled={memberOptions.length === 0} onChange={(event: SelectChangeEvent) => { syncMemberFields(event.target.value, setCheckInForm); }} value={checkInForm.userId}>
                    <option value="">{memberOptions.length ? 'Select user' : 'Add team members first'}</option>
                    {memberOptions.map((member) => (
                      <option key={member.id} value={member.userId}>
                        {member.userName}
                      </option>
                    ))}
                  </select>
                  <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setCheckInForm((current) => ({ ...current, result: event.target.value })); }} value={checkInForm.result}>
                    {CHECKIN_RESULT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getCheckinResultLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </FieldBlock>
              <FieldBlock label="Time / Address">
                <div className="grid gap-3">
                  <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setCheckInForm((current) => ({ ...current, checkInTime: event.target.value })); }} type="datetime-local" value={checkInForm.checkInTime} />
                  <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setCheckInForm((current) => ({ ...current, address: event.target.value })); }} placeholder="Check-in address" value={checkInForm.address} />
                </div>
              </FieldBlock>
              <FieldBlock label="Longitude / Latitude">
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setCheckInForm((current) => ({ ...current, lng: event.target.value })); }} placeholder="Longitude" type="number" value={checkInForm.lng} />
                  <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setCheckInForm((current) => ({ ...current, lat: event.target.value })); }} placeholder="Latitude" type="number" value={checkInForm.lat} />
                </div>
              </FieldBlock>
              <Button
                disabled={!selectedProjectId || memberOptions.length === 0 || actionLoading === 'create-checkin'}
                onClick={() => {
                  void runAction('create-checkin', async () => {
                    const projectId = ensureSelectedProject();
                    await mutateData(`/api/project/projects/${projectId}/checkins`, 'POST', {
                      address: trimToNull(checkInForm.address),
                      checkInTime: trimToNull(checkInForm.checkInTime),
                      lat: numberToNull(checkInForm.lat),
                      lng: numberToNull(checkInForm.lng),
                      result: checkInForm.result,
                      userId: checkInForm.userId,
                      userName: checkInForm.userName,
                    });
                    startTransition(() => {
                      setCheckInForm((current) => ({ ...initialCheckInFormState, userId: current.userId, userName: current.userName }));
                    });
                  });
                }}
              >
                {actionLoading === 'create-checkin' ? 'Saving...' : 'Create check-in'}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] p-6">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Attachments
            </div>
            <div className="mt-4 grid gap-4">
              <FieldBlock label="Uploader / Category">
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="theme-input h-11 rounded-2xl px-4" disabled={memberOptions.length === 0} onChange={(event: SelectChangeEvent) => { const nextUploader = memberOptions.find((member) => member.userId === event.target.value); setAttachmentForm((current) => ({ ...current, uploaderId: event.target.value, uploaderName: event.target.value ? nextUploader?.userName ?? current.uploaderName : '' })); }} value={attachmentForm.uploaderId}>
                    <option value="">{memberOptions.length ? 'Select uploader' : 'Add team members first'}</option>
                    {memberOptions.map((member) => (
                      <option key={member.id} value={member.userId}>
                        {member.userName}
                      </option>
                    ))}
                  </select>
                  <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setAttachmentForm((current) => ({ ...current, fileCategory: event.target.value })); }} value={attachmentForm.fileCategory}>
                    {FILE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getFileCategoryLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </FieldBlock>
              <FieldBlock label="Related Node / Task">
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="theme-input h-11 rounded-2xl px-4" disabled={nodeOptions.length === 0} onChange={(event: SelectChangeEvent) => { setAttachmentForm((current) => ({ ...current, projectNodeId: event.target.value })); }} value={attachmentForm.projectNodeId}>
                    <option value="">{nodeOptions.length ? 'Project level' : 'No nodes yet'}</option>
                    {nodeOptions.map((node) => (
                      <option key={node.id} value={String(node.id)}>
                        {node.nodeName}
                      </option>
                    ))}
                  </select>
                  <select className="theme-input h-11 rounded-2xl px-4" disabled={taskOptions.length === 0} onChange={(event: SelectChangeEvent) => { setAttachmentForm((current) => ({ ...current, projectTaskId: event.target.value })); }} value={attachmentForm.projectTaskId}>
                    <option value="">{taskOptions.length ? 'Project level' : 'No tasks yet'}</option>
                    {taskOptions.map((task) => (
                      <option key={task.id} value={String(task.id)}>
                        {task.taskTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </FieldBlock>
              <FieldBlock label="File / Remark">
                <div className="grid gap-3">
                  <input
                    className="theme-input h-11 rounded-2xl px-4 file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-semibold"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setAttachmentForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] ?? null,
                      }));
                    }}
                    type="file"
                  />
                  <textarea className="theme-input min-h-[84px] rounded-2xl px-4 py-3" onChange={(event: TextareaChangeEvent) => { setAttachmentForm((current) => ({ ...current, remark: event.target.value })); }} placeholder="Attachment remark" value={attachmentForm.remark} />
                </div>
              </FieldBlock>
              <Button
                disabled={!selectedProjectId || memberOptions.length === 0 || actionLoading === 'upload-attachment'}
                onClick={() => {
                  void runAction('upload-attachment', async () => {
                    const projectId = ensureSelectedProject();
                    if (!attachmentForm.file) {
                      throw new Error('Select a file to upload.');
                    }
                    const formData = new FormData();
                    formData.append('file', attachmentForm.file);
                    formData.append('fileCategory', attachmentForm.fileCategory);
                    formData.append('uploaderId', attachmentForm.uploaderId);
                    formData.append('uploaderName', attachmentForm.uploaderName);
                    formData.append('remark', attachmentForm.remark);
                    if (trimToNull(attachmentForm.projectNodeId)) {
                      formData.append('projectNodeId', attachmentForm.projectNodeId);
                    }
                    if (trimToNull(attachmentForm.projectTaskId)) {
                      formData.append('projectTaskId', attachmentForm.projectTaskId);
                    }
                    await mutateData(`/api/project/projects/${projectId}/attachments/upload`, 'POST', formData);
                    startTransition(() => {
                      setAttachmentForm((current) => ({ ...initialAttachmentFormState, uploaderId: current.uploaderId, uploaderName: current.uploaderName }));
                    });
                  });
                }}
              >
                {actionLoading === 'upload-attachment' ? 'Uploading...' : 'Upload file'}
              </Button>
            </div>
          </Card>

          <Card className="rounded-[28px] p-6">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Node And Task Execution
            </div>
            <div className="mt-4 grid gap-6">
              <div className="grid gap-4">
                <FieldBlock label="Node / Status">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="theme-input h-11 rounded-2xl px-4" disabled={nodeOptions.length === 0} onChange={(event: SelectChangeEvent) => { setNodeActionForm((current) => ({ ...current, nodeId: event.target.value })); }} value={nodeActionForm.nodeId}>
                      <option value="">{nodeOptions.length ? 'Select node' : 'No nodes yet'}</option>
                      {nodeOptions.map((node) => (
                        <option key={node.id} value={String(node.id)}>
                          {node.nodeName}
                        </option>
                      ))}
                    </select>
                    <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setNodeActionForm((current) => ({ ...current, status: event.target.value })); }} value={nodeActionForm.status}>
                      {EXECUTION_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldBlock>
                <FieldBlock label="Progress / Remark">
                  <div className="grid gap-3">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setNodeActionForm((current) => ({ ...current, progressRate: event.target.value })); }} placeholder="Progress" type="number" value={nodeActionForm.progressRate} />
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setNodeActionForm((current) => ({ ...current, remark: event.target.value })); }} placeholder="Node remark" value={nodeActionForm.remark} />
                  </div>
                </FieldBlock>
                <Button
                  disabled={!selectedProjectId || nodeOptions.length === 0 || actionLoading === 'update-node'}
                  onClick={() => {
                    void runAction('update-node', async () => {
                      const projectId = ensureSelectedProject();
                      if (!trimToNull(nodeActionForm.nodeId)) {
                        throw new Error('Select a node first.');
                      }
                      await mutateData(`/api/project/projects/${projectId}/nodes/${nodeActionForm.nodeId}/status`, 'PUT', {
                        progressRate: numberToNull(nodeActionForm.progressRate),
                        remark: trimToNull(nodeActionForm.remark),
                        status: nodeActionForm.status,
                      });
                    });
                  }}
                >
                  {actionLoading === 'update-node' ? 'Saving...' : 'Update node'}
                </Button>
              </div>

              <div className="grid gap-4">
                <FieldBlock label="Task / Status">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="theme-input h-11 rounded-2xl px-4" disabled={taskOptions.length === 0} onChange={(event: SelectChangeEvent) => { setTaskStatusForm((current) => ({ ...current, taskId: event.target.value })); setTaskAssignmentForm((current) => ({ ...current, taskId: event.target.value })); }} value={taskStatusForm.taskId}>
                      <option value="">{taskOptions.length ? 'Select task' : 'No tasks yet'}</option>
                      {taskOptions.map((task) => (
                        <option key={task.id} value={String(task.id)}>
                          {task.taskTitle}
                        </option>
                      ))}
                    </select>
                    <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setTaskStatusForm((current) => ({ ...current, status: event.target.value })); }} value={taskStatusForm.status}>
                      {EXECUTION_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldBlock>
                <FieldBlock label="Check / Audit">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setTaskStatusForm((current) => ({ ...current, checkStatus: event.target.value })); }} value={taskStatusForm.checkStatus}>
                      {REVIEW_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select className="theme-input h-11 rounded-2xl px-4" onChange={(event: SelectChangeEvent) => { setTaskStatusForm((current) => ({ ...current, auditStatus: event.target.value })); }} value={taskStatusForm.auditStatus}>
                      {REVIEW_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldBlock>
                <FieldBlock label="Progress / Finished Desc">
                  <div className="grid gap-3">
                    <input className="theme-input h-11 rounded-2xl px-4" onChange={(event: TextInputChangeEvent) => { setTaskStatusForm((current) => ({ ...current, progressRate: event.target.value })); }} placeholder="Progress" type="number" value={taskStatusForm.progressRate} />
                    <textarea className="theme-input min-h-[76px] rounded-2xl px-4 py-3" onChange={(event: TextareaChangeEvent) => { setTaskStatusForm((current) => ({ ...current, finishDesc: event.target.value })); }} placeholder="Finished description" value={taskStatusForm.finishDesc} />
                  </div>
                </FieldBlock>
                <Button
                  disabled={!selectedProjectId || taskOptions.length === 0 || actionLoading === 'update-task-status'}
                  onClick={() => {
                    void runAction('update-task-status', async () => {
                      const projectId = ensureSelectedProject();
                      if (!trimToNull(taskStatusForm.taskId)) {
                        throw new Error('Select a task first.');
                      }
                      await mutateData(`/api/project/projects/${projectId}/tasks/${taskStatusForm.taskId}/status`, 'PUT', {
                        auditStatus: taskStatusForm.auditStatus,
                        checkStatus: taskStatusForm.checkStatus,
                        finishDesc: trimToNull(taskStatusForm.finishDesc),
                        progressRate: numberToNull(taskStatusForm.progressRate),
                        status: taskStatusForm.status,
                      });
                    });
                  }}
                >
                  {actionLoading === 'update-task-status' ? 'Saving...' : 'Update task status'}
                </Button>
              </div>

              <div className="grid gap-4">
                <FieldBlock label="Responsible User">
                  <SystemUserPicker
                    disabled={systemUserLoading}
                    onChange={(nextValue) => {
                      setTaskAssignmentForm((current) => ({
                        ...current,
                        responsibleUserId: nextValue,
                      }));
                    }}
                    options={systemUsers}
                    placeholder={systemUserLoading ? 'Loading users...' : 'Select responsible user'}
                    value={taskAssignmentForm.responsibleUserId}
                  />
                </FieldBlock>
                <FieldBlock label="Participants">
                  <SystemUserPicker
                    disabled={systemUserLoading}
                    mode="multiple"
                    onChangeMany={(nextValues) => {
                      setTaskAssignmentForm((current) => ({
                        ...current,
                        participantUserIds: nextValues,
                      }));
                    }}
                    options={systemUsers}
                    placeholder={systemUserLoading ? 'Loading users...' : 'Select participants'}
                    values={taskAssignmentForm.participantUserIds}
                  />
                </FieldBlock>
                <Button
                  disabled={!selectedProjectId || taskOptions.length === 0 || systemUsers.length === 0 || actionLoading === 'update-task-assignment'}
                  onClick={() => {
                    void runAction('update-task-assignment', async () => {
                      const projectId = ensureSelectedProject();
                      if (!trimToNull(taskAssignmentForm.taskId)) {
                        throw new Error('Select a task first.');
                      }
                      const responsibleMember = systemUsers.find((user) => user.userId === taskAssignmentForm.responsibleUserId);
                      if (!responsibleMember) {
                        throw new Error('Select a responsible user.');
                      }
                      await mutateData(`/api/project/projects/${projectId}/tasks/${taskAssignmentForm.taskId}/assignment`, 'PUT', {
                        participantMembers: taskAssignmentForm.participantUserIds
                          .map((userId) => systemUsers.find((user) => user.userId === userId))
                          .filter((user): user is (typeof systemUsers)[number] => Boolean(user))
                          .map((user) => ({
                            userId: user.userId,
                            userName: user.userName,
                          })),
                        responsibleName: responsibleMember.userName,
                        responsibleUserId: responsibleMember.userId,
                      });
                    });
                  }}
                >
                  {actionLoading === 'update-task-assignment' ? 'Saving...' : 'Update assignment'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}

import type {
  ProjectAttachmentRecord,
  UploadProjectAttachmentInput,
} from '../../project-attachments';

export type PlanLogProject = {
  id: number;
  managerId?: string | null;
  managerName?: string | null;
  projectName: string;
};

export type PlanLogPlan = {
  id: number;
  managerId?: string | null;
  managerName?: string | null;
  planContent?: string | null;
  planEndDate?: string | null;
  planMonth?: string | null;
  planPeriod?: string | null;
  planStartDate?: string | null;
  planType: string;
  planWeek?: string | null;
  status?: string | null;
};

export type PlanLogPlanItem = {
  assigneeId?: string | null;
  assigneeName?: string | null;
  helpDept?: string | null;
  id: number;
  planContent: string;
  planDate?: string | null;
  planRequirement?: string | null;
  projectId: number;
  projectNodeId?: number | null;
  projectPlanId: number;
  projectTaskId?: number | null;
  status?: string | null;
  weekDay?: string | null;
};

export type PlanLogMember = {
  dutyContent?: string | null;
  roleName?: string | null;
  userId: string;
  userName: string;
};

export type PlanLogNode = {
  id: number;
  nodeName: string;
  parentId?: number | null;
};

export type PlanLogTask = {
  id: number;
  projectNodeId?: number | null;
  responsibleName?: string | null;
  taskTitle: string;
};

export type PlanLogReport = {
  coordinationContent?: string | null;
  id: number;
  delayFlag?: boolean | null;
  delayReason?: string | null;
  finishContent?: string | null;
  remark?: string | null;
  reportContent?: string | null;
  reportDate?: string | null;
  reportMonth?: string | null;
  reportType: string;
  reportWeek?: string | null;
  userId?: string | null;
  userName: string;
};

export type PlanLogAttachment = ProjectAttachmentRecord;

export type PlanLogSavePayload = {
  managerId: string | null;
  managerName: string | null;
  planContent: string | null;
  planEndDate: string | null;
  planMonth: string | null;
  planPeriod: string | null;
  planStartDate: string | null;
  planType: string;
  planWeek: string | null;
  status: string | null;
};

export type PlanLogItemSavePayload = {
  assigneeId: string | null;
  assigneeName: string | null;
  helpDept: string | null;
  planContent: string;
  planDate: string | null;
  planRequirement: string | null;
  projectNodeId: number | null;
  projectTaskId: number | null;
  status: string | null;
  weekDay: string | null;
};

export type PlanLogReportSavePayload = {
  coordinationContent?: string | null;
  delayFlag: boolean | null;
  delayReason: string | null;
  finishContent: string | null;
  projectNodeId?: number | null;
  projectTaskId?: number | null;
  remark: string | null;
  reportContent: string | null;
  reportDate: string | null;
  reportMonth: string | null;
  reportType: string;
  reportWeek: string | null;
  userId: string;
  userName: string;
};

export type PlanLogPageProps = {
  attachments: PlanLogAttachment[];
  currentUserId: string;
  currentUserName: string;
  loading: boolean;
  members: PlanLogMember[];
  nodes: PlanLogNode[];
  onCreatePlan: (projectId: number, payload: PlanLogSavePayload) => Promise<void>;
  onCreatePlanItem: (
    projectId: number,
    planId: number,
    payload: PlanLogItemSavePayload,
  ) => Promise<void>;
  onCreateReport: (
    projectId: number,
    payload: PlanLogReportSavePayload,
  ) => Promise<void>;
  onDeleteAttachment: (projectId: number, attachmentId: number) => Promise<void>;
  onUpdatePlan: (
    projectId: number,
    planId: number,
    payload: PlanLogSavePayload,
  ) => Promise<void>;
  onUpdatePlanItem: (
    projectId: number,
    planId: number,
    itemId: number,
    payload: PlanLogItemSavePayload,
  ) => Promise<void>;
  onUpdateReport: (
    projectId: number,
    reportId: number,
    payload: PlanLogReportSavePayload,
  ) => Promise<void>;
  onUploadAttachment: (
    projectId: number,
    payload: UploadProjectAttachmentInput,
  ) => Promise<void>;
  planItemsByPlanId: Record<number, PlanLogPlanItem[]>;
  plans: PlanLogPlan[];
  reports: PlanLogReport[];
  selectedProject: PlanLogProject | null;
  tasks: PlanLogTask[];
  workspaceError: string | null;
};

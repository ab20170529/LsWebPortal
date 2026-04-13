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

export type PlanLogCheckIn = {
  id: number;
  address?: string | null;
  checkInTime?: string | null;
  result?: string | null;
  userName: string;
};

export type PlanLogAttachment = {
  id: number;
  fileCategory?: string | null;
  fileName: string;
  fileSize?: number | null;
  uploadTime?: string | null;
  uploaderName?: string | null;
};

export type PlanLogPageProps = {
  attachments: PlanLogAttachment[];
  checkIns: PlanLogCheckIn[];
  loading: boolean;
  onCreatePlan: (
    projectId: number,
    payload: {
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
    },
  ) => Promise<void>;
  onUpdatePlan: (
    projectId: number,
    planId: number,
    payload: {
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
    },
  ) => Promise<void>;
  onCreateReport: (
    projectId: number,
    payload: {
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
    },
  ) => Promise<void>;
  onUpdateReport: (
    projectId: number,
    reportId: number,
    payload: {
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
    },
  ) => Promise<void>;
  reports: PlanLogReport[];
  selectedProject: PlanLogProject | null;
  workspaceError: string | null;
  plans: PlanLogPlan[];
};

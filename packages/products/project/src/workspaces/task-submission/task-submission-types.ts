export type TaskSubmissionProject = {
  id: number;
  projectName: string;
};

export type TaskSubmissionTask = {
  id: number;
  actualEndTime?: string | null;
  actualStartTime?: string | null;
  auditStatus?: string | null;
  checkStatus?: string | null;
  finishDesc?: string | null;
  planEndTime?: string | null;
  planStartTime?: string | null;
  progressRate?: number | null;
  remark?: string | null;
  responsibleName?: string | null;
  status?: string | null;
  taskTitle: string;
};

export type TaskSubmissionPayload = {
  actualEndTime: string | null;
  actualStartTime: string | null;
  auditStatus: string | null;
  checkStatus: string | null;
  finishDesc: string | null;
  planEndTime: string | null;
  planStartTime: string | null;
  progressRate: number | null;
  remark: string | null;
  status: string | null;
};

export type TaskSubmissionPageProps = {
  detailLoading: boolean;
  onUpdateTaskStatus: (
    projectId: number,
    taskId: number,
    payload: TaskSubmissionPayload,
  ) => Promise<void>;
  selectedProject: TaskSubmissionProject | null;
  tasks: TaskSubmissionTask[];
};

export type TaskFormState = {
  finishDesc: string;
  progressRate: string;
  remark: string;
  status: string;
};

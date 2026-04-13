export type ScheduleColor = 'blue' | 'emerald' | 'violet';

export type ProgressSchedule = {
  color: ScheduleColor;
  endDay: number;
  endMonth: number;
  id: string;
  owner: string;
  remark?: string;
  sourceId?: number;
  sort?: number;
  startDay: number;
  startMonth: number;
};

export type ProgressTaskTemplate = {
  code: string;
  description?: string;
  id: string;
  leadRole: string;
  needAudit?: boolean;
  needCheck?: boolean;
  needFile?: boolean;
  needSettle?: boolean;
  planDay?: number | null;
  remark?: string;
  schedules: ProgressSchedule[];
  sourceId?: number;
  taskContent?: string;
  title: string;
};

export type ProgressNodeTemplate = {
  code: string;
  description?: string;
  id: string;
  needAudit?: boolean;
  needCheck?: boolean;
  planDay?: number | null;
  sourceId?: number;
  tasks: ProgressTaskTemplate[];
  title: string;
};

export type ProgressProjectType = {
  code: string;
  description: string;
  id: string;
  nodes: ProgressNodeTemplate[];
  sourceId?: number;
  sort?: number | null;
  status?: string | null;
  typeDesc?: string;
  title: string;
};

export type SelectedSchedule = {
  nodeId: string;
  scheduleId: string;
  taskId: string;
  typeId: string;
};

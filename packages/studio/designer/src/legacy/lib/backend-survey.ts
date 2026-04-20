import { apiRequest } from './http';

export type SurveyMainListParams = {
  departId?: number | string | null;
  keyword?: string | null;
};

export type SurveyPersistedId = number | string;

export type SurveyMainDto = {
  id: SurveyPersistedId;
  departId: number | string | null;
  title?: string | null;
  project?: string | null;
  surveyDate?: string | null;
  fileNo?: string | null;
  address?: string | null;
  scope?: string | null;
  orderNum?: number | string | null;
  empNames?: string | null;
  surveyUsers?: string | null;
  positionsBak?: string | null;
  toolsBak?: string | null;
  painsBak?: string | null;
  specialBak?: string | null;
  otherBak?: string | null;
  operateDate?: string | null;
  operatorName?: string | null;
  status?: string | null;
  version?: string | null;
};

export type SurveyDepartmentStat = {
  departId: number;
  count: number;
};

export type SurveyDetailDto = {
  id: SurveyPersistedId;
  billNo?: string | null;
  mainId?: number | string | null;
  moduleName?: string | null;
  moduleId?: string | null;
  position1?: string | null;
  workingRate1?: number | string | null;
  position2?: string | null;
  workingRate2?: number | string | null;
  position3?: string | null;
  workingRate3?: number | string | null;
  workingBak?: string | null;
  painsBak?: string | null;
  suggestionBak?: string | null;
};

export type SaveSurveyMainPayload = Partial<SurveyMainDto> & {
  id?: SurveyPersistedId;
};

export type SaveSurveyDetailPayload = Partial<SurveyDetailDto> & {
  id?: SurveyPersistedId;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function readPersistedId(record: Record<string, unknown>) {
  const candidate = record.id ?? record.ID ?? record.Id;
  if (typeof candidate === 'number') {
    return Number.isFinite(candidate) ? candidate : undefined;
  }
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function readField(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (!(key in record)) {
      continue;
    }
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function normalizeSurveyMainDto(value: unknown): SurveyMainDto {
  if (!isRecord(value)) {
    return value as SurveyMainDto;
  }

  return {
    ...value,
    address: readField(value, 'address', 'Address', 'ADDRESS') as SurveyMainDto['address'],
    departId: readField(value, 'departId', 'departid', 'DepartId', 'DEPARTID') as SurveyMainDto['departId'],
    empNames: readField(value, 'empNames', 'empnames', 'EmpNames', 'EMPNAMES') as SurveyMainDto['empNames'],
    fileNo: readField(value, 'fileNo', 'fileno', 'FileNo', 'FILENO') as SurveyMainDto['fileNo'],
    id: readPersistedId(value) ?? (value.id as SurveyPersistedId),
    operateDate: readField(value, 'operateDate', 'operatedate', 'OperateDate', 'OPERATEDATE') as SurveyMainDto['operateDate'],
    operatorName: readField(value, 'operatorName', 'operatorname', 'OperatorName', 'OPERATORNAME') as SurveyMainDto['operatorName'],
    orderNum: readField(value, 'orderNum', 'ordernum', 'OrderNum', 'ORDERNUM') as SurveyMainDto['orderNum'],
    otherBak: readField(value, 'otherBak', 'otherbak', 'OtherBak', 'OTHERBAK') as SurveyMainDto['otherBak'],
    painsBak: readField(value, 'painsBak', 'painsbak', 'PainsBak', 'PAINSBAK') as SurveyMainDto['painsBak'],
    positionsBak: readField(value, 'positionsBak', 'Positionsbak', 'positionsbak', 'PositionsBak', 'POSITIONSBAK') as SurveyMainDto['positionsBak'],
    project: readField(value, 'project', 'Project', 'PROJECT') as SurveyMainDto['project'],
    scope: readField(value, 'scope', 'Scope', 'SCOPE') as SurveyMainDto['scope'],
    specialBak: readField(value, 'specialBak', 'specialbak', 'SpecialBak', 'SPECIALBAK') as SurveyMainDto['specialBak'],
    surveyDate: readField(value, 'surveyDate', 'surveydate', 'SurveyDate', 'SURVEYDATE') as SurveyMainDto['surveyDate'],
    surveyUsers: readField(value, 'surveyUsers', 'surveyusers', 'SurveyUsers', 'SURVEYUSERS') as SurveyMainDto['surveyUsers'],
    title: readField(value, 'title', 'Title', 'TITLE') as SurveyMainDto['title'],
    toolsBak: readField(value, 'toolsBak', 'toolsbak', 'ToolsBak', 'TOOLSBAK') as SurveyMainDto['toolsBak'],
    status: readField(value, 'status', 'Status', 'STATUS') as SurveyMainDto['status'],
    version: readField(value, 'version', 'Version', 'VERSION') as SurveyMainDto['version'],
  } as SurveyMainDto;
}

function normalizeSurveyDetailDto(value: unknown): SurveyDetailDto {
  if (!isRecord(value)) {
    return value as SurveyDetailDto;
  }

  return {
    ...value,
    billNo: readField(value, 'billNo', 'billno', 'BillNo', 'BillNO') as SurveyDetailDto['billNo'],
    id: readPersistedId(value) ?? (value.id as SurveyPersistedId),
    mainId: readField(value, 'mainId', 'mid', 'Mid', 'MID') as SurveyDetailDto['mainId'],
    moduleId: readField(value, 'moduleId', 'moduleid', 'ModuleId', 'MODULEID') as SurveyDetailDto['moduleId'],
    moduleName: readField(value, 'moduleName', 'modulename', 'ModuleName', 'MODULENAME') as SurveyDetailDto['moduleName'],
    painsBak: readField(value, 'painsBak', 'painsbak', 'PainsBak', 'PAINSBAK') as SurveyDetailDto['painsBak'],
    position1: readField(value, 'position1', 'Position1', 'POSITION1') as SurveyDetailDto['position1'],
    position2: readField(value, 'position2', 'Position2', 'POSITION2') as SurveyDetailDto['position2'],
    position3: readField(value, 'position3', 'Position3', 'POSITION3') as SurveyDetailDto['position3'],
    suggestionBak: readField(value, 'suggestionBak', 'Suggestionbak', 'suggestionbak', 'SuggestionBak', 'SUGGESTIONBAK') as SurveyDetailDto['suggestionBak'],
    workingBak: readField(value, 'workingBak', 'workingbak', 'WorkingBak', 'WORKINGBAK') as SurveyDetailDto['workingBak'],
    workingRate1: readField(value, 'workingRate1', 'Working_rate1', 'working_rate1', 'WORKING_RATE1') as SurveyDetailDto['workingRate1'],
    workingRate2: readField(value, 'workingRate2', 'Working_rate2', 'working_rate2', 'WORKING_RATE2') as SurveyDetailDto['workingRate2'],
    workingRate3: readField(value, 'workingRate3', 'Working_rate3', 'working_rate3', 'WORKING_RATE3') as SurveyDetailDto['workingRate3'],
  } as SurveyDetailDto;
}

export async function fetchSurveyMainList(params: SurveyMainListParams = {}) {
  const response = await apiRequest<unknown>('/api/survey/mains', {
    auth: true,
    method: 'GET',
    query: {
      departId: params.departId ?? undefined,
      keyword: params.keyword ?? undefined,
    },
  });
  return Array.isArray(response) ? response.map((item) => normalizeSurveyMainDto(item)) : [];
}

export async function fetchSurveyMain(id: SurveyPersistedId) {
  const response = await apiRequest<unknown>(`/api/survey/mains/${id}`, {
    auth: true,
    method: 'GET',
  });
  return normalizeSurveyMainDto(response);
}

export async function saveSurveyMain(payload: SaveSurveyMainPayload) {
  const response = await apiRequest<unknown>('/api/survey/mains', {
    auth: true,
    body: payload,
    method: 'POST',
  });
  return normalizeSurveyMainDto(response);
}

export async function deleteSurveyMain(id: SurveyPersistedId) {
  return apiRequest<void>(`/api/survey/mains/${id}`, {
    auth: true,
    method: 'DELETE',
  });
}

export async function fetchSurveyDetails(mainId: SurveyPersistedId) {
  const response = await apiRequest<unknown>(`/api/survey/mains/${mainId}/details`, {
    auth: true,
    method: 'GET',
  });
  return Array.isArray(response) ? response.map((item) => normalizeSurveyDetailDto(item)) : [];
}

export async function fetchSurveyDetail(mainId: SurveyPersistedId, id: SurveyPersistedId) {
  const response = await apiRequest<unknown>(`/api/survey/mains/${mainId}/details/${id}`, {
    auth: true,
    method: 'GET',
  });
  return normalizeSurveyDetailDto(response);
}

export async function saveSurveyDetail(mainId: SurveyPersistedId, payload: SaveSurveyDetailPayload) {
  const response = await apiRequest<unknown>(`/api/survey/mains/${mainId}/details`, {
    auth: true,
    body: payload,
    method: 'POST',
  });
  return normalizeSurveyDetailDto(response);
}

export async function deleteSurveyDetail(mainId: SurveyPersistedId, id: SurveyPersistedId) {
  return apiRequest<void>(`/api/survey/mains/${mainId}/details/${id}`, {
    auth: true,
    method: 'DELETE',
  });
}

export async function archiveSurveyMain(id: SurveyPersistedId) {
  const response = await apiRequest<unknown>(`/api/survey/mains/${id}/archive`, {
    auth: true,
    method: 'POST',
  });
  return normalizeSurveyMainDto(response);
}

function normalizeDepartmentStat(value: unknown): SurveyDepartmentStat | null {
  if (!isRecord(value)) {
    return null;
  }
  const departId = readField(value, 'departid', 'departId', 'DepartId', 'DEPARTID');
  const count = readField(value, 'cnt', 'count', 'Count', 'CNT');
  const parsedDepartId = typeof departId === 'number' ? departId : Number(departId);
  const parsedCount = typeof count === 'number' ? count : Number(count);
  if (!Number.isFinite(parsedDepartId) || !Number.isFinite(parsedCount)) {
    return null;
  }
  return { departId: parsedDepartId, count: parsedCount };
}

export async function fetchSurveyDepartmentStats() {
  const response = await apiRequest<unknown>('/api/survey/departments', {
    auth: true,
    method: 'GET',
  });
  if (!Array.isArray(response)) {
    return [];
  }
  return response
    .map((item) => normalizeDepartmentStat(item))
    .filter((item): item is SurveyDepartmentStat => item !== null);
}

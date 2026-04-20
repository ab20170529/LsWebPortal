import { apiRequest } from './http';

export interface FieldSqlTagOptionDto {
  showid?: unknown;
  showname?: unknown;
}

export type SystemTabDto = Record<string, unknown>;

export async function fetchFieldSqlTagOptions() {
  return apiRequest<FieldSqlTagOptionDto[]>('/api/system/fieldsqltag-options', {
    auth: true,
    method: 'GET',
  });
}

export async function fetchSystemTab() {
  return apiRequest<SystemTabDto>('/api/system/system-tab', {
    auth: true,
    method: 'GET',
  });
}

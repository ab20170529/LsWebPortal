import { apiRequest } from './http';

export type SystemDepartmentOption = {
  id: number;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
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

function readDepartmentId(record: Record<string, unknown>) {
  const rawValue = readField(record, 'Departmentid', 'departmentid', 'DepartmentId', 'departmentId', 'id', 'ID', 'Id');
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : undefined;
  }

  if (typeof rawValue === 'string') {
    const parsed = Number.parseInt(rawValue.trim(), 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeDepartmentOption(value: unknown): SystemDepartmentOption | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readDepartmentId(value);
  const name = String(readField(value, 'departmentname', 'Departmentname', 'departmentName', 'DepartmentName', 'name', 'title') ?? '').trim();

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  return {
    id,
    name,
  };
}

export async function fetchSystemDepartments() {
  const response = await apiRequest<unknown>('/api/system/departments', {
    auth: true,
    method: 'GET',
  });

  if (!Array.isArray(response)) {
    return [];
  }

  return response
    .map((item) => normalizeDepartmentOption(item))
    .filter((item): item is SystemDepartmentOption => item !== null);
}

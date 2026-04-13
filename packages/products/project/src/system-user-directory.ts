import { useEffect, useState } from 'react';
import { createApiClient } from '@lserp/http';

type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

type EmployeeOptionDto = {
  departmentId?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;
  loginAccount?: string | null;
  py?: string | null;
};

export type SystemUserOption = {
  departmentId: string;
  employeeId: number | null;
  loginAccount: string;
  py: string;
  searchText: string;
  userId: string;
  userName: string;
};

const systemUserApiClient = createApiClient({
  baseUrl:
    (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
    'http://127.0.0.1:8080',
});

function normalizeSystemUser(option: EmployeeOptionDto): SystemUserOption | null {
  const employeeId =
    typeof option.employeeId === 'number' && Number.isFinite(option.employeeId)
      ? option.employeeId
      : null;
  const userId = employeeId === null ? '' : String(employeeId);
  const userName = option.employeeName?.trim() ?? '';

  if (!userId || !userName) {
    return null;
  }

  const loginAccount = option.loginAccount?.trim() ?? '';
  const departmentId = option.departmentId?.trim() ?? '';
  const py = option.py?.trim() ?? '';

  return {
    departmentId,
    employeeId,
    loginAccount,
    py,
    searchText: [userName, loginAccount, py, departmentId, userId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    userId,
    userName,
  };
}

export async function fetchSystemUserOptions() {
  const response = await systemUserApiClient.request<CommonResult<EmployeeOptionDto[]>>(
    '/api/auth/employees',
    {
      method: 'GET',
    },
  );

  const rawItems = Array.isArray(response.data) ? response.data : [];
  const uniqueItems = new Map<string, SystemUserOption>();

  rawItems.forEach((item) => {
    const normalized = normalizeSystemUser(item);
    if (!normalized) {
      return;
    }

    uniqueItems.set(normalized.userId, normalized);
  });

  return Array.from(uniqueItems.values()).sort((left, right) =>
    left.userName.localeCompare(right.userName, 'zh-CN'),
  );
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '人员数据加载失败，请稍后重试。';
}

export function useSystemUserOptions() {
  const [options, setOptions] = useState<SystemUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextOptions = await fetchSystemUserOptions();
        if (!active) {
          return;
        }

        setOptions(nextOptions);
      } catch (error: unknown) {
        if (!active) {
          return;
        }

        setOptions([]);
        setError(normalizeErrorMessage(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return {
    error,
    loading,
    options,
  };
}

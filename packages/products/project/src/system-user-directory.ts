import { useEffect, useState } from 'react';

import { createProjectApiClient } from './project-api';

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

const systemUserApiClient = createProjectApiClient();

const fallbackSystemUserOptions: SystemUserOption[] = [
  {
    departmentId: 'PMO',
    employeeId: 1001,
    loginAccount: 'wangxiuling',
    py: 'wxl',
    searchText: '王秀娟 wangxiuling wxl PMO 1001'.toLowerCase(),
    userId: '1001',
    userName: '王秀娟',
  },
  {
    departmentId: 'DEV',
    employeeId: 1002,
    loginAccount: 'zhangwei',
    py: 'zw',
    searchText: '张伟 zhangwei zw DEV 1002'.toLowerCase(),
    userId: '1002',
    userName: '张伟',
  },
  {
    departmentId: 'QA',
    employeeId: 1003,
    loginAccount: 'liuming',
    py: 'lm',
    searchText: '刘明 liuming lm QA 1003'.toLowerCase(),
    userId: '1003',
    userName: '刘明',
  },
  {
    departmentId: 'FIN',
    employeeId: 1004,
    loginAccount: 'chenli',
    py: 'cl',
    searchText: '陈丽 chenli cl FIN 1004'.toLowerCase(),
    userId: '1004',
    userName: '陈丽',
  },
  {
    departmentId: 'OPS',
    employeeId: 1005,
    loginAccount: 'sunhao',
    py: 'sh',
    searchText: '孙浩 sunhao sh OPS 1005'.toLowerCase(),
    userId: '1005',
    userName: '孙浩',
  },
];

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
  try {
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

    const items = Array.from(uniqueItems.values()).sort((left, right) =>
      left.userName.localeCompare(right.userName, 'zh-CN'),
    );

    return items.length ? items : fallbackSystemUserOptions;
  } catch {
    return fallbackSystemUserOptions;
  }
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

import React, { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import type { EmployeeOption } from '../types';

type EmployeeSelectorProps = {
  disabled?: boolean;
  employees: EmployeeOption[];
  helperText: string;
  isLoading: boolean;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSelect: (employeeId: number, employeeName: string) => void;
  selectedId: number | null;
};

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12ZM12 12C7.85786 12 4.5 15.3579 4.5 19.5H19.5C19.5 15.3579 16.1421 12 12 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-[18px] w-[18px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function EmployeeSelector({
  disabled = false,
  employees,
  helperText,
  isLoading,
  keyword,
  onKeywordChange,
  onSelect,
  selectedId,
}: EmployeeSelectorProps) {
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = React.useRef(null as ReturnType<typeof setTimeout> | null);
  const containerRef = React.useRef(null as HTMLDivElement | null);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedKeyword = draftKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return employees.slice(0, 10);
    }

    return employees
      .filter((employee) => {
        const searchable = [employee.employeeName, employee.loginAccount, employee.py]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalizedKeyword);
      })
      .slice(0, 10);
  }, [draftKeyword, employees]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDraftKeyword(value);
    setIsOpen(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (value !== keyword) {
        onKeywordChange(value);
      }
    }, 300);
  };

  return (
    <div className="employee-selector space-y-1.5">
      <label className="ml-1 text-[11px] font-semibold text-slate-400">
        登录人员
      </label>

      <div ref={containerRef} className="dropdown-container relative">
        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          <PersonIcon />
        </div>

        <input
          className="h-[50px] w-full rounded-2xl border border-slate-200/85 bg-white/80 pl-12 pr-11 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-100/80"
          disabled={disabled || isLoading}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={isLoading ? '正在加载人员列表...' : '请输入或搜索人员名称'}
          type="text"
          value={draftKeyword}
        />

        <button
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-white/55 text-slate-400 transition-colors hover:bg-white/80 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isLoading}
          onClick={() => {
            setIsOpen((open) => !open);
          }}
          type="button"
        >
          <ChevronIcon isOpen={isOpen} />
        </button>

        {isOpen ? (
          <div className="dropdown-list open absolute left-0 right-0 z-20 mt-2.5 overflow-hidden rounded-[26px] border border-white/80 bg-white/86 shadow-[0_32px_64px_-32px_rgba(15,23,42,0.42)] backdrop-blur-2xl">
            <div className="max-h-[19rem] overflow-y-auto p-2.5">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => {
                  const isActive = selectedId === employee.employeeId;

                  return (
                    <button
                      key={employee.employeeId}
                      className={`flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(255,255,255,0.94))] text-slate-900 shadow-[0_18px_28px_-24px_rgba(14,116,144,0.75)]'
                          : 'text-slate-600 hover:bg-white/75 hover:text-slate-900'
                      }`}
                      onClick={() => {
                        onSelect(employee.employeeId, employee.employeeName);
                        setDraftKeyword(employee.employeeName);
                        setIsOpen(false);
                      }}
                      type="button"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all duration-200 ${
                          isActive
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-white/70 bg-white/55 text-slate-400'
                        }`}
                      >
                        <span className="text-[13px] font-bold">
                          {isActive ? '✓' : employee.employeeName.slice(0, 1)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {employee.employeeName}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-slate-400">未找到匹配的人员</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="ml-1 text-[11px] text-slate-500">{helperText}</div>
    </div>
  );
}

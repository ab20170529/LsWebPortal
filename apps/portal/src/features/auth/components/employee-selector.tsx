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
    <div className="space-y-1.5">
      <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        登录人员
      </label>

      <div ref={containerRef} className="relative">
        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          <span className="material-symbols-outlined text-lg">person</span>
        </div>

        <input
          className="h-12 w-full rounded-xl border border-slate-200/60 bg-white/50 pl-12 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100/70"
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
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isLoading}
          onClick={() => {
            setIsOpen((open) => !open);
          }}
          type="button"
        >
          <span
            className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-[24px] border border-white/70 bg-white/78 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => {
                  const isActive = selectedId === employee.employeeId;

                  return (
                    <button
                      key={employee.employeeId}
                      className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-[linear-gradient(135deg,rgba(224,242,254,0.95),rgba(255,255,255,0.92))] text-slate-900 shadow-[0_18px_28px_-24px_rgba(14,116,144,0.95)]'
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
                        <span className="material-symbols-outlined text-[18px]">
                          {isActive ? 'check' : 'badge'}
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

      <div className="ml-1 text-[11px] text-slate-400">{helperText}</div>
    </div>
  );
}

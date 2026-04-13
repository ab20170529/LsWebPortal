import React, { useEffect, useMemo, useState } from 'react';

import { cx } from '@lserp/ui';

import type { SystemUserOption } from './system-user-directory';

type SystemUserPickerProps = {
  disabled?: boolean;
  mode?: 'multiple' | 'single';
  onChange?: (nextValue: string, nextOption: SystemUserOption | null) => void;
  onChangeMany?: (
    nextValues: string[],
    nextOptions: SystemUserOption[],
  ) => void;
  options: SystemUserOption[];
  placeholder?: string;
  value?: string | null;
  values?: string[];
};

function ChevronDownIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20" className="h-4 w-4">
      <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12.5 12.5 16.5 16.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path
        d="M6 6 14 14M14 6 6 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function buildSingleLabel(option: SystemUserOption | null, placeholder: string) {
  if (!option) {
    return placeholder;
  }

  return option.loginAccount
    ? `${option.userName} / ${option.loginAccount}`
    : option.userName;
}

function buildMultipleLabel(options: SystemUserOption[]) {
  if (options.length === 0) {
    return '';
  }

  if (options.length <= 2) {
    return options.map((option) => option.userName).join('、');
  }

  return `${options
    .slice(0, 2)
    .map((option) => option.userName)
    .join('、')} +${options.length - 2}`;
}

export function SystemUserPicker({
  disabled = false,
  mode = 'single',
  onChange,
  onChangeMany,
  options,
  placeholder = '请选择人员',
  value,
  values,
}: SystemUserPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [rootRef] = useState<{ current: HTMLDivElement | null }>(() => ({ current: null }));
  const [inputRef] = useState<{ current: HTMLInputElement | null }>(() => ({ current: null }));

  const valueList = mode === 'multiple' ? values ?? [] : [];
  const selectedSingle =
    mode === 'single'
      ? options.find((option) => option.userId === (value ?? '')) ?? null
      : null;
  const selectedMultiple =
    mode === 'multiple'
      ? valueList
          .map((userId) => options.find((option) => option.userId === userId) ?? null)
          .filter((option): option is SystemUserOption => Boolean(option))
      : [];

  const filteredOptions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return options;
    }

    return options.filter((option) => option.searchText.includes(normalizedKeyword));
  }, [keyword, options]);

  useEffect(() => {
    if (!open) {
      setKeyword('');
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  function toggleOpen() {
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
  }

  function clearSelection(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (mode === 'single') {
      onChange?.('', null);
      return;
    }

    onChangeMany?.([], []);
  }

  function handleSingleSelect(option: SystemUserOption) {
    onChange?.(option.userId, option);
    setOpen(false);
  }

  function handleMultipleToggle(option: SystemUserOption) {
    const exists = valueList.includes(option.userId);
    const nextValues = exists
      ? valueList.filter((userId) => userId !== option.userId)
      : [...valueList, option.userId];
    const nextOptions = nextValues
      .map((userId) => options.find((item) => item.userId === userId) ?? null)
      .filter((item): item is SystemUserOption => Boolean(item));

    onChangeMany?.(nextValues, nextOptions);
  }

  const hasValue =
    mode === 'single' ? Boolean(selectedSingle) : selectedMultiple.length > 0;

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        className={cx(
          'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-sm outline-none transition',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'hover:border-slate-300 hover:bg-white',
          open ? 'border-sky-300 bg-white shadow-[0_0_0_3px_rgba(186,230,253,0.45)]' : '',
        )}
        onClick={toggleOpen}
        type="button"
      >
        <div className="min-w-0 flex-1">
          {mode === 'single' ? (
            <span className={selectedSingle ? 'text-slate-900' : 'text-slate-400'}>
              {buildSingleLabel(selectedSingle, placeholder)}
            </span>
          ) : selectedMultiple.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedMultiple.slice(0, 2).map((option) => (
                <span
                  key={option.userId}
                  className="inline-flex items-center rounded-xl bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                >
                  {option.userName}
                </span>
              ))}
              {selectedMultiple.length > 2 ? (
                <span className="inline-flex items-center rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  +{selectedMultiple.length - 2}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          {mode === 'multiple' && selectedMultiple.length ? (
            <div className="mt-1 text-xs text-slate-500">
              {buildMultipleLabel(selectedMultiple)}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {hasValue ? (
            <span
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-700"
              onClick={clearSelection}
              role="button"
              tabIndex={0}
            >
              <CloseIcon />
            </span>
          ) : null}
          <ChevronDownIcon />
        </div>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_60px_-38px_rgba(15,23,42,0.45)]">
          <div className="border-b border-slate-100 p-3">
            <label className="relative block">
              <SearchIcon />
              <input
                className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setKeyword(event.target.value);
                }}
                placeholder="搜索姓名、账号或简拼"
                ref={inputRef}
                value={keyword}
              />
            </label>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selected =
                  mode === 'single'
                    ? selectedSingle?.userId === option.userId
                    : valueList.includes(option.userId);

                return (
                  <button
                    key={option.userId}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition',
                      selected
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-700 hover:bg-slate-50',
                    )}
                    onClick={() => {
                      if (mode === 'single') {
                        handleSingleSelect(option);
                        return;
                      }

                      handleMultipleToggle(option);
                    }}
                    type="button"
                  >
                    {mode === 'multiple' ? (
                      <span
                        className={cx(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          selected
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-slate-300 bg-white',
                        )}
                      >
                        {selected ? (
                          <svg fill="none" viewBox="0 0 12 12" className="h-3 w-3">
                            <path
                              d="m2.5 6.2 2.1 2.1L9.5 3.8"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.6"
                            />
                          </svg>
                        ) : null}
                      </span>
                    ) : (
                      <span
                        className={cx(
                          'mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full',
                          selected ? 'bg-sky-500' : 'bg-slate-300',
                        )}
                      />
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {option.userName}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {[option.loginAccount, option.departmentId]
                          .filter(Boolean)
                          .join(' / ') || option.userId}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-8 text-center text-sm text-slate-500">
                未找到匹配人员
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

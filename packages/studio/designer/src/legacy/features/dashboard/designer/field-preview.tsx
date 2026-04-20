import React, { useCallback } from 'react';
import { CalendarDays, ChevronDown, Search } from 'lucide-react';

export type WorkbenchFieldPreviewMode = 'table' | 'filter' | 'condition';
export type NormalizePreviewField = (field: any) => any;
export type WorkbenchFieldPreviewRenderer = (
  rawField: any,
  rowIndex: number,
  mode?: WorkbenchFieldPreviewMode,
) => React.ReactNode;

export function getWorkbenchFieldOptionValues(rawField: any, normalizeField: NormalizePreviewField) {
  const field = normalizeField(rawField);
  const source = field.dictCode || field.helpText || '';

  if (/[,\n，;；|]/.test(source)) {
    const items = source
      .split(/[\n,，;；|]/)
      .map((item: string) => item.trim())
      .filter(Boolean);

    if (items.length > 0) {
      return items;
    }
  }

  return [];
}

export function getWorkbenchPreviewCellValue(
  rawField: any,
  rowIndex: number,
  normalizeField: NormalizePreviewField,
) {
  const field = normalizeField(rawField);
  const optionValues = getWorkbenchFieldOptionValues(field, normalizeField);

  if (field.defaultValue) {
    return field.defaultValue;
  }

  if (field.type === '下拉框' || field.type === '单选框') {
    return optionValues[rowIndex % optionValues.length] || '';
  }

  if (field.type === '多选框') {
    return optionValues.slice(0, 2).join('、');
  }

  return '';
}

export function renderWorkbenchFieldPreview(
  rawField: any,
  rowIndex: number,
  mode: WorkbenchFieldPreviewMode = 'table',
  normalizeField: NormalizePreviewField,
) {
  const field = normalizeField(rawField);
  const previewValue = getWorkbenchPreviewCellValue(field, rowIndex, normalizeField);
  const optionValues = getWorkbenchFieldOptionValues(field, normalizeField);
  const isFilterMode = mode !== 'table';
  const isConditionMode = mode === 'condition';
  const inputClass = isFilterMode
    ? 'h-10 w-full rounded-xl border border-slate-200/90 bg-white/96 px-3 text-[12px] text-slate-700 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900/88 dark:text-slate-200'
    : 'h-10 w-full rounded-xl border border-slate-200/80 bg-white/94 px-3 text-[12px] text-slate-700 outline-none transition shadow-[0_10px_20px_-18px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.72)] focus:border-[color:var(--workspace-accent-border-strong)] focus:ring-4 focus:ring-[color:var(--workspace-accent-soft)] dark:border-slate-700 dark:bg-slate-900/88 dark:text-slate-100';
  const compactInputClass = `${inputClass} px-2.5`;
  const previewKey = `${field.id}-${field.type}-${field.dictCode}-${field.defaultValue}-${field.placeholder}`;

  const stopPreviewEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  if (isFilterMode) {
    const shellClass = `flex h-9 w-full items-center justify-between gap-2 rounded-[10px] border border-slate-200/90 bg-white text-[12px] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 ${isConditionMode ? 'pointer-events-none px-2.5' : 'px-3'}`;
    const staticValue = field.placeholder || previewValue || '';
    const trailingIcon = field.type === '日期框'
      ? 'calendar'
      : field.type === '下拉框' || field.type === '多选框'
        ? 'expand'
        : field.type === '搜索框'
          ? 'search'
          : '';

    if (isConditionMode) {
      if (field.type === '多选框') {
        return (
          <div className={shellClass}>
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="h-4.5 w-4.5 rounded-md border border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70" />
              <span className="h-4.5 w-4.5 rounded-md border border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70" />
            </div>
            <ChevronDown className="size-4 text-slate-300 dark:text-slate-500" />
          </div>
        );
      }

      if (field.type === '单选框') {
        return (
          <div className={shellClass}>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-full border border-[color:var(--workspace-accent)] bg-[color:var(--workspace-accent)]/14" />
              <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
            </div>
          </div>
        );
      }

      return (
        <div className={shellClass}>
          {field.type === '搜索框' ? (
            <Search className="size-4 text-slate-300 dark:text-slate-500" />
          ) : null}
          <div className="min-w-0 flex-1" />
          {trailingIcon && field.type !== '搜索框' ? (
            trailingIcon === 'calendar' ? (
              <CalendarDays className="size-4 text-slate-300 dark:text-slate-500" />
            ) : (
              <ChevronDown className="size-4 text-slate-300 dark:text-slate-500" />
            )
          ) : null}
        </div>
      );
    }

    if (field.type === '多选框') {
      const tags = optionValues.slice(0, 2);
      return (
        <div className={shellClass}>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {tags.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-300 dark:text-slate-600">未配置选项</span>
            )}
          </div>
          <span className="material-symbols-outlined text-[16px] text-slate-300 dark:text-slate-500">expand_more</span>
        </div>
      );
    }

    if (field.type === '单选框') {
      const value = optionValues[0] || previewValue || '';
      return (
        <div className={shellClass}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--workspace-accent)]" />
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-slate-300 dark:text-slate-600">未配置选项</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={shellClass}>
        <div className="min-w-0 flex-1">
          <span className={`truncate ${field.type === '数字' ? 'font-semibold tabular-nums' : ''}`}>{staticValue}</span>
        </div>
        {trailingIcon ? (
          <span className="material-symbols-outlined text-[16px] text-slate-300 dark:text-slate-500">
            {trailingIcon}
          </span>
        ) : null}
      </div>
    );
  }

  if (field.type === '日期框') {
    return (
      <input
        key={previewKey}
        data-preview-control="true"
        type="date"
        defaultValue={previewValue}
        className={compactInputClass}
        onClick={stopPreviewEvent}
        onDoubleClick={stopPreviewEvent}
      />
    );
  }

  if (field.type === '下拉框') {
    return (
      <select
        key={previewKey}
        data-preview-control="true"
        defaultValue={optionValues.includes(previewValue) ? previewValue : optionValues[0] || ''}
        className={compactInputClass}
        onClick={stopPreviewEvent}
        onDoubleClick={stopPreviewEvent}
      >
        {optionValues.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === '搜索框') {
    return (
      <div
        data-preview-control="true"
        className="relative"
        onClick={stopPreviewEvent}
        onDoubleClick={stopPreviewEvent}
      >
        <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-slate-400 ${isFilterMode ? '' : 'z-[1]'}`}>
          search
        </span>
        <input
          key={previewKey}
          defaultValue={previewValue || ''}
          placeholder={field.placeholder || ''}
          className={`${compactInputClass} ${isFilterMode ? 'pl-8 pr-3' : 'pl-8 pr-3'} min-w-0`}
        />
      </div>
    );
  }

  if (field.type === '单选框') {
    return (
      <div
        data-preview-control="true"
        className="flex flex-wrap items-center gap-3"
        onClick={stopPreviewEvent}
        onDoubleClick={stopPreviewEvent}
      >
        {optionValues.length > 0 ? optionValues.map((option) => (
          <label key={option} className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
            <input
              type="radio"
              name={`${field.id}-${mode}`}
              defaultChecked={option === previewValue}
              className="h-3.5 w-3.5 accent-[color:var(--workspace-accent)]"
            />
            <span>{option}</span>
          </label>
        )) : (
          <span className="text-[12px] text-slate-300 dark:text-slate-600">未配置选项</span>
        )}
      </div>
    );
  }

  if (field.type === '多选框') {
    const tags = optionValues.slice(0, 2);
    return (
      <div
        data-preview-control="true"
        className="flex flex-wrap gap-2"
        onClick={stopPreviewEvent}
        onDoubleClick={stopPreviewEvent}
      >
        {optionValues.length > 0 ? optionValues.map((tag, index) => (
          <label key={tag} className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              defaultChecked={index < tags.length}
              className="h-3.5 w-3.5 rounded accent-[#1686e3]"
            />
            <span>{tag}</span>
          </label>
        )) : (
          <span className="text-[12px] text-slate-300 dark:text-slate-600">未配置选项</span>
        )}
      </div>
    );
  }

  if (field.type === '数字') {
    return (
      <input
        key={previewKey}
        data-preview-control="true"
        type="number"
        defaultValue={previewValue}
        className={`${compactInputClass} text-right font-semibold tabular-nums`}
        onClick={stopPreviewEvent}
        onDoubleClick={stopPreviewEvent}
      />
    );
  }

  return (
    <input
      key={previewKey}
      data-preview-control="true"
      type="text"
      defaultValue={previewValue || ''}
      placeholder={field.placeholder || ''}
      className={compactInputClass}
      onClick={stopPreviewEvent}
      onDoubleClick={stopPreviewEvent}
    />
  );
}

export function useWorkbenchFieldPreviewRenderer(
  normalizeField: NormalizePreviewField,
): WorkbenchFieldPreviewRenderer {
  return useCallback((rawField: any, rowIndex: number, mode: WorkbenchFieldPreviewMode = 'table') => (
    renderWorkbenchFieldPreview(rawField, rowIndex, mode, normalizeField)
  ), [normalizeField]);
}

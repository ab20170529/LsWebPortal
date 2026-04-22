import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getShadcnInspectorListBadgeClass,
  getShadcnInspectorListItemClass,
  shadcnFieldClass,
  shadcnInspectorListClass,
  shadcnMutedLabelClass,
  shadcnTextareaClass,
} from '../../../components/ui/shadcn-inspector';

type ColorRule = {
  backcolor?: string;
  backgroundColor?: string;
  condition?: string;
  dbcolor?: string;
  dfcolor?: string;
  disabled?: boolean;
  fontsize?: number;
  forcecolor?: string;
  id: string;
  ifBold?: number | boolean;
  ifItalic?: number | boolean;
  ifStrickOut?: number | boolean;
  ifUnderLine?: number | boolean;
  label?: string;
  note?: string;
  orderid?: number;
  tab?: string;
  textColor?: string;
  useflag?: number;
};

type ColorRuleFieldOption = {
  label: string;
  value: string;
};

type ColorRuleManagerProps = {
  colorRules: ColorRule[];
  enabledColorRuleCount: number;
  fieldOptions: ColorRuleFieldOption[];
  onAddRule: () => void;
  onDeleteRule: (ruleId: string) => void;
  onSelectRule: (ruleId: string) => void;
  onToggleRuleDisabled: (ruleId: string, disabled: boolean) => void;
  onUpdateRule: (ruleId: string, patch: Record<string, any>) => void;
  operatorOptions: string[];
  selectedRule: ColorRule | null;
};

const managerHeaderToolsClass = 'ml-auto flex flex-wrap items-center justify-end gap-2';

function resolveBooleanFlag(value: unknown, fallback = false) {
  if (value === true || value === 1 || value === '1') {
    return true;
  }

  if (value === false || value === 0 || value === '0') {
    return false;
  }

  return fallback;
}

function resolveColorValue(value: string | undefined, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value! : fallback;
}

function ColorRuleEditModal({
  rule,
  onClose,
  onUpdate,
}: {
  onClose: () => void;
  onUpdate: (ruleId: string, patch: Record<string, any>) => void;
  rule: ColorRule;
}) {
  const ruleUseFlag = resolveBooleanFlag(rule.useflag, !(rule.disabled ?? false));
  const ruleForceColor = resolveColorValue(rule.forcecolor || rule.textColor, '#9f1239');
  const ruleBackColor = resolveColorValue(rule.backcolor || rule.backgroundColor, '#ffe4e6');
  const ruleDfColor = rule.dfcolor || ruleForceColor;
  const ruleDbColor = rule.dbcolor || ruleBackColor;
  const ruleFontSize = Math.max(8, Number(rule.fontsize) || 12);

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const styleFlags = [
    { key: 'ifBold' as const, label: 'B', title: '加粗', style: 'font-black' },
    { key: 'ifItalic' as const, label: 'I', title: '倾斜', style: 'italic' },
    { key: 'ifStrickOut' as const, label: 'S', title: '删除线', style: 'line-through' },
    { key: 'ifUnderLine' as const, label: 'U', title: '下划线', style: 'underline' },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-[3px]"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] dark:border-slate-700 dark:bg-slate-900">
        {/* 顶栏：标题 + 关闭 */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-xl border"
              style={{ color: ruleForceColor, backgroundColor: ruleBackColor, borderColor: ruleBackColor }}
            >
              <span className="material-symbols-outlined text-[16px]">palette</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">编辑颜色规则</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">{rule.condition || rule.label || '未命名规则'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 内容区 — 统一滚动 */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto grid w-full grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-6">
              {/* 实时预览 */}
              <div
                className="flex items-center justify-center rounded-xl border-2 px-4 py-5 text-center transition-all"
                style={{
                  color: ruleForceColor,
                  backgroundColor: ruleBackColor,
                  borderColor: `${ruleBackColor}`,
                  fontSize: `${Math.min(ruleFontSize, 20)}px`,
                  fontWeight: resolveBooleanFlag(rule.ifBold) ? 700 : 400,
                  fontStyle: resolveBooleanFlag(rule.ifItalic) ? 'italic' : 'normal',
                  textDecoration: [
                    resolveBooleanFlag(rule.ifUnderLine) ? 'underline' : '',
                    resolveBooleanFlag(rule.ifStrickOut) ? 'line-through' : '',
                  ].filter(Boolean).join(' ') || 'none',
                }}
              >
                预览效果 Preview
              </div>

              {/* 1. 核心配置区 */}
              <section className="flex flex-1 flex-col">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">1</span>
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">核心配置</h4>
                </div>
                <div className="flex flex-1 flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex-1">
                    <label className={shadcnMutedLabelClass}>条件表达式</label>
                    <textarea
                      rows={3}
                      value={rule.condition ?? ''}
                      onChange={(event) => onUpdate(rule.id, {
                        condition: event.target.value,
                        label: event.target.value,
                        note: event.target.value,
                      })}
                      placeholder="如: status = '已完成'"
                      className={`${shadcnTextareaClass} h-full min-h-[80px] text-[12px]`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={shadcnMutedLabelClass}>顺序</label>
                      <input
                        type="number"
                        min={1}
                        value={String(rule.orderid ?? 1)}
                        onChange={(event) => onUpdate(rule.id, { orderid: Math.max(1, Number(event.target.value) || 1) })}
                        className={shadcnFieldClass}
                      />
                    </div>
                    <div>
                      <label className={shadcnMutedLabelClass}>启用状态</label>
                      <div className="flex h-9 items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
                        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{ruleUseFlag ? '已启用' : '已停用'}</span>
                        <button
                          type="button"
                          onClick={() => onUpdate(rule.id, { useflag: ruleUseFlag ? 0 : 1, disabled: ruleUseFlag })}
                          className={`relative h-5 w-9 rounded-full transition-colors ${ruleUseFlag ? 'bg-[color:var(--workspace-accent)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${ruleUseFlag ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              {/* 2. 颜色与样式区 */}
              <section className="flex flex-1 flex-col">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">2</span>
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">颜色与样式</h4>
                </div>
                <div className="flex flex-1 flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  {/* 颜色选择器 — 双列大色块 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={shadcnMutedLabelClass}>字体颜色</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={ruleForceColor}
                          onChange={(event) => onUpdate(rule.id, { forcecolor: event.target.value, textColor: event.target.value })}
                          className="size-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={rule.forcecolor ?? ruleForceColor}
                          onChange={(event) => onUpdate(rule.id, { forcecolor: event.target.value, textColor: event.target.value })}
                          className={`${shadcnFieldClass} flex-1 font-mono text-[11px]`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={shadcnMutedLabelClass}>背景颜色</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={ruleBackColor}
                          onChange={(event) => onUpdate(rule.id, { backcolor: event.target.value, backgroundColor: event.target.value })}
                          className="size-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={rule.backcolor ?? ruleBackColor}
                          onChange={(event) => onUpdate(rule.id, { backcolor: event.target.value, backgroundColor: event.target.value })}
                          className={`${shadcnFieldClass} flex-1 font-mono text-[11px]`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delphi 兼容色 */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200/60 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-400">Delphi 字体色</label>
                      <input
                        type="text"
                        value={ruleDfColor}
                        onChange={(event) => onUpdate(rule.id, { dfcolor: event.target.value })}
                        className={`${shadcnFieldClass} font-mono text-[11px]`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-400">Delphi 背景色</label>
                      <input
                        type="text"
                        value={ruleDbColor}
                        onChange={(event) => onUpdate(rule.id, { dbcolor: event.target.value })}
                        className={`${shadcnFieldClass} font-mono text-[11px]`}
                      />
                    </div>
                  </div>

                  {/* 样式标记 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={shadcnMutedLabelClass}>字号</label>
                      <input
                        type="number"
                        min={8}
                        max={72}
                        value={String(ruleFontSize)}
                        onChange={(event) => onUpdate(rule.id, { fontsize: Math.max(8, Number(event.target.value) || 12) })}
                        className={shadcnFieldClass}
                      />
                    </div>
                    <div>
                      <label className={shadcnMutedLabelClass}>文字样式</label>
                      <div className="flex gap-1.5">
                        {styleFlags.map((flag) => {
                          const active = resolveBooleanFlag(rule[flag.key]);
                          return (
                            <button
                              key={flag.key}
                              type="button"
                              title={flag.title}
                              onClick={() => onUpdate(rule.id, { [flag.key]: active ? 0 : 1 })}
                              className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-[14px] transition-all ${
                                active
                                  ? 'border-[color:var(--workspace-accent)] bg-[color:var(--workspace-accent)] font-bold text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              <span className={flag.style} style={{ textDecorationColor: active ? 'white' : undefined }}>{flag.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* 底栏 */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[color:var(--workspace-accent)] px-6 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            完成
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

export const ColorRuleManager = React.memo(function ColorRuleManager({
  colorRules,
  enabledColorRuleCount,
  onAddRule,
  onDeleteRule,
  onSelectRule,
  onToggleRuleDisabled,
  onUpdateRule,
  selectedRule,
}: ColorRuleManagerProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const editingRule = editingRuleId ? colorRules.find((r) => r.id === editingRuleId) ?? null : null;

  const handleRuleSelect = (ruleId: string) => {
    onSelectRule(ruleId);
  };

  const handleRuleDoubleClick = (ruleId: string) => {
    onSelectRule(ruleId);
    setEditingRuleId(ruleId);
  };

  return (
    <div className="space-y-0">
      <section className="px-3 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] text-[color:var(--workspace-accent-strong)]">
              <span className="material-symbols-outlined text-[16px]">format_paint</span>
            </div>
            <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-100">颜色规则</h4>
          </div>
          <div className={managerHeaderToolsClass}>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-bold text-slate-600 dark:text-slate-200">{enabledColorRuleCount}</span>
              <span>/</span>
              <span>{colorRules.length}</span>
              <span>生效</span>
            </div>
            <button
              type="button"
              onClick={onAddRule}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[color:var(--workspace-accent)] bg-[color:var(--workspace-accent)] px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
              新增
            </button>
          </div>
        </div>

        <div className={shadcnInspectorListClass}>
          {colorRules.length > 0 ? colorRules.map((rule, index) => {
            const enabled = resolveBooleanFlag(rule.useflag, !(rule.disabled ?? false));
            const isSelected = selectedRule?.id === rule.id;
            return (
              <div
                key={rule.id}
                className={getShadcnInspectorListItemClass(isSelected)}
              >
                <button
                  type="button"
                  onClick={() => handleRuleSelect(rule.id)}
                  onDoubleClick={() => handleRuleDoubleClick(rule.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className={`truncate text-[13px] ${isSelected ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium'}`}>
                    {rule.condition || rule.label || `颜色规则 ${index + 1}`}
                  </div>
                  <div className={`mt-0.5 text-[11px] ${isSelected ? 'text-slate-500 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                    规则 {index + 1}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleRuleDisabled(rule.id, !rule.disabled); }}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                      enabled
                        ? isSelected
                          ? getShadcnInspectorListBadgeClass(true)
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                    }`}
                    title={enabled ? '停用' : '启用'}
                  >
                    {enabled ? '已启用' : '已停用'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteRule(rule.id); }}
                    className="text-[11px] font-semibold text-rose-500 transition-colors hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200"
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-xl border border-dashed border-slate-200/80 px-4 py-10 text-center dark:border-slate-700">
              <span className="material-symbols-outlined mb-2 text-[28px] text-slate-300 dark:text-slate-600">palette</span>
              <div className="text-[12px] text-slate-400">还没有颜色规则</div>
              <button
                type="button"
                onClick={onAddRule}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:border-[color:var(--workspace-accent)] hover:text-[color:var(--workspace-accent)] dark:border-slate-700 dark:text-slate-400"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                新增规则
              </button>
            </div>
          )}
        </div>
      </section>

      {editingRule ? (
        <ColorRuleEditModal
          rule={editingRule}
          onClose={() => setEditingRuleId(null)}
          onUpdate={onUpdateRule}
        />
      ) : null}
    </div>
  );
});

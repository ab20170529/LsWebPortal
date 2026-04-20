import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  shadcnInfoCardClass,
  shadcnPanelBadgeClass,
  shadcnPanelHeaderClass,
  shadcnPanelIconShellClass,
  shadcnPanelShellClass,
  shadcnPanelTitleClass,
  shadcnSectionCardClass,
  shadcnSectionTitleClass,
} from '../../../components/ui/shadcn-inspector';

type MenuInfoTabId = 'common' | 'advanced';
type MenuInfoFieldKind = 'text' | 'textarea' | 'number' | 'select' | 'switch';
type MenuInfoValue = string | boolean;

type MenuInfoOption = {
  label: string;
  value: string;
};

type MenuInfoFieldSchema = {
  hint?: string;
  key: string;
  kind: MenuInfoFieldKind;
  label: string;
  options?: MenuInfoOption[];
  placeholder?: string;
  rows?: number;
  span?: 'half' | 'full';
  tableField: string;
};

type MenuInfoSectionSchema = {
  description: string;
  fields: MenuInfoFieldSchema[];
  title: string;
};

type MenuInfoFuncOption = {
  icon: string;
  id: string;
  name: string;
};

type MenuInfoStepProps = {
  activeConfigModuleKey: string;
  advancedFilledMenuFieldCount: number;
  businessType: string;
  commonFilledMenuFieldCount: number;
  commonFuncs: string[];
  currentAdvancedMenuKeys: string[];
  currentAdvancedMenuSections: MenuInfoSectionSchema[];
  currentMenuDraft: Record<string, MenuInfoValue>;
  currentMenuFieldEntriesCount: number;
  currentMenuFieldMap: Map<string, MenuInfoFieldSchema>;
  currentModuleGuideLabel: string;
  currentPinnedMenuKeys: string[];
  currentPinnedMenuKeySet: Set<string>;
  currentCommonMenuSections: MenuInfoSectionSchema[];
  filledMenuFieldCount: number;
  funcOptions: MenuInfoFuncOption[];
  isEditingMenu: boolean;
  isFuncPopoverOpen: boolean;
  isMenuInfoLoading: boolean;
  isMenuInfoSaving: boolean;
  menuConfigTableDesc: string;
  menuConfigTableName: string;
  menuInfoError: string | null;
  menuInfoTab: MenuInfoTabId;
  onBackToTypeSelect: () => void;
  onCloseFuncPopover: () => void;
  onMenuInfoTabChange: (tabId: MenuInfoTabId) => void;
  onToggleFieldPinned: (fieldKey: string, shouldPin: boolean) => void;
  onToggleFunc: (funcId: string) => void;
  onToggleFuncPopover: () => void;
  onUpdateMenuDraft: (fieldKey: string, value: MenuInfoValue) => void;
};

function renderMenuInfoField(
  field: MenuInfoFieldSchema,
  options: {
    currentValue: MenuInfoValue | undefined;
    isDisabled?: boolean;
    isPinned: boolean;
    onTogglePinned: () => void;
    onUpdateValue: (value: MenuInfoValue) => void;
  },
) {
  const value = options.currentValue ?? '';
  const wrapperClass = field.span === 'full' ? 'md:col-span-2' : '';
  const cardClass = 'cloudy-glass-panel-soft rounded-[22px] border border-white/75 p-4 shadow-[0_20px_44px_-32px_rgba(15,23,42,0.28)]';
  const baseInputClass = `w-full rounded-[18px] border border-slate-200/80 bg-slate-50/92 px-3.5 py-2.5 text-[12px] text-slate-700 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#1686e3]/70 focus:bg-white focus:ring-4 focus:ring-[#1686e3]/10 dark:border-slate-700 dark:bg-slate-900/72 dark:text-slate-100 ${
    options.isDisabled ? 'cursor-not-allowed opacity-60' : ''
  }`;
  const pinButtonClass = options.isPinned
    ? 'border-rose-200/80 bg-rose-50/90 text-rose-600 hover:border-rose-300 hover:bg-rose-100/80 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
    : 'border-sky-200/80 bg-sky-50/90 text-sky-700 hover:border-sky-300 hover:bg-sky-100/80 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200';

  return (
    <div key={field.key} className={wrapperClass}>
      <div className={cardClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{field.label}</label>
              <code className="rounded-full border border-slate-200/80 bg-white/85 px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-500">
                {field.tableField}
              </code>
            </div>
            {field.hint && field.kind === 'switch' ? (
              <p className="mt-1 text-[11px] leading-5 text-slate-400">{field.hint}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={options.isDisabled}
            onClick={options.onTogglePinned}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${pinButtonClass} ${
              options.isDisabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {options.isPinned ? 'remove_circle' : 'add_circle'}
            </span>
            {options.isPinned ? '移出常用' : '加入常用'}
          </button>
        </div>

        <div className="mt-3">
          {field.kind === 'textarea' ? (
            <textarea
              disabled={options.isDisabled}
              rows={field.rows ?? 4}
              value={String(value)}
              placeholder={field.placeholder}
              onChange={(event) => options.onUpdateValue(event.target.value)}
              className={`${baseInputClass} min-h-[112px] resize-y font-mono text-[11px] leading-5`}
            />
          ) : field.kind === 'select' ? (
            <div className="relative">
              <select
                disabled={options.isDisabled}
                value={String(value)}
                onChange={(event) => options.onUpdateValue(event.target.value)}
                className={`${baseInputClass} cursor-pointer appearance-none pr-10`}
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                expand_more
              </span>
            </div>
          ) : field.kind === 'switch' ? (
            <label
              className={`flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-white/82 px-4 py-3.5 transition-colors dark:border-slate-700 dark:bg-slate-900/60 ${
                options.isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#1686e3]/30'
              }`}
            >
              <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-100">
                {value === 'true' ? '已开启' : '未开启'}
              </div>
              <span className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${value === 'true' ? 'bg-[#f3afb7]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <input
                  type="checkbox"
                  disabled={options.isDisabled}
                  checked={value === 'true'}
                  onChange={(event) => options.onUpdateValue(event.target.checked ? 'true' : 'false')}
                  className="sr-only"
                />
                <span className={`absolute left-1 size-5 rounded-full bg-white shadow-[0_6px_16px_-8px_rgba(15,23,42,0.45)] transition-transform ${value === 'true' ? 'translate-x-5' : ''}`}></span>
              </span>
            </label>
          ) : (
            <input
              disabled={options.isDisabled}
              type={field.kind === 'number' ? 'number' : 'text'}
              value={String(value)}
              placeholder={field.placeholder}
              onChange={(event) => options.onUpdateValue(event.target.value)}
              className={baseInputClass}
            />
          )}
        </div>

        {field.hint && field.kind !== 'switch' ? (
          <p className="mt-2 text-[11px] leading-5 text-slate-400">{field.hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MenuInfoStep({
  activeConfigModuleKey,
  advancedFilledMenuFieldCount,
  businessType,
  commonFilledMenuFieldCount,
  commonFuncs,
  currentAdvancedMenuKeys,
  currentAdvancedMenuSections,
  currentMenuDraft,
  currentMenuFieldEntriesCount,
  currentMenuFieldMap,
  currentModuleGuideLabel,
  currentPinnedMenuKeys,
  currentPinnedMenuKeySet,
  currentCommonMenuSections,
  filledMenuFieldCount,
  funcOptions,
  isEditingMenu,
  isFuncPopoverOpen,
  isMenuInfoLoading,
  isMenuInfoSaving,
  menuConfigTableDesc,
  menuConfigTableName,
  menuInfoError,
  menuInfoTab,
  onBackToTypeSelect,
  onCloseFuncPopover,
  onMenuInfoTabChange,
  onToggleFieldPinned,
  onToggleFunc,
  onToggleFuncPopover,
  onUpdateMenuDraft,
}: MenuInfoStepProps) {
  const panelHeaderClass = `${shadcnPanelHeaderClass} px-5 py-3.5`;
  const panelIconShellClass = `${shadcnPanelIconShellClass} size-8`;
  const sidePanelShellClass = `${shadcnPanelShellClass} h-auto min-h-fit overflow-visible`;
  const menuTabs: Array<{ icon: string; id: MenuInfoTabId; label: string }> = [
    { id: 'common', label: '常用', icon: 'folder_managed' },
    { id: 'advanced', label: '不常用', icon: 'inventory_2' },
  ];
  const activeSections = menuInfoTab === 'common' ? currentCommonMenuSections : currentAdvancedMenuSections;
  const activeFieldCount = menuInfoTab === 'common' ? currentPinnedMenuKeys.length : currentAdvancedMenuKeys.length;
  const activeFilledCount = menuInfoTab === 'common' ? commonFilledMenuFieldCount : advancedFilledMenuFieldCount;
  const isMenuInfoBusy = isMenuInfoLoading || isMenuInfoSaving;

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={shadcnPanelShellClass}>
        <div className={panelHeaderClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1686e3]/15 bg-[#1686e3]/5 px-3 py-1 text-[11px] font-bold tracking-[0.24em] text-[#1686e3]">
                菜单信息
              </div>
              <div className="space-y-2">
                <h3 className="text-[24px] font-black tracking-tight text-slate-900 dark:text-white">
                  常用字段先配，不常用按需收进目录
                </h3>
              </div>
            </div>

            {isEditingMenu ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                编辑模式已锁定类型
              </div>
            ) : (
              <button
                type="button"
                onClick={onBackToTypeSelect}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold text-slate-500 transition-colors hover:border-[#1686e3]/30 hover:text-[#1686e3] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                返回切换类型
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#1686e3] px-3 py-1 text-[11px] font-bold text-white shadow-[0_12px_24px_-16px_rgba(22,134,227,0.52)]">
              <span className="material-symbols-outlined text-[15px]">
                {businessType === 'table' ? 'receipt_long' : 'table_view'}
              </span>
              {currentModuleGuideLabel}
            </span>
            <span className={shadcnPanelBadgeClass}>配置表 {menuConfigTableName}</span>
            <span className={shadcnPanelBadgeClass}>已填写 {filledMenuFieldCount}/{currentMenuFieldEntriesCount}</span>
            <span className={shadcnPanelBadgeClass}>{menuInfoTab === 'common' ? '常用目录' : '不常用目录'} {activeFilledCount}/{activeFieldCount}</span>
            {activeConfigModuleKey ? <span className={shadcnPanelBadgeClass}>模块标识 {activeConfigModuleKey}</span> : null}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[18px] border border-slate-200/70 bg-white/82 p-1.5 dark:border-slate-700 dark:bg-slate-900/50">
            {menuTabs.map((tab) => {
              const isActive = menuInfoTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onMenuInfoTabChange(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-[12px] font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-800 shadow-[0_14px_28px_-22px_rgba(22,134,227,0.36)] dark:bg-slate-900/92 dark:text-slate-100'
                      : 'text-slate-500 hover:bg-white/80 dark:text-slate-400 dark:hover:bg-slate-900/72'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[16px] ${isActive ? 'text-[#1686e3]' : 'text-slate-400 dark:text-slate-500'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {isMenuInfoLoading ? (
            <div className="mt-3 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3 text-[12px] font-semibold text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
              正在从后端加载菜单信息...
            </div>
          ) : null}

          {menuInfoError ? (
            <div className="mt-3 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-semibold text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {menuInfoError}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {activeSections.length > 0 ? (
            <div className="space-y-4">
              {activeSections.map((section) => (
                <section key={`${menuInfoTab}-${section.title}`} className={shadcnSectionCardClass}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/60 pb-4 dark:border-slate-700/70">
                    <div>
                      <div className={shadcnSectionTitleClass}>
                        <span className="material-symbols-outlined text-[16px] text-[#1686e3]">dashboard_customize</span>
                        <span>{section.title}</span>
                      </div>
                    </div>
                    <span className={shadcnPanelBadgeClass}>{section.fields.length} 项</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map((field) =>
                      renderMenuInfoField(field, {
                        currentValue: currentMenuDraft[field.key],
                        isDisabled: isMenuInfoBusy,
                        isPinned: currentPinnedMenuKeySet.has(field.key),
                        onTogglePinned: () => onToggleFieldPinned(field.key, !currentPinnedMenuKeySet.has(field.key)),
                        onUpdateValue: (value) => onUpdateMenuDraft(field.key, value),
                      }),
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="cloudy-glass-panel-soft max-w-md rounded-[24px] border border-dashed border-slate-300/70 px-6 py-8 text-center dark:border-slate-700">
                <span className="material-symbols-outlined text-[34px] text-[#1686e3]">
                  {menuInfoTab === 'common' ? 'folder_off' : 'done_all'}
                </span>
                <h4 className="mt-4 text-[18px] font-black tracking-tight text-slate-900 dark:text-white">
                  {menuInfoTab === 'common' ? '常用目录还是空的' : '不常用字段已经清空'}
                </h4>
                <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-300">
                  {menuInfoTab === 'common'
                    ? '先去不常用页签把要常看的字段加进来，目录会自动更新。'
                    : '当前字段已经全部收进常用目录，后续可以在常用页签继续精简。'}
                </p>
                {menuInfoTab === 'common' ? (
                  <button
                    type="button"
                    onClick={() => onMenuInfoTabChange('advanced')}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#1686e3]/20 bg-[#1686e3]/8 px-4 py-2 text-[12px] font-bold text-[#1686e3] transition-colors hover:bg-[#1686e3]/12"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_box</span>
                    去不常用添加字段
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className={sidePanelShellClass}>
          <div className={panelHeaderClass}>
            <div className="flex items-start gap-3">
              <div className={panelIconShellClass}>
                <span className="material-symbols-outlined text-[18px] text-[#1686e3]">folder_managed</span>
              </div>
              <div>
                <div className={shadcnPanelTitleClass}>常用目录</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <section className={shadcnSectionCardClass}>
              <div className={shadcnSectionTitleClass}>
                <span className="material-symbols-outlined text-[16px] text-[#1686e3]">list_alt</span>
                <span>当前常用字段</span>
              </div>
              {currentPinnedMenuKeys.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentPinnedMenuKeys.map((key) => {
                    const field = currentMenuFieldMap.get(key);
                    if (!field) {
                      return null;
                    }

                    return (
                      <button
                        key={`pinned-${key}`}
                        type="button"
                        onClick={() => onToggleFieldPinned(key, false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/88 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                      >
                        {field.label}
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-slate-300/70 px-4 py-4 text-[12px] leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  这里会显示你保留的高频字段。
                </div>
              )}
            </section>

            <section className={shadcnSectionCardClass}>
              <div className={shadcnSectionTitleClass}>
                <span className="material-symbols-outlined text-[16px] text-[#1686e3]">insights</span>
                <span>配置概览</span>
              </div>
              <div className="grid gap-3">
                <div className={shadcnInfoCardClass}>
                  <div className="text-[11px] font-bold tracking-[0.06em] text-slate-400">常用字段</div>
                  <div className="mt-2 text-[22px] font-black tracking-tight text-slate-900 dark:text-white">{currentPinnedMenuKeys.length}</div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">已填写 {commonFilledMenuFieldCount}</div>
                </div>
                <div className={shadcnInfoCardClass}>
                  <div className="text-[11px] font-bold tracking-[0.06em] text-slate-400">不常用字段</div>
                  <div className="mt-2 text-[22px] font-black tracking-tight text-slate-900 dark:text-white">{currentAdvancedMenuKeys.length}</div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">已填写 {advancedFilledMenuFieldCount}</div>
                </div>
                <div className={shadcnInfoCardClass}>
                  <div className="text-[11px] font-bold tracking-[0.06em] text-slate-400">配置表</div>
                  <div className="mt-2 break-all text-[13px] font-bold text-slate-800 dark:text-slate-100">{menuConfigTableName}</div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{menuConfigTableDesc}</div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className={sidePanelShellClass}>
          <div className={panelHeaderClass}>
            <div className="flex items-start gap-3">
              <div className={panelIconShellClass}>
                <span className="material-symbols-outlined text-[18px] text-[#1686e3]">tune</span>
              </div>
              <div>
                <div className={shadcnPanelTitleClass}>扩展能力</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <section className={shadcnSectionCardClass}>
              <div className="relative flex flex-wrap gap-3">
                {commonFuncs.map((funcId) => {
                  const func = funcOptions.find((item) => item.id === funcId);
                  if (!func) {
                    return null;
                  }

                  return (
                    <div key={func.id} className="inline-flex items-center gap-2 rounded-[16px] border border-[#1686e3]/18 bg-[#1686e3]/8 px-3.5 py-2 text-[12px] font-bold text-[#1686e3]">
                      <span className="material-symbols-outlined text-[16px]">{func.icon}</span>
                      {func.name}
                      <button type="button" onClick={() => onToggleFunc(func.id)} className="flex items-center justify-center transition-colors hover:text-rose-500">
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    </div>
                  );
                })}
                <div className="relative">
                  <button
                    type="button"
                    onClick={onToggleFuncPopover}
                    className="inline-flex items-center gap-2 rounded-[16px] border border-dashed border-slate-300 px-3.5 py-2 text-[12px] font-bold text-slate-500 transition-all hover:border-[#1686e3]/40 hover:bg-[#1686e3]/6 hover:text-[#1686e3] dark:border-slate-600 dark:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    添加功能
                  </button>
                  <AnimatePresence>
                    {isFuncPopoverOpen ? (
                      <>
                        <div className="fixed inset-0 z-40" onClick={onCloseFuncPopover}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-[18px] border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                        >
                          <div className="mb-2 px-2 pt-1 text-[12px] font-bold text-slate-400">选择扩展功能</div>
                          <div className="space-y-1">
                            {funcOptions.map((func) => {
                              const isSelected = commonFuncs.includes(func.id);

                              return (
                                <button
                                  key={func.id}
                                  type="button"
                                  onClick={() => onToggleFunc(func.id)}
                                  className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-left text-[13px] transition-colors ${
                                    isSelected
                                      ? 'bg-[#1686e3]/10 font-bold text-[#1686e3]'
                                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">{func.icon}</span>
                                    {func.name}
                                  </div>
                                  {isSelected ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

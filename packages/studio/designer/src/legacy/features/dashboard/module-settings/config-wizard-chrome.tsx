import React from 'react';
import { motion } from 'framer-motion';

export type ConfigWizardStepItem = {
  desc: string;
  id: number;
  title: string;
};

type ConfigWizardSidebarProps = {
  closeIcon?: string;
  closeTitle?: string;
  compact?: boolean;
  completedSteps: number[];
  configStep: number;
  flat?: boolean;
  headingTitle?: string;
  isFullscreenConfigActive: boolean;
  isTypeStepLocked: boolean;
  onClose: () => void;
  onLockedTypeStepSelect: () => void;
  onStepSelect: (stepId: number) => void;
  steps: ConfigWizardStepItem[];
};

export function ConfigWizardSidebar({
  closeIcon = 'close',
  closeTitle = '关闭',
  compact = false,
  completedSteps,
  configStep,
  flat = false,
  headingTitle = '配置向导',
  isFullscreenConfigActive,
  isTypeStepLocked,
  onClose,
  onLockedTypeStepSelect,
  onStepSelect,
  steps,
}: ConfigWizardSidebarProps) {
  return (
    <div className={`shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
      flat ? '' : 'shadow-[4px_0_18px_rgba(15,23,42,0.04)]'
    } ${
      isFullscreenConfigActive ? 'w-0 border-r-0 p-0 opacity-0' : compact ? 'w-56 p-3 opacity-100' : 'w-72 p-5 opacity-100'
    }`}>
      <div className={`flex items-center ${compact ? 'mb-4 gap-2.5' : 'mb-6 gap-3'}`}>
        <button
          onClick={onClose}
          title={closeTitle}
          className={`flex items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:text-slate-900 dark:bg-slate-800 dark:hover:text-white ${
            compact ? 'size-8' : 'size-9'
          }`}
        >
          <span className={`material-symbols-outlined ${compact ? 'text-[18px]' : 'text-xl'}`}>{closeIcon}</span>
        </button>
        <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${compact ? 'text-[16px]' : 'text-[18px]'}`}>{headingTitle}</span>
      </div>

      <div className={`relative flex flex-1 flex-col ${compact ? 'gap-4' : 'gap-6'}`}>
        <div className={`absolute w-px rounded-full bg-slate-200 dark:bg-slate-800 ${
          compact ? 'left-[13px] top-3 bottom-3' : 'left-[15px] top-4 bottom-6'
        }`} />

        {steps.map((step) => {
          const isActive = configStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isLocked = isTypeStepLocked && step.id === 1;

          return (
            <div
              key={step.id}
              onClick={() => {
                if (isLocked) {
                  onLockedTypeStepSelect();
                  return;
                }
                onStepSelect(step.id);
              }}
              className={`relative z-10 flex items-start group ${compact ? 'gap-2.5' : 'gap-3'} ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                compact ? 'h-7 w-7' : 'h-8 w-8'
              } ${
                isLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  : isCompleted
                    ? isActive
                      ? 'bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]'
                      : 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
                    : isActive
                      ? 'bg-primary shadow-[0_0_0_6px_rgba(14,116,144,0.12)] dark:shadow-[0_0_0_6px_rgba(14,116,144,0.24)]'
                      : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary/50'
              }`}>
                {isLocked ? (
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                ) : isCompleted ? (
                  <span className="material-symbols-outlined text-white text-[20px] font-bold">check</span>
                ) : isActive ? (
                  <motion.div layoutId="activeNode" className="h-3 w-3 rounded-full bg-white" />
                ) : (
                  <span className="text-[12px] font-bold text-slate-400">{step.id}</span>
                )}
              </div>

              <div className="mt-0 flex flex-col">
                <span className={`${compact ? 'text-[13px]' : 'text-[14px]'} font-semibold transition-colors duration-300 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                  {step.title}
                </span>
                {!compact ? <span className="mt-1 text-[11px] leading-5 text-slate-500">{step.desc}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ConfigWizardFooterProps = {
  canGoBack: boolean;
  isConfigFullscreenActive: boolean;
  nextDisabled: boolean;
  nextLabel: string;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  onToggleFullscreen: () => void;
  saveDisabled: boolean;
  saveLabel: string;
  showFullscreenToggle: boolean;
};

export function ConfigWizardFooter({
  canGoBack,
  isConfigFullscreenActive,
  nextDisabled,
  nextLabel,
  onNext,
  onPrevious,
  onSave,
  onToggleFullscreen,
  saveDisabled,
  saveLabel,
  showFullscreenToggle,
}: ConfigWizardFooterProps) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white/92 px-5 shadow-[0_-6px_18px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/88 lg:px-6">
      <div className="flex h-16 items-center justify-between gap-3">
        <button
          onClick={onPrevious}
          className={`inline-flex items-center gap-1.5 rounded-[11px] border px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
            !canGoBack
              ? 'cursor-not-allowed border-slate-200/80 bg-slate-100/70 text-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-600'
              : 'border-slate-200/80 bg-white/80 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200'
          }`}
          disabled={!canGoBack}
        >
          <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          上一步
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={saveDisabled}
            onClick={onSave}
            className={`inline-flex items-center gap-1.5 rounded-[11px] border border-slate-200/80 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 ${
              saveDisabled
                ? 'cursor-not-allowed opacity-60'
                : 'hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saveLabel}
          </button>

          {showFullscreenToggle ? (
            <button
              onClick={onToggleFullscreen}
              className={`inline-flex items-center gap-1.5 rounded-[11px] border px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                isConfigFullscreenActive
                  ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_16px_36px_rgba(49,98,255,0.18)]'
                  : 'border-slate-200/80 bg-white/80 text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isConfigFullscreenActive ? 'fullscreen_exit' : 'fullscreen'}
              </span>
              {isConfigFullscreenActive ? '退出全屏' : '全屏配置'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={`inline-flex items-center gap-1.5 rounded-[11px] px-4 py-1.5 text-[12px] font-semibold text-white shadow-[0_12px_24px_rgba(49,98,255,0.2)] transition-all ${
              nextDisabled
                ? 'cursor-not-allowed bg-primary/60'
                : 'bg-primary hover:-translate-y-0.5 hover:bg-erp-blue'
            }`}
          >
            {nextLabel}
            {nextLabel !== '完成配置' ? <span className="material-symbols-outlined text-[18px]">arrow_forward</span> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

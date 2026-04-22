import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type FunctionFlowConfirmModalAction = {
  disabled?: boolean;
  icon?: string;
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'danger' | 'primary' | 'secondary';
};

type FunctionFlowConfirmModalProps = {
  actions: FunctionFlowConfirmModalAction[];
  closeOnBackdrop?: boolean;
  description: string;
  detail?: React.ReactNode;
  icon?: string;
  onClose?: () => void;
  open: boolean;
  title: string;
  tone?: 'danger' | 'primary' | 'warning';
};

function resolveToneStyles(tone: FunctionFlowConfirmModalProps['tone']) {
  switch (tone) {
    case 'danger':
      return {
        accentClassName: 'border-rose-200 bg-rose-50 text-rose-500',
        badgeClassName: 'border-rose-200 bg-rose-50 text-rose-500',
      };
    case 'warning':
      return {
        accentClassName: 'border-amber-200 bg-amber-50 text-amber-500',
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-600',
      };
    case 'primary':
    default:
      return {
        accentClassName: 'border-indigo-200 bg-indigo-50 text-indigo-500',
        badgeClassName: 'border-indigo-200 bg-indigo-50 text-indigo-600',
      };
  }
}

function resolveActionClassName(variant: FunctionFlowConfirmModalAction['variant'], disabled: boolean) {
  if (disabled) {
    return 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300';
  }

  switch (variant) {
    case 'danger':
      return 'border-transparent bg-rose-500 text-white shadow-[0_20px_40px_-24px_rgba(244,63,94,0.72)] hover:bg-rose-600';
    case 'primary':
      return 'border-transparent bg-indigo-600 text-white shadow-[0_20px_40px_-24px_rgba(79,70,229,0.52)] hover:bg-indigo-500';
    case 'secondary':
    default:
      return 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900';
  }
}

export function FunctionFlowConfirmModal({
  actions,
  closeOnBackdrop = true,
  description,
  detail,
  icon = 'help',
  onClose,
  open,
  title,
  tone = 'primary',
}: FunctionFlowConfirmModalProps) {
  const toneStyles = resolveToneStyles(tone);
  const canBackdropClose = closeOnBackdrop && actions.every((action) => !action.disabled);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="function-flow-confirm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/28 px-4 backdrop-blur-[6px]"
          onClick={() => {
            if (canBackdropClose) {
              onClose?.();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[480px] rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,251,255,0.96))] p-6 shadow-[0_36px_90px_-42px_rgba(15,23,42,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`flex size-14 shrink-0 items-center justify-center rounded-[18px] border shadow-[0_12px_24px_-20px_rgba(15,23,42,0.22)] ${toneStyles.accentClassName}`}>
                <span className="material-symbols-outlined text-[28px]">{icon}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.18em] ${toneStyles.badgeClassName}`}>
                  {tone === 'danger' ? '危险操作' : tone === 'warning' ? '退出提醒' : '操作确认'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-[22px] font-black tracking-tight text-slate-900">{title}</h3>
                  <p className="text-[13px] leading-6 text-slate-500">{description}</p>
                </div>
              </div>
            </div>

            {detail ? (
              <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                {detail}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`inline-flex min-w-[108px] items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-bold transition-all ${resolveActionClassName(action.variant, action.disabled === true)}`}
                >
                  {action.icon ? (
                    <span className={`material-symbols-outlined text-[18px] ${action.disabled ? 'animate-pulse' : ''}`}>
                      {action.icon}
                    </span>
                  ) : null}
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

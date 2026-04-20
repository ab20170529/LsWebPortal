import React from 'react';

import {
  GRID_OPERATION_DEFINITIONS,
  getGridOperationEnabled,
  type GridOperationActionKey,
} from './grid-operation-config';

type GridOperationConfigBarProps = {
  config: Record<string, any> | null | undefined;
  onSelectAction: (actionKey: GridOperationActionKey) => void;
  selectedActionKey?: GridOperationActionKey | null;
};

export function GridOperationConfigBar({
  config,
  onSelectAction,
  selectedActionKey,
}: GridOperationConfigBarProps) {
  const visibleActions = GRID_OPERATION_DEFINITIONS.filter((action) => action.key !== 'save');

  return (
    <div className="border-t border-[#e6edf5] bg-[#fafcfe] px-4 py-2.5">
      <div className="flex items-center justify-end gap-2">
        {visibleActions.map((action) => {
          const isActive = selectedActionKey === action.key;
          const isEnabled = getGridOperationEnabled(config, action.key);

          return (
            <button
              key={action.key}
              type="button"
              onClick={() => onSelectAction(action.key)}
              className={`relative inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-all ${
                isActive
                  ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-tint)] text-[color:var(--workspace-accent-strong)] ring-1 ring-[color:var(--workspace-accent-border)]'
                  : 'border-[#dbe5ef] bg-white text-slate-600 hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <span className={`inline-block size-[6px] rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              <span className="material-symbols-outlined text-[14px]">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

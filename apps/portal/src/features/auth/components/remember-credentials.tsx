import type { ChangeEvent } from 'react';

type RememberCredentialsProps = {
  checked: boolean;
  disabled?: boolean;
  helperText?: string;
  onChange: () => void;
};

export function RememberCredentials({
  checked,
  disabled = false,
  helperText,
  onChange,
}: RememberCredentialsProps) {
  return (
    <label className="flex items-center justify-between rounded-[20px] border border-slate-200/80 bg-white/70 px-4 py-3.5 text-sm text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex items-center gap-3">
        <input
          checked={checked}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          disabled={disabled}
          onChange={(_event: ChangeEvent<HTMLInputElement>) => {
            onChange();
          }}
          type="checkbox"
        />
        <span className="font-medium text-slate-700">记住账号和密码</span>
      </div>
      {helperText ? (
        <span className="text-[11px] text-slate-400">{helperText}</span>
      ) : null}
    </label>
  );
}

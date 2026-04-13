import type { ChangeEvent } from 'react';

type RememberCredentialsProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
};

export function RememberCredentials({
  checked,
  disabled = false,
  onChange,
}: RememberCredentialsProps) {
  return (
    <label className="theme-surface-subtle flex items-center justify-between rounded-[22px] border border-white/70 px-4 py-3 text-sm">
      <span className="theme-text-strong font-medium">记住账号和密码</span>
      <input
        checked={checked}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        disabled={disabled}
        onChange={(_event: ChangeEvent<HTMLInputElement>) => {
          onChange();
        }}
        type="checkbox"
      />
    </label>
  );
}

import type { ChangeEvent } from 'react';

type PasswordInputProps = {
  disabled?: boolean;
  onChange: (password: string) => void;
  onToggleShow: () => void;
  placeholder?: string;
  showPassword: boolean;
  value: string;
};

export function PasswordInput({
  disabled = false,
  onChange,
  onToggleShow,
  placeholder = '请输入密码',
  showPassword,
  value,
}: PasswordInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        访问密码
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <span className="material-symbols-outlined text-lg">lock</span>
        </div>

        <input
          className="h-12 w-full rounded-xl border border-slate-200/60 bg-white/50 pl-12 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          type={showPassword ? 'text' : 'password'}
          value={value}
        />

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
          disabled={disabled}
          onClick={onToggleShow}
          type="button"
        >
          <span className="material-symbols-outlined text-lg">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );
}

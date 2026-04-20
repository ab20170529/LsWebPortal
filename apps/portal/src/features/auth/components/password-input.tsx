import type { ChangeEvent } from 'react';

type PasswordInputProps = {
  disabled?: boolean;
  onChange: (password: string) => void;
  onToggleShow: () => void;
  placeholder?: string;
  showPassword: boolean;
  value: string;
};

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 10.5V8.25C7.5 5.76472 9.51472 3.75 12 3.75C14.4853 3.75 16.5 5.76472 16.5 8.25V10.5M7.5 10.5H16.5C17.3284 10.5 18 11.1716 18 12V18.75C18 19.5784 17.3284 20.25 16.5 20.25H7.5C6.67157 20.25 6 19.5784 6 18.75V12C6 11.1716 6.67157 10.5 7.5 10.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 3L21 21M10.584 10.587C10.2228 10.9482 10 11.4472 10 12C10 13.1046 10.8954 14 12 14C12.5528 14 13.0518 13.7772 13.413 13.416M9.87868 5.09174C10.5654 4.86578 11.2744 4.75 12 4.75C16.25 4.75 19.6143 8.55808 20.75 12C20.2852 13.4084 19.4822 14.732 18.375 15.8151M14.1213 18.9083C13.4346 19.1342 12.7256 19.25 12 19.25C7.75 19.25 4.38571 15.4419 3.25 12C3.71477 10.5916 4.51778 9.26803 5.625 8.18488"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.75 12C3.88571 8.55808 7.25 4.75 12 4.75C16.75 4.75 20.1143 8.55808 21.25 12C20.1143 15.4419 16.75 19.25 12 19.25C7.25 19.25 3.88571 15.4419 2.75 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M12 14.75C13.5188 14.75 14.75 13.5188 14.75 12C14.75 10.4812 13.5188 9.25 12 9.25C10.4812 9.25 9.25 10.4812 9.25 12C9.25 13.5188 10.4812 14.75 12 14.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

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
      <label className="ml-1 text-[11px] font-semibold text-slate-400">
        访问密码
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <LockIcon />
        </div>

        <input
          className="h-[50px] w-full rounded-2xl border border-slate-200/85 bg-white/80 pl-12 pr-12 text-sm font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-100/80"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          type={showPassword ? 'text' : 'password'}
          value={value}
        />

        <button
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-white/55 text-slate-400 transition-colors hover:bg-white/80 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={onToggleShow}
          type="button"
        >
          <EyeIcon visible={showPassword} />
        </button>
      </div>
    </div>
  );
}

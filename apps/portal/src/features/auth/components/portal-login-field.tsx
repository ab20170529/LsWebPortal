import type { PropsWithChildren } from 'react';

type PortalLoginFieldProps = PropsWithChildren<{
  helperText?: string;
  label: string;
}>;

export function PortalLoginField({
  children,
  helperText,
  label,
}: PortalLoginFieldProps) {
  return (
    <label className="portal-auth-field">
      <span className="portal-auth-field__label">{label}</span>
      {children}
      {helperText ? (
        <span className="theme-text-muted text-xs leading-6">{helperText}</span>
      ) : null}
    </label>
  );
}

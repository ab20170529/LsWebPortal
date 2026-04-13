import type { CSSProperties, PropsWithChildren } from 'react';

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

type BadgeTone = 'brand' | 'danger' | 'neutral' | 'success';

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
}>;

export function Badge({ children, tone = 'brand' }: BadgeProps) {
  const toneClassName =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'danger'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : '';

  const toneStyle: CSSProperties =
    tone === 'neutral'
      ? {
          borderColor: 'color-mix(in srgb, var(--portal-color-border-strong) 82%, white)',
          backgroundColor:
            'color-mix(in srgb, var(--portal-color-surface-muted) 88%, white)',
          color: 'var(--portal-color-text-secondary)',
        }
      : tone === 'brand'
        ? {
            borderColor:
              'color-mix(in srgb, var(--portal-color-brand-500) 28%, white)',
            backgroundColor:
              'color-mix(in srgb, var(--portal-color-brand-500) 10%, white)',
            color: 'var(--portal-color-brand-700)',
          }
        : {};

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
        toneClassName,
      )}
      style={toneStyle}
    >
      {children}
    </span>
  );
}

type CardProps = PropsWithChildren<{
  className?: string;
  [key: string]: unknown;
}>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cx('backdrop-blur-xl', className)}
      style={{
        border: '1px solid color-mix(in srgb, var(--portal-color-border-soft) 72%, white)',
        background:
          'color-mix(in srgb, var(--portal-color-surface-panel) 74%, transparent)',
        boxShadow: '0 28px 70px -42px rgba(15, 23, 42, 0.32)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

type ButtonTone = 'ghost' | 'neutral' | 'primary';

type ButtonProps = PropsWithChildren<{
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  tone?: ButtonTone;
  type?: 'button' | 'reset' | 'submit';
}>;

export function Button({
  children,
  className,
  tone = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  const toneStyle: CSSProperties =
    tone === 'neutral'
      ? {
          backgroundColor: 'var(--portal-color-text-primary)',
          color: '#ffffff',
        }
      : tone === 'ghost'
        ? {
            backgroundColor: 'transparent',
            color: 'var(--portal-color-text-secondary)',
          }
        : {
            backgroundColor: 'var(--portal-color-brand-500)',
            color: '#ffffff',
          };

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      style={toneStyle}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

type AppLogoProps = {
  subtitle: string;
  title: string;
};

export function AppLogo({ subtitle, title }: AppLogoProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[20px] text-lg font-black text-white shadow-[0_18px_34px_-22px_rgba(24,119,242,0.6)]"
        style={{
          background:
            'linear-gradient(135deg, var(--portal-color-brand-500), var(--portal-color-brand-700))',
        }}
      >
        LS
      </div>
      <div>
        <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
          {subtitle}
        </div>
        <div className="theme-text-strong mt-1 text-2xl font-black tracking-tight">
          {title}
        </div>
      </div>
    </div>
  );
}

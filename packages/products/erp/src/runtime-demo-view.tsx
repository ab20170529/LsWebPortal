import type { ChangeEvent, ReactNode } from 'react';
import type { PlatformDatasourceOption } from '@lserp/contracts';
import type { PlatformViewRegistry } from '@lserp/renderer-react';
import type { RuntimePageStore } from '@lserp/runtime-store';
import { Badge, Button, Card, cx } from '@lserp/ui';

type DemoViewRegistryOptions = {
  actions: Record<string, () => void>;
  actionPermissions: Record<string, { disabled: boolean; visible: boolean }>;
  fieldOptions: Record<string, PlatformDatasourceOption[]>;
  fieldPermissions: Record<string, { disabled: boolean; visible: boolean }>;
  store: RuntimePageStore;
  validationErrors: Record<string, string[]>;
  values: Record<string, unknown>;
};

export function createErpDemoViewRegistry({
  actions,
  actionPermissions,
  fieldOptions,
  fieldPermissions,
  store,
  validationErrors,
  values,
}: DemoViewRegistryOptions): PlatformViewRegistry {
  return {
    action: ({ node }) => {
      const actionId = node.actionRefs?.[0]?.actionId;
      const tone = (node.props?.tone as 'ghost' | 'neutral' | 'primary' | undefined) ?? 'primary';
      const permission = actionId
        ? actionPermissions[actionId] ?? { disabled: false, visible: true }
        : { disabled: false, visible: true };

      if (!permission.visible) {
        return null;
      }

      return (
        <Button
          disabled={permission.disabled}
          onClick={() => {
            if (!permission.disabled && actionId) {
              actions[actionId]?.();
            }
          }}
          tone={tone}
        >
          {String(node.props?.label ?? 'Action')}
        </Button>
      );
    },
    field: ({ node }) => {
      const field = String(node.props?.field ?? '');
      const label = String(node.props?.label ?? field);
      const rawValue = values[field];
      const value = rawValue == null ? '' : String(rawValue);
      const errors = validationErrors[field] ?? [];
      const control = String(node.props?.control ?? 'input');
      const options = fieldOptions[field] ?? [];
      const permission = fieldPermissions[field] ?? {
        disabled: false,
        visible: true,
      };

      if (!permission.visible) {
        return null;
      }

      return (
        <label className="theme-surface-subtle block rounded-[24px] p-5">
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
            {label}
          </div>
          {control === 'select' ? (
            <select
              className="theme-input mt-4 h-12 w-full rounded-2xl px-4"
              disabled={permission.disabled}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                store.setFieldValue(field, event.target.value);
              }}
              value={value}
            >
              {options.map((option) => (
                <option
                  key={`${field}-${option.value}`}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="theme-input mt-4 h-12 w-full rounded-2xl px-4"
              disabled={permission.disabled}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const nextValue =
                  field === 'amount'
                    ? Number(event.target.value || 0)
                    : event.target.value;

                store.setFieldValue(field, nextValue);
              }}
              placeholder={String(node.props?.placeholder ?? '')}
              value={value}
            />
          )}
          {errors.length > 0 ? (
            <div className="mt-3 space-y-2">
              {errors.map((error) => (
                <div
                  key={`${field}-${error}`}
                  className="rounded-2xl border border-rose-100 bg-rose-50/80 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </div>
              ))}
            </div>
          ) : null}
          {control === 'select' && options.length > 0 ? (
            <div className="theme-text-soft mt-3 text-xs">
              {options.length} option(s) available from runtime datasource.
            </div>
          ) : null}
          {permission.disabled ? (
            <div className="theme-text-soft mt-2 text-xs">
              Editing is disabled by runtime permission.
            </div>
          ) : null}
        </label>
      );
    },
    page: ({ children }) => <div className="space-y-6">{children}</div>,
    section: ({ children, node }) => {
      const component = String(node.component);
      const title = node.props?.title ? String(node.props.title) : null;
      const slotChildren = renderSlotChildren(node.slots?.default);

      if (component === 'hero') {
        return (
          <Card className="rounded-[36px] p-8 lg:p-10">
            <Badge tone="success">{String(node.props?.eyebrow ?? 'Section')}</Badge>
            <h2 className="theme-text-strong mt-4 text-4xl font-black tracking-tight">
              {String(node.props?.title ?? 'Untitled')}
            </h2>
            <div className="theme-text-muted mt-4 space-y-3 text-sm leading-8">
              {slotChildren}
            </div>
          </Card>
        );
      }

      if (component === 'field-grid') {
        return (
          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              {title}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">{children}</div>
          </Card>
        );
      }

      if (component === 'summary-panel') {
        return (
          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              {title}
            </div>
            <div className="mt-4 rounded-[24px] border border-amber-100 bg-amber-50/70 p-5 text-sm leading-7 text-amber-900">
              {children}
            </div>
          </Card>
        );
      }

      if (component === 'action-row') {
        return <div className="flex flex-wrap items-center gap-3">{children}</div>;
      }

      return <div className="space-y-4">{children}</div>;
    },
    text: ({ node }) => {
      const template = String(node.props?.template ?? '');

      return (
        <p
          className={cx(
            'theme-text-muted text-sm leading-7',
            Number(values.amount ?? 0) > 10000 ? 'font-semibold' : '',
          )}
        >
          {interpolateTemplate(template, values)}
        </p>
      );
    },
  };
}

function interpolateTemplate(
  template: string,
  values: Record<string, unknown>,
) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, token: string) => {
    const value = values[token];
    return value == null || value === '' ? '--' : String(value);
  });
}

function renderSlotChildren(
  nodes?: Array<{ id: string; props?: Record<string, unknown> }>,
): ReactNode {
  return nodes?.map((node) => (
    <p
      key={node.id}
      className="theme-text-muted text-sm leading-7"
    >
      {String(node.props?.template ?? '')}
    </p>
  ));
}

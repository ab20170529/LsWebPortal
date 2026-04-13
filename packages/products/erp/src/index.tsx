import { startTransition, useEffect, useMemo, useState } from 'react';
import { PlatformTemplateRenderer } from '@lserp/renderer-react';
import { createRuntimeActionEngine } from '@lserp/runtime-actions';
import { createRuntimeDatasourceEngine } from '@lserp/runtime-datasource';
import { createRuntimePermissionEngine } from '@lserp/runtime-permission';
import {
  createRuntimePageStore,
  useRuntimePageSnapshot,
} from '@lserp/runtime-store';
import { Badge, Card } from '@lserp/ui';

import { erpBillDraftSchema } from './runtime-demo-schema';
import { createErpDemoViewRegistry } from './runtime-demo-view';

const erpTracks = [
  'Runtime owns values and field state',
  'View schema stays separate from business logic',
  'Theme tokens change the look without rewriting runtime',
  'Later Designer can edit the same contracts',
];

export function ErpHomePage() {
  const [fieldOptions, setFieldOptions] = useState<Record<string, Array<{ label: string; value: string }>>>({});
  const [message, setMessage] = useState('Waiting for runtime interaction.');
  const [permissionFlags, setPermissionFlags] = useState({
    canEditAmount: true,
    canSubmit: true,
    canViewApproval: true,
  });
  const store = useMemo(() => createRuntimePageStore(erpBillDraftSchema), []);
  const snapshot = useRuntimePageSnapshot(store);
  const actionEngine = useMemo(
    () =>
      createRuntimeActionEngine({
        schema: erpBillDraftSchema,
        store,
      }),
    [store],
  );
  const datasourceEngine = useMemo(
    () =>
      createRuntimeDatasourceEngine({
        schema: erpBillDraftSchema,
      }),
    [],
  );
  const permissionEngine = useMemo(
    () =>
      createRuntimePermissionEngine({
        schema: erpBillDraftSchema,
      }),
    [],
  );
  const permissionBindings = useMemo(
    () => ({
      ...snapshot.values,
      permissions: permissionFlags,
    }),
    [permissionFlags, snapshot.values],
  );
  const fieldPermissions = useMemo(
    () => permissionEngine.resolveAllFieldPermissions(permissionBindings),
    [permissionBindings, permissionEngine],
  );
  const actionPermissions = useMemo(
    () => permissionEngine.resolveAllActionPermissions(permissionBindings),
    [permissionBindings, permissionEngine],
  );

  useEffect(() => {
    let cancelled = false;

    void datasourceEngine.loadAllFieldOptions(permissionBindings).then((nextOptions) => {
      if (cancelled) {
        return;
      }

      startTransition(() => {
        setFieldOptions(nextOptions);
      });

      const approvalOptions = nextOptions.approvalMode ?? [];
      const currentApprovalMode = String(snapshot.values.approvalMode ?? '');

      if (
        approvalOptions.length > 0 &&
        !approvalOptions.some((option) => option.value === currentApprovalMode)
      ) {
        store.setFieldValue('approvalMode', approvalOptions[0]?.value ?? '');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [datasourceEngine, permissionBindings, snapshot.values, store]);

  const actions = useMemo(
    () =>
      Object.fromEntries(
        actionEngine.listActions().map((action) => [
          action.id,
          () => {
            const permission = actionPermissions[action.id];

            if (permission && permission.disabled) {
              setMessage(`Action "${action.id}" is blocked by runtime permission.`);
              return;
            }

            const result = actionEngine.dispatch(action.id);
            setMessage(result.message);
          },
        ]),
      ) as Record<string, () => void>,
    [actionEngine, actionPermissions],
  );

  const registry = useMemo(
    () =>
      createErpDemoViewRegistry({
        actions,
        actionPermissions,
        fieldOptions,
        fieldPermissions,
        store,
        validationErrors: snapshot.validationErrors,
        values: snapshot.values,
      }),
    [
      actionPermissions,
      actions,
      fieldOptions,
      fieldPermissions,
      snapshot.validationErrors,
      snapshot.values,
      store,
    ],
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[36px] p-8 lg:p-10">
        <Badge tone="success">ERP Runtime</Badge>
        <h2 className="theme-text-strong mt-4 text-4xl font-black tracking-tight">
          ERP now has a real schema-driven runtime demo.
        </h2>
        <p className="theme-text-muted mt-4 max-w-3xl text-sm leading-8">
          This page is no longer static copy. The view is rendered from a schema,
          the values live in an external runtime store, and the product page only
          composes the pieces together.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PlatformTemplateRenderer
          context={{
            actionPermissions,
            actions,
            bindings: permissionBindings,
            fieldPermissions,
            validationErrors: snapshot.validationErrors,
          }}
          registry={registry}
          viewModel={erpBillDraftSchema.view}
        />

        <div className="space-y-6">
          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              Permission Toggles
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="theme-surface-subtle rounded-full px-4 py-2 text-sm"
                onClick={() => {
                  setPermissionFlags((current) => ({
                    ...current,
                    canEditAmount: !current.canEditAmount,
                  }));
                }}
                type="button"
              >
                Edit Amount: {permissionFlags.canEditAmount ? 'On' : 'Off'}
              </button>
              <button
                className="theme-surface-subtle rounded-full px-4 py-2 text-sm"
                onClick={() => {
                  setPermissionFlags((current) => ({
                    ...current,
                    canViewApproval: !current.canViewApproval,
                  }));
                }}
                type="button"
              >
                View Approval: {permissionFlags.canViewApproval ? 'On' : 'Off'}
              </button>
              <button
                className="theme-surface-subtle rounded-full px-4 py-2 text-sm"
                onClick={() => {
                  setPermissionFlags((current) => ({
                    ...current,
                    canSubmit: !current.canSubmit,
                  }));
                }}
                type="button"
              >
                Submit Action: {permissionFlags.canSubmit ? 'On' : 'Off'}
              </button>
            </div>
          </Card>

          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              Runtime State
            </div>
            <div className="mt-5 space-y-3">
              {snapshot.fieldOrder.map((field) => (
                <div
                  key={field}
                  className="theme-surface-subtle rounded-[24px] p-4"
                >
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                    {field}
                  </div>
                  <div className="theme-text-strong mt-2 text-base font-semibold">
                    {String(snapshot.values[field] ?? '--')}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              Datasource Signals
            </div>
            <div className="mt-5 space-y-3">
              {Object.entries(fieldOptions).map(([field, options]) => (
                <div
                  key={field}
                  className="theme-surface-subtle rounded-[24px] p-4"
                >
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                    {field}
                  </div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">
                    {options.map((option) => option.label).join(', ') || '--'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              Permission Signals
            </div>
            <div className="mt-5 space-y-3">
              {Object.entries(fieldPermissions).map(([field, permission]) => (
                <div
                  key={field}
                  className="theme-surface-subtle rounded-[24px] p-4"
                >
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                    {field}
                  </div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">
                    visible: {String(permission.visible)}, disabled: {String(permission.disabled)}
                  </div>
                </div>
              ))}
              {Object.entries(actionPermissions).map(([actionId, permission]) => (
                <div
                  key={actionId}
                  className="theme-surface-subtle rounded-[24px] p-4"
                >
                  <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.2em]">
                    action:{actionId}
                  </div>
                  <div className="theme-text-strong mt-2 text-sm font-semibold">
                    visible: {String(permission.visible)}, disabled: {String(permission.disabled)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              Rule Signals
            </div>
            <div className="mt-5 space-y-3">
              {snapshot.activeBehaviorEffects.length > 0 ? (
                snapshot.activeBehaviorEffects.map((effect) => (
                  <div
                    key={effect}
                    className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800"
                  >
                    Active effect: {effect}
                  </div>
                ))
              ) : (
                <div className="theme-surface-subtle rounded-[24px] p-4 text-sm">
                  No behavior rules are currently active.
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-[32px] p-8">
            <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
              Architecture Signals
            </div>
            <div className="mt-5 space-y-4">
              {erpTracks.map((track) => (
                <div
                  key={track}
                  className="theme-surface-subtle rounded-[24px] p-5"
                >
                  <div className="theme-text-strong text-sm font-black tracking-tight">
                    {track}
                  </div>
                </div>
              ))}
            </div>
            <div className="theme-text-muted mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-7 text-emerald-900">
              {message}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

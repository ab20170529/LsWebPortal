import React from 'react';
import { shadcnTextareaClass } from '../../../components/ui/shadcn-inspector';
import type { LayoutFieldWorkbenchMetaResolver } from './layout-field-workbench-meta';

type ArchiveLayoutFieldShellProps = {
  getLayoutFieldWorkbenchMeta: LayoutFieldWorkbenchMetaResolver;
  height?: number | null;
  rawField: any;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
  rowIndex: number;
  width?: number | null;
};

function getArchiveLayoutControlLabelWidth(field: any, isTallControl: boolean) {
  if (isTallControl) return 84;
  return Math.max(50, Math.min(78, String(field.name ?? '').length * 11));
}

export const ArchiveLayoutFieldShell = React.memo(function ArchiveLayoutFieldShell({
  getLayoutFieldWorkbenchMeta,
  height,
  rawField,
  renderFieldPreview,
  rowIndex,
  width,
}: ArchiveLayoutFieldShellProps) {
  const layoutMeta = getLayoutFieldWorkbenchMeta(rawField, width, height);
  const labelWidth = getArchiveLayoutControlLabelWidth(layoutMeta.field, layoutMeta.isTallControl);
  const shellClass = layoutMeta.isTallControl
    ? 'flex h-full w-full flex-col justify-center gap-1.5'
    : 'flex h-full w-full items-center gap-2';

  return (
    <div
      className="flex h-full w-full items-center"
      style={layoutMeta.isTallControl ? { minHeight: layoutMeta.height } : undefined}
    >
      <div className={shellClass}>
        {layoutMeta.isTallControl ? (
          <>
            <div
              className={`text-[10px] font-medium ${
                layoutMeta.field.required
                  ? 'text-[color:var(--workspace-accent-strong)]'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
              style={{ width: labelWidth }}
              title={layoutMeta.field.name}
            >
              <span className="block truncate">{layoutMeta.field.name}</span>
            </div>
            <div className="min-h-0 flex-1">
              <textarea
                readOnly
                rows={layoutMeta.previewRows}
                value={String(
                  layoutMeta.field.defaultValue
                  || layoutMeta.field.placeholder
                  || '',
                )}
                className={`${shadcnTextareaClass} min-h-0 pointer-events-none resize-none bg-white text-[11px] text-slate-600 shadow-none dark:bg-slate-950 dark:text-slate-200`}
                style={{ minHeight: Math.max(70, layoutMeta.height - 28) }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className={`shrink-0 text-left text-[10px] font-medium ${
                layoutMeta.field.required
                  ? 'text-[color:var(--workspace-accent-strong)]'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
              style={{ width: labelWidth }}
              title={layoutMeta.field.name}
            >
              <span className="block truncate">{layoutMeta.field.name}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="pointer-events-none">
                {renderFieldPreview(layoutMeta.field, rowIndex, 'filter')}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

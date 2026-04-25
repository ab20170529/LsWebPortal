import type { ReactNode } from 'react';

type BiWorkspaceShellProps = {
  canvas: ReactNode;
  contextCollapsed?: boolean;
  contextPanel: ReactNode;
  onToggleContext?: () => void;
  sidebar: ReactNode;
  toolbar: ReactNode;
};

export function BiWorkspaceShell({
  canvas,
  contextCollapsed = false,
  contextPanel,
  onToggleContext,
  sidebar,
  toolbar,
}: BiWorkspaceShellProps) {
  return (
    <div className={contextCollapsed ? 'bi-workspace-shell is-context-collapsed' : 'bi-workspace-shell'}>
      {sidebar}
      <div className="bi-workspace-main">
        {toolbar}
        {canvas}
      </div>
      <div className="bi-context-panel-wrap">
        {contextPanel}
        {onToggleContext ? (
          <button className="bi-context-toggle" onClick={onToggleContext} type="button">
            {contextCollapsed ? '展开' : '收起'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

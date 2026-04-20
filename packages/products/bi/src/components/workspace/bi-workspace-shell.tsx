import type { ReactNode } from 'react';

type BiWorkspaceShellProps = {
  canvas: ReactNode;
  contextPanel: ReactNode;
  sidebar: ReactNode;
  toolbar: ReactNode;
};

export function BiWorkspaceShell({
  canvas,
  contextPanel,
  sidebar,
  toolbar,
}: BiWorkspaceShellProps) {
  return (
    <div className="bi-workspace-shell">
      {sidebar}
      <div className="bi-workspace-main">
        {toolbar}
        {canvas}
      </div>
      {contextPanel}
    </div>
  );
}

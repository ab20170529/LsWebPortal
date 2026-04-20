import React from 'react';

import { DashboardWorkspaceHeader } from './dashboard-workspace-header';
import { DashboardWorkspaceSidebar } from './dashboard-workspace-sidebar';

export function DashboardServerPermissionScreen({
  configModalNode,
  contentNode,
  deleteConfirmNode,
  headerProps,
  sidebarProps,
}: {
  configModalNode: React.ReactNode;
  contentNode: React.ReactNode;
  deleteConfirmNode: React.ReactNode;
  headerProps: React.ComponentProps<typeof DashboardWorkspaceHeader>;
  sidebarProps: React.ComponentProps<typeof DashboardWorkspaceSidebar>;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100 font-sans">
      <DashboardWorkspaceSidebar {...sidebarProps} />

      <main className="flex flex-1 flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <DashboardWorkspaceHeader {...headerProps} />

        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
          {contentNode}
        </div>
      </main>

      {deleteConfirmNode}
      {configModalNode}
    </div>
  );
}

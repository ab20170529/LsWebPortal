import React from 'react';

import { DashboardOverview } from './dashboard-overview';
import { DashboardOverviewPane } from './dashboard-overview-pane';
import { DashboardWorkspaceHeader } from './dashboard-workspace-header';
import { DashboardWorkspaceSidebar } from './dashboard-workspace-sidebar';

export function DashboardModuleScreen({
  configModalNode,
  contentKey,
  deleteConfirmNode,
  headerProps,
  overviewProps,
  sidebarProps,
}: {
  configModalNode: React.ReactNode;
  contentKey: string;
  deleteConfirmNode: React.ReactNode;
  headerProps: React.ComponentProps<typeof DashboardWorkspaceHeader>;
  overviewProps: React.ComponentProps<typeof DashboardOverview>;
  sidebarProps: React.ComponentProps<typeof DashboardWorkspaceSidebar>;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">
      <DashboardWorkspaceSidebar {...sidebarProps} />

      <main className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <DashboardWorkspaceHeader {...headerProps} />

        <div className="flex-1 overflow-y-auto p-8 lg:p-10 relative">
          <DashboardOverviewPane contentKey={contentKey} overviewProps={overviewProps} />
        </div>
      </main>

      {deleteConfirmNode}
      {configModalNode}
    </div>
  );
}

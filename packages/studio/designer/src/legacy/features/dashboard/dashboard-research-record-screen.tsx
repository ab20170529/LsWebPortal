import React from 'react';

export function DashboardResearchRecordScreen({
  configModalNode,
  contentNode,
  deleteConfirmNode,
}: {
  configModalNode: React.ReactNode;
  contentNode: React.ReactNode;
  deleteConfirmNode: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 dark:bg-background-dark dark:text-slate-100 font-sans">
      <main className="h-full w-full">
        {contentNode}
      </main>

      {deleteConfirmNode}
      {configModalNode}
    </div>
  );
}

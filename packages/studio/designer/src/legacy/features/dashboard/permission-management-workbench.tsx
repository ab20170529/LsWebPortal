import { useState } from 'react';

import { RolePermissionWorkbench } from './role-permission-workbench';
import { ServerPermissionWorkbench } from './server-permission-workbench';

type PermissionTab = 'server' | 'role';

export function PermissionManagementWorkbench({
  currentUserName,
}: {
  currentUserName: string;
}) {
  const [activeTab, setActiveTab] = useState<PermissionTab>('server');

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-700">Permission Center</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Permission Center</h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              {currentUserName} is maintaining permissions. Server access controls which account sets a user can open,
              while role and menu permissions control which menus appear inside the current account set.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('server')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'server'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Server Access
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('role')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'role'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Roles and Menus
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'server' ? (
        <ServerPermissionWorkbench currentUserName={currentUserName} />
      ) : (
        <RolePermissionWorkbench currentUserName={currentUserName} />
      )}
    </section>
  );
}

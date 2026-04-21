import { cx } from '@lserp/ui';

import type { BiWorkspaceSection } from '../../utils/bi-workspace-view-state';
import { BoxIcon, FolderIcon, SettingsIcon, ShareIcon } from './bi-icons';

type BiSidebarNavProps = {
  activeSection: BiWorkspaceSection;
  onChange: (section: BiWorkspaceSection) => void;
};

const ITEMS: Array<{
  icon: typeof FolderIcon;
  id: BiWorkspaceSection;
  label: string;
}> = [
  { icon: FolderIcon, id: 'canvas', label: '目录画布' },
  { icon: BoxIcon, id: 'sources', label: '分析源管理' },
  { icon: ShareIcon, id: 'archives', label: 'BI档案管理' },
];

export function BiSidebarNav({ activeSection, onChange }: BiSidebarNavProps) {
  return (
    <aside className="bi-sidebar-nav" aria-label="BI 工作台导航">
      <div className="bi-sidebar-nav-group">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeSection;
          return (
            <button
              key={item.id}
              className={cx('bi-sidebar-nav-item', active ? 'is-active' : '')}
              onClick={() => onChange(item.id)}
              title={item.label}
              type="button"
            >
              <Icon className="bi-sidebar-nav-icon" />
              <span className="bi-sidebar-nav-tooltip">{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        className={cx('bi-sidebar-nav-item', activeSection === 'settings' ? 'is-active' : '')}
        onClick={() => onChange('settings')}
        title="工作台设置"
        type="button"
      >
        <SettingsIcon className="bi-sidebar-nav-icon" />
        <span className="bi-sidebar-nav-tooltip">工作台设置</span>
      </button>
    </aside>
  );
}

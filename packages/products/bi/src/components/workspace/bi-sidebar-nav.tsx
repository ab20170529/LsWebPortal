import { cx } from '@lserp/ui';

import { BotIcon, BoxIcon, FolderIcon, SettingsIcon } from './bi-icons';

export type BiWorkspaceSection = 'ai' | 'assets' | 'canvas' | 'settings';

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
  { icon: BoxIcon, id: 'assets', label: '数据资产' },
  { icon: BotIcon, id: 'ai', label: 'AI 提示词' },
];

export function BiSidebarNav({ activeSection, onChange }: BiSidebarNavProps) {
  return (
    <aside className="bi-sidebar-nav" aria-label="BI design navigation">
      <div className="bi-sidebar-nav-group">
        {ITEMS.map((item) => {
          const active = item.id === activeSection;
          const Icon = item.icon;
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

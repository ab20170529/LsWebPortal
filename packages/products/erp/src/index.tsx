import { useEffect, type ReactNode } from 'react';

import './erp-workbench.css';

type IconName =
  | 'alert'
  | 'alertCircle'
  | 'archive'
  | 'bell'
  | 'briefcase'
  | 'chart'
  | 'clipboard'
  | 'cube'
  | 'dashboard'
  | 'document'
  | 'download'
  | 'folder'
  | 'inbox'
  | 'inventory'
  | 'menu'
  | 'message'
  | 'monitor'
  | 'pie'
  | 'plusBox'
  | 'search'
  | 'server'
  | 'stamp'
  | 'trend'
  | 'warehouse';

type MenuItem = {
  icon: IconName;
  label: string;
};

type MetricCard = {
  accent: 'blue' | 'green' | 'red' | 'purple';
  icon: IconName;
  label: string;
  title: string;
  value: string;
};

type TaskRow = {
  code: string;
  description: string;
  module: string;
  moduleTone: 'blue' | 'green' | 'purple';
  priority: 'blue' | 'orange' | 'red';
  submittedAt: string;
};

type QuickAction = {
  icon: IconName;
  label: string;
  tone: 'blue' | 'green' | 'orange' | 'purple';
};

const sidebarItems: MenuItem[] = [
  { icon: 'dashboard', label: '待办首页' },
  { icon: 'warehouse', label: '我的工作台' },
  { icon: 'inbox', label: '入库管理' },
  { icon: 'cube', label: '出库管理' },
  { icon: 'clipboard', label: '库存盘点' },
  { icon: 'alert', label: '库存预警' },
  { icon: 'chart', label: '库存报表' },
];

const metrics: MetricCard[] = [
  {
    accent: 'blue',
    icon: 'document',
    label: '待处理审批单据',
    title: '待我审批',
    value: '12',
  },
  {
    accent: 'green',
    icon: 'cube',
    label: '待完成入库任务',
    title: '今日入库任务',
    value: '24',
  },
  {
    accent: 'red',
    icon: 'alert',
    label: '需关注预警',
    title: '系统预警',
    value: '3',
  },
  {
    accent: 'purple',
    icon: 'trend',
    label: '进行中项目数',
    title: '活跃项目',
    value: '8',
  },
];

const taskRows: TaskRow[] = [
  {
    code: 'PO-20231012',
    description: '采购单 PO-20231012-001 等待审批',
    module: '采购管理',
    moduleTone: 'blue',
    priority: 'red',
    submittedAt: '10 分钟前',
  },
  {
    code: 'AL-8821',
    description: '组装A线设备温度过高预警',
    module: '设备档案',
    moduleTone: 'green',
    priority: 'red',
    submittedAt: '1 小时前',
  },
  {
    code: 'RP-0912',
    description: '提交Q3市场部销售预测报告',
    module: '市场运维',
    moduleTone: 'purple',
    priority: 'orange',
    submittedAt: '昨天 14:30',
  },
  {
    code: 'TK-0441',
    description: '园区3F研发中心投影仪报修',
    module: '行政后勤',
    moduleTone: 'blue',
    priority: 'blue',
    submittedAt: '昨天 09:15',
  },
  {
    code: 'WH-1029',
    description: 'A区原物料盘点确认',
    module: '仓储管理',
    moduleTone: 'blue',
    priority: 'blue',
    submittedAt: '05-17 16:00',
  },
];

const quickActions: QuickAction[] = [
  { icon: 'download', label: '入库登记', tone: 'blue' },
  { icon: 'plusBox', label: '出库申请', tone: 'green' },
  { icon: 'inventory', label: '库存查询', tone: 'orange' },
  { icon: 'clipboard', label: '库存盘点', tone: 'purple' },
  { icon: 'pie', label: '报表中心', tone: 'blue' },
  { icon: 'cube', label: '物料申请', tone: 'green' },
  { icon: 'stamp', label: '审批中心', tone: 'orange' },
  { icon: 'folder', label: '项目管理', tone: 'purple' },
];

export function ErpHomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="erp-workbench">
      <aside className="erp-workbench__sidebar">
        <div className="erp-workbench__side-scroll">
          <nav className="erp-workbench__nav" aria-label="仓储管理导航">
            {sidebarItems.map((item, index) => {
              const iconName = index === 1 ? 'monitor' : index === 5 ? 'alertCircle' : item.icon;

              return (
                <button
                  key={item.label}
                  className={[
                    'erp-workbench__nav-item',
                    index === 0 ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                >
                  <span className="erp-workbench__nav-icon">
                    <ErpIcon name={iconName} />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <button className="erp-workbench__collapse" type="button">
          <ErpIcon name="menu" />
          <span>收起菜单</span>
        </button>
      </aside>

      <div className="erp-workbench__main">
        <header className="erp-workbench__topbar">
          <div className="erp-workbench__brand-area">
            <button className="erp-workbench__menu-button" type="button" aria-label="展开菜单">
              <ErpIcon name="menu" />
            </button>
            <div className="erp-workbench__brand">
              <span className="erp-workbench__brand-lum">lum</span>
              <span className="erp-workbench__brand-soft">soft</span>
              <span className="erp-workbench__brand-cn">朗速</span>
            </div>
            <span className="erp-workbench__brand-divider" />
            <button className="erp-workbench__module-picker" type="button">
              <span>仓储管理</span>
              <span className="erp-workbench__chevron">⌄</span>
            </button>
          </div>

          <div className="erp-workbench__top-actions">
            <label className="erp-workbench__search">
              <ErpIcon name="search" />
              <input placeholder="搜索单据号、任务、物料..." />
              <span>Ctrl + K</span>
            </label>
            <IconBadge count="12" icon="bell" />
            <IconBadge count="5" icon="message" />
            <button className="erp-workbench__user" type="button">
              <span>A</span>
              <strong>Admin</strong>
              <span className="erp-workbench__chevron">⌄</span>
            </button>
          </div>
        </header>

        <main className="erp-workbench__content">
          <section className="erp-workbench__hero">
            <h1>工作台</h1>
            <p>今天是 2026年5月19日，管理员，祝您工作顺利。</p>
          </section>

          <section className="erp-workbench__metric-grid" aria-label="工作台概览">
            {metrics.map((metric) => (
              <article key={metric.title} className="erp-workbench__metric-card">
                <div>
                  <p>{metric.title}</p>
                  <strong className={`erp-workbench__metric-value is-${metric.accent}`}>
                    {metric.value}
                  </strong>
                  <span>{metric.label}</span>
                </div>
                <span className={`erp-workbench__metric-icon is-${metric.accent}`}>
                  <ErpIcon name={metric.icon} />
                </span>
              </article>
            ))}
          </section>

          <section className="erp-workbench__panel">
            <div className="erp-workbench__tabs">
              <div className="erp-workbench__tab-list">
                <button className="is-active" type="button">我的待办</button>
                <button type="button">已办结</button>
                <button type="button">我发起的</button>
              </div>
              <button className="erp-workbench__more" type="button">•••</button>
            </div>

            <div className="erp-workbench__table">
              <div className="erp-workbench__table-head">
                <span>单据编号</span>
                <span>任务描述</span>
                <span>所属模块</span>
                <span>提交时间</span>
                <span>操作</span>
              </div>
              {taskRows.map((task) => (
                <div key={task.code} className="erp-workbench__table-row">
                  <span>{task.code}</span>
                  <span className="erp-workbench__task-desc">
                    <i className={`is-${task.priority}`} />
                    {task.description}
                  </span>
                  <span>
                    <em className={`erp-workbench__module-tag is-${task.moduleTone}`}>
                      {task.module}
                    </em>
                  </span>
                  <span>{task.submittedAt}</span>
                  <span>
                    <button type="button">处理</button>
                  </span>
                </div>
              ))}
            </div>

            <footer className="erp-workbench__table-footer">
              <span>共 12 条记录</span>
              <div className="erp-workbench__pagination">
                <button type="button">&lt;</button>
                <button className="is-active" type="button">1</button>
                <button type="button">2</button>
                <button type="button">&gt;</button>
              </div>
            </footer>
          </section>

          <section className="erp-workbench__panel erp-workbench__quick-panel">
            <h2>常用功能</h2>
            <div className="erp-workbench__quick-grid">
              {quickActions.map((action) => (
                <button key={action.label} className="erp-workbench__quick-card" type="button">
                  <span className={`erp-workbench__quick-icon is-${action.tone}`}>
                    <ErpIcon name={action.icon} />
                  </span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function IconBadge({ count, icon }: { count: string; icon: IconName }) {
  return (
    <button className="erp-workbench__icon-button" type="button">
      <ErpIcon name={icon} />
      <span>{count}</span>
    </button>
  );
}

function ErpIcon({ name }: { name: IconName }) {
  const iconPaths: Record<IconName, ReactNode> = {
    alert: (
      <>
        <path d="M12 4 21 20H3L12 4Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    alertCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7v13h12V7" />
        <path d="M9 11h6" />
      </>
    ),
    bell: (
      <>
        <path d="M15 18H9" />
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-1.5 2h15L18 16Z" />
      </>
    ),
    briefcase: (
      <>
        <path d="M9 7V5h6v2" />
        <path d="M4 8h16v11H4z" />
        <path d="M4 13h16" />
      </>
    ),
    chart: (
      <>
        <path d="M5 19V5h14v14H5Z" />
        <path d="M9 16v-5" />
        <path d="M12 16V8" />
        <path d="M15 16v-3" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 5h6l1 2h2v14H6V7h2l1-2Z" />
        <path d="M9 12h6" />
        <path d="M9 16h5" />
      </>
    ),
    cube: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5" />
        <path d="M12 12v9" />
      </>
    ),
    dashboard: (
      <>
        <path d="M5 5h5v5H5z" />
        <path d="M14 5h5v5h-5z" />
        <path d="M5 14h5v5H5z" />
        <path d="M14 14h5v5h-5z" />
      </>
    ),
    document: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5" />
        <path d="M10 12h5" />
        <path d="M10 16h5" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 20h14V6" />
      </>
    ),
    folder: (
      <>
        <path d="M4 7h6l2 2h8v10H4z" />
        <path d="M4 11h16" />
      </>
    ),
    inbox: (
      <>
        <path d="M5 8h14l2 7h-5l-2 3h-4l-2-3H3l2-7Z" />
        <path d="M7 8l2-4h6l2 4" />
      </>
    ),
    inventory: (
      <>
        <path d="M6 5h12v14H6z" />
        <path d="M9 9h6" />
        <path d="M9 13h4" />
        <path d="m14 16 4 4" />
        <circle cx="13" cy="15" r="3" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),
    message: (
      <>
        <path d="M5 6h14v10H9l-4 4V6Z" />
        <path d="M9 10h.01" />
        <path d="M12 10h.01" />
        <path d="M15 10h.01" />
      </>
    ),
    monitor: (
      <>
        <path d="M4 5h16v11H4z" />
        <path d="M12 16v4" />
        <path d="M8 20h8" />
      </>
    ),
    pie: (
      <>
        <path d="M12 3v9h9" />
        <path d="M19.5 15A8 8 0 1 1 9 4" />
        <path d="M14 3.3A8 8 0 0 1 20.7 10" />
      </>
    ),
    plusBox: (
      <>
        <path d="M5 6h10v13H5z" />
        <path d="M10 10v5" />
        <path d="M7.5 12.5h5" />
        <path d="M18 9v10" />
        <path d="M15 19h5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    server: (
      <>
        <path d="M5 5h14v6H5z" />
        <path d="M5 13h14v6H5z" />
        <path d="M8 8h.01" />
        <path d="M8 16h.01" />
      </>
    ),
    stamp: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M10 11v4l-3 2v3h10v-3l-3-2v-4" />
      </>
    ),
    trend: (
      <>
        <path d="M4 17 10 11l4 4 6-8" />
        <path d="M15 7h5v5" />
      </>
    ),
    warehouse: (
      <>
        <path d="M4 9 12 4l8 5" />
        <path d="M6 9v11h12V9" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

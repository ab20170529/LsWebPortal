import { startTransition, useEffect, useMemo, useState } from 'react';
import type React from 'react';

import { biApi } from '../api/bi-api';
import { BiDisplayRuntimeStage } from '../components/bi-display-runtime-stage';
import { getBiDisplayPlatform } from '../display/display-platform-registry';
import type { BiDirectoryNode, BiRuntimeScreen, BiScreen } from '../types';
import { buildNodePath } from '../utils/bi-directory';
import {
  buildDisplayNodeSummaries,
  buildDisplayScreenMap,
  formatDisplayRate,
  getDisplayScreenMixSegments,
  summarizeDisplayNode,
  type BiDisplayNodeSummary,
} from '../utils/bi-display-view-model';
import { findDisplayNodeForRoute, pruneOrganizationForest } from '../utils/bi-display-tree';
import {
  getBiDisplayPlatformNodePath,
  getBiDisplayPlatformPath,
  navigateBiDisplay,
} from '../utils/bi-display-routes';

type BiDisplayPlatformPageProps = {
  nodeCode?: string | null;
  platformCode: string;
};

const TOP_NAV_ITEMS = ['设备总览', '看板中心', '报警中心', '监控平台', '数据管理', '采集云平台'];

async function loadRuntimeScreen(nodeCode: string) {
  const meta = await biApi.getRuntimeByNode(nodeCode);
  if (meta.biType !== 'INTERNAL') {
    return meta;
  }

  return biApi.queryRuntimeByScreen(meta.screenCode);
}

function accentStyle(accent: string): React.CSSProperties {
  return { '--bi-display-accent': accent } as React.CSSProperties;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesSearch(summary: BiDisplayNodeSummary, searchKeyword: string) {
  const keyword = normalizeSearch(searchKeyword);
  if (!keyword) {
    return true;
  }

  return (
    summary.node.nodeName.toLowerCase().includes(keyword) ||
    summary.node.nodeCode.toLowerCase().includes(keyword)
  );
}

function buildDisplayTitle(node: BiDirectoryNode | null, isDetailRoute: boolean) {
  if (!node) {
    return '全厂设备运行总览';
  }

  return isDetailRoute ? `${node.nodeName} 运行总览` : '全厂设备运行总览';
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M6.3 9.5a5.7 5.7 0 1 1 11.4 0v3.1c0 .8.3 1.6.8 2.3l1 1.2H4.5l1-1.2c.5-.7.8-1.5.8-2.3V9.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 19.1a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DisplayState({
  action,
  actionLabel,
  text,
  title,
}: {
  action?: () => void;
  actionLabel?: string;
  text: string;
  title: string;
}) {
  return (
    <section className="bi-display-state">
      <div className="bi-display-state-title">{title}</div>
      <div className="bi-display-state-text">{text}</div>
      {action && actionLabel ? (
        <button className="bi-display-state-action" onClick={action} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function DisplayTitleBanner({ title }: { title: string }) {
  return (
    <section className="bi-display-title-banner-wrap">
      <div className="bi-display-title-banner">
        <svg preserveAspectRatio="none" viewBox="0 0 1920 90">
          <defs>
            <linearGradient id="bi-display-header-bg" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="bi-display-wing-left" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="bi-display-wing-right" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </linearGradient>
            <filter height="140%" id="bi-display-title-glow-filter" width="140%" x="-20%" y="-20%">
              <feGaussianBlur result="blur" stdDeviation="6" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <path
            d="M 660 0 L 1260 0 L 1300 70 L 620 70 Z"
            fill="url(#bi-display-header-bg)"
            filter="url(#bi-display-title-glow-filter)"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          <path
            d="M 680 0 L 1240 0 L 1270 55 L 650 55 Z"
            fill="rgba(0, 240, 255, 0.1)"
            opacity="0.8"
            stroke="#00f0ff"
            strokeWidth="1"
          />
          <path
            d="M 0 70 L 620 70"
            filter="url(#bi-display-title-glow-filter)"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          <path d="M 0 70 L 620 70 L 660 0 L 0 0 Z" fill="url(#bi-display-wing-left)" />
          <path
            d="M 1300 70 L 1920 70"
            filter="url(#bi-display-title-glow-filter)"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          <path d="M 1300 70 L 1920 70 L 1920 0 L 1260 0 Z" fill="url(#bi-display-wing-right)" />
          <path d="M 0 55 L 600 55 L 630 0" fill="none" opacity="0.5" stroke="#00f0ff" strokeWidth="1" />
          <path d="M 0 40 L 580 40 L 600 0" fill="none" opacity="0.3" stroke="#00f0ff" strokeWidth="1" />
          <path d="M 1920 55 L 1320 55 L 1290 0" fill="none" opacity="0.5" stroke="#00f0ff" strokeWidth="1" />
          <path d="M 1920 40 L 1340 40 L 1320 0" fill="none" opacity="0.3" stroke="#00f0ff" strokeWidth="1" />
          <path
            d="M 860 70 L 1060 70"
            filter="url(#bi-display-title-glow-filter)"
            stroke="#ffffff"
            strokeWidth="4"
          />
          <path d="M 0 0 L 1920 0" opacity="0.5" stroke="#00f0ff" strokeWidth="1" />
        </svg>
      </div>

      <div className="bi-display-title-heading-wrap">
        <h1 aria-hidden="true" className="bi-display-title-glow">
          {title}
        </h1>
        <h1 className="bi-display-title-heading">{title}</h1>
      </div>
    </section>
  );
}

function DisplayRootCard({ summary }: { summary: BiDisplayNodeSummary }) {
  return (
    <div className="bi-display-root-card">
      <h2 className="bi-display-root-title">{summary.node.nodeName}</h2>
      <div className="bi-display-root-metrics">
        <div className="bi-display-root-metric">
          <span>组织节点</span>
          <strong className="is-accent">{summary.totalNodes}</strong>
        </div>
        <div className="bi-display-root-metric">
          <span>在线率</span>
          <strong className="is-success">{formatDisplayRate(summary.activeRate)}</strong>
        </div>
      </div>
    </div>
  );
}

function getBadgeLabel(tone: BiDisplayNodeSummary['badge']['tone']) {
  switch (tone) {
    case 'danger':
      return '异常';
    case 'warning':
      return '待完善';
    case 'neutral':
      return '待配置';
    default:
      return '正常';
  }
}

function DisplayNodeCard({
  onClick,
  summary,
}: {
  onClick: () => void;
  summary: BiDisplayNodeSummary;
}) {
  const screenMixSegments = getDisplayScreenMixSegments(summary);

  return (
    <button className="bi-display-node-card" onClick={onClick} style={accentStyle(summary.accent)} type="button">
      <div className="bi-display-node-card-glow" />
      <div className="bi-display-node-card-topline" />

      <div className="bi-display-node-card-head">
        <div className="bi-display-node-card-title">
          <span className="bi-display-node-card-title-dot" />
          <span>{summary.node.nodeName}</span>
        </div>
        <span className={`bi-display-node-card-badge is-${summary.badge.tone}`}>
          {getBadgeLabel(summary.badge.tone)}
        </span>
      </div>

      <div className="bi-display-node-card-grid">
        <div className="bi-display-node-card-stat">
          <span>组织节点</span>
          <strong>{summary.totalNodes}</strong>
        </div>
        <div className="bi-display-node-card-stat">
          <span>绑定大屏</span>
          <strong>{summary.boundScreens}</strong>
        </div>
      </div>

      <div className="bi-display-node-card-status">
        <div className="bi-display-node-card-status-head">
          <span>节点结构分布</span>
          <span>{formatDisplayRate(summary.activeRate)} 在线</span>
        </div>

        <div className="bi-display-node-card-meter">
          {screenMixSegments.map((segment) => (
            <div key={segment.key} className={`is-${segment.key}`} style={{ width: `${segment.percentage}%` }} />
          ))}
        </div>

        <div className="bi-display-node-card-legend">
          {screenMixSegments.map((segment) => (
            <span key={segment.key} className={`is-${segment.key}`}>
              {segment.label} {segment.value}
            </span>
          ))}
        </div>
      </div>

      <div className="bi-display-node-card-corner" />
    </button>
  );
}

export function BiDisplayPlatformPage({
  nodeCode = null,
  platformCode,
}: BiDisplayPlatformPageProps) {
  const platform = getBiDisplayPlatform(platformCode);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingRuntime, setIsLoadingRuntime] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<BiDirectoryNode[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [runtimeScreen, setRuntimeScreen] = useState<BiRuntimeScreen | null>(null);
  const [screens, setScreens] = useState<BiScreen[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      setIsLoadingTree(true);
      setLoadError(null);

      try {
        const [tree, allScreens] = await Promise.all([biApi.listDirectoryTree(), biApi.listScreens()]);
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setNodes(pruneOrganizationForest(tree));
          setScreens(allScreens);
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '加载 BI 展示目录失败。');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTree(false);
        }
      }
    }

    void loadTree();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSearchKeyword('');
  }, [nodeCode, platformCode]);

  const screenMap = useMemo(() => buildDisplayScreenMap(screens), [screens]);

  const { rootNode, selectedNode } = useMemo(
    () => findDisplayNodeForRoute(nodes, platform?.rootNodeCode ?? '', nodeCode),
    [nodeCode, nodes, platform?.rootNodeCode],
  );

  const isDetailRoute = Boolean(nodeCode);
  const focusNode = selectedNode ?? rootNode;
  const selectedPath = useMemo(() => buildNodePath(selectedNode ?? null, nodes), [nodes, selectedNode]);

  const focusSummary = useMemo(
    () => (focusNode ? summarizeDisplayNode(focusNode, screenMap) : null),
    [focusNode, screenMap],
  );

  const childSummaries = useMemo(() => {
    if (!focusNode) {
      return [] as BiDisplayNodeSummary[];
    }

    return buildDisplayNodeSummaries(focusNode.children, screenMap).filter((summary) =>
      matchesSearch(summary, searchKeyword),
    );
  }, [focusNode, screenMap, searchKeyword]);

  const detailTopNode = useMemo(() => {
    if (!rootNode || !selectedNode) {
      return null;
    }

    return selectedPath[1] ?? selectedNode ?? rootNode;
  }, [rootNode, selectedNode, selectedPath]);

  const detailTopSummaries = useMemo(() => {
    if (!rootNode) {
      return [] as BiDisplayNodeSummary[];
    }

    const nodesForTabs = rootNode.children.length > 0 ? rootNode.children : [rootNode];
    return buildDisplayNodeSummaries(nodesForTabs, screenMap);
  }, [rootNode, screenMap]);

  const detailLeftSummaries = useMemo(() => {
    if (!detailTopNode) {
      return [] as BiDisplayNodeSummary[];
    }

    const leftNodes =
      detailTopNode.children.length > 0 ? [detailTopNode, ...detailTopNode.children] : [detailTopNode];

    return buildDisplayNodeSummaries(leftNodes, screenMap).filter((summary) =>
      matchesSearch(summary, searchKeyword),
    );
  }, [detailTopNode, screenMap, searchKeyword]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateRuntime() {
      if (!isDetailRoute || !selectedNode) {
        setRuntimeScreen(null);
        setRuntimeError(null);
        setIsLoadingRuntime(false);
        return;
      }

      setIsLoadingRuntime(true);
      setRuntimeError(null);

      try {
        const runtime = await loadRuntimeScreen(selectedNode.nodeCode);
        if (!cancelled) {
          startTransition(() => {
            setRuntimeScreen(runtime);
          });
        }
      } catch (error) {
        if (!cancelled) {
          startTransition(() => {
            setRuntimeScreen(null);
            setRuntimeError(error instanceof Error ? error.message : '当前节点暂时没有可展示的大屏。');
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRuntime(false);
        }
      }
    }

    void hydrateRuntime();

    return () => {
      cancelled = true;
    };
  }, [isDetailRoute, selectedNode]);

  if (!platform) {
    return (
      <div className="bi-display-app">
        <DisplayState
          text="请确认展示平台编码已经在前端平台注册表中完成配置。"
          title="未找到展示平台定义"
        />
      </div>
    );
  }

  return (
    <div className="bi-display-app">
      <header className="bi-display-topbar">
        <div className="bi-display-topbar-left">
          <button
            className="bi-display-brand"
            onClick={() => {
              navigateBiDisplay(getBiDisplayPlatformPath(platformCode));
            }}
            type="button"
          >
            <img alt="Lumsoft" className="bi-display-brand-logo" src="/logo.png" />
            <span className="bi-display-brand-mark">朗速BI</span>
          </button>

          <nav className="bi-display-topbar-nav">
            {isDetailRoute && detailTopSummaries.length > 0
              ? detailTopSummaries.map((summary) => (
                  <button
                    key={summary.node.id}
                    className={`bi-display-topbar-tab ${detailTopNode?.id === summary.node.id ? 'is-active' : ''}`}
                    onClick={() => {
                      navigateBiDisplay(getBiDisplayPlatformNodePath(platformCode, summary.node.nodeCode));
                    }}
                    type="button"
                  >
                    {summary.node.nodeName}
                  </button>
                ))
              : TOP_NAV_ITEMS.map((label, index) => (
                  <button
                    key={label}
                    className={`bi-display-topbar-tab ${index === 0 ? 'is-active' : ''}`}
                    onClick={
                      index === 0
                        ? () => {
                            navigateBiDisplay(getBiDisplayPlatformPath(platformCode));
                          }
                        : undefined
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
          </nav>
        </div>

        <div className="bi-display-topbar-actions">
          {isDetailRoute ? (
            <button
              className="bi-display-back-button"
              onClick={() => {
                navigateBiDisplay(getBiDisplayPlatformPath(platformCode));
              }}
              type="button"
            >
              ← 全厂总览
            </button>
          ) : null}

          <label className="bi-display-topbar-search">
            <SearchIcon />
            <input
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSearchKeyword(event.target.value);
              }}
              placeholder="搜索指标、日志..."
              type="text"
              value={searchKeyword}
            />
          </label>

          <button className="bi-display-topbar-icon" type="button">
            <BellIcon />
          </button>

          <button className="bi-display-topbar-user" type="button">
            <span className="bi-display-topbar-avatar">JD</span>
            <ChevronDownIcon />
          </button>
        </div>
      </header>

      <main className="bi-display-main-shell">
        <div className="bi-display-ambient bi-display-ambient--cyan" />
        <div className="bi-display-ambient bi-display-ambient--violet" />

        {isLoadingTree ? (
          <DisplayState text="正在同步 BI 组织结构与节点绑定数据。" title="正在加载展示平台" />
        ) : loadError ? (
          <DisplayState text={loadError} title="展示数据加载失败" />
        ) : !rootNode ? (
          <DisplayState text="当前平台下还没有可展示的组织根节点。" title="未找到组织根节点" />
        ) : isDetailRoute && !selectedNode ? (
          <DisplayState
            action={() => {
              navigateBiDisplay(getBiDisplayPlatformPath(platformCode));
            }}
            actionLabel="返回全厂总览"
            text="当前节点不存在，或者不在当前展示平台配置的组织树范围内。"
            title="未找到组织节点"
          />
        ) : isDetailRoute && focusSummary && focusNode && detailTopNode ? (
          <section className="bi-display-detail-shell">
            <aside className="bi-display-detail-aside">
              <div className="bi-display-detail-aside-title">节点导航</div>
              <div className="bi-display-detail-aside-subtitle">{detailTopNode.nodeName}</div>

              <div className="bi-display-detail-nav">
                {detailLeftSummaries.map((summary, index) => (
                  <button
                    key={summary.node.id}
                    className={`bi-display-detail-nav-item ${summary.node.id === focusNode.id ? 'is-active' : ''}`}
                    onClick={() => {
                      navigateBiDisplay(getBiDisplayPlatformNodePath(platformCode, summary.node.nodeCode));
                    }}
                    type="button"
                  >
                    <span>{index === 0 ? `${detailTopNode.nodeName}总览` : summary.node.nodeName}</span>
                    <span>{summary.childCount || summary.boundScreens}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="bi-display-detail-main">
              <DisplayTitleBanner title={`${focusNode.nodeName} 数据汇总`} />

              <div className="bi-display-detail-stage">
                <BiDisplayRuntimeStage
                  error={runtimeError}
                  isLoading={isLoadingRuntime}
                  screen={runtimeScreen}
                />
              </div>
            </section>
          </section>
        ) : focusSummary && focusNode ? (
          <>
            <DisplayTitleBanner title={buildDisplayTitle(focusNode, isDetailRoute)} />

            <section className="bi-display-tree-stage">
              <div className="bi-display-root-wrap">
                <DisplayRootCard summary={focusSummary} />
              </div>

              {focusNode.children.length > 0 ? (
                <>
                  <div className="bi-display-tree-connector" />

                  {childSummaries.length > 0 ? (
                    <div className="bi-display-children-scroll">
                      {childSummaries.length > 1 ? <div className="bi-display-children-rail" /> : null}

                      {childSummaries.map((summary) => (
                        <div key={summary.node.id} className="bi-display-child-slot">
                          <div className="bi-display-child-line" />
                          <DisplayNodeCard
                            onClick={() => {
                              navigateBiDisplay(
                                getBiDisplayPlatformNodePath(platformCode, summary.node.nodeCode),
                              );
                            }}
                            summary={summary}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bi-display-inline-hint">未找到匹配的组织节点。</div>
                  )}
                </>
              ) : null}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

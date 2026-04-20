import { startTransition, useEffect, useMemo, useState } from 'react';

import { biApi } from '../api/bi-api';
import { BiDisplayRuntimeStage } from '../components/bi-display-runtime-stage';
import { getBiDisplayPlatform } from '../display/display-platform-registry';
import type { BiDirectoryNode, BiRuntimeScreen } from '../types';
import { buildNodePath } from '../utils/bi-directory';
import { findNodeById, findPreferredDisplayRoot, pruneOrganizationForest } from '../utils/bi-display-tree';

type BiDisplayPlatformPageProps = {
  platformCode: string;
};

const NODE_ACCENTS = ['#00f0ff', '#7000ff', '#3b82f6', '#10b981', '#ec4899', '#f59e0b'];

function getNodeAccent(node: BiDirectoryNode) {
  if (typeof node.canvasMeta?.accent === 'string' && node.canvasMeta.accent.trim()) {
    return node.canvasMeta.accent;
  }

  return NODE_ACCENTS[node.id % NODE_ACCENTS.length];
}

async function loadRuntimeScreen(nodeCode: string) {
  const meta = await biApi.getRuntimeByNode(nodeCode);
  if (meta.biType !== 'INTERNAL') {
    return meta;
  }

  return biApi.queryRuntimeByScreen(meta.screenCode);
}

function TreeNode({
  activeNodeId,
  node,
  onSelect,
}: {
  activeNodeId: number | null;
  node: BiDirectoryNode;
  onSelect: (nodeId: number) => void;
}) {
  const isActive = node.id === activeNodeId;
  const accent = getNodeAccent(node);

  return (
    <div className="bi-display-tree-node">
      <button
        className={`bi-display-tree-card ${isActive ? 'is-active' : ''}`}
        onClick={() => {
          onSelect(node.id);
        }}
        type="button"
      >
        <span className="bi-display-tree-card-accent" style={{ backgroundColor: accent }} />
        <div className="bi-display-tree-card-head">
          <span className="bi-display-tree-card-type">{node.nodeType}</span>
          <span className="bi-display-tree-card-status">{node.status ?? 'ACTIVE'}</span>
        </div>
        <div className="bi-display-tree-card-title">{node.nodeName}</div>
        <div className="bi-display-tree-card-code">{node.nodeCode}</div>
        <div className="bi-display-tree-card-metrics">
          <span>子级 {node.children.length}</span>
          <span>数据源 {node.datasourceIds.length}</span>
        </div>
      </button>

      {node.children.length > 0 ? (
        <div className="bi-display-tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.id} activeNodeId={activeNodeId} node={child} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BiDisplayPlatformPage({ platformCode }: BiDisplayPlatformPageProps) {
  const platform = getBiDisplayPlatform(platformCode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<BiDirectoryNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [activeHeaderId, setActiveHeaderId] = useState<number | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<number | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isLoadingRuntime, setIsLoadingRuntime] = useState(false);
  const [runtimeScreen, setRuntimeScreen] = useState<BiRuntimeScreen | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      setIsLoadingTree(true);
      setLoadError(null);

      try {
        const tree = await biApi.listDirectoryTree();
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setNodes(pruneOrganizationForest(tree));
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : '加载 BI 组织目录失败。');
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

  const rootNode = useMemo(() => {
    if (!platform) {
      return null;
    }

    return findPreferredDisplayRoot(nodes, platform.rootNodeCode);
  }, [nodes, platform]);

  const headerNodes = useMemo(() => {
    if (!rootNode) {
      return [] as BiDirectoryNode[];
    }

    return rootNode.children.length > 0 ? rootNode.children : [rootNode];
  }, [rootNode]);

  const activeHeader = useMemo(() => {
    if (headerNodes.length === 0) {
      return null;
    }

    return headerNodes.find((node) => node.id === activeHeaderId) ?? headerNodes[0];
  }, [activeHeaderId, headerNodes]);

  const focusNode = useMemo(() => {
    if (!activeHeader) {
      return null;
    }

    if (!focusNodeId) {
      return activeHeader;
    }

    return findNodeById([activeHeader], focusNodeId) ?? activeHeader;
  }, [activeHeader, focusNodeId]);

  const focusPath = useMemo(() => {
    if (!focusNode) {
      return [] as BiDirectoryNode[];
    }

    return buildNodePath(focusNode, nodes);
  }, [focusNode, nodes]);

  useEffect(() => {
    if (!activeHeader) {
      setActiveHeaderId(null);
      setFocusNodeId(null);
      return;
    }

    startTransition(() => {
      setActiveHeaderId(activeHeader.id);
      setFocusNodeId((current) => {
        if (!current) {
          return activeHeader.id;
        }

        return findNodeById([activeHeader], current) ? current : activeHeader.id;
      });
    });
  }, [activeHeader]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateRuntime() {
      if (!focusNode) {
        startTransition(() => {
          setRuntimeScreen(null);
          setRuntimeError(null);
        });
        return;
      }

      setIsLoadingRuntime(true);
      setRuntimeError(null);

      try {
        const runtime = await loadRuntimeScreen(focusNode.nodeCode);
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setRuntimeScreen(runtime);
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : '当前节点尚未绑定可展示的大屏。';
        startTransition(() => {
          setRuntimeScreen(null);
          setRuntimeError(message);
        });
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
  }, [focusNode]);

  const summaryItems = useMemo(() => {
    return [
      {
        label: '当前层级',
        value: String(focusPath.length || '--'),
      },
      {
        label: '直属子级',
        value: String(focusNode?.children.length ?? 0),
      },
      {
        label: '绑定数据源',
        value: String(focusNode?.datasourceIds.length ?? 0),
      },
      {
        label: '展示模块',
        value: runtimeScreen ? String(runtimeScreen.modules.length) : '--',
      },
    ];
  }, [focusNode, focusPath.length, runtimeScreen]);

  if (!platform) {
    return (
      <div className="bi-display-app">
        <div className="bi-display-empty-state">
          <div className="bi-display-empty-title">未找到展示平台定义</div>
          <div className="bi-display-empty-text">请确认平台编码是否已在前端展示平台注册表中配置。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bi-display-app">
      <header className="bi-display-header">
        <div className="bi-display-header-brand">
          <div className="bi-display-header-logo">BI</div>
          <div>
            <div className="bi-display-header-title">{platform.title}</div>
            <div className="bi-display-header-subtitle">{platform.subtitle}</div>
          </div>
        </div>

        <div className="bi-display-header-tabs">
          {headerNodes.map((node) => (
            <button
              key={node.id}
              className={`bi-display-header-tab ${node.id === activeHeader?.id ? 'is-active' : ''}`}
              onClick={() => {
                startTransition(() => {
                  setActiveHeaderId(node.id);
                  setFocusNodeId(node.id);
                });
              }}
              type="button"
            >
              {node.nodeName}
            </button>
          ))}
        </div>

        <div className="bi-display-header-status">
          <span className="bi-display-header-pill">Platform {platform.platformCode}</span>
          <span className="bi-display-header-pill">{focusNode?.nodeType ?? 'NODE'}</span>
        </div>
      </header>

      <main className="bi-display-main">
        <section className="bi-display-branch-band">
          <div className="bi-display-branch-topline">
            <div>
              <div className="bi-display-branch-title">
                {activeHeader?.nodeName ?? rootNode?.nodeName ?? '组织架构'}
              </div>
              <div className="bi-display-branch-caption">
                点击下方组织节点后，左侧子维度与中间大屏会同步切换。
              </div>
            </div>

            <div className="bi-display-summary-grid">
              {summaryItems.map((item) => (
                <div key={item.label} className="bi-display-summary-card">
                  <span className="bi-display-summary-label">{item.label}</span>
                  <span className="bi-display-summary-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {isLoadingTree ? (
            <div className="bi-display-empty-text">正在同步组织架构...</div>
          ) : loadError ? (
            <div className="bi-display-error-banner">{loadError}</div>
          ) : activeHeader ? (
            <div className="bi-display-tree-wrap">
              {activeHeader.children.length > 0 ? (
                activeHeader.children.map((child) => (
                  <TreeNode
                    key={child.id}
                    activeNodeId={focusNode?.id ?? null}
                    node={child}
                    onSelect={(nodeId) => {
                      setFocusNodeId(nodeId);
                    }}
                  />
                ))
              ) : (
                <div className="bi-display-empty-text">当前一级组织下暂无剩余组织节点。</div>
              )}
            </div>
          ) : (
            <div className="bi-display-empty-text">未找到可展示的组织根节点。</div>
          )}
        </section>

        <section className="bi-display-workbench">
          <aside className="bi-display-side-panel">
            <div className="bi-display-side-panel-head">
              <div className="bi-display-side-panel-title">主维度</div>
              <div className="bi-display-side-panel-current">{focusNode?.nodeName ?? '--'}</div>
              <div className="bi-display-side-panel-path">
                {focusPath.map((node) => node.nodeName).join(' / ') || '未选择节点'}
              </div>
            </div>

            <button
              className={`bi-display-dimension-button ${focusNode?.id === activeHeader?.id ? 'is-active' : ''}`}
              onClick={() => {
                if (activeHeader) {
                  setFocusNodeId(activeHeader.id);
                }
              }}
              type="button"
            >
              <span>总览</span>
              <span>{activeHeader?.children.length ?? 0}</span>
            </button>

            <div className="bi-display-dimension-list">
              {focusNode?.children.length ? (
                focusNode.children.map((child) => (
                  <button
                    key={child.id}
                    className={`bi-display-dimension-button ${focusNodeId === child.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setFocusNodeId(child.id);
                    }}
                    type="button"
                  >
                    <span>{child.nodeName}</span>
                    <span>{child.children.length}</span>
                  </button>
                ))
              ) : (
                <div className="bi-display-side-empty">当前主维度下没有更多子维度。</div>
              )}
            </div>
          </aside>

          <section className="bi-display-screen-panel">
            <div className="bi-display-screen-panel-head">
              <div>
                <div className="bi-display-screen-panel-title">{focusNode?.nodeName ?? '当前节点'}</div>
                <div className="bi-display-screen-panel-subtitle">
                  {runtimeScreen?.screenName ?? runtimeScreen?.screenCode ?? focusNode?.nodeCode ?? ''}
                </div>
              </div>
              <div className="bi-display-screen-panel-tags">
                <span className="bi-display-screen-tag">{focusNode?.nodeType ?? 'NODE'}</span>
                <span className="bi-display-screen-tag">{runtimeScreen?.publishStatus ?? 'READY'}</span>
              </div>
            </div>

            <BiDisplayRuntimeStage
              error={runtimeError}
              isLoading={isLoadingRuntime}
              screen={runtimeScreen}
            />
          </section>
        </section>
      </main>
    </div>
  );
}

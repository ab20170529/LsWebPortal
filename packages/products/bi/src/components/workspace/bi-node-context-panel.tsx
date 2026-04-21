import { Button } from '@lserp/ui';

import type { BiDirectoryNode, BiScreen } from '../../types';
import { getNodeTypeLabel, getStatusLabel } from '../../utils/bi-directory';
import type { BiArchiveTab, BiWorkspaceSection } from '../../utils/bi-workspace-view-state';

type BiNodeContextPanelProps = {
  node: BiDirectoryNode | null;
  onOpenArchiveTab: (tab: BiArchiveTab) => void;
  onOpenSection: (section: BiWorkspaceSection) => void;
  onQuickCreateExternalArchive: () => void;
  onQuickDesignInternalArchive: () => void;
  screens: BiScreen[];
};

export function BiNodeContextPanel({
  node,
  onOpenArchiveTab,
  onOpenSection,
  onQuickCreateExternalArchive,
  onQuickDesignInternalArchive,
  screens,
}: BiNodeContextPanelProps) {
  return (
    <aside className="bi-context-panel">
      <div className="bi-context-panel-header">
        <div>
          <div className="bi-context-panel-title">节点摘要</div>
          <div className="bi-context-panel-subtitle">
            {node ? `当前选中：${node.nodeName}` : '请先从目录画布中选择一个节点'}
          </div>
        </div>
      </div>

      <div className="bi-context-body">
        <div className="bi-panel-scroll">
          {node ? (
            <>
              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">节点信息</div>
                  <div className="bi-panel-section-caption">{getStatusLabel(node.status)}</div>
                </div>
                <div className="bi-info-grid">
                  <div className="bi-info-item">
                    <span className="bi-info-label">节点类型</span>
                    <span className="bi-info-value">{getNodeTypeLabel(node.nodeType, node.nodeTypeName)}</span>
                  </div>
                  <div className="bi-info-item">
                    <span className="bi-info-label">层级</span>
                    <span className="bi-info-value">{node.level ?? 1}</span>
                  </div>
                  <div className="bi-info-item">
                    <span className="bi-info-label">分析源资产</span>
                    <span className="bi-info-value">{node.sourceAssetIds.length}</span>
                  </div>
                  <div className="bi-info-item">
                    <span className="bi-info-label">BI 档案</span>
                    <span className="bi-info-value">{screens.length}</span>
                  </div>
                </div>
              </section>

              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">快捷操作</div>
                </div>
                <div className="bi-panel-card">
                  <div className="bi-panel-form">
                    <Button onClick={onQuickDesignInternalArchive}>设计内置 BI</Button>
                    <Button onClick={onQuickCreateExternalArchive} tone="ghost">
                      新建外链 BI
                    </Button>
                    <Button onClick={() => onOpenArchiveTab('base')} tone="ghost">
                      管理 BI 档案
                    </Button>
                    <Button onClick={() => onOpenSection('sources')} tone="ghost">
                      管理分析源
                    </Button>
                  </div>
                </div>
              </section>

              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">已绑定分析源</div>
                  <button className="bi-inline-link" onClick={() => onOpenSection('sources')} type="button">
                    去调整绑定
                  </button>
                </div>
                {node.boundAssets.length > 0 ? (
                  <div className="bi-stack-list bi-stack-list-tight">
                    {node.boundAssets.slice(0, 6).map((asset) => (
                      <div key={asset.id} className="bi-side-card">
                        <div className="bi-side-card-title">{asset.assetName}</div>
                        <div className="bi-side-card-subtitle">
                          {asset.datasourceName ?? asset.datasourceCode ?? '未归属数据源'} / {asset.assetType}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bi-panel-empty bi-panel-empty-tight">当前节点还没有绑定分析源资产。</div>
                )}
              </section>

              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">节点档案摘要</div>
                  <button className="bi-inline-link" onClick={() => onOpenArchiveTab('base')} type="button">
                    查看全部
                  </button>
                </div>
                {screens.length > 0 ? (
                  <div className="bi-stack-list bi-stack-list-tight">
                    {screens.slice(0, 4).map((screen) => (
                      <div key={screen.id} className="bi-side-card">
                        <div className="bi-side-card-header">
                          <div>
                            <div className="bi-side-card-title">{screen.name}</div>
                            <div className="bi-side-card-subtitle">{screen.screenCode}</div>
                          </div>
                          <span className="bi-node-card-status">
                            {screen.biType === 'EXTERNAL' ? '外链' : '内置'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bi-panel-empty bi-panel-empty-tight">当前节点还没有 BI 档案。</div>
                )}
              </section>
            </>
          ) : (
            <div className="bi-panel-empty">
              先在目录画布里选择一个节点。选中后，这里会显示节点摘要、已绑定分析源以及进入 BI 档案设计的快捷入口。
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

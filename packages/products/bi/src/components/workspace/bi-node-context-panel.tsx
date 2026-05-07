import { Button, cx } from '@lserp/ui';

import type { BiDirectoryNode, BiScreen } from '../../types';
import {
  getNodeTypeLabel,
  getPublishedVersionId,
  getStatusLabel,
} from '../../utils/bi-directory';
import type { BiArchiveTab, BiWorkspaceSection } from '../../utils/bi-workspace-view-state';

type BiNodeContextPanelProps = {
  activeArchiveTab: BiArchiveTab;
  activeSection: BiWorkspaceSection;
  canDeleteNode: boolean;
  canPreviewCurrent: boolean;
  canPublishCurrent: boolean;
  deleteHint: string;
  node: BiDirectoryNode | null;
  onDeleteNode: () => void;
  onEditNode: () => void;
  onLocateCurrentNode: () => void;
  onOpenArchiveTab: (tab: BiArchiveTab) => void;
  onOpenPreview: () => void;
  onOpenSection: (section: BiWorkspaceSection) => void;
  onPublishCurrent: () => void;
  onQuickCreateExternalArchive: () => void;
  onQuickDesignInternalArchive: () => void;
  previewHint?: string | null;
  screens: BiScreen[];
};

type GuideStepTone = 'blocked' | 'complete' | 'next';

type GuideStep = {
  actionLabel: string;
  description: string;
  doneLabel: string;
  isDone: boolean;
  onAction: () => void;
  stepNo: number;
  title: string;
  tone: GuideStepTone;
};

function getStepTone(isDone: boolean, isReady: boolean): GuideStepTone {
  if (isDone) {
    return 'complete';
  }

  return isReady ? 'next' : 'blocked';
}

function getStepStateLabel(step: GuideStep) {
  if (step.isDone) {
    return step.doneLabel;
  }

  if (step.tone === 'next') {
    return '下一步';
  }

  return '前置未完成';
}

export function BiNodeContextPanel({
  activeArchiveTab,
  activeSection,
  canDeleteNode,
  canPreviewCurrent,
  canPublishCurrent,
  deleteHint,
  node,
  onDeleteNode,
  onEditNode,
  onLocateCurrentNode,
  onOpenArchiveTab,
  onOpenPreview,
  onOpenSection,
  onPublishCurrent,
  onQuickCreateExternalArchive,
  onQuickDesignInternalArchive,
  previewHint,
  screens,
}: BiNodeContextPanelProps) {
  const isArchiveSection = activeSection === 'archives';
  const isSourceSection = activeSection === 'sources';
  const isDesignArchiveActive = isArchiveSection && activeArchiveTab === 'design';
  const isArchiveBaseActive = isArchiveSection && activeArchiveTab === 'base';

  const sourceAssetCount = node?.sourceAssetIds.length ?? 0;
  const internalScreen = screens.find((screen) => screen.biType === 'INTERNAL') ?? null;
  const hasInternalArchive = Boolean(internalScreen);
  const hasVersionDraft = Boolean(internalScreen?.versions?.length);
  const hasPublishedVersion = Boolean(getPublishedVersionId(internalScreen));
  const hasPreviewReady = canPreviewCurrent;
  const canCreateInternalArchive = sourceAssetCount > 0;
  const canGenerateDraft = hasInternalArchive;
  const canPublishStep = hasVersionDraft;

  const setupStates = [
    {
      description: sourceAssetCount > 0 ? `${sourceAssetCount} 个资产已绑定` : '先绑定至少 1 个分析资产',
      done: sourceAssetCount > 0,
      label: '分析源',
    },
    {
      description: hasInternalArchive ? '当前节点已存在内置 BI' : '建议先创建一个内置 BI 档案',
      done: hasInternalArchive,
      label: '内置 BI',
    },
    {
      description: hasVersionDraft ? '已经有可编辑版本' : '还没有可生成或可编辑的版本',
      done: hasVersionDraft,
      label: '草稿版本',
    },
    {
      description: hasPublishedVersion ? '已具备展示运行版本' : '需要发布一个版本后才能稳定展示',
      done: hasPublishedVersion,
      label: '已发布',
    },
    {
      description: hasPreviewReady
        ? '当前节点已经可以打开预览页面校验展示效果'
        : (previewHint ?? '完成生成后可以先预览，再决定是否继续发布或展示'),
      done: hasPreviewReady,
      label: '可预览',
    },
  ];
  const completedSetupCount = setupStates.filter((item) => item.done).length;
  const nextSetupState = setupStates.find((item) => !item.done);

  const guideSteps: GuideStep[] = [
    {
      actionLabel: '去绑定分析源',
      description: sourceAssetCount > 0
        ? `当前节点已绑定 ${sourceAssetCount} 个分析资产，可直接进入下一步。`
        : '先把当前节点和表 / SQL 资产绑定起来，后续生成和运行都依赖这里的白名单。',
      doneLabel: '已完成',
      isDone: sourceAssetCount > 0,
      onAction: () => onOpenSection('sources'),
      stepNo: 1,
      title: '绑定分析源',
      tone: getStepTone(sourceAssetCount > 0, true),
    },
    {
      actionLabel: '创建或打开内置 BI',
      description: hasInternalArchive
        ? '当前节点已经有内置 BI，可以继续生成草稿或维护内容。'
        : '系统会为当前节点创建一个内置 BI 档案，并切到设计与生成页面。',
      doneLabel: '已创建',
      isDone: hasInternalArchive,
      onAction: onQuickDesignInternalArchive,
      stepNo: 2,
      title: '创建内置 BI',
      tone: getStepTone(hasInternalArchive, canCreateInternalArchive),
    },
    {
      actionLabel: '去设计与生成',
      description: hasVersionDraft
        ? '当前节点已经有版本草稿，可以继续发布或预览。'
        : '在设计页里填写提示词、生成草稿，或者手工维护当前版本内容。',
      doneLabel: '已有草稿',
      isDone: hasVersionDraft,
      onAction: () => onOpenArchiveTab('design'),
      stepNo: 3,
      title: '生成草稿',
      tone: getStepTone(hasVersionDraft, canGenerateDraft),
    },
    {
      actionLabel: canPublishCurrent ? '直接发布当前版本' : '去版本与发布',
      description: hasPublishedVersion
        ? '当前节点已经存在已发布版本，展示系统可直接读取。'
        : '发布后 BI 展示系统才能稳定读取这个节点的大屏内容。',
      doneLabel: '已发布',
      isDone: hasPublishedVersion,
      onAction: canPublishCurrent ? onPublishCurrent : () => onOpenArchiveTab('versions'),
      stepNo: 4,
      title: '发布版本',
      tone: getStepTone(hasPublishedVersion, canPublishStep),
    },
    {
      actionLabel: '打开预览页面',
      description: hasPreviewReady
        ? (previewHint ?? '当前节点已经可以预览，请确认页面内容和展示效果。')
        : '预览需要先生成版本；如果要让展示系统读取，还需要至少发布一个版本。',
      doneLabel: '可预览',
      isDone: false,
      onAction: onOpenPreview,
      stepNo: 5,
      title: '验证预览',
      tone: getStepTone(false, hasPreviewReady),
    },
  ];

  const recommendedStep =
    guideSteps.find((step) => !step.isDone && step.tone === 'next')
    ?? (hasPreviewReady ? guideSteps[4] : null);

  return (
    <aside className="bi-context-panel">
      <div className="bi-context-panel-header">
        <div>
          <div className="bi-context-panel-title">节点摘要</div>
          <div className="bi-context-panel-subtitle">
            {node ? `当前选中：${node.nodeName}` : '请先从目录画布中选择一个节点。'}
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
                <div className="bi-context-summary-card">
                  <div className="bi-context-summary-title">
                    {getNodeTypeLabel(node.nodeType, node.nodeTypeName)}
                    <span>第 {node.level ?? 1} 层</span>
                  </div>
                  <div className="bi-context-summary-meta">
                    <span>{sourceAssetCount} 个分析源</span>
                    <span>{screens.length} 个 BI 档案</span>
                  </div>
                  <Button className="bi-context-locate-action" onClick={onLocateCurrentNode} tone="ghost">
                    定位到画布节点
                  </Button>
                </div>
              </section>

              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">节点就绪度</div>
                  <div className="bi-panel-section-caption">
                    {completedSetupCount}/{setupStates.length}
                  </div>
                </div>
                <div className="bi-context-readiness-rail">
                  {setupStates.map((item) => (
                    <div
                      key={item.label}
                      className={cx('bi-context-readiness-chip', item.done ? 'is-complete' : 'is-pending')}
                    >
                      <span className="bi-context-state-label">{item.label}</span>
                      <span className="bi-context-state-badge">{item.done ? '已完成' : '未完成'}</span>
                    </div>
                  ))}
                </div>
                {nextSetupState ? (
                  <div className="bi-context-next-hint">
                    <span>下一步</span>
                    {nextSetupState.description}
                  </div>
                ) : null}
              </section>

              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">配置向导</div>
                  <div className="bi-panel-section-caption">按 1 到 5 步完成一次节点大屏配置</div>
                </div>
                <div className="bi-context-guide-list">
                  {guideSteps.map((step) => {
                    const isActionDisabled = step.tone === 'blocked';
                    return (
                      <div
                        key={step.stepNo}
                        className={cx(
                          'bi-context-guide-card',
                          `is-${step.tone}`,
                        )}
                      >
                        <div className="bi-context-guide-head">
                          <div className="bi-context-guide-stepno">步骤 {step.stepNo}</div>
                          <div className="bi-context-guide-state">{getStepStateLabel(step)}</div>
                        </div>
                        <div className="bi-context-guide-title">{step.title}</div>
                        <div className="bi-context-guide-text">{step.description}</div>
                        <Button
                          className={cx('bi-context-guide-action', step.isDone ? 'is-complete' : '')}
                          disabled={isActionDisabled}
                          onClick={step.onAction}
                          tone="ghost"
                        >
                          {step.actionLabel}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {recommendedStep ? (
                <section className="bi-panel-section">
                  <div className="bi-panel-section-header">
                    <div className="bi-panel-section-title">建议下一步</div>
                  </div>
                  <div className="bi-context-next-card">
                    <div className="bi-context-next-kicker">推荐动作</div>
                    <div className="bi-context-next-title">
                      {`步骤 ${recommendedStep.stepNo}：${recommendedStep.title}`}
                    </div>
                    <div className="bi-context-next-text">{recommendedStep.description}</div>
                    <div className="bi-context-next-actions">
                      <Button
                        disabled={recommendedStep.tone === 'blocked'}
                        onClick={recommendedStep.onAction}
                      >
                        {recommendedStep.actionLabel}
                      </Button>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="bi-panel-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">常用操作</div>
                </div>
                <div className="bi-panel-card">
                  <div className="bi-panel-form">
                    <Button className="bi-panel-action" onClick={onEditNode} tone="ghost">
                      编辑当前节点
                    </Button>
                    <Button
                      className={cx('bi-panel-action', isSourceSection ? 'is-active' : '')}
                      onClick={() => onOpenSection('sources')}
                      tone="ghost"
                    >
                      去绑定分析源
                    </Button>
                    <Button
                      className={cx('bi-panel-action', isDesignArchiveActive ? 'is-active' : '')}
                      onClick={onQuickDesignInternalArchive}
                      tone="ghost"
                    >
                      创建或打开内置 BI
                    </Button>
                    <Button
                      className={cx('bi-panel-action', isArchiveSection ? 'is-active' : '')}
                      onClick={() => onOpenArchiveTab('base')}
                      tone="ghost"
                    >
                      查看 BI 档案与版本
                    </Button>
                    <Button
                      className="bi-panel-action"
                      onClick={onQuickCreateExternalArchive}
                      tone="ghost"
                    >
                      新建外链 BI
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
                  <div className="bi-panel-empty bi-panel-empty-tight">
                    当前节点还没有绑定分析源资产。
                  </div>
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
                  <div className="bi-panel-empty bi-panel-empty-tight">
                    当前节点还没有 BI 档案。
                  </div>
                )}
              </section>

              <section className="bi-panel-section bi-panel-danger-section">
                <div className="bi-panel-section-header">
                  <div className="bi-panel-section-title">危险操作</div>
                </div>
                <div className="bi-panel-card bi-panel-card-danger">
                  <Button
                    className="bi-button-danger"
                    disabled={!canDeleteNode}
                    onClick={onDeleteNode}
                    tone="ghost"
                  >
                    删除节点
                  </Button>
                  <div className="bi-panel-note bi-panel-note-danger">{deleteHint}</div>
                </div>
              </section>
            </>
          ) : (
            <div className="bi-panel-empty">
              先在目录画布中选择一个节点。选中后，这里会按步骤告诉你先绑定分析源、再创建 BI、再生成和发布。
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

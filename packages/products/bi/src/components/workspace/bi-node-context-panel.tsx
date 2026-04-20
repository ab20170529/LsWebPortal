import { cx } from '@lserp/ui';

import type {
  DataAssetSavePayload,
  DatasourceSavePayload,
  DirectorySavePayload,
  GenerateDraftPayload,
  RegenerateVersionPayload,
  ScreenSavePayload,
  ShareCreatePayload,
} from '../../api/bi-api';
import type {
  BiDatasource,
  BiDirectoryNode,
  BiGenerationTask,
  BiPromptPreview,
  BiPromptTemplate,
  BiScreen,
  BiScreenDesignRecord,
  BiShareToken,
} from '../../types';
import { BiContextAssetsTab } from './bi-context-assets-tab';
import { BiContextInfoTab } from './bi-context-info-tab';
import { BiContextPromptTab } from './bi-context-prompt-tab';

type ContextTab = 'assets' | 'info' | 'prompt';

type BiNodeContextPanelProps = {
  boundDatasources: BiDatasource[];
  contextTab: ContextTab;
  datasources: BiDatasource[];
  designRecords: BiScreenDesignRecord[];
  generationTask: BiGenerationTask | null;
  isMutating: boolean;
  node: BiDirectoryNode | null;
  promptPreview: BiPromptPreview | null;
  promptTemplates: BiPromptTemplate[];
  screens: BiScreen[];
  selectedScreenId: number | null;
  shareTokens: BiShareToken[];
  onBindSources: (nodeId: number, datasourceIds: number[]) => Promise<void>;
  onCreateDatasource: (payload: DatasourceSavePayload) => Promise<void>;
  onCreateScreen: (payload: ScreenSavePayload) => Promise<void>;
  onCreateShareToken: (payload: ShareCreatePayload) => Promise<void>;
  onGenerateAssetBizComments: (assetId: number) => Promise<unknown>;
  onGenerateDraft: (payload: GenerateDraftPayload) => Promise<void>;
  onPreviewPrompt: (payload: {
    datasourceIds?: number[];
    nodeId: number;
    prompt: string;
    providerCode?: string;
    screenId?: number;
    templateCode?: string;
  }) => Promise<unknown>;
  onPublishGeneratedVersion: (screenId: number, versionId?: number | null) => Promise<void>;
  onPublishVersion: (screenId: number, versionId: number) => Promise<void>;
  onRegenerateVersion: (screenId: number, payload: RegenerateVersionPayload) => Promise<void>;
  onRevokeShareToken: (tokenId: number) => Promise<void>;
  onSaveAsset: (datasourceId: number, payload: DataAssetSavePayload, assetId?: number) => Promise<void>;
  onSaveSelectedNode: (id: number, payload: DirectorySavePayload) => Promise<void>;
  onSelectScreen: (screenId: number | null) => void;
  onTabChange: (tab: ContextTab) => void;
};

const TABS: Array<{ id: ContextTab; label: string }> = [
  { id: 'info', label: '节点信息' },
  { id: 'assets', label: '数据资产' },
  { id: 'prompt', label: 'AI 提示词' },
];

export function BiNodeContextPanel({
  boundDatasources,
  contextTab,
  datasources,
  designRecords,
  generationTask,
  isMutating,
  node,
  promptPreview,
  promptTemplates,
  screens,
  selectedScreenId,
  shareTokens,
  onBindSources,
  onCreateDatasource,
  onCreateScreen,
  onCreateShareToken,
  onGenerateAssetBizComments,
  onGenerateDraft,
  onPreviewPrompt,
  onPublishGeneratedVersion,
  onPublishVersion,
  onRegenerateVersion,
  onRevokeShareToken,
  onSaveAsset,
  onSaveSelectedNode,
  onSelectScreen,
  onTabChange,
}: BiNodeContextPanelProps) {
  return (
    <aside className="bi-context-panel">
      <div className="bi-context-panel-header">
        <div>
          <div className="bi-context-panel-title">节点工作区</div>
          <div className="bi-context-panel-subtitle">
            {node ? `正在设计 ${node.nodeName}` : '请先从画布中选择一个节点'}
          </div>
        </div>
      </div>

      <div className="bi-context-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={cx('bi-context-tab', contextTab === tab.id ? 'is-active' : '')}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bi-context-body">
        {contextTab === 'info' ? (
          <BiContextInfoTab isMutating={isMutating} node={node} onSaveSelectedNode={onSaveSelectedNode} />
        ) : null}

        {contextTab === 'assets' ? (
          <BiContextAssetsTab
            boundDatasources={boundDatasources}
            datasources={datasources}
            isMutating={isMutating}
            node={node}
            onBindSources={onBindSources}
            onCreateDatasource={onCreateDatasource}
            onCreateScreen={onCreateScreen}
            onCreateShareToken={onCreateShareToken}
            onGenerateBizComments={onGenerateAssetBizComments}
            onPublishVersion={onPublishVersion}
            onRevokeShareToken={onRevokeShareToken}
            onSaveAsset={onSaveAsset}
            onSelectScreen={onSelectScreen}
            screens={screens}
            selectedScreenId={selectedScreenId}
            shareTokens={shareTokens}
          />
        ) : null}

        {contextTab === 'prompt' ? (
          <BiContextPromptTab
            boundDatasources={boundDatasources}
            designRecords={designRecords}
            generationTask={generationTask}
            isMutating={isMutating}
            node={node}
            onGenerateDraft={onGenerateDraft}
            onPreviewPrompt={onPreviewPrompt}
            onPublishGeneratedVersion={onPublishGeneratedVersion}
            onRegenerateVersion={onRegenerateVersion}
            onSelectScreen={onSelectScreen}
            promptPreview={promptPreview}
            promptTemplates={promptTemplates}
            screens={screens}
            selectedScreenId={selectedScreenId}
          />
        ) : null}
      </div>
    </aside>
  );
}

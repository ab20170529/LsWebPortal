import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Button, cx } from '@lserp/ui';

import type {
  GenerateDraftPayload,
  RegenerateVersionPayload,
  ScreenSavePayload,
  ScreenVersionSavePayload,
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
import {
  collectAllowedTables,
  collectFieldCoverage,
  formatDateTime,
  getGenerationStatusLabel,
  getPublishModeLabel,
  getPublishedVersionId,
  getScreenDesignStatusLabel,
} from '../../utils/bi-directory';
import type { BiArchiveTab } from '../../utils/bi-workspace-view-state';
import { ExternalLinkIcon, HistoryIcon, PlayIcon, ShareIcon } from './bi-icons';

type BiArchiveManagementPanelProps = {
  activeTab: BiArchiveTab;
  allNodes: BiDirectoryNode[];
  boundDatasources: BiDatasource[];
  createPresetType: 'EXTERNAL' | 'INTERNAL' | null;
  designRecords: BiScreenDesignRecord[];
  generationTask: BiGenerationTask | null;
  isMutating: boolean;
  node: BiDirectoryNode | null;
  promptPreview: BiPromptPreview | null;
  promptTemplates: BiPromptTemplate[];
  screens: BiScreen[];
  selectedScreenId: number | null;
  shareTokens: BiShareToken[];
  onActiveTabChange: (tab: BiArchiveTab) => void;
  onClearCreatePreset: () => void;
  onCreateScreen: (payload: ScreenSavePayload) => Promise<BiScreen | void>;
  onCreateShareToken: (payload: ShareCreatePayload) => Promise<void>;
  onGenerateDraft: (payload: GenerateDraftPayload) => Promise<void>;
  onPreviewPrompt: (payload: {
    datasourceIds?: number[];
    nodeId: number;
    prompt: string;
    providerCode?: string;
    screenId?: number;
    sourceAssetIds?: number[];
    templateCode?: string;
  }) => Promise<unknown>;
  onPublishGeneratedVersion: (screenId: number, versionId?: number | null) => Promise<void>;
  onPublishVersion: (screenId: number, versionId: number) => Promise<void>;
  onRegenerateVersion: (screenId: number, payload: RegenerateVersionPayload) => Promise<void>;
  onRevokeShareToken: (tokenId: number) => Promise<void>;
  onSaveScreenVersion: (screenId: number, payload: ScreenVersionSavePayload) => Promise<void>;
  onSelectNode: (nodeId: number | null) => void;
  onSelectScreen: (screenId: number | null) => void;
  onUpdateScreen: (screenId: number, payload: ScreenSavePayload) => Promise<BiScreen | void>;
};

type ArchiveBaseFormState = {
  accessMode: string;
  biType: 'EXTERNAL' | 'INTERNAL';
  businessNote: string;
  designMetaText: string;
  designNote: string;
  externalAllowFullscreen: boolean;
  externalOpenMode: string;
  externalQueryParamMappingText: string;
  externalSandboxPolicy: string;
  externalTargetUrl: string;
  latestDesignPrompt: string;
  name: string;
  screenCode: string;
};

type VersionFormState = {
  externalConfigText: string;
  filtersText: string;
  id: number | null;
  moduleLayoutText: string;
  modulesText: string;
  pageSchemaText: string;
  theme: string;
};

const ARCHIVE_TABS: Array<{ id: BiArchiveTab; label: string }> = [
  { id: 'base', label: '基础信息' },
  { id: 'versions', label: '版本管理' },
  { id: 'design', label: '设计与生成' },
  { id: 'sharing', label: '发布分享' },
];

const ACCESS_MODE_OPTIONS = [
  { label: '登录后访问', value: 'LOGIN_REQUIRED' },
  { label: '允许分享访问', value: 'SHARE_ALLOWED' },
  { label: '公开访问', value: 'PUBLIC' },
];

const DEFAULT_PROMPT =
  '请基于当前节点绑定的分析源资产，生成一份可用于经营分析的 BI 设计草稿，突出核心指标、趋势、异常和区域对比。';

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toJsonText(value: unknown) {
  if (value == null) {
    return '';
  }
  return JSON.stringify(value, null, 2);
}

function parseJsonText<T>(value: string, fallback: T): T {
  if (!value.trim()) {
    return fallback;
  }
  return JSON.parse(value) as T;
}

function resolveDesignBriefValue(screen: BiScreen | null, key: string) {
  const value = screen?.designBrief?.[key];
  return typeof value === 'string' ? value : '';
}

function buildEmptyBaseForm(node: BiDirectoryNode | null, biType: 'EXTERNAL' | 'INTERNAL'): ArchiveBaseFormState {
  const baseCode = slugifyCode(node?.nodeCode || node?.nodeName || 'bi_archive') || 'bi_archive';
  return {
    accessMode: 'LOGIN_REQUIRED',
    biType,
    businessNote: '',
    designMetaText: '',
    designNote: '',
    externalAllowFullscreen: true,
    externalOpenMode: 'iframe',
    externalQueryParamMappingText: '{}',
    externalSandboxPolicy: 'allow-same-origin allow-scripts allow-forms',
    externalTargetUrl: '',
    latestDesignPrompt: '',
    name: node ? `${node.nodeName}${biType === 'EXTERNAL' ? '外链' : '内置'}BI` : '',
    screenCode: `${baseCode}_${biType === 'EXTERNAL' ? 'external' : 'internal'}`,
  };
}

function mapBaseForm(screen: BiScreen | null, node: BiDirectoryNode | null, presetType: 'EXTERNAL' | 'INTERNAL' | null) {
  if (!screen) {
    return buildEmptyBaseForm(node, presetType ?? 'INTERNAL');
  }
  const currentVersion =
    screen.versions.find((version) => version.id === screen.currentVersionId) ?? screen.versions[0] ?? null;
  const externalConfig = currentVersion?.externalConfig ?? {};
  return {
    accessMode: screen.accessMode ?? 'LOGIN_REQUIRED',
    biType: (screen.biType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL') as 'EXTERNAL' | 'INTERNAL',
    businessNote: resolveDesignBriefValue(screen, 'businessNote'),
    designMetaText: toJsonText(screen.designMeta),
    designNote: resolveDesignBriefValue(screen, 'designNote'),
    externalAllowFullscreen: Boolean(externalConfig.allowFullscreen ?? true),
    externalOpenMode:
      typeof externalConfig.openMode === 'string' ? externalConfig.openMode : 'iframe',
    externalQueryParamMappingText: toJsonText(externalConfig.queryParamMapping ?? {}),
    externalSandboxPolicy:
      typeof externalConfig.sandboxPolicy === 'string'
        ? externalConfig.sandboxPolicy
        : 'allow-same-origin allow-scripts allow-forms',
    externalTargetUrl:
      typeof externalConfig.targetUrl === 'string' ? externalConfig.targetUrl : '',
    latestDesignPrompt: screen.latestDesignPrompt ?? '',
    name: screen.name,
    screenCode: screen.screenCode,
  };
}

function mapVersionForm(screen: BiScreen | null, versionId: number | null): VersionFormState {
  const version =
    screen?.versions.find((item) => item.id === versionId) ??
    screen?.versions.find((item) => item.id === screen.currentVersionId) ??
    screen?.versions[0] ??
    null;
  return {
    externalConfigText: toJsonText(version?.externalConfig),
    filtersText: toJsonText(version?.filters ?? []),
    id: version?.id ?? null,
    moduleLayoutText: toJsonText(version?.moduleLayout),
    modulesText: toJsonText(version?.modules ?? []),
    pageSchemaText: toJsonText(version?.pageSchema),
    theme: version?.theme ?? (screen?.biType === 'EXTERNAL' ? 'external' : 'enterprise'),
  };
}

function buildExternalConfig(form: ArchiveBaseFormState) {
  return {
    allowFullscreen: form.externalAllowFullscreen,
    openMode: form.externalOpenMode,
    queryParamMapping: parseJsonText<Record<string, unknown>>(form.externalQueryParamMappingText, {}),
    sandboxPolicy: form.externalSandboxPolicy.trim() || undefined,
    targetUrl: form.externalTargetUrl.trim(),
    title: form.name.trim(),
  };
}

function buildScreenPayload(
  form: ArchiveBaseFormState,
  nodeId: number,
  includeExternalDraft: boolean,
): ScreenSavePayload {
  return {
    accessMode: form.accessMode,
    biType: form.biType,
    designBrief: {
      businessNote: form.businessNote.trim(),
      designNote: form.designNote.trim(),
    },
    designMeta: parseJsonText<Record<string, unknown>>(form.designMetaText, {}),
    latestDesignPrompt: form.latestDesignPrompt.trim() || undefined,
    name: form.name.trim(),
    nodeId,
    screenCode: form.screenCode.trim(),
    ...(includeExternalDraft && form.biType === 'EXTERNAL'
      ? {
          versionDraft: {
            externalConfig: buildExternalConfig(form),
            filters: [],
            publishNow: false,
            theme: 'external',
          },
        }
      : {}),
  };
}

function buildVersionPayload(form: VersionFormState): ScreenVersionSavePayload {
  return {
    externalConfig: parseJsonText<Record<string, unknown>>(form.externalConfigText, {}),
    filters: parseJsonText<Array<Record<string, unknown>>>(form.filtersText, []),
    ...(form.id ? { id: form.id } : {}),
    moduleLayout: parseJsonText<Record<string, unknown>>(form.moduleLayoutText, {}),
    modules: parseJsonText<Array<Record<string, unknown>>>(form.modulesText, []),
    pageSchema: parseJsonText<Record<string, unknown>>(form.pageSchemaText, {}),
    publishNow: false,
    theme: form.theme.trim() || undefined,
  };
}

export function BiArchiveManagementPanel({
  activeTab,
  allNodes,
  boundDatasources,
  createPresetType,
  designRecords,
  generationTask,
  isMutating,
  node,
  promptPreview,
  promptTemplates,
  screens,
  selectedScreenId,
  shareTokens,
  onActiveTabChange,
  onClearCreatePreset,
  onCreateScreen,
  onCreateShareToken,
  onGenerateDraft,
  onPreviewPrompt,
  onPublishGeneratedVersion,
  onPublishVersion,
  onRegenerateVersion,
  onRevokeShareToken,
  onSaveScreenVersion,
  onSelectNode,
  onSelectScreen,
  onUpdateScreen,
}: BiArchiveManagementPanelProps) {
  const [baseForm, setBaseForm] = useState<ArchiveBaseFormState>(
    buildEmptyBaseForm(node, createPresetType ?? 'INTERNAL'),
  );
  const [versionForm, setVersionForm] = useState<VersionFormState>(mapVersionForm(null, null));
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [manualPrompt, setManualPrompt] = useState(DEFAULT_PROMPT);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('');
  const [versionEditingMode, setVersionEditingMode] = useState<'create' | 'edit'>('edit');

  const selectedScreen = useMemo(
    () => screens.find((screen) => screen.id === selectedScreenId) ?? null,
    [screens, selectedScreenId],
  );
  const selectedTemplate = useMemo(
    () =>
      promptTemplates.find((template) => template.templateCode === selectedTemplateCode) ??
      promptTemplates.find((template) => template.defaultTemplate) ??
      promptTemplates[0] ??
      null,
    [promptTemplates, selectedTemplateCode],
  );
  const datasourceIds = useMemo(() => boundDatasources.map((datasource) => datasource.id), [boundDatasources]);
  const sourceAssetIds = useMemo(
    () => boundDatasources.flatMap((datasource) => datasource.assets.map((asset) => asset.id)),
    [boundDatasources],
  );
  const allowedTables = useMemo(() => collectAllowedTables(boundDatasources), [boundDatasources]);
  const fieldCoverage = useMemo(() => collectFieldCoverage(boundDatasources), [boundDatasources]);

  useEffect(() => {
    if (!selectedTemplateCode && selectedTemplate?.templateCode) {
      setSelectedTemplateCode(selectedTemplate.templateCode);
    }
  }, [selectedTemplate, selectedTemplateCode]);

  useEffect(() => {
    setBaseForm(mapBaseForm(selectedScreen, node, createPresetType));
  }, [createPresetType, node, selectedScreen]);

  useEffect(() => {
    const nextVersionId =
      selectedScreen?.versions.find((version) => version.id === selectedScreen?.currentVersionId)?.id ??
      selectedScreen?.versions[0]?.id ??
      null;
    setVersionForm(mapVersionForm(selectedScreen, nextVersionId));
    setVersionEditingMode(nextVersionId ? 'edit' : 'create');
  }, [selectedScreen]);

  useEffect(() => {
    if (selectedScreen) {
      setManualPrompt(selectedScreen.latestDesignPrompt ?? DEFAULT_PROMPT);
      return;
    }
    setManualPrompt(DEFAULT_PROMPT);
  }, [selectedScreen]);

  async function handleSaveArchiveBase() {
    if (!node) {
      return;
    }

    try {
      const includeExternalDraft = !selectedScreen && baseForm.biType === 'EXTERNAL';
      const payload = buildScreenPayload(baseForm, node.id, includeExternalDraft);
      const saved =
        selectedScreen ? await onUpdateScreen(selectedScreen.id, payload) : await onCreateScreen(payload);

      if (saved && typeof saved === 'object' && 'id' in saved) {
        const savedScreen = saved as BiScreen;
        onSelectScreen(savedScreen.id);
        onClearCreatePreset();
        if (baseForm.biType === 'EXTERNAL') {
          await onSaveScreenVersion(savedScreen.id, {
            ...(savedScreen.currentVersionId ? { id: savedScreen.currentVersionId } : {}),
            externalConfig: buildExternalConfig(baseForm),
            filters: [],
            moduleLayout: {},
            modules: [],
            pageSchema: {
              title: baseForm.name.trim(),
            },
            publishNow: false,
            theme: 'external',
          });
        }
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'JSON 格式不正确，请检查后再保存。');
    }
  }

  async function handleSaveVersion(screenId: number) {
    try {
      await onSaveScreenVersion(screenId, buildVersionPayload(versionForm));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '版本 JSON 格式不正确，请检查后再保存。');
    }
  }

  const canSaveArchive =
    Boolean(node) && baseForm.name.trim().length > 0 && baseForm.screenCode.trim().length > 0;

  return (
    <section className="bi-management-panel">
      <div className="bi-management-header">
        <div>
          <div className="bi-management-title">BI 档案管理</div>
          <div className="bi-management-subtitle">
            管理节点绑定的 BI 档案、版本、AI 设计记录、发布与分享入口。
          </div>
        </div>
        <div className="bi-management-header-actions">
          <label className="bi-management-selector">
            <span>当前节点</span>
            <select
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onSelectNode(event.target.value ? Number(event.target.value) : null)
              }
              value={node?.id ?? ''}
            >
              {allNodes.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${'　'.repeat(Math.max(0, Number(item.level ?? 1) - 1))}${item.nodeName}`}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={!node}
            onClick={() => {
              onSelectScreen(null);
              onClearCreatePreset();
              setBaseForm(buildEmptyBaseForm(node, 'INTERNAL'));
              onActiveTabChange('base');
            }}
            tone="ghost"
          >
            新建内置 BI
          </Button>
          <Button
            disabled={!node}
            onClick={() => {
              onSelectScreen(null);
              setBaseForm(buildEmptyBaseForm(node, 'EXTERNAL'));
              onActiveTabChange('base');
            }}
            tone="ghost"
          >
            新建外链 BI
          </Button>
        </div>
      </div>

      <div className="bi-management-layout bi-management-layout-wide">
        <section className="bi-panel-card bi-management-column">
          <div className="bi-panel-card-header">
            <div>
              <div className="bi-panel-card-title">档案列表</div>
              <div className="bi-panel-card-subtitle">
                {node ? `当前节点下共 ${screens.length} 个档案` : '请先选择一个节点'}
              </div>
            </div>
          </div>
          <div className="bi-stack-list">
            {screens.map((screen) => (
              <button
                key={screen.id}
                className={cx('bi-side-card', screen.id === selectedScreenId ? 'is-selected' : '')}
                onClick={() => onSelectScreen(screen.id)}
                type="button"
              >
                <div className="bi-side-card-header">
                  <div>
                    <div className="bi-side-card-title">{screen.name}</div>
                    <div className="bi-side-card-subtitle">{screen.screenCode}</div>
                  </div>
                  <Badge tone="brand">{screen.biType === 'EXTERNAL' ? '外链 BI' : '内置 BI'}</Badge>
                </div>
                <div className="bi-side-card-meta">
                  设计状态：{getScreenDesignStatusLabel(screen.designStatus)} / 已发布版本：
                  {getPublishedVersionId(screen) ?? '未发布'}
                </div>
              </button>
            ))}
            {screens.length === 0 ? (
              <div className="bi-panel-empty">当前节点还没有 BI 档案，可以先创建内置 BI 或外链 BI。</div>
            ) : null}
          </div>
        </section>

        <section className="bi-panel-scroll">
          <div className="bi-context-tabs bi-context-tabs-wide">
            {ARCHIVE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={cx('bi-context-tab', activeTab === tab.id ? 'is-active' : '')}
                onClick={() => onActiveTabChange(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'base' ? (
            <div className="bi-panel-card">
              <div className="bi-panel-card-header">
                <div>
                  <div className="bi-panel-card-title">档案基础信息</div>
                  <div className="bi-panel-card-subtitle">
                    维护档案类型、访问方式、业务说明、设计说明与外链配置。
                  </div>
                </div>
                {selectedScreen ? (
                  <span className="bi-node-card-status">{getScreenDesignStatusLabel(selectedScreen.designStatus)}</span>
                ) : null}
              </div>

              <div className="bi-panel-form">
                <div className="bi-form-grid bi-form-grid-2">
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">档案名称</span>
                    <input
                      aria-label="档案名称"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setBaseForm((current) => ({ ...current, name: event.target.value }))
                      }
                      value={baseForm.name}
                    />
                  </label>
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">档案编码</span>
                    <input
                      aria-label="档案编码"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setBaseForm((current) => ({ ...current, screenCode: event.target.value }))
                      }
                      value={baseForm.screenCode}
                    />
                  </label>
                </div>

                <div className="bi-form-grid bi-form-grid-2">
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">BI 类型</span>
                    <select
                      aria-label="BI 类型"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setBaseForm((current) => ({
                          ...current,
                          biType: event.target.value === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL',
                        }))
                      }
                      value={baseForm.biType}
                    >
                      <option value="INTERNAL">内置 BI</option>
                      <option value="EXTERNAL">外链 BI</option>
                    </select>
                  </label>
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">访问方式</span>
                    <select
                      aria-label="访问方式"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setBaseForm((current) => ({ ...current, accessMode: event.target.value }))
                      }
                      value={baseForm.accessMode}
                    >
                      {ACCESS_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="bi-panel-field">
                  <span className="bi-panel-label">业务说明</span>
                  <textarea
                    aria-label="业务说明"
                    className="bi-panel-textarea"
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setBaseForm((current) => ({ ...current, businessNote: event.target.value }))
                    }
                    value={baseForm.businessNote}
                  />
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">设计说明</span>
                  <textarea
                    aria-label="设计说明"
                    className="bi-panel-textarea"
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setBaseForm((current) => ({ ...current, designNote: event.target.value }))
                    }
                    value={baseForm.designNote}
                  />
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">最近一次设计提示词</span>
                  <textarea
                    aria-label="最近一次设计提示词"
                    className="bi-panel-textarea"
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setBaseForm((current) => ({ ...current, latestDesignPrompt: event.target.value }))
                    }
                    value={baseForm.latestDesignPrompt}
                  />
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">扩展元信息 JSON</span>
                  <textarea
                    aria-label="扩展元信息 JSON"
                    className="bi-panel-textarea bi-panel-code"
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      setBaseForm((current) => ({ ...current, designMetaText: event.target.value }))
                    }
                    placeholder='例如：{"owner":"分析团队","category":"经营分析"}'
                    value={baseForm.designMetaText}
                  />
                </label>

                {baseForm.biType === 'EXTERNAL' ? (
                  <div className="bi-panel-card bi-panel-card-muted">
                    <div className="bi-panel-card-title">外链配置</div>
                    <div className="bi-form-grid bi-form-grid-2">
                      <label className="bi-panel-field">
                        <span className="bi-panel-label">外链地址</span>
                        <input
                          aria-label="外链地址"
                          className="bi-panel-input"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setBaseForm((current) => ({ ...current, externalTargetUrl: event.target.value }))
                          }
                          value={baseForm.externalTargetUrl}
                        />
                      </label>
                      <label className="bi-panel-field">
                        <span className="bi-panel-label">打开方式</span>
                        <select
                          aria-label="打开方式"
                          className="bi-panel-input"
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            setBaseForm((current) => ({ ...current, externalOpenMode: event.target.value }))
                          }
                          value={baseForm.externalOpenMode}
                        >
                          <option value="iframe">页面内嵌（iframe）</option>
                          <option value="new-tab">新标签打开</option>
                        </select>
                      </label>
                    </div>
                    <label className="bi-panel-field">
                      <span className="bi-panel-label">沙箱策略</span>
                      <input
                        aria-label="沙箱策略"
                        className="bi-panel-input"
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setBaseForm((current) => ({ ...current, externalSandboxPolicy: event.target.value }))
                        }
                        value={baseForm.externalSandboxPolicy}
                      />
                    </label>
                    <label className="bi-panel-field">
                      <span className="bi-panel-label">查询参数映射 JSON</span>
                      <textarea
                        aria-label="查询参数映射 JSON"
                        className="bi-panel-textarea bi-panel-code"
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          setBaseForm((current) => ({
                            ...current,
                            externalQueryParamMappingText: event.target.value,
                          }))
                        }
                        value={baseForm.externalQueryParamMappingText}
                      />
                    </label>
                    <label className="bi-inline-check">
                      <input
                        checked={baseForm.externalAllowFullscreen}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setBaseForm((current) => ({
                            ...current,
                            externalAllowFullscreen: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      允许全屏
                    </label>
                  </div>
                ) : null}

                <div className="bi-panel-inline-actions">
                  <Button disabled={isMutating || !canSaveArchive} onClick={() => void handleSaveArchiveBase()}>
                    {selectedScreen ? '保存档案信息' : '创建档案'}
                  </Button>
                  {selectedScreen ? (
                    <a className="bi-inline-link" href={`/bi/screen/${selectedScreen.screenCode}`} rel="noreferrer" target="_blank">
                      <PlayIcon className="bi-inline-icon" />
                      预览档案
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'versions' ? (
            <div className="bi-panel-card">
              <div className="bi-panel-card-header">
                <div>
                  <div className="bi-panel-card-title">版本管理</div>
                  <div className="bi-panel-card-subtitle">
                    可编辑页面结构、模块布局、过滤器、模块清单和外链配置。
                  </div>
                </div>
                {selectedScreen ? (
                  <button
                    className="bi-inline-link"
                    onClick={() => {
                      setVersionEditingMode('create');
                      setVersionForm({
                        ...mapVersionForm(selectedScreen, selectedScreen.currentVersionId ?? null),
                        id: null,
                      });
                    }}
                    type="button"
                  >
                    新建草稿版本
                  </button>
                ) : null}
              </div>

              {selectedScreen ? (
                <>
                  <div className="bi-stack-list">
                    {selectedScreen.versions.map((version) => (
                      <div
                        key={version.id}
                        className={cx(
                          'bi-side-card',
                          version.id === versionForm.id && versionEditingMode === 'edit' ? 'is-selected' : '',
                        )}
                      >
                        <div className="bi-side-card-header">
                          <div>
                            <div className="bi-side-card-title">v{version.versionNo ?? version.id}</div>
                            <div className="bi-side-card-subtitle">
                              {version.theme ?? '未设置主题'} / {version.generatedByAi ? 'AI 生成' : '手工维护'}
                            </div>
                          </div>
                          {version.published ? <Badge tone="brand">已发布</Badge> : null}
                        </div>
                        <div className="bi-side-card-actions">
                          <button
                            className="bi-chip-link"
                            onClick={() => {
                              setVersionEditingMode('edit');
                              setVersionForm(mapVersionForm(selectedScreen, version.id));
                            }}
                            type="button"
                          >
                            编辑
                          </button>
                          <button
                            className="bi-chip-link"
                            onClick={() => void onPublishVersion(selectedScreen.id, version.id)}
                            type="button"
                          >
                            {version.published ? '当前发布版本' : '发布此版本'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bi-panel-form bi-panel-form-spaced">
                    <div className="bi-form-grid bi-form-grid-2">
                      <label className="bi-panel-field">
                        <span className="bi-panel-label">主题</span>
                        <input
                          aria-label="版本主题"
                          className="bi-panel-input"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setVersionForm((current) => ({ ...current, theme: event.target.value }))
                          }
                          value={versionForm.theme}
                        />
                      </label>
                      <label className="bi-panel-field">
                        <span className="bi-panel-label">编辑模式</span>
                        <input
                          aria-label="版本编辑模式"
                          className="bi-panel-input"
                          readOnly
                          value={versionEditingMode === 'create' ? '新建草稿版本' : '编辑已有版本'}
                        />
                      </label>
                    </div>

                    <JsonEditor
                      label="页面结构 JSON"
                      value={versionForm.pageSchemaText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, pageSchemaText: value }))}
                    />
                    <JsonEditor
                      label="模块布局 JSON"
                      value={versionForm.moduleLayoutText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, moduleLayoutText: value }))}
                    />
                    <JsonEditor
                      label="过滤器 JSON"
                      value={versionForm.filtersText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, filtersText: value }))}
                    />
                    <JsonEditor
                      label="模块定义 JSON"
                      value={versionForm.modulesText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, modulesText: value }))}
                    />
                    <JsonEditor
                      label="外链配置 JSON"
                      value={versionForm.externalConfigText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, externalConfigText: value }))}
                    />

                    <div className="bi-panel-inline-actions">
                      <Button
                        disabled={isMutating}
                        onClick={() => void handleSaveVersion(selectedScreen.id)}
                      >
                        {versionEditingMode === 'create' ? '保存为新版本' : '保存当前版本'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bi-panel-empty">请先选择一个 BI 档案，再进行版本管理。</div>
              )}
            </div>
          ) : null}

          {activeTab === 'design' ? (
            <>
              <div className="bi-panel-card">
                <div className="bi-panel-card-header">
                  <div>
                    <div className="bi-panel-card-title">AI 设计与生成</div>
                    <div className="bi-panel-card-subtitle">
                      从当前节点直接设计内置 BI，AI 生成和手工设计共用同一份版本内容。
                    </div>
                  </div>
                  <span className="bi-node-card-status">{getGenerationStatusLabel(generationTask?.status)}</span>
                </div>

                {node ? (
                  <div className="bi-prompt-box">
                    <div>
                      <span className="bi-prompt-key">节点</span>
                      <span className="bi-prompt-value">{node.nodeName}</span>
                    </div>
                    <div>
                      <span className="bi-prompt-key">分析源资产</span>
                      <span className="bi-prompt-value">
                        {boundDatasources
                          .flatMap((datasource) => datasource.assets.map((asset) => asset.assetName))
                          .join('，') || '当前节点没有绑定分析源资产'}
                      </span>
                    </div>
                    <div>
                      <span className="bi-prompt-key">允许表</span>
                      <span className="bi-prompt-value">{allowedTables.join('，') || '未声明允许表'}</span>
                    </div>
                    <div>
                      <span className="bi-prompt-key">字段覆盖</span>
                      <span className="bi-prompt-value">{fieldCoverage.length} 个字段说明</span>
                    </div>
                  </div>
                ) : (
                  <div className="bi-panel-empty">请先选择一个节点，再开始设计内置 BI。</div>
                )}

                <div className="bi-panel-form">
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">提示词模板</span>
                    <select
                      aria-label="提示词模板"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedTemplateCode(event.target.value)}
                      value={selectedTemplate?.templateCode ?? ''}
                    >
                      {promptTemplates.map((template) => (
                        <option key={template.id} value={template.templateCode}>
                          {template.templateName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">业务提示词</span>
                    <textarea
                      aria-label="业务提示词"
                      className="bi-panel-textarea"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setManualPrompt(event.target.value)}
                      value={manualPrompt}
                    />
                  </label>
                  <div className="bi-panel-note">
                    当前可用上下文：{sourceAssetIds.length} 个分析源资产，{allowedTables.length} 张允许表，{fieldCoverage.length}{' '}
                    个字段说明。
                  </div>
                  <div className="bi-panel-inline-actions">
                    <Button
                      disabled={isMutating || !node || sourceAssetIds.length === 0}
                      onClick={() =>
                        node
                          ? onPreviewPrompt({
                              datasourceIds,
                              nodeId: node.id,
                              prompt: manualPrompt,
                              providerCode: selectedTemplate?.providerCode ?? 'RULE_BASED',
                              ...(selectedScreen ? { screenId: selectedScreen.id } : {}),
                              sourceAssetIds,
                              ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                            })
                          : Promise.resolve()
                      }
                      tone="ghost"
                    >
                      预览提示词
                    </Button>
                    <Button
                      disabled={isMutating || !node || sourceAssetIds.length === 0}
                      onClick={() =>
                        node
                          ? onGenerateDraft({
                              datasourceIds,
                              nodeId: node.id,
                              prompt: manualPrompt,
                              providerCode: selectedTemplate?.providerCode ?? 'RULE_BASED',
                              publishMode: 'DRAFT',
                              ...(selectedScreen ? { screenId: selectedScreen.id } : {}),
                              screenCode: baseForm.screenCode.trim(),
                              screenName: baseForm.name.trim(),
                              sourceAssetIds,
                              ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                            })
                          : Promise.resolve()
                      }
                    >
                      生成草稿
                    </Button>
                    <Button
                      disabled={!selectedScreen || isMutating || sourceAssetIds.length === 0}
                      onClick={() =>
                        selectedScreen
                          ? onRegenerateVersion(selectedScreen.id, {
                              datasourceIds,
                              prompt: manualPrompt,
                              providerCode: selectedTemplate?.providerCode ?? 'RULE_BASED',
                              publishMode: 'DRAFT',
                              sourceAssetIds,
                              ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                            })
                          : Promise.resolve()
                      }
                      tone="ghost"
                    >
                      重新生成
                    </Button>
                  </div>
                </div>

                {promptPreview ? (
                  <div className="bi-panel-card bi-panel-card-muted">
                    <div className="bi-panel-card-title">提示词预览</div>
                    <pre className="bi-code-box">{promptPreview.userPrompt ?? promptPreview.systemPrompt ?? ''}</pre>
                  </div>
                ) : null}

                {generationTask ? (
                  <div className="bi-panel-card bi-panel-card-muted">
                    <div className="bi-task-grid">
                      <div className="bi-task-item">
                        <span className="bi-task-label">任务号</span>
                        <span className="bi-task-value">#{generationTask.id}</span>
                      </div>
                      <div className="bi-task-item">
                        <span className="bi-task-label">模型</span>
                        <span className="bi-task-value">{generationTask.modelName ?? '-'}</span>
                      </div>
                      <div className="bi-task-item">
                        <span className="bi-task-label">提供方</span>
                        <span className="bi-task-value">{generationTask.providerCode ?? 'AUTO'}</span>
                      </div>
                      <div className="bi-task-item">
                        <span className="bi-task-label">发布模式</span>
                        <span className="bi-task-value">{getPublishModeLabel(generationTask.publishMode)}</span>
                      </div>
                    </div>
                    {generationTask.result ? (
                      <pre className="bi-code-box">{JSON.stringify(generationTask.result, null, 2)}</pre>
                    ) : null}
                    <div className="bi-panel-inline-actions">
                      <Button
                        disabled={!generationTask.screenId || !generationTask.versionId || isMutating}
                        onClick={() =>
                          generationTask.screenId
                            ? onPublishGeneratedVersion(
                                generationTask.screenId,
                                generationTask.versionId ?? undefined,
                              )
                            : Promise.resolve()
                        }
                      >
                        发布生成版本
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bi-panel-card">
                <div className="bi-panel-card-header">
                  <div>
                    <div className="bi-panel-card-title">手工编辑当前版本</div>
                    <div className="bi-panel-card-subtitle">
                      不依赖 AI 也可以直接维护页面结构、布局、过滤器和模块定义。
                    </div>
                  </div>
                  <HistoryIcon className="bi-inline-icon bi-inline-icon-muted" />
                </div>
                {selectedScreen ? (
                  <div className="bi-panel-form">
                    <JsonEditor
                      label="页面结构 JSON"
                      value={versionForm.pageSchemaText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, pageSchemaText: value }))}
                    />
                    <JsonEditor
                      label="模块布局 JSON"
                      value={versionForm.moduleLayoutText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, moduleLayoutText: value }))}
                    />
                    <JsonEditor
                      label="过滤器 JSON"
                      value={versionForm.filtersText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, filtersText: value }))}
                    />
                    <JsonEditor
                      label="模块定义 JSON"
                      value={versionForm.modulesText}
                      onChange={(value) => setVersionForm((current) => ({ ...current, modulesText: value }))}
                    />
                    <div className="bi-panel-inline-actions">
                      <Button
                        disabled={isMutating}
                        onClick={() => void handleSaveVersion(selectedScreen.id)}
                      >
                        保存当前版本内容
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bi-panel-empty">请先选择一个档案，再进行内置 BI 的版本编辑。</div>
                )}
              </div>

              <div className="bi-panel-card">
                <div className="bi-panel-card-header">
                  <div>
                    <div className="bi-panel-card-title">设计记录</div>
                    <div className="bi-panel-card-subtitle">{designRecords.length} 条记录</div>
                  </div>
                </div>
                {designRecords.length > 0 ? (
                  <div className="bi-stack-list">
                    {designRecords.map((record) => (
                      <div key={record.id} className="bi-history-card">
                        <div className="bi-side-card-header">
                          <div>
                            <div className="bi-side-card-title">{record.templateCode ?? '未命名模板'}</div>
                            <div className="bi-side-card-subtitle">
                              {record.providerCode ?? 'AUTO'} / {formatDateTime(record.createTime)}
                            </div>
                          </div>
                          <Badge tone="neutral">{record.status ?? 'CREATED'}</Badge>
                        </div>
                        <div className="bi-history-summary">{record.resultSummary ?? '暂无摘要'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bi-panel-empty">当前档案还没有设计记录。</div>
                )}
              </div>
            </>
          ) : null}

          {activeTab === 'sharing' ? (
            <div className="bi-panel-card">
              <div className="bi-panel-card-header">
                <div>
                  <div className="bi-panel-card-title">发布与分享</div>
                  <div className="bi-panel-card-subtitle">
                    集中查看节点直达、档案直达和分享链接，不再散落在右侧小卡片里。
                  </div>
                </div>
                {selectedScreen?.biType === 'EXTERNAL' ? (
                  <ExternalLinkIcon className="bi-inline-icon bi-inline-icon-muted" />
                ) : (
                  <ShareIcon className="bi-inline-icon bi-inline-icon-muted" />
                )}
              </div>

              {selectedScreen ? (
                <div className="bi-panel-form">
                  <div className="bi-info-grid">
                    <div className="bi-info-item">
                      <span className="bi-info-label">节点直达</span>
                      <a className="bi-inline-link" href={`/bi/node/${node?.nodeCode ?? ''}`} rel="noreferrer" target="_blank">
                        /bi/node/{node?.nodeCode ?? ''}
                      </a>
                    </div>
                    <div className="bi-info-item">
                      <span className="bi-info-label">档案直达</span>
                      <a className="bi-inline-link" href={`/bi/screen/${selectedScreen.screenCode}`} rel="noreferrer" target="_blank">
                        /bi/screen/{selectedScreen.screenCode}
                      </a>
                    </div>
                  </div>

                  <label className="bi-panel-field">
                    <span className="bi-panel-label">分享失效时间</span>
                    <input
                      aria-label="分享失效时间"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setShareExpiresAt(event.target.value)}
                      type="datetime-local"
                      value={shareExpiresAt}
                    />
                  </label>
                  <div className="bi-panel-inline-actions">
                    <Button
                      disabled={isMutating}
                      onClick={async () => {
                        await onCreateShareToken({
                          ...(shareExpiresAt
                            ? { expiresAt: new Date(shareExpiresAt).toISOString() }
                            : {}),
                          screenId: selectedScreen.id,
                        });
                        setShareExpiresAt('');
                      }}
                    >
                      创建分享链接
                    </Button>
                  </div>

                  {shareTokens.length > 0 ? (
                    <div className="bi-stack-list">
                      {shareTokens.map((token) => (
                        <div key={token.id} className="bi-token-card">
                          <div className="bi-side-card-header">
                            <div>
                              <div className="bi-side-card-title bi-side-card-title-small">{token.tokenValue}</div>
                              <div className="bi-side-card-subtitle">
                                {token.expiresAt ? formatDateTime(token.expiresAt) : '长期有效'} /{' '}
                                {token.status ?? 'ACTIVE'}
                              </div>
                            </div>
                            <a className="bi-inline-link" href={`/bi/share/${token.tokenValue}`} rel="noreferrer" target="_blank">
                              打开分享页
                            </a>
                          </div>
                          <button
                            className="bi-inline-link"
                            onClick={() => void onRevokeShareToken(token.id)}
                            type="button"
                          >
                            吊销链接
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bi-panel-empty">当前档案还没有分享链接。</div>
                  )}
                </div>
              ) : (
                <div className="bi-panel-empty">请先选择一个档案，再进行发布与分享管理。</div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function JsonEditor({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="bi-panel-field">
      <span className="bi-panel-label">{label}</span>
      <textarea
        aria-label={label}
        className="bi-panel-textarea bi-panel-code"
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

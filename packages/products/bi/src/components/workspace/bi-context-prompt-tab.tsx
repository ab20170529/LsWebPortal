import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Button } from '@lserp/ui';

import type { GenerateDraftPayload, RegenerateVersionPayload } from '../../api/bi-api';
import type {
  BiDatasource,
  BiDirectoryNode,
  BiGenerationTask,
  BiPromptPreview,
  BiPromptTemplate,
  BiScreen,
  BiScreenDesignRecord,
} from '../../types';
import {
  collectAllowedTables,
  collectFieldCoverage,
  formatDateTime,
  getGenerationStatusLabel,
  getPublishModeLabel,
  getScreenDesignStatusLabel,
} from '../../utils/bi-directory';
import { resolveScreenDraftSelection } from '../../utils/bi-workspace-state';

type BiContextPromptTabProps = {
  boundDatasources: BiDatasource[];
  designRecords: BiScreenDesignRecord[];
  generationTask: BiGenerationTask | null;
  isMutating: boolean;
  node: BiDirectoryNode | null;
  promptPreview: BiPromptPreview | null;
  promptTemplates: BiPromptTemplate[];
  screens: BiScreen[];
  selectedScreenId: number | null;
  onSelectScreen: (screenId: number | null) => void;
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
  onRegenerateVersion: (screenId: number, payload: RegenerateVersionPayload) => Promise<void>;
};

const DEFAULT_PROMPT =
  '请基于当前节点绑定的分析源与字段说明，生成一个适合企业管理层阅读的 BI 大屏草稿，突出核心指标、趋势变化、区域对比和异常提醒。';

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function BiContextPromptTab({
  boundDatasources,
  designRecords,
  generationTask,
  isMutating,
  node,
  promptPreview,
  promptTemplates,
  screens,
  selectedScreenId,
  onSelectScreen,
  onGenerateDraft,
  onPreviewPrompt,
  onPublishGeneratedVersion,
  onRegenerateVersion,
}: BiContextPromptTabProps) {
  const [manualPrompt, setManualPrompt] = useState(DEFAULT_PROMPT);
  const [screenCodeDraft, setScreenCodeDraft] = useState('');
  const [screenNameDraft, setScreenNameDraft] = useState('');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');

  const selectedTemplate = useMemo(
    () =>
      promptTemplates.find((template) => template.templateCode === selectedTemplateCode) ??
      promptTemplates.find((template) => template.defaultTemplate) ??
      promptTemplates[0] ??
      null,
    [promptTemplates, selectedTemplateCode],
  );
  const selectedScreen = useMemo(
    () => screens.find((screen) => screen.id === selectedScreenId) ?? null,
    [screens, selectedScreenId],
  );
  const datasourceIds = useMemo(() => boundDatasources.map((datasource) => datasource.id), [boundDatasources]);
  const allowedTables = useMemo(() => collectAllowedTables(boundDatasources), [boundDatasources]);
  const fieldCoverage = useMemo(() => collectFieldCoverage(boundDatasources), [boundDatasources]);
  const generatedScreenCode = useMemo(() => {
    const candidate = generationTask?.result?.screenCode;
    return typeof candidate === 'string' && candidate.trim()
      ? candidate.trim()
      : selectedScreen?.screenCode ?? screenCodeDraft;
  }, [generationTask?.result, screenCodeDraft, selectedScreen?.screenCode]);
  const providerCode = selectedTemplate?.providerCode ?? 'RULE_BASED';

  useEffect(() => {
    if (!selectedTemplateCode && selectedTemplate?.templateCode) {
      setSelectedTemplateCode(selectedTemplate.templateCode);
    }
  }, [selectedTemplate, selectedTemplateCode]);

  useEffect(() => {
    if (selectedScreen) {
      setScreenCodeDraft(selectedScreen.screenCode);
      setScreenNameDraft(selectedScreen.name);
      return;
    }
    if (node) {
      setScreenCodeDraft(`${slugifyCode(node.nodeCode || node.nodeName) || 'bi_screen'}_ai`);
      setScreenNameDraft(`${node.nodeName} AI 大屏`);
      return;
    }
    setScreenCodeDraft('');
    setScreenNameDraft('');
  }, [node, selectedScreen]);

  if (!node) {
    return (
      <div className="bi-panel-scroll">
        <div className="bi-panel-empty">
          先选择一个节点，再基于它绑定的分析源、字段资产和 BI 档案生成 AI 大屏草稿。
        </div>
      </div>
    );
  }

  return (
    <div className="bi-panel-scroll">
      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">AI 设计上下文</div>
          <div className="bi-panel-section-caption">
            {selectedScreen ? getScreenDesignStatusLabel(selectedScreen.designStatus) : '尚未选择档案'}
          </div>
        </div>

        <div className="bi-prompt-box">
          <div>
            <span className="bi-prompt-key">NODE</span>
            <span className="bi-prompt-value">{node.nodeName}</span>
          </div>
          <div>
            <span className="bi-prompt-key">DATASOURCE</span>
            <span className="bi-prompt-value">
              {boundDatasources.map((datasource) => datasource.name).join('、') || '未挂载分析源'}
            </span>
          </div>
          <div>
            <span className="bi-prompt-key">TABLES</span>
            <span className="bi-prompt-value">{allowedTables.join('、') || '无可用表'}</span>
          </div>
          <div>
            <span className="bi-prompt-key">TARGET</span>
            <span className="bi-prompt-value">{(selectedScreen?.name ?? screenNameDraft) || '新建档案'}</span>
          </div>
        </div>
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">生成控制</div>
          <div className="bi-panel-section-caption">默认仅生成草稿，发布需要人工确认</div>
        </div>

        <div className="bi-panel-form">
          <label className="bi-panel-field">
            <span className="bi-panel-label">提示词模板</span>
            <select
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
            <span className="bi-panel-label">目标 BI 档案</span>
            <select
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const selection = resolveScreenDraftSelection(screens, event.target.value);
                onSelectScreen(selection.screenId);
                setScreenCodeDraft(selection.screenCode);
                setScreenNameDraft(selection.screenName);
              }}
              value={selectedScreenId ?? ''}
            >
              <option value="">新建档案</option>
              {screens.map((screen) => (
                <option key={screen.id} value={screen.id}>
                  {screen.name}
                </option>
              ))}
            </select>
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">档案编码</span>
            <input
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenCodeDraft(event.target.value)}
              value={screenCodeDraft}
            />
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">档案名称</span>
            <input
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenNameDraft(event.target.value)}
              value={screenNameDraft}
            />
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">业务提示词</span>
            <textarea
              className="bi-panel-textarea"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setManualPrompt(event.target.value)}
              value={manualPrompt}
            />
          </label>

          <div className="bi-panel-note">
            当前上下文包含 {datasourceIds.length} 个分析源、{allowedTables.length} 张可访问表、{fieldCoverage.length} 个字段说明。
          </div>

          <div className="bi-panel-inline-actions">
            <Button
              disabled={isMutating || !manualPrompt.trim() || datasourceIds.length === 0}
              onClick={() =>
                onPreviewPrompt({
                  datasourceIds,
                  nodeId: node.id,
                  prompt: manualPrompt,
                  providerCode,
                  ...(selectedScreenId ? { screenId: selectedScreenId } : {}),
                  ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                })
              }
              tone="ghost"
            >
              预览提示词
            </Button>
            <Button
              disabled={isMutating || !manualPrompt.trim() || datasourceIds.length === 0}
              onClick={() =>
                onGenerateDraft({
                  datasourceIds,
                  nodeId: node.id,
                  prompt: manualPrompt,
                  providerCode,
                  publishMode: 'DRAFT',
                  ...(screenCodeDraft ? { screenCode: screenCodeDraft } : {}),
                  ...(selectedScreenId ? { screenId: selectedScreenId } : {}),
                  ...(screenNameDraft ? { screenName: screenNameDraft } : {}),
                  ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                })
              }
            >
              生成草稿
            </Button>
            <Button
              disabled={!selectedScreenId || isMutating || datasourceIds.length === 0}
              onClick={() =>
                selectedScreenId
                  ? onRegenerateVersion(selectedScreenId, {
                      datasourceIds,
                      prompt: manualPrompt,
                      providerCode,
                      publishMode: 'DRAFT',
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
          <div className="bi-panel-card">
            <div className="bi-panel-card-title">提示词预览</div>
            <pre className="bi-code-box">{promptPreview.userPrompt ?? promptPreview.systemPrompt ?? ''}</pre>
          </div>
        ) : null}
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">生成结果</div>
          <div className="bi-panel-section-caption">{getGenerationStatusLabel(generationTask?.status)}</div>
        </div>

        {generationTask ? (
          <div className="bi-panel-card">
            <div className="bi-task-grid">
              <div className="bi-task-item">
                <span className="bi-task-label">任务编号</span>
                <span className="bi-task-value">#{generationTask.id}</span>
              </div>
              <div className="bi-task-item">
                <span className="bi-task-label">Provider</span>
                <span className="bi-task-value">{generationTask.providerCode ?? 'AUTO'}</span>
              </div>
              <div className="bi-task-item">
                <span className="bi-task-label">模型</span>
                <span className="bi-task-value">{generationTask.modelName ?? '-'}</span>
              </div>
              <div className="bi-task-item">
                <span className="bi-task-label">发布方式</span>
                <span className="bi-task-value">{getPublishModeLabel(generationTask.publishMode)}</span>
              </div>
            </div>

            {generationTask.errorMessage ? <div className="bi-panel-error">{generationTask.errorMessage}</div> : null}
            {generationTask.result ? (
              <pre className="bi-code-box">{JSON.stringify(generationTask.result, null, 2)}</pre>
            ) : null}

            <div className="bi-panel-inline-actions">
              <Button
                disabled={!generationTask.screenId || !generationTask.versionId || isMutating}
                onClick={() =>
                  generationTask.screenId
                    ? onPublishGeneratedVersion(generationTask.screenId, generationTask.versionId ?? undefined)
                    : Promise.resolve()
                }
              >
                发布本次版本
              </Button>
              {generationTask.screenId && generatedScreenCode ? (
                <a className="bi-inline-link" href={`/bi/screen/${generatedScreenCode}`} rel="noreferrer" target="_blank">
                  打开预览
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bi-panel-empty bi-panel-empty-tight">
            生成任务会在这里记录请求、校验结果、版本号和当前发布状态。
          </div>
        )}
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">历史设计记录</div>
          <div className="bi-panel-section-caption">{designRecords.length} 条</div>
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
                  <Badge tone="neutral">{record.status ?? 'DRAFT_CREATED'}</Badge>
                </div>
                <div className="bi-history-summary">{record.resultSummary ?? '暂无摘要'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bi-panel-empty bi-panel-empty-tight">还没有 AI 设计记录。</div>
        )}
      </section>
    </div>
  );
}

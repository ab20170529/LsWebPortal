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
    sourceAssetIds?: number[];
    templateCode?: string;
  }) => Promise<unknown>;
  onPublishGeneratedVersion: (screenId: number, versionId?: number | null) => Promise<void>;
  onRegenerateVersion: (screenId: number, payload: RegenerateVersionPayload) => Promise<void>;
};

const DEFAULT_PROMPT =
  'Generate a BI dashboard draft for management review based on the bound source assets, fields, key trends, exceptions, and regional comparison.';

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
  const sourceAssetIds = useMemo(
    () => boundDatasources.flatMap((datasource) => datasource.assets.map((asset) => asset.id)),
    [boundDatasources],
  );
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
      setScreenNameDraft(`${node.nodeName} AI screen`);
      return;
    }
    setScreenCodeDraft('');
    setScreenNameDraft('');
  }, [node, selectedScreen]);

  if (!node) {
    return (
      <div className="bi-panel-scroll">
        <div className="bi-panel-empty">
          Select a node first, then generate an AI draft from the source assets bound to that node.
        </div>
      </div>
    );
  }

  return (
    <div className="bi-panel-scroll">
      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">AI context</div>
          <div className="bi-panel-section-caption">
            {selectedScreen ? getScreenDesignStatusLabel(selectedScreen.designStatus) : 'No archive selected'}
          </div>
        </div>

        <div className="bi-prompt-box">
          <div>
            <span className="bi-prompt-key">NODE</span>
            <span className="bi-prompt-value">{node.nodeName}</span>
          </div>
          <div>
            <span className="bi-prompt-key">ASSETS</span>
            <span className="bi-prompt-value">
              {boundDatasources.flatMap((datasource) => datasource.assets.map((asset) => asset.assetName)).join(', ') || 'No bound assets'}
            </span>
          </div>
          <div>
            <span className="bi-prompt-key">TABLES</span>
            <span className="bi-prompt-value">{allowedTables.join(', ') || 'No allowed tables'}</span>
          </div>
          <div>
            <span className="bi-prompt-key">TARGET</span>
            <span className="bi-prompt-value">{(selectedScreen?.name ?? screenNameDraft) || 'New archive'}</span>
          </div>
        </div>
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">Generation</div>
          <div className="bi-panel-section-caption">Draft first, publish after review.</div>
        </div>

        <div className="bi-panel-form">
          <label className="bi-panel-field">
            <span className="bi-panel-label">Prompt template</span>
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
            <span className="bi-panel-label">Target archive</span>
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
              <option value="">Create new archive</option>
              {screens.map((screen) => (
                <option key={screen.id} value={screen.id}>
                  {screen.name}
                </option>
              ))}
            </select>
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">Archive code</span>
            <input
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenCodeDraft(event.target.value)}
              value={screenCodeDraft}
            />
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">Archive name</span>
            <input
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenNameDraft(event.target.value)}
              value={screenNameDraft}
            />
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">Business prompt</span>
            <textarea
              className="bi-panel-textarea"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setManualPrompt(event.target.value)}
              value={manualPrompt}
            />
          </label>

          <div className="bi-panel-note">
            Context contains {sourceAssetIds.length} source assets, {allowedTables.length} allowed tables, and{' '}
            {fieldCoverage.length} field descriptions.
          </div>

          <div className="bi-panel-inline-actions">
            <Button
              disabled={isMutating || !manualPrompt.trim() || sourceAssetIds.length === 0}
              onClick={() =>
                onPreviewPrompt({
                  datasourceIds,
                  nodeId: node.id,
                  prompt: manualPrompt,
                  providerCode,
                  ...(selectedScreenId ? { screenId: selectedScreenId } : {}),
                  sourceAssetIds,
                  ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                })
              }
              tone="ghost"
            >
              Preview prompt
            </Button>
            <Button
              disabled={isMutating || !manualPrompt.trim() || sourceAssetIds.length === 0}
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
                  sourceAssetIds,
                  ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                })
              }
            >
              Generate draft
            </Button>
            <Button
              disabled={!selectedScreenId || isMutating || sourceAssetIds.length === 0}
              onClick={() =>
                selectedScreenId
                  ? onRegenerateVersion(selectedScreenId, {
                      datasourceIds,
                      prompt: manualPrompt,
                      providerCode,
                      publishMode: 'DRAFT',
                      sourceAssetIds,
                      ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
                    })
                  : Promise.resolve()
              }
              tone="ghost"
            >
              Regenerate
            </Button>
          </div>
        </div>

        {promptPreview ? (
          <div className="bi-panel-card">
            <div className="bi-panel-card-title">Prompt preview</div>
            <pre className="bi-code-box">{promptPreview.userPrompt ?? promptPreview.systemPrompt ?? ''}</pre>
          </div>
        ) : null}
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">Generation result</div>
          <div className="bi-panel-section-caption">{getGenerationStatusLabel(generationTask?.status)}</div>
        </div>

        {generationTask ? (
          <div className="bi-panel-card">
            <div className="bi-task-grid">
              <div className="bi-task-item">
                <span className="bi-task-label">Task</span>
                <span className="bi-task-value">#{generationTask.id}</span>
              </div>
              <div className="bi-task-item">
                <span className="bi-task-label">Provider</span>
                <span className="bi-task-value">{generationTask.providerCode ?? 'AUTO'}</span>
              </div>
              <div className="bi-task-item">
                <span className="bi-task-label">Model</span>
                <span className="bi-task-value">{generationTask.modelName ?? '-'}</span>
              </div>
              <div className="bi-task-item">
                <span className="bi-task-label">Publish mode</span>
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
                Publish this version
              </Button>
              {generationTask.screenId && generatedScreenCode ? (
                <a className="bi-inline-link" href={`/bi/screen/${generatedScreenCode}`} rel="noreferrer" target="_blank">
                  Open preview
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bi-panel-empty bi-panel-empty-tight">
            The task panel will show request context, validation, archive, and version result here.
          </div>
        )}
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">Design history</div>
          <div className="bi-panel-section-caption">{designRecords.length} records</div>
        </div>

        {designRecords.length > 0 ? (
          <div className="bi-stack-list">
            {designRecords.map((record) => (
              <div key={record.id} className="bi-history-card">
                <div className="bi-side-card-header">
                  <div>
                    <div className="bi-side-card-title">{record.templateCode ?? 'Unnamed template'}</div>
                    <div className="bi-side-card-subtitle">
                      {record.providerCode ?? 'AUTO'} / {formatDateTime(record.createTime)}
                    </div>
                  </div>
                  <Badge tone="neutral">{record.status ?? 'DRAFT_CREATED'}</Badge>
                </div>
                <div className="bi-history-summary">{record.resultSummary ?? 'No summary yet'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bi-panel-empty bi-panel-empty-tight">No AI design records yet.</div>
        )}
      </section>
    </div>
  );
}

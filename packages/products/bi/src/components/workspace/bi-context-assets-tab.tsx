import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Button, cx } from '@lserp/ui';

import type {
  DataAssetSavePayload,
  DatasourceSavePayload,
  ScreenSavePayload,
  ShareCreatePayload,
} from '../../api/bi-api';
import type { BiDataAsset, BiDatasource, BiDirectoryNode, BiScreen, BiShareToken } from '../../types';
import {
  formatDateTime,
  getAssetTypeLabel,
  getDatasourceAssetSummary,
  getModuleCount,
  getPublishedVersionId,
  getScreenDesignStatusLabel,
} from '../../utils/bi-directory';
import { CodeIcon, DatabaseIcon, ExternalLinkIcon, ShareIcon } from './bi-icons';

type BiContextAssetsTabProps = {
  boundDatasources: BiDatasource[];
  datasources: BiDatasource[];
  isMutating: boolean;
  node: BiDirectoryNode | null;
  onBindSources: (nodeId: number, datasourceIds: number[]) => Promise<void>;
  onCreateDatasource: (payload: DatasourceSavePayload) => Promise<void>;
  onCreateScreen: (payload: ScreenSavePayload) => Promise<void>;
  onCreateShareToken: (payload: ShareCreatePayload) => Promise<void>;
  onGenerateBizComments: (assetId: number) => Promise<unknown>;
  onPublishVersion: (screenId: number, versionId: number) => Promise<void>;
  onRevokeShareToken: (tokenId: number) => Promise<void>;
  onSaveAsset: (datasourceId: number, payload: DataAssetSavePayload, assetId?: number) => Promise<void>;
  onSelectScreen: (screenId: number | null) => void;
  screens: BiScreen[];
  selectedScreenId: number | null;
  shareTokens: BiShareToken[];
};

type AssetEditorMode = 'create' | 'edit';

type AssetFormState = {
  assetCode: string;
  assetComment: string;
  assetFieldsText: string;
  assetName: string;
  assetSourceTablesText: string;
  assetSqlText: string;
  assetTableName: string;
  assetTableSchema: string;
  assetType: 'SQL' | 'TABLE';
};

function emptyAssetForm(): AssetFormState {
  return {
    assetCode: '',
    assetComment: '',
    assetFieldsText: '',
    assetName: '',
    assetSourceTablesText: '',
    assetSqlText: '',
    assetTableName: '',
    assetTableSchema: 'dbo',
    assetType: 'TABLE',
  };
}

function parseFields(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [fieldName = '', fieldLabel = '', fieldType = '', dbComment = '', bizComment = '', exampleValue = ''] =
        line.split('|').map((item) => item.trim());
      return {
        ...(bizComment ? { bizComment } : {}),
        ...(dbComment ? { dbComment } : {}),
        ...(exampleValue ? { exampleValue } : {}),
        ...(fieldLabel ? { fieldLabel } : {}),
        fieldName,
        ...(fieldType ? { fieldType } : {}),
        sortNo: index,
      };
    })
    .filter((field) => field.fieldName);
}

function formatFields(asset: BiDataAsset | null) {
  if (!asset) {
    return '';
  }
  return asset.fields
    .map((field) =>
      [
        field.fieldName,
        field.fieldLabel ?? '',
        field.fieldType ?? '',
        field.dbComment ?? '',
        field.bizComment ?? '',
        field.exampleValue ?? '',
      ].join('|'),
    )
    .join('\n');
}

function buildExternalVersionDraft(name: string, targetUrl: string) {
  return {
    externalConfig: {
      allowFullscreen: true,
      openMode: 'iframe',
      queryParamMapping: {},
      sandboxPolicy: 'allow-same-origin allow-scripts allow-forms',
      targetUrl,
      title: name,
    },
    publishNow: true,
    theme: 'external',
  };
}

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildAssetPayload(assetForm: AssetFormState): DataAssetSavePayload {
  return {
    ...(assetForm.assetCode ? { assetCode: assetForm.assetCode.trim() } : {}),
    ...(assetForm.assetComment ? { comment: assetForm.assetComment.trim() } : {}),
    ...(assetForm.assetName ? { assetName: assetForm.assetName.trim() } : {}),
    ...(parseFields(assetForm.assetFieldsText).length > 0
      ? { fields: parseFields(assetForm.assetFieldsText) }
      : {}),
    assetType: assetForm.assetType,
    ...(assetForm.assetType === 'TABLE'
      ? {
          tableName: assetForm.assetTableName.trim(),
          tableSchema: assetForm.assetTableSchema.trim() || 'dbo',
        }
      : {
          sourceTables: assetForm.assetSourceTablesText
            .split(/[\r\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
          sqlText: assetForm.assetSqlText,
        }),
  };
}

export function BiContextAssetsTab({
  boundDatasources,
  datasources,
  isMutating,
  node,
  onBindSources,
  onCreateDatasource,
  onCreateScreen,
  onCreateShareToken,
  onGenerateBizComments,
  onPublishVersion,
  onRevokeShareToken,
  onSaveAsset,
  onSelectScreen,
  screens,
  selectedScreenId,
  shareTokens,
}: BiContextAssetsTabProps) {
  const [bindingIds, setBindingIds] = useState<number[]>([]);
  const [datasourceDescription, setDatasourceDescription] = useState('');
  const [datasourceName, setDatasourceName] = useState('');
  const [datasourceSourceCode, setDatasourceSourceCode] = useState('');
  const [screenBiType, setScreenBiType] = useState<'EXTERNAL' | 'INTERNAL'>('INTERNAL');
  const [screenCode, setScreenCode] = useState('');
  const [screenExternalUrl, setScreenExternalUrl] = useState('');
  const [screenName, setScreenName] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<number | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [showArchiveCreator, setShowArchiveCreator] = useState(false);
  const [showDatasourceCreator, setShowDatasourceCreator] = useState(false);
  const [showSourceBinding, setShowSourceBinding] = useState(false);
  const [assetEditorMode, setAssetEditorMode] = useState<AssetEditorMode | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormState>(emptyAssetForm());

  const selectedDatasource = useMemo(
    () => boundDatasources.find((datasource) => datasource.id === selectedDatasourceId) ?? null,
    [boundDatasources, selectedDatasourceId],
  );
  const selectedAsset = useMemo(
    () => selectedDatasource?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [selectedDatasource, selectedAssetId],
  );
  const selectedScreen = useMemo(
    () => screens.find((screen) => screen.id === selectedScreenId) ?? null,
    [screens, selectedScreenId],
  );
  const canSaveAsset = useMemo(() => {
    if (!assetForm.assetName.trim()) {
      return false;
    }
    if (assetForm.assetType === 'TABLE') {
      return Boolean(assetForm.assetTableName.trim());
    }
    return Boolean(assetForm.assetSqlText.trim() && assetForm.assetSourceTablesText.trim());
  }, [assetForm]);
  const canCreateArchive = useMemo(() => {
    if (!screenCode.trim() || !screenName.trim()) {
      return false;
    }
    if (screenBiType === 'EXTERNAL') {
      return Boolean(screenExternalUrl.trim());
    }
    return true;
  }, [screenBiType, screenCode, screenExternalUrl, screenName]);

  useEffect(() => {
    setBindingIds(node?.datasourceIds ?? []);
    if (node) {
      setScreenCode((current) => current || `${slugifyCode(node.nodeCode || node.nodeName) || 'bi_screen'}_01`);
      setScreenName((current) => current || `${node.nodeName} 大屏`);
    }
  }, [node]);

  useEffect(() => {
    if (!boundDatasources.some((datasource) => datasource.id === selectedDatasourceId)) {
      setSelectedDatasourceId(boundDatasources[0]?.id ?? null);
    }
  }, [boundDatasources, selectedDatasourceId]);

  useEffect(() => {
    if (!selectedDatasource?.assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(selectedDatasource?.assets[0]?.id ?? null);
    }
  }, [selectedAssetId, selectedDatasource]);

  useEffect(() => {
    if (assetEditorMode !== 'edit') {
      return;
    }
    if (!selectedAsset) {
      setAssetForm(emptyAssetForm());
      return;
    }
    setAssetForm({
      assetCode: selectedAsset.assetCode,
      assetComment: selectedAsset.comment ?? '',
      assetFieldsText: formatFields(selectedAsset),
      assetName: selectedAsset.assetName,
      assetSourceTablesText: selectedAsset.sourceTables.join(', '),
      assetSqlText: selectedAsset.sqlText ?? '',
      assetTableName: selectedAsset.tableName ?? '',
      assetTableSchema: selectedAsset.tableSchema ?? 'dbo',
      assetType: selectedAsset.assetType === 'SQL' ? 'SQL' : 'TABLE',
    });
  }, [assetEditorMode, selectedAsset]);

  if (!node) {
    return (
      <div className="bi-panel-scroll">
        <div className="bi-panel-empty">请先在画布中选中一个节点，再为它配置分析源、数据资产与 BI 档案。</div>
      </div>
    );
  }

  return (
    <div className="bi-panel-scroll">
      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">分析源资产</div>
          <div className="bi-panel-inline-actions">
            <button className="bi-inline-link" onClick={() => setShowSourceBinding((value) => !value)} type="button">
              {showSourceBinding ? '收起挂载' : '挂载分析源'}
            </button>
            <button
              className="bi-inline-link"
              onClick={() => setShowDatasourceCreator((value) => !value)}
              type="button"
            >
              {showDatasourceCreator ? '收起新建' : '新建分析源'}
            </button>
          </div>
        </div>

        {showSourceBinding ? (
          <div className="bi-panel-card">
            <div className="bi-selection-list">
              {datasources.map((datasource) => {
                const checked = bindingIds.includes(datasource.id);
                const summary = getDatasourceAssetSummary(datasource);
                return (
                  <label key={datasource.id} className={cx('bi-checkbox-card', checked ? 'is-checked' : '')}>
                    <input
                      checked={checked}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setBindingIds((current) =>
                          event.target.checked
                            ? [...new Set([...current, datasource.id])]
                            : current.filter((item) => item !== datasource.id),
                        );
                      }}
                      type="checkbox"
                    />
                    <div>
                      <div className="bi-checkbox-title">{datasource.name}</div>
                      <div className="bi-checkbox-meta">
                        {datasource.sourceCode} · TABLE {summary.tableCount} / SQL {summary.sqlCount}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <Button disabled={isMutating} onClick={() => onBindSources(node.id, bindingIds)}>
              保存挂载
            </Button>
          </div>
        ) : null}

        {showDatasourceCreator ? (
          <div className="bi-panel-card">
            <div className="bi-panel-form">
              <label className="bi-panel-field">
                <span className="bi-panel-label">分析源名称</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setDatasourceName(event.target.value)}
                  value={datasourceName}
                />
              </label>
              <label className="bi-panel-field">
                <span className="bi-panel-label">分析源编码</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setDatasourceSourceCode(event.target.value)}
                  value={datasourceSourceCode}
                />
              </label>
              <label className="bi-panel-field">
                <span className="bi-panel-label">说明</span>
                <textarea
                  className="bi-panel-textarea"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDatasourceDescription(event.target.value)}
                  value={datasourceDescription}
                />
              </label>
              <Button
                disabled={!datasourceName.trim() || !datasourceSourceCode.trim() || isMutating}
                onClick={async () => {
                  await onCreateDatasource({
                    description: datasourceDescription || undefined,
                    name: datasourceName.trim(),
                    sourceCode: datasourceSourceCode.trim(),
                  });
                  setDatasourceDescription('');
                  setDatasourceName('');
                  setDatasourceSourceCode('');
                  setShowDatasourceCreator(false);
                }}
              >
                创建分析源
              </Button>
            </div>
          </div>
        ) : null}

        {boundDatasources.length > 0 ? (
          <>
            <div className="bi-stack-list">
              {boundDatasources.map((datasource) => {
                const summary = getDatasourceAssetSummary(datasource);
                return (
                  <button
                    key={datasource.id}
                    className={cx('bi-side-card', datasource.id === selectedDatasourceId ? 'is-selected' : '')}
                    onClick={() => setSelectedDatasourceId(datasource.id)}
                    type="button"
                  >
                    <div className="bi-side-card-header">
                      <div>
                        <div className="bi-side-card-title">{datasource.name}</div>
                        <div className="bi-side-card-subtitle">{datasource.sourceCode}</div>
                      </div>
                      <Badge tone="neutral">{datasource.assets.length} 个资产</Badge>
                    </div>
                    <div className="bi-side-card-meta">TABLE {summary.tableCount} / SQL {summary.sqlCount}</div>
                  </button>
                );
              })}
            </div>

            {selectedDatasource ? (
              <div className="bi-panel-card">
                <div className="bi-panel-card-header">
                  <div>
                    <div className="bi-panel-card-title">{selectedDatasource.name}</div>
                    <div className="bi-panel-card-subtitle">统一维护数据表、SQL 资产与字段说明。</div>
                  </div>
                  <div className="bi-panel-inline-actions">
                    <button
                      className="bi-inline-link"
                      onClick={() => {
                        setAssetEditorMode('create');
                        setAssetForm(emptyAssetForm());
                      }}
                      type="button"
                    >
                      新建资产
                    </button>
                    <button
                      className="bi-inline-link"
                      disabled={!selectedAsset}
                      onClick={() => {
                        if (!selectedAsset) {
                          return;
                        }
                        setAssetEditorMode('edit');
                      }}
                      type="button"
                    >
                      编辑当前资产
                    </button>
                  </div>
                </div>

                {selectedDatasource.assets.length > 0 ? (
                  <div className="bi-stack-list bi-stack-list-tight">
                    {selectedDatasource.assets.map((asset) => (
                      <button
                        key={asset.id}
                        className={cx('bi-asset-card', asset.id === selectedAssetId ? 'is-selected' : '')}
                        onClick={() => setSelectedAssetId(asset.id)}
                        type="button"
                      >
                        <div className="bi-side-card-header">
                          <div>
                            <div className="bi-side-card-title">{asset.assetName}</div>
                            <div className="bi-side-card-subtitle">{asset.assetCode}</div>
                          </div>
                          <Badge tone="brand">{getAssetTypeLabel(asset.assetType)}</Badge>
                        </div>
                        <div className="bi-side-card-meta">
                          {asset.assetType === 'TABLE'
                            ? `${asset.tableSchema ?? 'dbo'}.${asset.tableName ?? ''}`
                            : asset.sourceTables.join(', ') || '尚未声明来源表'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bi-panel-empty bi-panel-empty-tight">当前分析源还没有任何数据资产。</div>
                )}

                {assetEditorMode ? (
                  <div className="bi-panel-form">
                    <label className="bi-panel-field">
                      <span className="bi-panel-label">资产类型</span>
                      <select
                        className="bi-panel-input"
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setAssetForm((current) => ({
                            ...current,
                            assetType: event.target.value === 'SQL' ? 'SQL' : 'TABLE',
                          }))
                        }
                        value={assetForm.assetType}
                      >
                        <option value="TABLE">TABLE</option>
                        <option value="SQL">SQL</option>
                      </select>
                    </label>

                    <label className="bi-panel-field">
                      <span className="bi-panel-label">资产名称</span>
                      <input
                        className="bi-panel-input"
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setAssetForm((current) => ({ ...current, assetName: event.target.value }))
                        }
                        value={assetForm.assetName}
                      />
                    </label>

                    <label className="bi-panel-field">
                      <span className="bi-panel-label">资产编码</span>
                      <input
                        className="bi-panel-input"
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setAssetForm((current) => ({ ...current, assetCode: event.target.value }))
                        }
                        value={assetForm.assetCode}
                      />
                    </label>

                    <label className="bi-panel-field">
                      <span className="bi-panel-label">说明</span>
                      <input
                        className="bi-panel-input"
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setAssetForm((current) => ({ ...current, assetComment: event.target.value }))
                        }
                        value={assetForm.assetComment}
                      />
                    </label>

                    {assetForm.assetType === 'TABLE' ? (
                      <>
                        <label className="bi-panel-field">
                          <span className="bi-panel-label">Schema</span>
                          <input
                            className="bi-panel-input"
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setAssetForm((current) => ({ ...current, assetTableSchema: event.target.value }))
                            }
                            value={assetForm.assetTableSchema}
                          />
                        </label>

                        <label className="bi-panel-field">
                          <span className="bi-panel-label">表名</span>
                          <input
                            className="bi-panel-input"
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setAssetForm((current) => ({ ...current, assetTableName: event.target.value }))
                            }
                            value={assetForm.assetTableName}
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="bi-panel-field">
                          <span className="bi-panel-label">SQL</span>
                          <textarea
                            className="bi-panel-textarea bi-panel-code"
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              setAssetForm((current) => ({ ...current, assetSqlText: event.target.value }))
                            }
                            value={assetForm.assetSqlText}
                          />
                        </label>

                        <label className="bi-panel-field">
                          <span className="bi-panel-label">来源表</span>
                          <textarea
                            className="bi-panel-textarea"
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              setAssetForm((current) => ({
                                ...current,
                                assetSourceTablesText: event.target.value,
                              }))
                            }
                            placeholder="用逗号或换行分隔来源表"
                            value={assetForm.assetSourceTablesText}
                          />
                        </label>
                      </>
                    )}

                    <label className="bi-panel-field">
                      <span className="bi-panel-label">字段定义</span>
                      <textarea
                        className="bi-panel-textarea bi-panel-code"
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          setAssetForm((current) => ({ ...current, assetFieldsText: event.target.value }))
                        }
                        placeholder="fieldName|fieldLabel|fieldType|dbComment|bizComment|exampleValue"
                        value={assetForm.assetFieldsText}
                      />
                    </label>

                    <div className="bi-panel-inline-actions">
                      {selectedAsset && assetEditorMode === 'edit' ? (
                        <Button disabled={isMutating} onClick={() => onGenerateBizComments(selectedAsset.id)} tone="ghost">
                          一键生成字段业务说明
                        </Button>
                      ) : null}
                      <Button
                        disabled={!canSaveAsset || isMutating}
                        onClick={async () => {
                          await onSaveAsset(
                            selectedDatasource.id,
                            buildAssetPayload(assetForm),
                            assetEditorMode === 'edit' ? selectedAsset?.id : undefined,
                          );
                          setAssetEditorMode(null);
                          setAssetForm(emptyAssetForm());
                        }}
                      >
                        {assetEditorMode === 'edit' ? '保存资产' : '创建资产'}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {selectedAsset ? (
                  <div className="bi-field-table-wrap">
                    <div className="bi-field-table-header">
                      <div className="bi-field-table-title">
                        {selectedAsset.assetType === 'TABLE' ? (
                          <DatabaseIcon className="bi-inline-icon" />
                        ) : (
                          <CodeIcon className="bi-inline-icon" />
                        )}
                        字段说明
                      </div>
                      <div className="bi-field-table-subtitle">{selectedAsset.fields.length} 个字段</div>
                    </div>
                    <table className="bi-field-table">
                      <thead>
                        <tr>
                          <th>字段</th>
                          <th>类型</th>
                          <th>数据库说明</th>
                          <th>业务说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAsset.fields.map((field) => (
                          <tr key={field.id}>
                            <td>{field.fieldName}</td>
                            <td>{field.fieldType ?? '-'}</td>
                            <td>{field.dbComment ?? '-'}</td>
                            <td>{field.bizComment ?? '待补充'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="bi-panel-empty">当前节点还没有挂载任何分析源。</div>
        )}
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">BI 档案</div>
          <button className="bi-inline-link" onClick={() => setShowArchiveCreator((value) => !value)} type="button">
            {showArchiveCreator ? '收起新建' : '新建档案'}
          </button>
        </div>

        {showArchiveCreator ? (
          <div className="bi-panel-card">
            <div className="bi-panel-form">
              <label className="bi-panel-field">
                <span className="bi-panel-label">档案名称</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenName(event.target.value)}
                  value={screenName}
                />
              </label>

              <label className="bi-panel-field">
                <span className="bi-panel-label">档案编码</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenCode(event.target.value)}
                  value={screenCode}
                />
              </label>

              <label className="bi-panel-field">
                <span className="bi-panel-label">类型</span>
                <select
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setScreenBiType(event.target.value === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL')
                  }
                  value={screenBiType}
                >
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="EXTERNAL">EXTERNAL</option>
                </select>
              </label>

              {screenBiType === 'EXTERNAL' ? (
                <label className="bi-panel-field">
                  <span className="bi-panel-label">外链地址</span>
                  <input
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenExternalUrl(event.target.value)}
                    value={screenExternalUrl}
                  />
                </label>
              ) : null}

              <Button
                disabled={!canCreateArchive || isMutating}
                onClick={async () => {
                  await onCreateScreen({
                    biType: screenBiType,
                    name: screenName.trim(),
                    nodeId: node.id,
                    screenCode: screenCode.trim(),
                    ...(screenBiType === 'EXTERNAL' && screenExternalUrl
                      ? {
                          versionDraft: buildExternalVersionDraft(screenName.trim(), screenExternalUrl),
                        }
                      : {}),
                  });
                  setScreenName('');
                  setScreenCode('');
                  setScreenExternalUrl('');
                  setShowArchiveCreator(false);
                }}
              >
                创建档案
              </Button>
            </div>
          </div>
        ) : null}

        {screens.length > 0 ? (
          <div className="bi-stack-list">
            {screens.map((screen) => (
              <div key={screen.id} className={cx('bi-side-card', screen.id === selectedScreenId ? 'is-selected' : '')}>
                <button className="bi-side-card-button" onClick={() => onSelectScreen(screen.id)} type="button">
                  <div className="bi-side-card-header">
                    <div>
                      <div className="bi-side-card-title">{screen.name}</div>
                      <div className="bi-side-card-subtitle">{screen.screenCode}</div>
                    </div>
                    <div className="bi-side-card-badges">
                      <Badge tone="brand">{screen.biType}</Badge>
                      <Badge tone="neutral">{getScreenDesignStatusLabel(screen.designStatus)}</Badge>
                    </div>
                  </div>
                  <div className="bi-side-card-meta">
                    模块 {getModuleCount(screen)} / 当前版本 {getPublishedVersionId(screen) ?? '未发布'}
                  </div>
                </button>

                <div className="bi-side-card-actions">
                  <a className="bi-chip-link" href={`/bi/screen/${screen.screenCode}`} rel="noreferrer" target="_blank">
                    预览
                  </a>
                  {screen.versions.map((version) => (
                    <button
                      key={version.id}
                      className="bi-chip-link"
                      onClick={() => onPublishVersion(screen.id, version.id)}
                      type="button"
                    >
                      {version.published ? `v${version.versionNo ?? version.id} 已发布` : `发布 v${version.versionNo ?? version.id}`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bi-panel-empty">当前节点还没有 BI 档案。</div>
        )}

        {selectedScreen ? (
          <div className="bi-panel-card">
            <div className="bi-panel-card-header">
              <div>
                <div className="bi-panel-card-title">分享访问</div>
                <div className="bi-panel-card-subtitle">为当前选中的档案生成独立访问链接。</div>
              </div>
              {selectedScreen.biType === 'EXTERNAL' ? (
                <ExternalLinkIcon className="bi-inline-icon bi-inline-icon-muted" />
              ) : (
                <ShareIcon className="bi-inline-icon bi-inline-icon-muted" />
              )}
            </div>
            <div className="bi-panel-form">
              <label className="bi-panel-field">
                <span className="bi-panel-label">过期时间</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setShareExpiresAt(event.target.value)}
                  type="datetime-local"
                  value={shareExpiresAt}
                />
              </label>
              <Button
                disabled={isMutating}
                onClick={async () => {
                  await onCreateShareToken({
                    ...(shareExpiresAt ? { expiresAt: new Date(shareExpiresAt).toISOString() } : {}),
                    screenId: selectedScreen.id,
                  });
                  setShareExpiresAt('');
                }}
              >
                创建分享链接
              </Button>
            </div>

            {shareTokens.length > 0 ? (
              <div className="bi-stack-list bi-stack-list-tight">
                {shareTokens.slice(0, 3).map((token) => (
                  <div key={token.id} className="bi-token-card">
                    <div>
                      <div className="bi-side-card-title bi-side-card-title-small">{token.tokenValue}</div>
                      <div className="bi-side-card-subtitle">
                        {token.expiresAt ? formatDateTime(token.expiresAt) : '长期有效'} / {token.status ?? 'ACTIVE'}
                      </div>
                    </div>
                    <div className="bi-panel-inline-actions">
                      <a className="bi-inline-link" href={`/bi/share/${token.tokenValue}`} rel="noreferrer" target="_blank">
                        打开
                      </a>
                      <button className="bi-inline-link" onClick={() => onRevokeShareToken(token.id)} type="button">
                        失效
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Button, cx } from '@lserp/ui';

import type {
  DataAssetFieldSavePayload,
  DataAssetSavePayload,
  DatasourceSavePayload,
} from '../../api/bi-api';
import type { BiDataAsset, BiDatasource, BiDirectoryNode } from '../../types';
import { getAssetTypeLabel, getDatasourceAssetSummary, getStatusLabel } from '../../utils/bi-directory';
import { CodeIcon, DatabaseIcon } from './bi-icons';

type BiSourceManagementPanelProps = {
  datasources: BiDatasource[];
  isMutating: boolean;
  node: BiDirectoryNode | null;
  onBindSourceAssets: (nodeId: number, sourceAssetIds: number[]) => Promise<void>;
  onCreateDatasource: (payload: DatasourceSavePayload) => Promise<BiDatasource | void>;
  onGenerateBizComments: (assetId: number) => Promise<unknown>;
  onReplaceAssetFields: (
    assetId: number,
    fields: DataAssetFieldSavePayload[],
  ) => Promise<unknown>;
  onSaveAsset: (
    datasourceId: number,
    payload: DataAssetSavePayload,
    assetId?: number,
  ) => Promise<BiDataAsset>;
  onUpdateDatasource: (id: number, payload: DatasourceSavePayload) => Promise<BiDatasource | void>;
};

type DatasourceFormState = {
  businessScope: string;
  dataScope: string;
  description: string;
  name: string;
  sourceCode: string;
  status: string;
};

type AssetFieldRow = {
  bizComment: string;
  dbComment: string;
  exampleValue: string;
  fieldLabel: string;
  fieldName: string;
  fieldOrigin: string;
  fieldType: string;
  isNullable: boolean;
  sortNo: number;
};

type AssetFormState = {
  assetCode: string;
  assetName: string;
  assetType: 'SQL' | 'TABLE';
  comment: string;
  fields: AssetFieldRow[];
  sortNo: number;
  sourceTablesText: string;
  sqlText: string;
  status: string;
  tableName: string;
  tableSchema: string;
};

function emptyDatasourceForm(): DatasourceFormState {
  return {
    businessScope: '',
    dataScope: 'CURRENT_DATASOURCE',
    description: '',
    name: '',
    sourceCode: '',
    status: 'ACTIVE',
  };
}

function emptyFieldRow(sortNo: number): AssetFieldRow {
  return {
    bizComment: '',
    dbComment: '',
    exampleValue: '',
    fieldLabel: '',
    fieldName: '',
    fieldOrigin: 'MANUAL',
    fieldType: '',
    isNullable: true,
    sortNo,
  };
}

function emptyAssetForm(): AssetFormState {
  return {
    assetCode: '',
    assetName: '',
    assetType: 'TABLE',
    comment: '',
    fields: [],
    sortNo: 0,
    sourceTablesText: '',
    sqlText: '',
    status: 'ACTIVE',
    tableName: '',
    tableSchema: 'dbo',
  };
}

function mapDatasourceForm(datasource: BiDatasource | null): DatasourceFormState {
  if (!datasource) {
    return emptyDatasourceForm();
  }
  return {
    businessScope: datasource.businessScope ?? '',
    dataScope: datasource.dataScope ?? 'CURRENT_DATASOURCE',
    description: datasource.description ?? '',
    name: datasource.name,
    sourceCode: datasource.sourceCode,
    status: datasource.status ?? 'ACTIVE',
  };
}

function mapAssetForm(asset: BiDataAsset | null): AssetFormState {
  if (!asset) {
    return emptyAssetForm();
  }
  return {
    assetCode: asset.assetCode,
    assetName: asset.assetName,
    assetType: asset.assetType === 'SQL' ? 'SQL' : 'TABLE',
    comment: asset.comment ?? '',
    fields: asset.fields.map((field, index) => ({
      bizComment: field.bizComment ?? '',
      dbComment: field.dbComment ?? '',
      exampleValue: field.exampleValue ?? '',
      fieldLabel: field.fieldLabel ?? '',
      fieldName: field.fieldName,
      fieldOrigin: field.fieldOrigin ?? 'MANUAL',
      fieldType: field.fieldType ?? '',
      isNullable: field.isNullable ?? true,
      sortNo: Number(field.sortNo ?? index),
    })),
    sortNo: Number(asset.sortNo ?? 0),
    sourceTablesText: asset.sourceTables.join(', '),
    sqlText: asset.sqlText ?? '',
    status: asset.status ?? 'ACTIVE',
    tableName: asset.tableName ?? '',
    tableSchema: asset.tableSchema ?? 'dbo',
  };
}

function buildDatasourcePayload(form: DatasourceFormState): DatasourceSavePayload {
  return {
    businessScope: form.businessScope.trim() || undefined,
    dataScope: form.dataScope,
    description: form.description.trim() || undefined,
    name: form.name.trim(),
    sourceCode: form.sourceCode.trim(),
    status: form.status,
  };
}

function buildAssetPayload(form: AssetFormState, includeFields = true): DataAssetSavePayload {
  const fields = form.fields
    .map((field, index) => ({
      bizComment: field.bizComment.trim() || undefined,
      dbComment: field.dbComment.trim() || undefined,
      exampleValue: field.exampleValue.trim() || undefined,
      fieldLabel: field.fieldLabel.trim() || undefined,
      fieldName: field.fieldName.trim(),
      fieldOrigin: field.fieldOrigin.trim() || undefined,
      fieldType: field.fieldType.trim() || undefined,
      isNullable: field.isNullable,
      sortNo: Number(field.sortNo ?? index),
    }))
    .filter((field) => field.fieldName);

  return {
    assetCode: form.assetCode.trim() || undefined,
    assetName: form.assetName.trim(),
    assetType: form.assetType,
    comment: form.comment.trim() || undefined,
    ...(includeFields && fields.length > 0 ? { fields } : {}),
    sortNo: Number(form.sortNo ?? 0),
    status: form.status,
    ...(form.assetType === 'TABLE'
      ? {
          tableName: form.tableName.trim(),
          tableSchema: form.tableSchema.trim() || 'dbo',
        }
      : {
          sourceTables: form.sourceTablesText
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
          sqlText: form.sqlText,
        }),
  };
}

export function BiSourceManagementPanel({
  datasources,
  isMutating,
  node,
  onBindSourceAssets,
  onCreateDatasource,
  onGenerateBizComments,
  onReplaceAssetFields,
  onSaveAsset,
  onUpdateDatasource,
}: BiSourceManagementPanelProps) {
  const [bindingIds, setBindingIds] = useState<number[]>([]);
  const [datasourceEditorMode, setDatasourceEditorMode] = useState<'create' | 'edit'>('edit');
  const [datasourceForm, setDatasourceForm] = useState<DatasourceFormState>(emptyDatasourceForm());
  const [assetEditorMode, setAssetEditorMode] = useState<'create' | 'edit'>('edit');
  const [assetForm, setAssetForm] = useState<AssetFormState>(emptyAssetForm());
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  const selectedDatasource = useMemo(
    () => datasources.find((datasource) => datasource.id === selectedDatasourceId) ?? null,
    [datasources, selectedDatasourceId],
  );
  const selectedAsset = useMemo(
    () => selectedDatasource?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [selectedAssetId, selectedDatasource],
  );
  const boundAssetCount = node?.sourceAssetIds.length ?? 0;
  const totalAssetCount = datasources.reduce((total, datasource) => total + datasource.assets.length, 0);
  const hasBindingChanged = node
    ? bindingIds.length !== node.sourceAssetIds.length ||
      bindingIds.some((assetId) => !node.sourceAssetIds.includes(assetId))
    : false;
  const sourceActionTitle = !node
    ? '先选择节点'
    : bindingIds.length === 0
      ? '先勾选分析源'
      : hasBindingChanged
        ? '保存节点绑定'
        : selectedAsset
          ? '维护当前资产'
          : '选择要维护的资产';
  const sourceActionHint = !node
    ? '当前没有选中节点，可以先维护全局数据源目录。'
    : bindingIds.length === 0
      ? '从上方列表勾选这个节点允许使用的表或 SQL 资产。'
      : hasBindingChanged
        ? '已经选择了新的分析源，需要保存后 AI 生成和预览才会使用。'
        : selectedAsset
          ? `正在编辑“${selectedAsset.assetName}”，可以补充字段和业务说明。`
          : '先在左侧选择数据源和资产，再维护详情。';

  useEffect(() => {
    setBindingIds(node?.sourceAssetIds ?? []);
  }, [node?.id, node?.sourceAssetIds]);

  useEffect(() => {
    if (!datasources.some((datasource) => datasource.id === selectedDatasourceId)) {
      const preferredDatasourceId =
        datasources.find((datasource) => datasource.assets.some((asset) => bindingIds.includes(asset.id)))?.id ??
        datasources[0]?.id ??
        null;
      setSelectedDatasourceId(preferredDatasourceId);
    }
  }, [bindingIds, datasources, selectedDatasourceId]);

  useEffect(() => {
    if (!selectedDatasource?.assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(selectedDatasource?.assets[0]?.id ?? null);
    }
  }, [selectedAssetId, selectedDatasource]);

  useEffect(() => {
    if (datasourceEditorMode === 'create') {
      setDatasourceForm(emptyDatasourceForm());
      return;
    }
    setDatasourceForm(mapDatasourceForm(selectedDatasource));
  }, [datasourceEditorMode, selectedDatasource]);

  useEffect(() => {
    if (assetEditorMode === 'create') {
      setAssetForm(emptyAssetForm());
      return;
    }
    setAssetForm(mapAssetForm(selectedAsset));
  }, [assetEditorMode, selectedAsset]);

  const canSaveDatasource =
    datasourceForm.name.trim().length > 0 && datasourceForm.sourceCode.trim().length > 0;
  const canSaveAsset =
    assetForm.assetName.trim().length > 0 &&
    (assetForm.assetType === 'TABLE'
      ? assetForm.tableName.trim().length > 0
      : assetForm.sqlText.trim().length > 0 && assetForm.sourceTablesText.trim().length > 0);

  async function handleSaveDatasource() {
    const payload = buildDatasourcePayload(datasourceForm);
    const saved =
      datasourceEditorMode === 'create'
        ? await onCreateDatasource(payload)
        : selectedDatasource
          ? await onUpdateDatasource(selectedDatasource.id, payload)
          : null;
    if (saved && typeof saved === 'object' && 'id' in saved) {
      setSelectedDatasourceId(Number((saved as { id: number }).id));
      setDatasourceEditorMode('edit');
    }
  }

  async function handleSaveAsset(includeDetectedFields = true) {
    if (!selectedDatasource) {
      return;
    }
    const savedAsset = await onSaveAsset(
      selectedDatasource.id,
      buildAssetPayload(assetForm, includeDetectedFields),
      assetEditorMode === 'edit' ? selectedAsset?.id : undefined,
    );
    setSelectedDatasourceId(savedAsset.datasourceId);
    setSelectedAssetId(savedAsset.id);
    setAssetEditorMode('edit');
    if (node && !bindingIds.includes(savedAsset.id)) {
      const nextBindingIds = [...new Set([...bindingIds, savedAsset.id])];
      await onBindSourceAssets(node.id, nextBindingIds);
      setBindingIds(nextBindingIds);
    }
  }

  return (
    <section className="bi-management-panel bi-source-management-panel">
      <div className="bi-management-header">
        <div>
          <div className="bi-management-title">分析源管理</div>
          <div className="bi-management-subtitle">
            统一维护数据源、表或 SQL 资产、字段说明，并按节点绑定可用分析源。
          </div>
        </div>
        {node ? (
          <div className="bi-management-node-chip">
            当前节点：{node.nodeName} / 已绑定 {boundAssetCount} 个分析源资产
          </div>
        ) : (
          <div className="bi-management-node-chip">未选中节点，可先维护全局分析源目录。</div>
        )}
      </div>

      <section className="bi-source-action-panel">
        <div>
          <div className="bi-source-action-kicker">当前应该做</div>
          <div className="bi-source-action-title">{sourceActionTitle}</div>
          <div className="bi-source-action-text">{sourceActionHint}</div>
        </div>
        <div className="bi-source-action-buttons">
          {node ? (
            <Button
              disabled={isMutating || !hasBindingChanged}
              onClick={() => onBindSourceAssets(node.id, bindingIds)}
            >
              保存节点绑定
            </Button>
          ) : null}
          <Button disabled={!selectedDatasource} onClick={() => setAssetEditorMode('create')} tone="ghost">
            新建分析资产
          </Button>
        </div>
      </section>

      {node ? (
        <section className="bi-panel-card bi-source-binding-panel">
          <div className="bi-panel-card-header">
            <div>
              <div className="bi-panel-card-title">节点分析源绑定</div>
              <div className="bi-panel-card-subtitle">
                AI 生成和运行只使用已勾选资产。
              </div>
            </div>
            <div className="bi-source-binding-summary">
              <span>已选择 {bindingIds.length} 个</span>
              <span>可用 {totalAssetCount} 个</span>
            </div>
            <Button disabled={isMutating || !hasBindingChanged} onClick={() => onBindSourceAssets(node.id, bindingIds)}>
              保存节点绑定
            </Button>
          </div>

          <div className="bi-binding-grid">
            {datasources.map((datasource) => (
              <div key={datasource.id} className={cx('bi-binding-card', datasource.assets.length === 0 ? 'is-empty' : '')}>
                <div className="bi-side-card-header">
                  <div>
                    <div className="bi-side-card-title">{datasource.name}</div>
                    <div className="bi-side-card-subtitle">{datasource.sourceCode}</div>
                  </div>
                  <Badge tone="neutral">{datasource.assets.length} 个资产</Badge>
                </div>
                <div className="bi-selection-list bi-stack-list-tight">
                  {datasource.assets.map((asset) => {
                    const checked = bindingIds.includes(asset.id);
                    return (
                      <label key={asset.id} className={cx('bi-checkbox-card', checked ? 'is-checked' : '')}>
                        <input
                          checked={checked}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            setBindingIds((current) =>
                              event.target.checked
                                ? [...new Set([...current, asset.id])]
                                : current.filter((item) => item !== asset.id),
                            );
                          }}
                          type="checkbox"
                        />
                        <div>
                          <div className="bi-checkbox-title">{asset.assetName}</div>
                          <div className="bi-checkbox-meta">
                            {asset.assetCode} / {getAssetTypeLabel(asset.assetType)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {datasource.assets.length === 0 ? (
                    <div className="bi-binding-empty">暂无可绑定资产</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="bi-management-layout bi-source-management-layout">
        <div className="bi-source-catalog-panel">
          <div className="bi-source-workflow-heading">
            <span className="bi-source-workflow-step">1</span>
            <div>
              <div className="bi-source-workflow-title">选择对象</div>
              <div className="bi-source-workflow-subtitle">先选数据源，再选择要维护的分析资产。</div>
            </div>
          </div>
          <div className="bi-source-selection-summary">
            <span>{datasources.length} 个数据源</span>
            <span>{totalAssetCount} 个资产</span>
            <span>{bindingIds.length} 个已勾选</span>
          </div>
          <section className="bi-panel-card bi-management-column bi-management-column-list bi-source-nav-panel">
            <div className="bi-panel-card-header">
              <div>
                <div className="bi-panel-card-title">
                  <span className="bi-source-step-dot">1.1</span>
                  数据源
                </div>
                <div className="bi-panel-card-subtitle">选择数据源</div>
              </div>
              <button
                className="bi-inline-link"
                onClick={() => setDatasourceEditorMode('create')}
                type="button"
              >
                新建
              </button>
            </div>
            <div className="bi-stack-list">
              {datasources.map((datasource) => {
                const summary = getDatasourceAssetSummary(datasource);
                return (
                  <button
                    key={datasource.id}
                    className={cx('bi-side-card', datasource.id === selectedDatasourceId ? 'is-selected' : '')}
                    onClick={() => {
                      setSelectedDatasourceId(datasource.id);
                      setDatasourceEditorMode('edit');
                    }}
                    type="button"
                  >
                    <div className="bi-side-card-header">
                      <div>
                        <div className="bi-side-card-title">{datasource.name}</div>
                        <div className="bi-side-card-subtitle">{datasource.sourceCode}</div>
                      </div>
                      <span className="bi-node-card-status">{getStatusLabel(datasource.status)}</span>
                    </div>
                    <div className="bi-side-card-meta">
                      TABLE {summary.tableCount} / SQL {summary.sqlCount}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bi-panel-card bi-management-column bi-management-column-list bi-source-nav-panel">
            <div className="bi-panel-card-header">
              <div>
                <div className="bi-panel-card-title">
                  <span className="bi-source-step-dot">1.2</span>
                  资产
                </div>
                <div className="bi-panel-card-subtitle">
                  {selectedDatasource ? selectedDatasource.name : '请先选择数据源'}
                </div>
              </div>
              <button
                className="bi-inline-link"
                disabled={!selectedDatasource}
                onClick={() => setAssetEditorMode('create')}
                type="button"
              >
                新建
              </button>
            </div>
            {selectedDatasource ? (
              <div className="bi-stack-list">
                {selectedDatasource.assets.map((asset) => (
                  <button
                    key={asset.id}
                    className={cx('bi-asset-card', asset.id === selectedAssetId ? 'is-selected' : '')}
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setAssetEditorMode('edit');
                    }}
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
                        : asset.sourceTables.join(', ') || '未声明来源表'}
                    </div>
                  </button>
                ))}
                {selectedDatasource.assets.length === 0 ? (
                  <div className="bi-panel-empty bi-panel-empty-tight">这个数据源下还没有分析资产。</div>
                ) : null}
              </div>
            ) : (
              <div className="bi-panel-empty">请先在左侧选择一个数据源。</div>
            )}
          </section>
        </div>

        <section className="bi-panel-scroll bi-management-editor bi-source-editor-panel">
          <div className="bi-source-workflow-heading bi-source-workflow-heading-editor">
            <span className="bi-source-workflow-step">2</span>
            <div>
              <div className="bi-source-workflow-title">编辑详情</div>
              <div className="bi-source-workflow-subtitle">
                {selectedAsset
                  ? `当前资产：${selectedAsset.assetName}`
                  : selectedDatasource
                    ? `当前数据源：${selectedDatasource.name}`
                    : '选择左侧对象后维护详细信息'}
              </div>
            </div>
          </div>
          <div className="bi-panel-card bi-source-editor-card">
            <div className="bi-panel-card-header">
              <div>
                <div className="bi-panel-card-title">
                  {datasourceEditorMode === 'create' ? '新建数据源' : '编辑数据源'}
                </div>
                <div className="bi-panel-card-subtitle">补齐数据源名称、范围、状态与说明。</div>
              </div>
            </div>

            <div className="bi-panel-form">
              <label className="bi-panel-field">
                <span className="bi-panel-label">数据源名称</span>
                <input
                  aria-label="数据源名称"
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDatasourceForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={datasourceForm.name}
                />
              </label>
              <label className="bi-panel-field">
                <span className="bi-panel-label">数据源编码</span>
                <input
                  aria-label="数据源编码"
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDatasourceForm((current) => ({ ...current, sourceCode: event.target.value }))
                  }
                  value={datasourceForm.sourceCode}
                />
              </label>
              <label className="bi-panel-field">
                <span className="bi-panel-label">业务范围</span>
                <input
                  aria-label="业务范围"
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDatasourceForm((current) => ({ ...current, businessScope: event.target.value }))
                  }
                  value={datasourceForm.businessScope}
                />
              </label>
              <div className="bi-form-grid bi-form-grid-2">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">数据范围</span>
                  <select
                    aria-label="数据范围"
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setDatasourceForm((current) => ({ ...current, dataScope: event.target.value }))
                    }
                    value={datasourceForm.dataScope}
                  >
                    <option value="CURRENT_DATASOURCE">当前账套</option>
                    <option value="GLOBAL">全局</option>
                  </select>
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">状态</span>
                  <select
                    aria-label="数据源状态"
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setDatasourceForm((current) => ({ ...current, status: event.target.value }))
                    }
                    value={datasourceForm.status}
                  >
                    <option value="ACTIVE">启用</option>
                    <option value="DRAFT">草稿</option>
                    <option value="DISABLED">停用</option>
                  </select>
                </label>
              </div>
              <label className="bi-panel-field">
                <span className="bi-panel-label">说明</span>
                <textarea
                  aria-label="数据源说明"
                  className="bi-panel-textarea"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setDatasourceForm((current) => ({ ...current, description: event.target.value }))
                  }
                  value={datasourceForm.description}
                />
              </label>
              <div className="bi-panel-inline-actions">
                <Button disabled={isMutating || !canSaveDatasource} onClick={handleSaveDatasource}>
                  {datasourceEditorMode === 'create' ? '创建数据源' : '保存数据源'}
                </Button>
                {datasourceEditorMode === 'create' ? (
                  <Button onClick={() => setDatasourceEditorMode('edit')} tone="ghost">
                    返回编辑
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bi-panel-card bi-source-editor-card">
            <div className="bi-panel-card-header">
              <div>
                <div className="bi-panel-card-title">
                  {assetEditorMode === 'create' ? '新建分析资产' : '编辑分析资产'}
                </div>
                <div className="bi-panel-card-subtitle">
                  维护表/SQL 资产、列信息和业务说明。字段支持结构化编辑，不再用长文本拼接。
                </div>
              </div>
            </div>

            <div className="bi-panel-form">
              <div className="bi-form-grid bi-form-grid-2">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">资产类型</span>
                  <select
                    aria-label="资产类型"
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setAssetForm((current) => ({
                        ...current,
                        assetType: event.target.value === 'SQL' ? 'SQL' : 'TABLE',
                      }))
                    }
                    value={assetForm.assetType}
                  >
                    <option value="TABLE">数据表</option>
                    <option value="SQL">SQL 结果集</option>
                  </select>
                </label>
                <label className="bi-panel-field">
                  <span className="bi-panel-label">状态</span>
                  <select
                    aria-label="资产状态"
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setAssetForm((current) => ({ ...current, status: event.target.value }))
                    }
                    value={assetForm.status}
                  >
                    <option value="ACTIVE">启用</option>
                    <option value="DRAFT">草稿</option>
                    <option value="DISABLED">停用</option>
                  </select>
                </label>
              </div>

              <div className="bi-form-grid bi-form-grid-2">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">资产名称</span>
                  <input
                    aria-label="资产名称"
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
                    aria-label="资产编码"
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setAssetForm((current) => ({ ...current, assetCode: event.target.value }))
                    }
                    value={assetForm.assetCode}
                  />
                </label>
              </div>

              <label className="bi-panel-field">
                <span className="bi-panel-label">资产说明</span>
                <input
                  aria-label="资产说明"
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setAssetForm((current) => ({ ...current, comment: event.target.value }))
                  }
                  value={assetForm.comment}
                />
              </label>

              {assetForm.assetType === 'TABLE' ? (
                <div className="bi-form-grid bi-form-grid-2">
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">表架构</span>
                    <input
                      aria-label="表架构"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setAssetForm((current) => ({ ...current, tableSchema: event.target.value }))
                      }
                      value={assetForm.tableSchema}
                    />
                  </label>
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">表名</span>
                    <input
                      aria-label="表名"
                      className="bi-panel-input"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setAssetForm((current) => ({ ...current, tableName: event.target.value }))
                      }
                      value={assetForm.tableName}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">SQL 文本</span>
                    <textarea
                      aria-label="SQL 文本"
                      className="bi-panel-textarea bi-panel-code"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        setAssetForm((current) => ({ ...current, sqlText: event.target.value }))
                      }
                      value={assetForm.sqlText}
                    />
                  </label>
                  <label className="bi-panel-field">
                    <span className="bi-panel-label">声明来源表</span>
                    <textarea
                      aria-label="声明来源表"
                      className="bi-panel-textarea"
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        setAssetForm((current) => ({ ...current, sourceTablesText: event.target.value }))
                      }
                      placeholder="使用逗号或换行分隔"
                      value={assetForm.sourceTablesText}
                    />
                  </label>
                </>
              )}

              <div className="bi-field-table-wrap">
                <div className="bi-field-table-header">
                  <div className="bi-field-table-title">
                    {assetForm.assetType === 'TABLE' ? (
                      <DatabaseIcon className="bi-inline-icon" />
                    ) : (
                      <CodeIcon className="bi-inline-icon" />
                    )}
                    列信息
                  </div>
                  <div className="bi-panel-inline-actions">
                    <button
                      className="bi-inline-link"
                      onClick={() =>
                        setAssetForm((current) => ({
                          ...current,
                          fields: [...current.fields, emptyFieldRow(current.fields.length)],
                        }))
                      }
                      type="button"
                    >
                      添加列
                    </button>
                    <button
                      className="bi-inline-link"
                      disabled={!selectedDatasource}
                      onClick={() => {
                        void handleSaveAsset(false);
                      }}
                      type="button"
                    >
                      {assetForm.assetType === 'TABLE' ? '读取表字段说明' : '读取 SQL 结果列'}
                    </button>
                    {selectedAsset ? (
                      <button
                        className="bi-inline-link"
                        onClick={() => {
                          void onGenerateBizComments(selectedAsset.id);
                        }}
                        type="button"
                      >
                        AI 生成业务说明
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="bi-field-editor-grid">
                  <div className="bi-field-editor-grid-header">字段名</div>
                  <div className="bi-field-editor-grid-header">显示名</div>
                  <div className="bi-field-editor-grid-header">类型</div>
                  <div className="bi-field-editor-grid-header">数据库说明</div>
                  <div className="bi-field-editor-grid-header">业务说明</div>
                  <div className="bi-field-editor-grid-header">示例值</div>
                  <div className="bi-field-editor-grid-header">可空</div>
                  <div className="bi-field-editor-grid-header">操作</div>
                  {assetForm.fields.map((field, index) => (
                    <FragmentFieldRow
                      field={field}
                      index={index}
                      key={`${field.fieldName || 'field'}-${index}`}
                      onChange={(patch) =>
                        setAssetForm((current) => ({
                          ...current,
                          fields: current.fields.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, ...patch } : item,
                          ),
                        }))
                      }
                      onRemove={() =>
                        setAssetForm((current) => ({
                          ...current,
                          fields: current.fields.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                    />
                  ))}
                  {assetForm.fields.length === 0 ? (
                    <div className="bi-panel-empty bi-field-editor-empty">
                      还没有列信息。可以手工添加，也可以先读取表字段说明或 SQL 结果列。
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedAsset ? (
                <Button
                  disabled={isMutating}
                  onClick={() =>
                    onReplaceAssetFields(
                      selectedAsset.id,
                      assetForm.fields
                        .map((field, index) => ({
                          bizComment: field.bizComment.trim() || undefined,
                          dbComment: field.dbComment.trim() || undefined,
                          exampleValue: field.exampleValue.trim() || undefined,
                          fieldLabel: field.fieldLabel.trim() || undefined,
                          fieldName: field.fieldName.trim(),
                          fieldOrigin: field.fieldOrigin.trim() || undefined,
                          fieldType: field.fieldType.trim() || undefined,
                          isNullable: field.isNullable,
                          sortNo: Number(field.sortNo ?? index),
                        }))
                        .filter((field) => field.fieldName),
                    )
                  }
                  tone="ghost"
                >
                  仅保存列信息
                </Button>
              ) : null}

              <div className="bi-panel-inline-actions">
                <Button disabled={!canSaveAsset || !selectedDatasource || isMutating} onClick={() => void handleSaveAsset()}>
                  {assetEditorMode === 'create' ? '创建资产并绑定节点' : '保存资产'}
                </Button>
                {assetEditorMode === 'create' ? (
                  <Button onClick={() => setAssetEditorMode('edit')} tone="ghost">
                    返回编辑
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function FragmentFieldRow({
  field,
  index,
  onChange,
  onRemove,
}: {
  field: AssetFieldRow;
  index: number;
  onChange: (patch: Partial<AssetFieldRow>) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <input
        aria-label={`字段名-${index + 1}`}
        className="bi-panel-input bi-field-editor-input"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fieldName: event.target.value })}
        value={field.fieldName}
      />
      <input
        aria-label={`显示名-${index + 1}`}
        className="bi-panel-input bi-field-editor-input"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fieldLabel: event.target.value })}
        value={field.fieldLabel}
      />
      <input
        aria-label={`字段类型-${index + 1}`}
        className="bi-panel-input bi-field-editor-input"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ fieldType: event.target.value })}
        value={field.fieldType}
      />
      <input
        aria-label={`数据库说明-${index + 1}`}
        className="bi-panel-input bi-field-editor-input"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ dbComment: event.target.value })}
        value={field.dbComment}
      />
      <input
        aria-label={`业务说明-${index + 1}`}
        className="bi-panel-input bi-field-editor-input"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ bizComment: event.target.value })}
        value={field.bizComment}
      />
      <input
        aria-label={`示例值-${index + 1}`}
        className="bi-panel-input bi-field-editor-input"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ exampleValue: event.target.value })}
        value={field.exampleValue}
      />
      <label className="bi-field-editor-checkbox">
        <input
          checked={field.isNullable}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ isNullable: event.target.checked })}
          type="checkbox"
        />
        可空
      </label>
      <button className="bi-inline-link" onClick={onRemove} type="button">
        删除
      </button>
    </>
  );
}

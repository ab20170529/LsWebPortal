import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Button, Card } from '@lserp/ui';

import type {
  DataAssetSavePayload,
  DatasourceSavePayload,
} from '../api/bi-api';
import type { BiDataAsset, BiDatasource } from '../types';

type BiDataAssetPanelProps = {
  datasources: BiDatasource[];
  isMutating: boolean;
  onCreateDatasource: (payload: DatasourceSavePayload) => Promise<void>;
  onSaveAsset: (
    datasourceId: number,
    payload: DataAssetSavePayload,
    assetId?: number,
  ) => Promise<void>;
  onSelectDatasource: (datasourceId: number) => void;
  selectedDatasourceId: number | null;
};

function formatFieldText(asset: BiDataAsset | null) {
  if (!asset || asset.fields.length === 0) {
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

function parseFieldText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [
        fieldName = '',
        fieldLabel = '',
        fieldType = '',
        dbComment = '',
        bizComment = '',
        exampleValue = '',
      ] = line.split('|').map((part) => part.trim());

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
    .filter((field) => field.fieldName.length > 0);
}

function parseSourceTables(value: string) {
  return value
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyAssetState() {
  return {
    assetCode: '',
    assetComment: '',
    assetName: '',
    assetType: 'TABLE' as 'SQL' | 'TABLE',
    assetFieldsText: '',
    assetSourceTablesText: '',
    assetSqlText: '',
    assetTableName: '',
    assetTableSchema: 'dbo',
  };
}

export function BiDataAssetPanel({
  datasources,
  isMutating,
  onCreateDatasource,
  onSaveAsset,
  onSelectDatasource,
  selectedDatasourceId,
}: BiDataAssetPanelProps) {
  const [datasourceDescription, setDatasourceDescription] = useState('');
  const [datasourceName, setDatasourceName] = useState('');
  const [datasourceSourceCode, setDatasourceSourceCode] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [assetForm, setAssetForm] = useState(emptyAssetState);

  const selectedDatasource = useMemo(
    () => datasources.find((datasource) => datasource.id === selectedDatasourceId) ?? null,
    [datasources, selectedDatasourceId],
  );

  const selectedAsset = useMemo(
    () =>
      selectedDatasource?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [selectedDatasource, selectedAssetId],
  );

  useEffect(() => {
    if (!selectedDatasource) {
      setSelectedAssetId(null);
      setAssetForm(emptyAssetState());
      return;
    }

    if (!selectedDatasource.assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(selectedDatasource.assets[0]?.id ?? null);
    }
  }, [selectedAssetId, selectedDatasource]);

  useEffect(() => {
    if (!selectedAsset) {
      setAssetForm(emptyAssetState());
      return;
    }

    setAssetForm({
      assetCode: selectedAsset.assetCode,
      assetComment: selectedAsset.comment ?? '',
      assetFieldsText: formatFieldText(selectedAsset),
      assetName: selectedAsset.assetName,
      assetSourceTablesText: selectedAsset.sourceTables.join(', '),
      assetSqlText: selectedAsset.sqlText ?? '',
      assetTableName: selectedAsset.tableName ?? '',
      assetTableSchema: selectedAsset.tableSchema ?? 'dbo',
      assetType: selectedAsset.assetType === 'SQL' ? 'SQL' : 'TABLE',
    });
  }, [selectedAsset]);

  async function handleCreateDatasource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateDatasource({
      description: datasourceDescription || undefined,
      name: datasourceName,
      sourceCode: datasourceSourceCode,
    });
    setDatasourceSourceCode('');
    setDatasourceName('');
    setDatasourceDescription('');
  }

  async function handleSaveAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDatasourceId) {
      return;
    }

    const fields = parseFieldText(assetForm.assetFieldsText);
    const payload: DataAssetSavePayload = {
      ...(assetForm.assetCode ? { assetCode: assetForm.assetCode } : {}),
      ...(assetForm.assetComment ? { comment: assetForm.assetComment } : {}),
      ...(fields.length > 0 ? { fields } : {}),
      ...(assetForm.assetName ? { assetName: assetForm.assetName } : {}),
      assetType: assetForm.assetType,
      ...(assetForm.assetType === 'TABLE'
        ? {
            ...(assetForm.assetTableName ? { tableName: assetForm.assetTableName } : {}),
            ...(assetForm.assetTableSchema ? { tableSchema: assetForm.assetTableSchema } : {}),
          }
        : {
            ...(assetForm.assetSqlText ? { sqlText: assetForm.assetSqlText } : {}),
            ...(parseSourceTables(assetForm.assetSourceTablesText).length > 0
              ? { sourceTables: parseSourceTables(assetForm.assetSourceTablesText) }
              : {}),
          }),
    };

    await onSaveAsset(selectedDatasourceId, payload, selectedAssetId ?? undefined);
  }

  return (
    <Card className="rounded-[28px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            Data Assets
          </div>
          <div className="theme-text-strong mt-2 text-xl font-black tracking-tight">
            Unified datasource and asset center
          </div>
        </div>
        {selectedDatasource ? (
          <Badge tone="brand">{selectedDatasource.sourceCode}</Badge>
        ) : (
          <Badge tone="neutral">No datasource selected</Badge>
        )}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <form className="space-y-3" onSubmit={handleCreateDatasource}>
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Create datasource
            </div>
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDatasourceSourceCode(event.target.value)
              }
              placeholder="sourceCode"
              value={datasourceSourceCode}
            />
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDatasourceName(event.target.value)}
              placeholder="Datasource name"
              value={datasourceName}
            />
            <textarea
              className="theme-input min-h-[96px] w-full rounded-[24px] px-4 py-3"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setDatasourceDescription(event.target.value)
              }
              placeholder="Datasource description"
              value={datasourceDescription}
            />
            <Button disabled={isMutating} type="submit">
              Save datasource
            </Button>
          </form>

          <div className="space-y-3">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Datasource list
            </div>
            {datasources.map((datasource) => (
              <button
                key={datasource.id}
                className="w-full rounded-[22px] border px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
                onClick={() => {
                  onSelectDatasource(datasource.id);
                }}
                style={{
                  backgroundColor:
                    datasource.id === selectedDatasourceId
                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 8%, white)'
                      : 'color-mix(in srgb, var(--portal-color-surface-panel) 84%, white)',
                  borderColor:
                    datasource.id === selectedDatasourceId
                      ? 'color-mix(in srgb, var(--portal-color-brand-500) 28%, white)'
                      : 'color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="theme-text-strong text-sm font-black tracking-tight">
                      {datasource.name}
                    </div>
                    <div className="theme-text-muted mt-1 text-xs">{datasource.sourceCode}</div>
                  </div>
                  <Badge tone="neutral">{datasource.assets.length} assets</Badge>
                </div>
                {datasource.description ? (
                  <div className="theme-text-muted mt-3 text-xs leading-6">
                    {datasource.description}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Asset list
            </div>
            {selectedDatasource?.assets.length ? (
              selectedDatasource.assets.map((asset) => (
                <button
                  key={asset.id}
                  className="w-full rounded-[22px] border px-4 py-4 text-left"
                  onClick={() => {
                    setSelectedAssetId(asset.id);
                  }}
                  style={{
                    backgroundColor:
                      asset.id === selectedAssetId
                        ? 'color-mix(in srgb, var(--portal-color-brand-500) 8%, white)'
                        : 'color-mix(in srgb, var(--portal-color-surface-panel) 84%, white)',
                    borderColor:
                      asset.id === selectedAssetId
                        ? 'color-mix(in srgb, var(--portal-color-brand-500) 28%, white)'
                        : 'color-mix(in srgb, var(--portal-color-border-soft) 76%, white)',
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="theme-text-strong text-sm font-black tracking-tight">
                        {asset.assetName}
                      </div>
                      <div className="theme-text-muted mt-1 text-xs">{asset.assetCode}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone="neutral">{asset.assetType}</Badge>
                      <Badge tone="brand">{asset.fields.length} fields</Badge>
                    </div>
                  </div>
                  <div className="theme-text-muted mt-3 text-xs leading-6">
                    {asset.assetType === 'TABLE'
                      ? `${asset.tableSchema ?? 'dbo'}.${asset.tableName ?? ''}`
                      : asset.sourceTables.join(', ') || 'No source tables'}
                  </div>
                </button>
              ))
            ) : (
              <div className="theme-text-muted rounded-[22px] border px-4 py-6 text-sm">
                Add a datasource first, then create table or SQL assets under it.
              </div>
            )}
          </div>

          <form className="space-y-3" onSubmit={handleSaveAsset}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="theme-text-strong text-lg font-black tracking-tight">
                {selectedAsset ? 'Edit asset' : 'Create asset'}
              </div>
              {selectedAsset ? <Badge tone="success">Asset #{selectedAsset.id}</Badge> : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="theme-input h-11 w-full rounded-2xl px-4"
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
              <input
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAssetForm((current) => ({ ...current, assetCode: event.target.value }))
                }
                placeholder="assetCode (optional)"
                value={assetForm.assetCode}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAssetForm((current) => ({ ...current, assetName: event.target.value }))
                }
                placeholder="assetName"
                value={assetForm.assetName}
              />
              <input
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAssetForm((current) => ({ ...current, assetComment: event.target.value }))
                }
                placeholder="comment"
                value={assetForm.assetComment}
              />
            </div>

            {assetForm.assetType === 'TABLE' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="theme-input h-11 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setAssetForm((current) => ({
                      ...current,
                      assetTableSchema: event.target.value,
                    }))
                  }
                  placeholder="table schema"
                  value={assetForm.assetTableSchema}
                />
                <input
                  className="theme-input h-11 w-full rounded-2xl px-4"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setAssetForm((current) => ({ ...current, assetTableName: event.target.value }))
                  }
                  placeholder="table name"
                  value={assetForm.assetTableName}
                />
              </div>
            ) : (
              <>
                <textarea
                  className="theme-input min-h-[120px] w-full rounded-[24px] px-4 py-3"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setAssetForm((current) => ({ ...current, assetSqlText: event.target.value }))
                  }
                  placeholder="SQL text"
                  value={assetForm.assetSqlText}
                />
                <textarea
                  className="theme-input min-h-[90px] w-full rounded-[24px] px-4 py-3"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setAssetForm((current) => ({
                      ...current,
                      assetSourceTablesText: event.target.value,
                    }))
                  }
                  placeholder="source tables, comma or newline separated"
                  value={assetForm.assetSourceTablesText}
                />
              </>
            )}

            <textarea
              className="theme-input min-h-[160px] w-full rounded-[24px] px-4 py-3"
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setAssetForm((current) => ({ ...current, assetFieldsText: event.target.value }))
              }
              placeholder="fieldName|fieldLabel|fieldType|dbComment|bizComment|exampleValue"
              value={assetForm.assetFieldsText}
            />

            <div className="theme-text-muted text-xs leading-6">
              Leave the field block empty when importing a new table asset. The backend will read
              table columns and comments automatically.
            </div>

            <Button disabled={!selectedDatasourceId || isMutating} type="submit">
              Save asset
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

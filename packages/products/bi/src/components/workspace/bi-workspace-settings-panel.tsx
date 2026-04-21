import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button, cx } from '@lserp/ui';

import type { NodeTypeSavePayload } from '../../api/bi-api';
import type { BiNodeType } from '../../types';
import { getStatusLabel } from '../../utils/bi-directory';

type BiWorkspaceSettingsPanelProps = {
  isMutating: boolean;
  nodeTypes: BiNodeType[];
  onSaveNodeType: (payload: NodeTypeSavePayload, id?: number) => Promise<unknown>;
};

function emptyForm(sortNo: number) {
  return {
    allowedChildTypeCodes: [] as string[],
    description: '',
    sortNo,
    status: 'ACTIVE',
    systemDefault: false,
    typeCode: '',
    typeName: '',
  };
}

export function BiWorkspaceSettingsPanel({
  isMutating,
  nodeTypes,
  onSaveNodeType,
}: BiWorkspaceSettingsPanelProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [form, setForm] = useState(() => emptyForm((nodeTypes.at(-1)?.sortNo ?? 0) + 10));

  const selectedType = useMemo(
    () => nodeTypes.find((nodeType) => nodeType.id === selectedTypeId) ?? null,
    [nodeTypes, selectedTypeId],
  );
  const childTypeOptions = useMemo(() => {
    const options = [...nodeTypes];
    if (form.typeCode.trim() && !options.some((nodeType) => nodeType.typeCode === form.typeCode.trim().toUpperCase())) {
      options.push({
        allowedChildTypeCodes: [],
        id: -1,
        sortNo: form.sortNo,
        status: form.status,
        systemDefault: false,
        typeCode: form.typeCode.trim().toUpperCase(),
        typeName: form.typeName.trim() || form.typeCode.trim().toUpperCase(),
      });
    }
    return options;
  }, [form.sortNo, form.status, form.typeCode, form.typeName, nodeTypes]);

  useEffect(() => {
    if (!selectedType && nodeTypes.length > 0 && selectedTypeId == null) {
      setSelectedTypeId(nodeTypes[0]?.id ?? null);
    }
  }, [nodeTypes, selectedType, selectedTypeId]);

  useEffect(() => {
    if (!selectedType) {
      if (selectedTypeId == null) {
        setForm(emptyForm((nodeTypes.at(-1)?.sortNo ?? 0) + 10));
      }
      return;
    }
    setForm({
      allowedChildTypeCodes: [...selectedType.allowedChildTypeCodes],
      description: selectedType.description ?? '',
      sortNo: Number(selectedType.sortNo ?? 0),
      status: selectedType.status ?? 'ACTIVE',
      systemDefault: Boolean(selectedType.systemDefault),
      typeCode: selectedType.typeCode,
      typeName: selectedType.typeName,
    });
  }, [nodeTypes, selectedType, selectedTypeId]);

  return (
    <aside className="bi-context-panel">
      <div className="bi-context-panel-header">
        <div>
          <div className="bi-context-panel-title">工作台设置</div>
          <div className="bi-context-panel-subtitle">
            维护 BI 节点类型、显示顺序以及允许的子级类型规则。
          </div>
        </div>
      </div>

      <div className="bi-context-body">
        <div className="bi-panel-scroll">
          <section className="bi-panel-section">
            <div className="bi-panel-section-header">
              <div className="bi-panel-section-title">节点类型</div>
              <button
                className="bi-inline-link"
                onClick={() => {
                  setSelectedTypeId(null);
                  setForm(emptyForm((nodeTypes.at(-1)?.sortNo ?? 0) + 10));
                }}
                type="button"
              >
                新建类型
              </button>
            </div>

            <div className="bi-stack-list">
              {nodeTypes.map((nodeType) => (
                <button
                  key={nodeType.id}
                  className={cx('bi-side-card', nodeType.id === selectedTypeId ? 'is-selected' : '')}
                  onClick={() => setSelectedTypeId(nodeType.id)}
                  type="button"
                >
                  <div className="bi-side-card-header">
                    <div>
                      <div className="bi-side-card-title">{nodeType.typeName}</div>
                      <div className="bi-side-card-subtitle">{nodeType.typeCode}</div>
                    </div>
                    <span className="bi-node-card-status">{getStatusLabel(nodeType.status)}</span>
                  </div>
                  <div className="bi-side-card-meta">
                    允许子级：{nodeType.allowedChildTypeCodes.join(', ') || '无'}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bi-panel-section">
            <div className="bi-panel-section-header">
              <div className="bi-panel-section-title">编辑类型</div>
              <div className="bi-panel-section-caption">{selectedType ? '已有类型' : '新建类型'}</div>
            </div>

            <div className="bi-panel-form">
              <label className="bi-panel-field">
                <span className="bi-panel-label">类型编码</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setForm((current) => ({ ...current, typeCode: event.target.value.toUpperCase() }))
                  }
                  value={form.typeCode}
                />
              </label>

              <label className="bi-panel-field">
                <span className="bi-panel-label">类型名称</span>
                <input
                  className="bi-panel-input"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setForm((current) => ({ ...current, typeName: event.target.value }))
                  }
                  value={form.typeName}
                />
              </label>

              <label className="bi-panel-field">
                <span className="bi-panel-label">说明</span>
                <textarea
                  className="bi-panel-textarea"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  value={form.description}
                />
              </label>

              <div className="bi-info-grid">
                <label className="bi-panel-field">
                  <span className="bi-panel-label">排序号</span>
                  <input
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setForm((current) => ({ ...current, sortNo: Number(event.target.value || 0) }))
                    }
                    type="number"
                    value={form.sortNo}
                  />
                </label>

                <label className="bi-panel-field">
                  <span className="bi-panel-label">状态</span>
                  <select
                    className="bi-panel-input"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setForm((current) => ({ ...current, status: event.target.value }))
                    }
                    value={form.status}
                  >
                    <option value="ACTIVE">启用</option>
                    <option value="DRAFT">草稿</option>
                    <option value="DISABLED">停用</option>
                  </select>
                </label>
              </div>

              <label className="bi-panel-field">
                <span className="bi-panel-label">允许子级类型</span>
                <div className="bi-selection-list">
                  {childTypeOptions.map((nodeType) => {
                    const checked = form.allowedChildTypeCodes.includes(nodeType.typeCode);
                    return (
                      <label
                        key={`${nodeType.id}-${nodeType.typeCode}`}
                        className={cx('bi-checkbox-card', checked ? 'is-checked' : '')}
                      >
                        <input
                          checked={checked}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            setForm((current) => ({
                              ...current,
                              allowedChildTypeCodes: event.target.checked
                                ? [...new Set([...current.allowedChildTypeCodes, nodeType.typeCode])]
                                : current.allowedChildTypeCodes.filter((item) => item !== nodeType.typeCode),
                            }));
                          }}
                          type="checkbox"
                        />
                        <div>
                          <div className="bi-checkbox-title">{nodeType.typeName}</div>
                          <div className="bi-checkbox-meta">{nodeType.typeCode}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </label>

              <Button
                disabled={isMutating || !form.typeCode.trim() || !form.typeName.trim()}
                onClick={() =>
                  onSaveNodeType(
                    {
                      allowedChildTypeCodes: form.allowedChildTypeCodes,
                      description: form.description || undefined,
                      sortNo: form.sortNo,
                      status: form.status,
                      systemDefault: form.systemDefault,
                      typeCode: form.typeCode.trim().toUpperCase(),
                      typeName: form.typeName.trim(),
                    },
                    selectedType?.id,
                  )
                }
              >
                保存节点类型
              </Button>
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}

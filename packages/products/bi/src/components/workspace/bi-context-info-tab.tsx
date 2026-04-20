import { useEffect, useState, type ChangeEvent } from 'react';
import { Button } from '@lserp/ui';

import type { BiDirectoryNode } from '../../types';
import { getNodeTypeLabel, getStatusLabel } from '../../utils/bi-directory';

type BiContextInfoTabProps = {
  isMutating: boolean;
  node: BiDirectoryNode | null;
  onSaveSelectedNode: (
    id: number,
    payload: {
      canvasMeta?: Record<string, unknown>;
      nodeCode: string;
      nodeName: string;
      nodeType: string;
      orderNo?: number;
      parentId?: number | null;
      status?: string;
    },
  ) => Promise<void>;
};

export function BiContextInfoTab({
  isMutating,
  node,
  onSaveSelectedNode,
}: BiContextInfoTabProps) {
  const [form, setForm] = useState({
    nodeCode: '',
    nodeName: '',
    nodeType: 'COMPANY',
    orderNo: 0,
    status: 'ACTIVE',
  });

  useEffect(() => {
    setForm({
      nodeCode: node?.nodeCode ?? '',
      nodeName: node?.nodeName ?? '',
      nodeType: node?.nodeType ?? 'COMPANY',
      orderNo: Number(node?.orderNo ?? 0),
      status: node?.status ?? 'ACTIVE',
    });
  }, [node]);

  if (!node) {
    return (
      <div className="bi-panel-scroll">
        <div className="bi-panel-empty">
          在画布中选中一个节点后，这里会展示它的基础信息，并支持直接编辑节点编码、名称、类型和状态。
        </div>
      </div>
    );
  }

  return (
    <div className="bi-panel-scroll">
      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">节点信息</div>
          <div className="bi-panel-section-caption">{getStatusLabel(node.status)}</div>
        </div>

        <div className="bi-info-grid">
          <div className="bi-info-item">
            <span className="bi-info-label">层级</span>
            <span className="bi-info-value">{node.level ?? 1}</span>
          </div>
          <div className="bi-info-item">
            <span className="bi-info-label">节点类型</span>
            <span className="bi-info-value">{getNodeTypeLabel(node.nodeType)}</span>
          </div>
          <div className="bi-info-item">
            <span className="bi-info-label">分析源</span>
            <span className="bi-info-value">{node.datasourceIds.length}</span>
          </div>
          <div className="bi-info-item">
            <span className="bi-info-label">状态</span>
            <span className="bi-info-value">{getStatusLabel(node.status)}</span>
          </div>
        </div>
      </section>

      <section className="bi-panel-section">
        <div className="bi-panel-section-header">
          <div className="bi-panel-section-title">编辑属性</div>
          <div className="bi-panel-section-caption">{node.nodeCode}</div>
        </div>

        <div className="bi-panel-form">
          <label className="bi-panel-field">
            <span className="bi-panel-label">节点名称</span>
            <input
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((current) => ({ ...current, nodeName: event.target.value }))
              }
              value={form.nodeName}
            />
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">节点编码</span>
            <input
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((current) => ({ ...current, nodeCode: event.target.value }))
              }
              value={form.nodeCode}
            />
          </label>

          <label className="bi-panel-field">
            <span className="bi-panel-label">节点类型</span>
            <select
              className="bi-panel-input"
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setForm((current) => ({ ...current, nodeType: event.target.value }))
              }
              value={form.nodeType}
            >
              <option value="COMPANY">COMPANY</option>
              <option value="DEPARTMENT">DEPARTMENT</option>
              <option value="ANALYSIS_DIM">ANALYSIS_DIM</option>
              <option value="SUB_DIM">SUB_DIM</option>
            </select>
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
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </label>

          <Button
            disabled={isMutating || !form.nodeCode.trim() || !form.nodeName.trim()}
            onClick={() =>
              onSaveSelectedNode(node.id, {
                canvasMeta: node.canvasMeta ?? undefined,
                nodeCode: form.nodeCode.trim(),
                nodeName: form.nodeName.trim(),
                nodeType: form.nodeType,
                orderNo: form.orderNo,
                parentId: node.parentId ?? null,
                status: form.status,
              })
            }
          >
            保存节点
          </Button>
        </div>
      </section>
    </div>
  );
}

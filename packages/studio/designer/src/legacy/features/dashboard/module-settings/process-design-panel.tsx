import React, { useMemo, useState } from 'react';
import {
  buildFlowableBridgeRequest,
  compileProcessDesignerXml,
  publishProcessDesignerBridge,
  previewProcessDesignerBridge,
  type ApprovalFlowFamily,
  type FlowableBridgePublishResult,
  type FlowableBridgePreviewResult,
  type FlowableBridgeTablePreview,
} from '../../../lib/backend-process-designer';
import type {
  SimpleProcessSchema,
  SimpleProcessSchemaVersion,
} from '../../../lib/simple-process-designer-host';
import { cn } from '../../../lib/utils';
import { ProcessDesignerStudio } from './process-designer-studio';
import {
  countProcessDesignerGatewayNodes,
  countProcessDesignerTaskNodes,
  createProcessDesignerTemplateDocument,
  type ProcessDesignerDocument,
  type ProcessDesignerEdge,
  type ProcessDesignerNode,
} from './process-designer-types';

type ProcessDesignValue = {
  actionDescription: string;
  approvalFamily: ApprovalFlowFamily;
  businessCode: string;
  businessType: string;
  designerDocument: ProcessDesignerDocument;
  legacyFlowTypeId?: number;
  permissionScope: string;
  planValue: string;
  schemeCode: string;
  schemeName: string;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
};

type ProcessDesignPanelProps = {
  currentModuleName: string;
  currentUserName?: string;
  emptyHint?: string;
  mode?: 'wizard' | 'workspace';
  onCreate?: () => void;
  onToast?: (message: string) => void;
  onUpdate: (patch: Partial<ProcessDesignValue>) => void;
  processDesign: ProcessDesignValue | null;
};

type LeftTabKey = 'scheme' | 'template' | 'bridge';

const FIELD_CLASS =
  'h-11 rounded-[14px] border border-slate-200/80 bg-white px-3 text-[13px] text-slate-700 shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100';

const LEFT_TABS: Array<{
  key: LeftTabKey;
  title: string;
  desc: string;
  icon: string;
}> = [
  { key: 'scheme', title: '流程方案', desc: '维护方案基础信息与业务范围。', icon: 'tune' },
  { key: 'template', title: '模板切换', desc: '切换模板并快速追加审批节点。', icon: 'dashboard_customize' },
  { key: 'bridge', title: '联调发布', desc: '编译 XML、预览映射、发布旧流程。', icon: 'cloud_sync' },
];

function nextStepCode(document: ProcessDesignerDocument) {
  const codes = document.nodes
    .map((node) => node.properties.stepCode)
    .filter((code): code is number => typeof code === 'number' && Number.isFinite(code));
  return (codes.length ? Math.max(...codes) : 0) + 100;
}

function createEdge(sourceNodeId: string, targetNodeId: string, properties: ProcessDesignerEdge['properties'] = {}): ProcessDesignerEdge {
  return {
    id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'sequence-flow',
    sourceNodeId,
    targetNodeId,
    properties,
  };
}

function appendApprovalAtTail(document: ProcessDesignerDocument) {
  const endNode = document.nodes.find((node) => node.type === 'end-node');
  if (!endNode) {
    return null;
  }

  const incoming = document.edges.filter((edge) => edge.targetNodeId === endNode.id);
  if (incoming.length !== 1) {
    return null;
  }

  const source = document.nodes.find((node) => node.id === incoming[0].sourceNodeId);
  if (!source) {
    return null;
  }

  const movedNodes = document.nodes.map((node) => (
    node.id === endNode.id
      ? {
          ...node,
          properties: {
            ...node.properties,
            x: node.properties.x + 220,
          },
        }
      : node
  ));
  const shiftedEnd = movedNodes.find((node) => node.id === endNode.id) ?? endNode;
  const insertedNode: ProcessDesignerNode = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'approver-task',
    textValue: `审批节点 ${countProcessDesignerTaskNodes(document) + 1}`,
    properties: {
      x: source.properties.x + 220,
      y: shiftedEnd.properties.y,
      assigneeMode: 'role',
      stepCode: nextStepCode(document),
      stepGroup: `审批 ${countProcessDesignerTaskNodes(document) + 1}`,
    },
  };

  return {
    nodes: [...movedNodes, insertedNode],
    edges: document.edges
      .filter((edge) => edge.id !== incoming[0].id)
      .concat(
        createEdge(source.id, insertedNode.id),
        createEdge(insertedNode.id, shiftedEnd.id),
      ),
  };
}

export function ProcessDesignPanel({
  currentModuleName,
  currentUserName,
  emptyHint = '先创建一条流程方案，再开始配置流程画布和审批节点属性。',
  mode = 'workspace',
  onCreate,
  onToast,
  onUpdate,
  processDesign,
}: ProcessDesignPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTabKey>('scheme');
  const [compiledXml, setCompiledXml] = useState('');
  const [compileWarnings, setCompileWarnings] = useState<string[]>([]);
  const [previewResult, setPreviewResult] = useState<FlowableBridgePreviewResult | null>(null);
  const [publishResult, setPublishResult] = useState<FlowableBridgePublishResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const bridgeRequest = useMemo(() => {
    if (!processDesign) {
      return null;
    }

    return buildFlowableBridgeRequest({
      approvalFamily: processDesign.approvalFamily,
      businessCode: processDesign.businessCode,
      businessType: processDesign.businessType,
      currentUserName,
      document: processDesign.designerDocument,
      permissionScope: processDesign.permissionScope,
      planValue: processDesign.planValue,
      schemeCode: processDesign.schemeCode,
      schemeName: processDesign.schemeName,
      simpleSchema: processDesign.simpleSchema,
      simpleSchemaVersion: processDesign.simpleSchemaVersion,
    });
  }, [currentUserName, processDesign]);

  if (!processDesign || !bridgeRequest) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-white/70 px-6 text-center dark:border-slate-700 dark:bg-slate-950/30">
        <div className="text-[18px] font-black tracking-[-0.03em] text-slate-900 dark:text-white">流程设计尚未创建</div>
        <div className="mt-2 max-w-[460px] text-[13px] leading-6 text-slate-500 dark:text-slate-300">{emptyHint}</div>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-[16px] bg-primary px-4 py-2 text-[12px] font-bold text-white shadow-[0_18px_36px_-24px_rgba(49,98,255,0.35)] transition-all hover:-translate-y-0.5 hover:bg-erp-blue"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            创建流程方案
          </button>
        ) : null}
      </div>
    );
  }

  const document = processDesign.designerDocument;

  const applyTemplate = (template: ProcessDesignerDocument['properties']['template']) => {
    onUpdate({
      designerDocument: createProcessDesignerTemplateDocument(template, currentModuleName),
    });
    onToast?.(`已切换到${template === 'branch' ? '条件分支' : template === 'parallel' ? '并行会签' : '线性审批'}模板`);
  };

  const handleAppendTailApproval = () => {
    const next = appendApprovalAtTail(processDesign.designerDocument);
    if (!next) {
      onToast?.('当前流程不是单链路，暂时无法直接在尾部追加审批节点。');
      return;
    }
    onUpdate({
      designerDocument: {
        ...processDesign.designerDocument,
        nodes: next.nodes,
        edges: next.edges,
      },
    });
    onToast?.('已在流程尾部追加审批节点。');
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    try {
      const result = await compileProcessDesignerXml(bridgeRequest);
      setCompiledXml(result.bpmnXml || '');
      setCompileWarnings(result.warnings || []);
      onToast?.('流程 XML 编译完成');
    } catch (error) {
      onToast?.(error instanceof Error ? error.message : '流程 XML 编译失败');
    } finally {
      setIsCompiling(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const result = await previewProcessDesignerBridge(bridgeRequest);
      setPreviewResult(result);
      onToast?.('Legacy 表映射预览已生成');
    } catch (error) {
      onToast?.(error instanceof Error ? error.message : 'Legacy 表映射预览失败');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishProcessDesignerBridge(bridgeRequest);
      setPublishResult(result);
      onToast?.('Legacy 流程发布请求已完成');
    } catch (error) {
      onToast?.(error instanceof Error ? error.message : 'Legacy 流程发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="rounded-[24px] border border-slate-200/80 bg-white/92 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-[11px] font-black text-white shadow-[0_18px_30px_-24px_rgba(49,98,255,0.35)]">
              {mode === 'wizard' ? '流程设计步骤' : '流程设计管理'}
            </div>
            <div className="mt-3 text-[20px] font-black tracking-[-0.03em] text-slate-900 dark:text-white">
              {processDesign.schemeName || `${currentModuleName} 流程方案`}
            </div>
            <div className="mt-2 max-w-[620px] text-[12px] leading-6 text-slate-500 dark:text-slate-300">
              左侧卡片用于切换方案配置、模板和联调发布；右侧保留完整流程画布，节点属性改成点击后从右侧抽屉打开。
            </div>
          </div>

          <div className="grid min-w-[260px] gap-2 sm:grid-cols-4">
            <Metric label="模板" value={document.properties.template === 'branch' ? '条件分支' : document.properties.template === 'parallel' ? '并行会签' : '线性审批'} />
            <Metric label="节点" value={String(document.nodes.length)} />
            <Metric label="任务" value={String(countProcessDesignerTaskNodes(document))} />
            <Metric label="网关" value={String(countProcessDesignerGatewayNodes(document))} />
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col gap-4">
          <section className="rounded-[24px] border border-slate-200/80 bg-white/92 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="grid gap-2">
              {LEFT_TABS.map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-start gap-3 rounded-[18px] border px-4 py-3 text-left transition-all',
                      active
                        ? 'border-primary/20 bg-primary/10 shadow-[0_18px_30px_-26px_rgba(49,98,255,0.35)]'
                        : 'border-slate-200/80 bg-slate-50/80 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-950/40',
                    )}
                  >
                    <span className={cn('material-symbols-outlined mt-0.5 text-[20px]', active ? 'text-primary' : 'text-slate-400')}>
                      {tab.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">{tab.title}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-300">{tab.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-h-0 flex-1 overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white/92 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            {activeTab === 'scheme' ? (
              <div className="grid gap-4">
                <SidebarCard title="流程方案" desc="维护方案字段、业务标识和授权范围。">
                  <div className="grid gap-4">
                    <Field label="流程方案名称">
                      <input className={FIELD_CLASS} value={processDesign.schemeName} onChange={(event) => onUpdate({ schemeName: event.target.value })} />
                    </Field>
                    <Field label="流程方案编号">
                      <input className={FIELD_CLASS} value={processDesign.schemeCode} onChange={(event) => onUpdate({ schemeCode: event.target.value })} />
                    </Field>
                    <Field label="流程方案 ID">
                      <input className={FIELD_CLASS} value={processDesign.planValue} onChange={(event) => onUpdate({ planValue: event.target.value })} />
                    </Field>
                    <Field label="业务编码">
                      <input className={FIELD_CLASS} value={processDesign.businessCode} onChange={(event) => onUpdate({ businessCode: event.target.value })} />
                    </Field>
                    <Field label="业务类型">
                      <input className={FIELD_CLASS} value={processDesign.businessType} onChange={(event) => onUpdate({ businessType: event.target.value })} />
                    </Field>
                    <Field label="权限范围">
                      <textarea className={`${FIELD_CLASS} min-h-[104px] resize-none py-3`} value={processDesign.permissionScope} onChange={(event) => onUpdate({ permissionScope: event.target.value })} />
                    </Field>
                    <Field label="操作说明">
                      <textarea className={`${FIELD_CLASS} min-h-[124px] resize-none py-3`} value={processDesign.actionDescription} onChange={(event) => onUpdate({ actionDescription: event.target.value })} />
                    </Field>
                  </div>
                </SidebarCard>
              </div>
            ) : null}

            {activeTab === 'template' ? (
              <div className="grid gap-4">
                <SidebarCard title="模板切换" desc="快速创建标准起步图，再继续在画布上追加节点。">
                  <div className="grid gap-2">
                    <button type="button" onClick={() => applyTemplate('linear')} className="rounded-[16px] border border-slate-200/80 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">
                      线性审批
                    </button>
                    <button type="button" onClick={() => applyTemplate('branch')} className="rounded-[16px] border border-slate-200/80 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">
                      条件分支
                    </button>
                    <button type="button" onClick={() => applyTemplate('parallel')} className="rounded-[16px] border border-slate-200/80 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">
                      并行会签
                    </button>
                  </div>
                </SidebarCard>

                <SidebarCard title="快捷操作" desc="适合在搭建基础骨架时快速补齐节点。">
                  <div className="grid gap-3">
                    <button type="button" onClick={handleAppendTailApproval} className="rounded-[16px] border border-slate-200/80 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">
                      在尾部追加审批节点
                    </button>
                    <div className="rounded-[16px] border border-dashed border-slate-200/80 bg-slate-50/80 px-3 py-3 text-[11px] leading-5 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                      画布中点击连线上的 <span className="font-black text-slate-700 dark:text-slate-100">+</span>，可以更快地插入审批、条件分支和并行会签。
                    </div>
                  </div>
                </SidebarCard>
              </div>
            ) : null}

            {activeTab === 'bridge' ? (
              <div className="grid gap-4">
                <SidebarCard title="后端联调" desc="这里直接调用 compile、preview、publish 接口。">
                  <div className="grid gap-3">
                    <button type="button" onClick={() => void handleCompile()} disabled={isCompiling} className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-slate-200/80 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">
                      <span className="material-symbols-outlined text-[18px]">conversion_path</span>
                      {isCompiling ? '编译中...' : '编译 XML'}
                    </button>
                    <button type="button" onClick={() => void handlePreview()} disabled={isPreviewing} className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-primary px-4 py-2 text-[12px] font-bold text-white shadow-[0_18px_36px_-24px_rgba(49,98,255,0.35)] transition-all hover:-translate-y-0.5 hover:bg-erp-blue disabled:cursor-not-allowed disabled:opacity-60">
                      <span className="material-symbols-outlined text-[18px]">preview</span>
                      {isPreviewing ? '预览中...' : '预览 Legacy 映射'}
                    </button>
                    <button type="button" onClick={() => void handlePublish()} disabled={isPublishing} className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                      <span className="material-symbols-outlined text-[18px]">publish</span>
                      {isPublishing ? '发布中...' : '发布 Legacy 流程'}
                    </button>
                  </div>
                </SidebarCard>

                {compileWarnings.length > 0 ? (
                  <SidebarCard title="编译提示">
                    <div className="rounded-[18px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[11px] leading-5 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                      {compileWarnings.map((warning) => <div key={warning}>{warning}</div>)}
                    </div>
                  </SidebarCard>
                ) : null}

                <SidebarCard title="XML 结果">
                  <textarea readOnly value={compiledXml} placeholder="点击“编译 XML”后，这里会显示后端返回的 Flowable BPMN XML。" className={`${FIELD_CLASS} min-h-[200px] resize-none py-3 font-mono text-[11px]`} />
                </SidebarCard>

                {previewResult ? (
                  <SidebarCard title="Legacy 预览">
                    <div className="grid gap-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Metric label="任务节点" value={String(previewResult.userTaskCount ?? 0)} />
                        <Metric label="连线数" value={String(previewResult.sequenceFlowCount ?? 0)} />
                        <Metric label="网关数" value={String(previewResult.gatewayCount ?? 0)} />
                      </div>
                      {(previewResult.tablePreviews || []).map((table) => (
                        <div key={table.tableName}>
                          <LegacyPreviewCard table={table} />
                        </div>
                      ))}
                    </div>
                  </SidebarCard>
                ) : null}

                {publishResult ? (
                  <SidebarCard title="发布结果">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Metric label="流程头" value={String(publishResult.upsertedFlowCount ?? 0)} />
                      <Metric label="步骤关系" value={String(publishResult.upsertedFlowTypeStepCount ?? 0)} />
                      <Metric label="字段" value={String(publishResult.insertedGridFieldCount ?? 0)} />
                      <Metric label="条件" value={String(publishResult.insertedConditionCount ?? 0)} />
                      <Metric label="菜单" value={String(publishResult.insertedMenuCount ?? 0)} />
                      <Metric label="附件" value={String(publishResult.insertedAttachmentCount ?? 0)} />
                    </div>
                  </SidebarCard>
                ) : null}
              </div>
            ) : null}
          </section>
        </aside>

        <ProcessDesignerStudio
          className="min-h-[720px]"
          onToast={onToast}
          onChange={(designerDocument) => onUpdate({ designerDocument })}
          value={document}
        />
      </div>
    </div>
  );
}

function SidebarCard({
  children,
  desc,
  title,
}: {
  children: React.ReactNode;
  desc?: string;
  title: string;
}) {
  return (
    <section className="rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/40">
      <div className="text-[14px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">{title}</div>
      {desc ? (
        <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-300">{desc}</div>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-[11px] font-bold tracking-[0.04em] text-slate-500 dark:text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200/80 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
      <div className="text-[10px] font-black tracking-[0.08em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-[13px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function LegacyPreviewCard({ table }: { table: FlowableBridgeTablePreview }) {
  return (
    <div className="rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-black tracking-[-0.02em] text-slate-900 dark:text-white">{table.tableName}</div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">
          {table.plannedRowCount ?? 0} rows
        </div>
      </div>
      {table.note ? (
        <div className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-300">{table.note}</div>
      ) : null}
      {table.sampleRows?.length ? (
        <pre className="mt-3 overflow-auto rounded-[14px] bg-slate-950 px-3 py-3 text-[10px] leading-5 text-emerald-200">
          {JSON.stringify(table.sampleRows, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchFunctionFlowModuleMeta,
  previewFunctionFlow,
  saveFunctionFlow,
} from '../../lib/backend-function-flow';
import { fetchFieldSqlTagOptions, type FieldSqlTagOptionDto } from '../../lib/backend-system';
import type {
  FunctionFlowDetail,
  FunctionFlowEdgeConfig,
  FunctionFlowGeneratedArtifacts,
  FunctionFlowGraphJson,
  FunctionFlowModuleMeta,
  FunctionFlowModuleOption,
  FunctionFlowPreviewResult,
} from './function-flow-types';
import {
  createEmptyFunctionFlowGeneratedArtifacts,
  createEmptyFunctionFlowGraphJson,
} from './function-flow-types';
import { useEdgeDetail } from './use-edge-detail';
import { EdgeDetailModal } from './EdgeDetailModal';

type FunctionFlowDrawIoDesignerProps = {
  flowCode: string;
  flowName: string;
  initialGeneratedArtifacts?: FunctionFlowGeneratedArtifacts | null;
  initialGraphJson?: FunctionFlowGraphJson | null;
  initialXml: string;
  moduleOptions: FunctionFlowModuleOption[];
  onChange: (xml: string) => void;
  onClose: () => void;
  onPersist?: (detail: FunctionFlowDetail) => void;
  onShowToast?: (message: string) => void;
  subsystemTitle: string;
};

type DrawIoStatus = 'booting' | 'ready' | 'saving' | 'saved';
type DrawIoCellPayload = {
  attributes?: Record<string, string>;
  id?: string;
  isEdge?: boolean;
  isVertex?: boolean;
  label?: string;
  style?: string;
};
type DrawIoEventMessage = {
  cell?: DrawIoCellPayload | null;
  cellId?: string;
  error?: string;
  event?: string;
  functionDesignMode?: boolean;
  graphJson?: FunctionFlowGraphJson;
  href?: string;
  message?: string;
  moduleCode?: string;
  preview?: FunctionFlowPreviewResult;
  selectedCellId?: string;
  xml?: string;
};

const DRAWIO_PATH = '/drawio/index.html';
const DRAWIO_LIBRARY_SET = 'general;flowchart;basic;arrows2;bpmn';
const DRAWIO_HOST_VERSION = 'function-flow-native-v19';
const DRAWIO_BASE_PARAMS = {
  configure: '1',
  embed: '1',
  hostv: DRAWIO_HOST_VERSION,
  lang: 'zh',
  libraries: '1',
  noExitBtn: '0',
  noSaveBtn: '1',
  p: 'props',
  proto: 'json',
  saveAndExit: '0',
  spin: '1',
  ui: 'simple',
} as const;
const DRAWIO_CONFIG = {
  defaultEdgeStyle: {
    endArrow: 'classic',
    html: 1,
    rounded: 0,
    strokeColor: '#5b84d6',
    strokeWidth: 2,
  },
  defaultLibraries: DRAWIO_LIBRARY_SET,
  defaultVertexStyle: {
    fillColor: '#ffffff',
    fontColor: '#0f172a',
    html: 1,
    rounded: 1,
    strokeColor: '#5B9BD5',
    strokeWidth: 2,
    whiteSpace: 'wrap',
  },
  enabledLibraries: ['general', 'flowchart', 'basic', 'arrows2', 'bpmn'],
  expandLibraries: true,
  override: true,
  sidebarTitles: false,
  sidebarWidth: 220,
  thumbHeight: 62,
  thumbWidth: 86,
  version: DRAWIO_HOST_VERSION,
};

function buildDrawIoEmbedUrl() {
  const params = new URLSearchParams(DRAWIO_BASE_PARAMS);

  if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    params.set('dev', '1');
  }

  return `${DRAWIO_PATH}?${params.toString()}`;
}

function parseDrawIoMessage(payload: unknown): DrawIoEventMessage | null {
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return parsed && typeof parsed === 'object' ? parsed as DrawIoEventMessage : null;
    } catch {
      return null;
    }
  }

  if (payload && typeof payload === 'object') {
    return payload as DrawIoEventMessage;
  }

  return null;
}

function normalizeGraphJson(input?: FunctionFlowGraphJson | null): FunctionFlowGraphJson {
  const fallback = createEmptyFunctionFlowGraphJson();
  if (!input) {
    return fallback;
  }

  return {
    edges: Array.isArray(input.edges) ? input.edges : [],
    fieldMappings: Array.isArray(input.fieldMappings) ? input.fieldMappings : [],
    generatedArtifacts: {
      detailSql: input.generatedArtifacts?.detailSql || '',
      gridJson: Array.isArray(input.generatedArtifacts?.gridJson) ? input.generatedArtifacts.gridJson : [],
      sourceSql: input.generatedArtifacts?.sourceSql || '',
    },
    nodes: Array.isArray(input.nodes) ? input.nodes : [],
  };
}

function toGeneratedArtifacts(preview?: FunctionFlowPreviewResult | FunctionFlowGeneratedArtifacts | null): FunctionFlowGeneratedArtifacts {
  if (!preview) {
    return createEmptyFunctionFlowGeneratedArtifacts();
  }

  return {
    detailSql: preview.detailSql || '',
    gridJson: Array.isArray(preview.gridJson) ? preview.gridJson : [],
    sourceSql: preview.sourceSql || '',
  };
}

function toJoinTypeAttribute(joinType: 'left' | 'inner' | 'right' | 'full') {
  switch (joinType) {
    case 'inner':
      return 'inner join';
    case 'right':
      return 'right join';
    case 'full':
      return 'full outer join';
    case 'left':
    default:
      return 'left join';
  }
}

export function FunctionFlowDrawIoDesigner(props: FunctionFlowDrawIoDesignerProps) {
  const {
    flowCode,
    flowName,
    initialGeneratedArtifacts,
    initialGraphJson,
    initialXml,
    moduleOptions,
    onChange,
    onClose,
    onPersist,
    onShowToast,
    subsystemTitle,
  } = props;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialXmlRef = useRef(initialXml);
  const graphJsonRef = useRef<FunctionFlowGraphJson>(normalizeGraphJson(initialGraphJson));
  const previewArtifactsRef = useRef<FunctionFlowGeneratedArtifacts>(toGeneratedArtifacts(initialGeneratedArtifacts));
  const previewTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const saveQueueXmlRef = useRef<string | null>(null);
  const saveInFlightRef = useRef(false);
  const moduleMetaCacheRef = useRef<Record<string, FunctionFlowModuleMeta>>({});
  const moduleMetaPendingRef = useRef<Record<string, boolean>>({});
  const [status, setStatus] = useState<DrawIoStatus>('booting');
  const [isReady, setIsReady] = useState(false);
  const [fieldSqlTagOptions, setFieldSqlTagOptions] = useState<FieldSqlTagOptionDto[]>([]);
  const [edgeDetailModalOpen, setEdgeDetailModalOpen] = useState(false);
  const [selectedNodeForEdgeDetail, setSelectedNodeForEdgeDetail] = useState<string | null>(null);
  const { edgeDetails, loadEdgeDetails, reorderEdges } = useEdgeDetail();
  const isOpeningModalRef = useRef(false);

  const editorTitle = useMemo(
    () => `${subsystemTitle.trim() || '未命名子系统'} 流程设计`,
    [subsystemTitle],
  );
  const iframeSrc = useMemo(() => buildDrawIoEmbedUrl(), []);

  useEffect(() => {
    if (initialXml.trim()) {
      initialXmlRef.current = initialXml;
    }
  }, [initialXml]);

  useEffect(() => {
    graphJsonRef.current = normalizeGraphJson(initialGraphJson);
  }, [initialGraphJson]);

  useEffect(() => {
    previewArtifactsRef.current = toGeneratedArtifacts(initialGeneratedArtifacts);
  }, [initialGeneratedArtifacts]);

  useEffect(() => {
    let cancelled = false;

    void fetchFieldSqlTagOptions()
      .then((rows) => {
        if (cancelled || !Array.isArray(rows)) {
          return;
        }

        setFieldSqlTagOptions(rows);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setFieldSqlTagOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const postMessageToEditor = useCallback((payload: Record<string, unknown>) => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) {
      return false;
    }

    targetWindow.postMessage(JSON.stringify(payload), window.location.origin);
    return true;
  }, []);

  const sendPreviewToEditor = useCallback((preview: FunctionFlowPreviewResult | FunctionFlowGeneratedArtifacts | null | undefined) => {
    const artifacts = toGeneratedArtifacts(preview ?? null);
    const validationMessages = Array.isArray((preview as FunctionFlowPreviewResult | undefined)?.validationMessages)
      ? (preview as FunctionFlowPreviewResult).validationMessages
      : [];
    previewArtifactsRef.current = artifacts;
    graphJsonRef.current = {
      ...graphJsonRef.current,
      generatedArtifacts: artifacts,
    };
    postMessageToEditor({
      action: 'functionFlowPreviewResult',
      preview: {
        detailSql: artifacts.detailSql,
        gridJson: artifacts.gridJson,
        sourceSql: artifacts.sourceSql,
        validationMessages,
      },
    });
  }, [postMessageToEditor]);

  const prefetchModuleMetas = useCallback((graphJson: FunctionFlowGraphJson) => {
    const nodes = Array.isArray(graphJson.nodes) ? graphJson.nodes : [];
    for (const node of nodes) {
      const requestedCode = node.moduleCode?.trim();
      if (!requestedCode || moduleMetaCacheRef.current[requestedCode] || moduleMetaPendingRef.current[requestedCode]) {
        continue;
      }

      moduleMetaPendingRef.current[requestedCode] = true;
      void fetchFunctionFlowModuleMeta(requestedCode)
        .then((meta) => {
          moduleMetaCacheRef.current[requestedCode] = meta;
          postMessageToEditor({
            action: 'functionFlowModuleMeta',
            cellId: node.cellId ?? null,
            meta,
            moduleCode: requestedCode,
          });
        })
        .catch(() => {
          // 后台预拉取失败不打断主流程，用户后续点中节点时仍会单独请求。
        })
        .finally(() => {
          delete moduleMetaPendingRef.current[requestedCode];
      });
    }
  }, [postMessageToEditor]);

  const syncFunctionFlowEditor = useCallback(() => {
    postMessageToEditor({
      action: 'functionFlowConfig',
      fieldSqlTagOptions,
      mode: 'function',
      moduleOptions,
    });
    postMessageToEditor({
      action: 'toggleFormatPanel',
      visible: true,
    });
    sendPreviewToEditor(previewArtifactsRef.current);
    prefetchModuleMetas(graphJsonRef.current);
  }, [
    fieldSqlTagOptions,
    moduleOptions,
    postMessageToEditor,
    prefetchModuleMetas,
    sendPreviewToEditor,
  ]);

  const openEdgeDetailForTarget = useCallback((selectedCellId: string, graphJson: FunctionFlowGraphJson, functionDesignMode: boolean) => {
    if (!functionDesignMode || isOpeningModalRef.current || edgeDetailModalOpen) {
      return;
    }

    const incomingEdges = graphJson.edges.filter(
      (edge: FunctionFlowEdgeConfig) => edge.targetCellId === selectedCellId,
    );

    if (incomingEdges.length <= 1) {
      return;
    }

    isOpeningModalRef.current = true;
    setSelectedNodeForEdgeDetail(selectedCellId);
    loadEdgeDetails(selectedCellId, graphJson);
    setEdgeDetailModalOpen(true);
  }, [edgeDetailModalOpen, loadEdgeDetails]);

  const persistFlow = useCallback(async (xmlText: string) => {
    const normalizedXml = xmlText.trim();
    if (!normalizedXml) {
      return;
    }

    if (saveInFlightRef.current) {
      saveQueueXmlRef.current = normalizedXml;
      return;
    }

    saveInFlightRef.current = true;
    setStatus('saving');

    try {
      const detail = await saveFunctionFlow({
        drawioXml: normalizedXml,
        flowCode,
        flowName,
        generatedArtifacts: previewArtifactsRef.current,
        graphJson: {
          ...graphJsonRef.current,
          generatedArtifacts: previewArtifactsRef.current,
        },
      });

      onPersist?.(detail);
      setStatus('saved');
    } catch (error) {
      setStatus('ready');
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '功能流程图保存失败');
    } finally {
      saveInFlightRef.current = false;

      if (saveQueueXmlRef.current && saveQueueXmlRef.current !== normalizedXml) {
        const queuedXml = saveQueueXmlRef.current;
        saveQueueXmlRef.current = null;
        void persistFlow(queuedXml);
      }
    }
  }, [flowCode, flowName, onPersist, onShowToast]);

  const runPreview = useCallback(async (graphJson: FunctionFlowGraphJson) => {
    try {
      const preview = await previewFunctionFlow({
        flowCode,
        graphJson,
      });
      sendPreviewToEditor(preview);
    } catch (error) {
      sendPreviewToEditor(previewArtifactsRef.current);
      onShowToast?.(error instanceof Error && error.message.trim() ? error.message : 'SQL 预览生成失败');
    }
  }, [flowCode, onShowToast, sendPreviewToEditor]);

  const schedulePreview = useCallback((graphJson: FunctionFlowGraphJson) => {
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
    }

    previewTimerRef.current = window.setTimeout(() => {
      void runPreview(graphJson);
    }, 320);
  }, [runPreview]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    syncFunctionFlowEditor();
  }, [isReady, syncFunctionFlowEditor]);

  useEffect(() => {
    function handleWindowMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = parseDrawIoMessage(event.data);
      if (!payload?.event) {
        return;
      }

      if (payload.event === 'configure') {
        postMessageToEditor({
          action: 'configure',
          config: DRAWIO_CONFIG,
        });
        return;
      }

      if (payload.event === 'init') {
        setIsReady(true);
        setStatus('ready');
        postMessageToEditor({
          action: 'load',
          autosave: 1,
          title: editorTitle,
          xml: initialXmlRef.current,
        });
        return;
      }

      if (payload.event === 'load') {
        syncFunctionFlowEditor();
        return;
      }

      if (payload.event === 'autosave' || payload.event === 'save') {
        if (payload.xml?.trim()) {
          initialXmlRef.current = payload.xml;
          onChange(payload.xml);
          void persistFlow(payload.xml);
        }
        return;
      }

      if (payload.event === 'exit') {
        if (payload.xml?.trim()) {
          initialXmlRef.current = payload.xml;
          onChange(payload.xml);
          void persistFlow(payload.xml);
        }
        onClose();
        return;
      }

      if (payload.event === 'openLink' && payload.href) {
        window.open(payload.href, '_blank', 'noopener,noreferrer');
        return;
      }

      if (payload.event === 'functionFlowTargetDblClick') {
        const selectedCellId = payload.cell?.id;
        if (!selectedCellId || !payload.cell?.isVertex) {
          return;
        }

        openEdgeDetailForTarget(selectedCellId, graphJsonRef.current, payload.functionDesignMode === true);
        return;
      }

      if (payload.event === 'functionFlowGraphChange' && payload.graphJson) {
        const nextGraph = normalizeGraphJson(payload.graphJson);
        graphJsonRef.current = {
          ...nextGraph,
          generatedArtifacts: previewArtifactsRef.current,
        };
        prefetchModuleMetas(graphJsonRef.current);
        schedulePreview(graphJsonRef.current);
        return;
      }

      if (payload.event === 'functionFlowPreviewChange') {
        const nextArtifacts = toGeneratedArtifacts(payload.preview ?? null);
        previewArtifactsRef.current = nextArtifacts;
        graphJsonRef.current = {
          ...graphJsonRef.current,
          generatedArtifacts: nextArtifacts,
        };
        return;
      }

      if (payload.event === 'functionFlowModuleMetaRequest') {
        const requestedCode = payload.moduleCode?.trim();
        if (requestedCode && moduleMetaCacheRef.current[requestedCode]) {
          postMessageToEditor({
            action: 'functionFlowModuleMeta',
            cellId: payload.cellId ?? null,
            meta: moduleMetaCacheRef.current[requestedCode],
            moduleCode: requestedCode,
          });
          return;
        }

        if (!requestedCode || moduleMetaPendingRef.current[requestedCode]) {
          return;
        }

        moduleMetaPendingRef.current[requestedCode] = true;
        void fetchFunctionFlowModuleMeta(requestedCode)
          .then((meta) => {
            moduleMetaCacheRef.current[requestedCode] = meta;
            postMessageToEditor({
              action: 'functionFlowModuleMeta',
              cellId: payload.cellId ?? null,
              meta,
              moduleCode: requestedCode,
            });
          })
          .catch((error) => {
            onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '模块元数据读取失败');
          })
          .finally(() => {
            delete moduleMetaPendingRef.current[requestedCode];
          });
        return;
      }

      if (payload.event === 'error') {
        setStatus('ready');
        onShowToast?.(payload.message?.trim() || payload.error?.trim() || 'draw.io 编辑器发生错误');
      }
    }

    window.addEventListener('message', handleWindowMessage);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
      }
    };
  }, [editorTitle, onChange, onClose, onShowToast, openEdgeDetailForTarget, persistFlow, postMessageToEditor, schedulePreview, syncFunctionFlowEditor]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#eef3f8]">
      <iframe
        key={iframeSrc}
        ref={iframeRef}
        src={iframeSrc}
        title={editorTitle}
        className="h-full w-full border-0"
      />

      {!isReady ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#eef3f8]/72 backdrop-blur-[2px]">
          <div className="rounded-[26px] border border-white/70 bg-white/92 px-6 py-5 text-center shadow-[0_30px_60px_-36px_rgba(15,23,42,0.35)]">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            </div>
            <div className="mt-4 text-[15px] font-semibold text-slate-900">正在载入 draw.io 编辑器</div>
            <div className="mt-1 text-[12px] text-slate-500">
              {status === 'saving' ? '正在同步当前草稿...' : '首次打开会稍慢一点'}
            </div>
          </div>
        </div>
      ) : null}

      <EdgeDetailModal
        isOpen={edgeDetailModalOpen}
        onClose={() => {
          setEdgeDetailModalOpen(false);
          isOpeningModalRef.current = false;
        }}
        targetNodeName={
          selectedNodeForEdgeDetail
            ? graphJsonRef.current.nodes.find((n) => n.cellId === selectedNodeForEdgeDetail)?.moduleName ?? '未知模块'
            : ''
        }
        edgeDetails={edgeDetails}
        onSave={(details) => {
          details.forEach((detail) => {
          postMessageToEditor({
              action: 'functionFlowSetCellData',
              attributes: {
                ffJoinType: toJoinTypeAttribute(detail.inferredJoinType),
              },
              cellId: detail.edgeId,
            });
          });
          setEdgeDetailModalOpen(false);
          isOpeningModalRef.current = false;
          onShowToast?.('已保存单据来源配置');
        }}
        onReorder={reorderEdges}
      />
    </div>
  );
}

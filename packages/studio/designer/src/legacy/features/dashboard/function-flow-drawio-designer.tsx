import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  fetchFunctionFlowModuleMeta,
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
  flowId?: string | null;
  flowName: string;
  initialGeneratedArtifacts?: FunctionFlowGeneratedArtifacts | null;
  initialGraphJson?: FunctionFlowGraphJson | null;
  initialXml: string;
  moduleOptions: FunctionFlowModuleOption[];
  onChange: (xml: string) => void;
  onClose: () => void;
  onFlowNameChange?: (name: string) => void;
  onPersist?: (detail: FunctionFlowDetail) => void;
  onShowToast?: (message: string) => void;
  rowVersion?: number | string | null;
  subsystemId: string;
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

function normalizeFlowName(value?: string | null) {
  const normalized = String(value ?? '').trim();
  return normalized || '未命名流程图';
}

function syncFlowNameIntoXml(xmlText: string, flowName: string) {
  const normalizedXml = xmlText.trim();
  if (!normalizedXml || typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return normalizedXml;
  }

  try {
    const xmlDocument = new DOMParser().parseFromString(normalizedXml, 'text/xml');
    if (xmlDocument.getElementsByTagName('parsererror').length > 0) {
      return normalizedXml;
    }

    const diagramNode = xmlDocument.getElementsByTagName('diagram')[0];
    if (!diagramNode) {
      return normalizedXml;
    }

    diagramNode.setAttribute('name', normalizeFlowName(flowName));
    return new XMLSerializer().serializeToString(xmlDocument);
  } catch {
    return normalizedXml;
  }
}

export function FunctionFlowDrawIoDesigner(props: FunctionFlowDrawIoDesignerProps) {
  const {
    flowCode,
    flowId,
    flowName,
    initialGeneratedArtifacts,
    initialGraphJson,
    initialXml,
    moduleOptions,
    onChange,
    onClose,
    onFlowNameChange,
    onPersist,
    onShowToast,
    rowVersion,
    subsystemId,
    subsystemTitle,
  } = props;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialXmlRef = useRef(initialXml);
  const currentXmlRef = useRef(initialXml.trim());
  const currentFlowNameRef = useRef(normalizeFlowName(flowName));
  const flowIdRef = useRef<string | null>(flowId?.trim() || null);
  const graphJsonRef = useRef<FunctionFlowGraphJson>(normalizeGraphJson(initialGraphJson));
  const lastPersistedFlowNameRef = useRef(normalizeFlowName(flowName));
  const lastPersistedXmlRef = useRef(initialXml.trim());
  const previewArtifactsRef = useRef<FunctionFlowGeneratedArtifacts>(toGeneratedArtifacts(initialGeneratedArtifacts));
  const rowVersionRef = useRef<number | string | null>(rowVersion ?? null);
  const saveQueueXmlRef = useRef<string | null>(null);
  const saveInFlightRef = useRef(false);
  const saveSuccessToastTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const graphChangeInitializedRef = useRef(false);
  const moduleMetaCacheRef = useRef<Record<string, FunctionFlowModuleMeta>>({});
  const moduleMetaPendingRef = useRef<Record<string, boolean>>({});
  const [status, setStatus] = useState<DrawIoStatus>('booting');
  const [isReady, setIsReady] = useState(false);
  const [flowNameInput, setFlowNameInput] = useState(normalizeFlowName(flowName));
  const [hasUnsavedXmlChanges, setHasUnsavedXmlChanges] = useState(false);
  const [saveSuccessToastVisible, setSaveSuccessToastVisible] = useState(false);
  const [fieldSqlTagOptions, setFieldSqlTagOptions] = useState<FieldSqlTagOptionDto[]>([]);
  const [edgeDetailModalOpen, setEdgeDetailModalOpen] = useState(false);
  const [selectedNodeForEdgeDetail, setSelectedNodeForEdgeDetail] = useState<string | null>(null);
  const { edgeDetails, loadEdgeDetails, reorderEdges } = useEdgeDetail();
  const isOpeningModalRef = useRef(false);

  const resolvedFlowName = useMemo(() => normalizeFlowName(flowNameInput), [flowNameInput]);
  const isFlowNameDirty = resolvedFlowName !== lastPersistedFlowNameRef.current;
  const hasUnsavedChanges = hasUnsavedXmlChanges || isFlowNameDirty;
  const editorTitle = useMemo(() => resolvedFlowName, [resolvedFlowName]);
  const iframeTitle = useMemo(
    () => `${subsystemTitle.trim() || '未命名子系统'} - ${resolvedFlowName}`,
    [resolvedFlowName, subsystemTitle],
  );
  const iframeSrc = useMemo(() => buildDrawIoEmbedUrl(), []);
  const isSaving = status === 'saving';

  const isXmlDirty = useCallback((xmlText?: string | null) => {
    const normalizedXml = String(xmlText ?? '').trim();
    if (!normalizedXml) {
      return false;
    }

    return normalizedXml !== lastPersistedXmlRef.current || saveInFlightRef.current;
  }, []);

  const rememberCurrentXml = useCallback((xmlText?: string | null) => {
    const normalizedXml = String(xmlText ?? '').trim();
    if (!normalizedXml) {
      return '';
    }

    initialXmlRef.current = normalizedXml;
    currentXmlRef.current = normalizedXml;
    onChange(normalizedXml);
    setHasUnsavedXmlChanges(isXmlDirty(normalizedXml));
    return normalizedXml;
  }, [isXmlDirty, onChange]);

  const markDirty = useCallback(() => {
    setHasUnsavedXmlChanges(true);
    setStatus((prev) => (prev === 'saving' ? prev : 'ready'));
  }, []);

  const commitFlowNameInput = useCallback((nextValue?: string | null) => {
    const nextFlowName = normalizeFlowName(nextValue ?? flowNameInput);
    currentFlowNameRef.current = nextFlowName;
    setFlowNameInput(nextFlowName);
    onFlowNameChange?.(nextFlowName);
    return nextFlowName;
  }, [flowNameInput, onFlowNameChange]);

  const showSaveSuccessToast = useCallback(() => {
    if (saveSuccessToastTimerRef.current) {
      window.clearTimeout(saveSuccessToastTimerRef.current);
    }

    setSaveSuccessToastVisible(true);
    saveSuccessToastTimerRef.current = window.setTimeout(() => {
      setSaveSuccessToastVisible(false);
      saveSuccessToastTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    const normalizedInitialXml = initialXml.trim();
    initialXmlRef.current = normalizedInitialXml;
    currentXmlRef.current = normalizedInitialXml;
    lastPersistedXmlRef.current = normalizedInitialXml;
    graphChangeInitializedRef.current = false;
    setHasUnsavedXmlChanges(false);
  }, [initialXml]);

  useEffect(() => {
    const persistedFlowName = normalizeFlowName(flowName);
    currentFlowNameRef.current = persistedFlowName;
    lastPersistedFlowNameRef.current = persistedFlowName;
    setFlowNameInput(persistedFlowName);
  }, [flowName]);

  useEffect(() => {
    return () => {
      if (saveSuccessToastTimerRef.current) {
        window.clearTimeout(saveSuccessToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSaving) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
    iframeRef.current?.blur();
    setSaveSuccessToastVisible(false);
  }, [isSaving]);

  useEffect(() => {
    flowIdRef.current = flowId?.trim() || null;
  }, [flowId]);

  useEffect(() => {
    rowVersionRef.current = rowVersion ?? null;
  }, [rowVersion]);

  useEffect(() => {
    currentFlowNameRef.current = resolvedFlowName;
  }, [resolvedFlowName]);

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
    const normalizedFlowName = commitFlowNameInput(currentFlowNameRef.current);
    const normalizedXml = syncFlowNameIntoXml(xmlText, normalizedFlowName);
    if (!normalizedXml) {
      return;
    }

    if (currentXmlRef.current !== undefined) {
      currentXmlRef.current = normalizedXml;
      initialXmlRef.current = normalizedXml;
      onChange(normalizedXml);

      const xmlDirty = isXmlDirty(normalizedXml);
      const nameDirty = normalizedFlowName !== lastPersistedFlowNameRef.current;

      if (!xmlDirty && !nameDirty) {
        setHasUnsavedXmlChanges(false);
        return;
      }

      if (saveInFlightRef.current) {
        saveQueueXmlRef.current = normalizedXml;
        setHasUnsavedXmlChanges(true);
        return;
      }

      saveInFlightRef.current = true;
      setStatus('saving');

      try {
        const detail = await saveFunctionFlow({
          editorXml: normalizedXml,
          flowCode,
          flowId: flowIdRef.current,
          flowName: normalizedFlowName,
          generatedArtifacts: previewArtifactsRef.current,
          graphJson: {
            ...graphJsonRef.current,
            generatedArtifacts: previewArtifactsRef.current,
          },
          rowVersion: rowVersionRef.current,
          subsystemId,
        });

        const persistedFlowName = normalizeFlowName(detail.flowName || normalizedFlowName);
        flowIdRef.current = detail.id || flowIdRef.current;
        currentFlowNameRef.current = persistedFlowName;
        lastPersistedFlowNameRef.current = persistedFlowName;
        lastPersistedXmlRef.current = normalizedXml;
        rowVersionRef.current = detail.rowVersion ?? rowVersionRef.current;
        setFlowNameInput(persistedFlowName);
        onFlowNameChange?.(persistedFlowName);
        setHasUnsavedXmlChanges(Boolean(saveQueueXmlRef.current && saveQueueXmlRef.current !== normalizedXml));
        graphChangeInitializedRef.current = true;
        onPersist?.(detail);
        setStatus('saved');

        showSaveSuccessToast();
        return;
      } catch (error) {
        setStatus('ready');
        setHasUnsavedXmlChanges(xmlDirty);
        onShowToast?.(error instanceof Error && error.message.trim() ? error.message : '功能流程图保存失败');
        return;
      } finally {
        saveInFlightRef.current = false;

        if (saveQueueXmlRef.current === normalizedXml) {
          saveQueueXmlRef.current = null;
        }

        if (saveQueueXmlRef.current && saveQueueXmlRef.current !== normalizedXml) {
          const queuedXml = saveQueueXmlRef.current;
          saveQueueXmlRef.current = null;
          void persistFlow(queuedXml);
        }
      }
    }

    const xmlDirty = normalizedXml !== lastPersistedXmlRef.current;
    const nameDirty = normalizedFlowName !== lastPersistedFlowNameRef.current;
    if (!xmlDirty && !nameDirty) {
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
        editorXml: normalizedXml,
        flowCode,
        flowId: flowIdRef.current,
        flowName: normalizedFlowName,
        generatedArtifacts: previewArtifactsRef.current,
        graphJson: {
          ...graphJsonRef.current,
          generatedArtifacts: previewArtifactsRef.current,
        },
        rowVersion: rowVersionRef.current,
        subsystemId,
      });

      const persistedFlowName = normalizeFlowName(detail.flowName || normalizedFlowName);
      flowIdRef.current = detail.id || flowIdRef.current;
      currentFlowNameRef.current = persistedFlowName;
      lastPersistedFlowNameRef.current = persistedFlowName;
      lastPersistedXmlRef.current = normalizedXml;
      rowVersionRef.current = detail.rowVersion ?? rowVersionRef.current;
      setFlowNameInput(persistedFlowName);
      onFlowNameChange?.(persistedFlowName);
      setHasUnsavedXmlChanges(false);
      onPersist?.(detail);
      setStatus('saved');

      showSaveSuccessToast();
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
  }, [commitFlowNameInput, flowCode, isXmlDirty, onChange, onClose, onFlowNameChange, onPersist, onShowToast, showSaveSuccessToast, subsystemId]);

  const requestEditorSave = useCallback(() => {
    if (isSaving) {
      return;
    }

    commitFlowNameInput();
    if (!postMessageToEditor({
      action: 'invokeAction',
      actionName: 'save',
    })) {
      void persistFlow(currentXmlRef.current);
    }
  }, [commitFlowNameInput, isSaving, persistFlow, postMessageToEditor]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    syncFunctionFlowEditor();
  }, [isReady, syncFunctionFlowEditor]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges && !saveInFlightRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    postMessageToEditor({
      action: 'status',
      modified: hasUnsavedChanges,
    });
  }, [hasUnsavedChanges, isReady, postMessageToEditor]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }

      event.preventDefault();
      requestEditorSave();
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [requestEditorSave]);

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
          autosave: 0,
          title: editorTitle,
          xml: initialXmlRef.current,
        });
        return;
      }

      if (payload.event === 'load') {
        syncFunctionFlowEditor();
        return;
      }

      if (payload.event === 'save') {
        const nextXml = rememberCurrentXml(payload.xml ?? currentXmlRef.current);
        if (nextXml) {
          void persistFlow(nextXml);
        }
        return;
      }

      if (payload.event === 'exit') {
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
        if (graphChangeInitializedRef.current) {
          markDirty();
        } else {
          graphChangeInitializedRef.current = true;
        }
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
    };
  }, [editorTitle, markDirty, onClose, onShowToast, openEdgeDetailForTarget, persistFlow, postMessageToEditor, prefetchModuleMetas, rememberCurrentXml, syncFunctionFlowEditor]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#eef3f8]">
      <iframe
        key={iframeSrc}
        ref={iframeRef}
        src={iframeSrc}
        title={iframeTitle}
        className="h-full w-full border-0"
      />

      <div className="pointer-events-none absolute left-[calc(50%-108px)] top-2 z-[11] -translate-x-1/2">
        <div
          className={`pointer-events-auto rounded-full border px-3 py-1 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-md transition-all ${isSaving ? 'opacity-80' : ''} ${isFlowNameDirty ? 'border-amber-200 bg-amber-50/92' : 'border-white/80 bg-white/92'}`}
          title="流程图名称，按 Ctrl+S 保存"
        >
          <input
            type="text"
            value={flowNameInput}
            onChange={(event) => {
              setFlowNameInput(event.target.value);
              currentFlowNameRef.current = normalizeFlowName(event.target.value);
            }}
            onBlur={(event) => {
              commitFlowNameInput(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitFlowNameInput(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
            disabled={isSaving}
            placeholder="请输入流程图名称"
            className="w-[188px] max-w-[28vw] bg-transparent text-center text-[14px] font-semibold text-slate-700 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <AnimatePresence>
        {saveSuccessToastVisible && !isSaving ? (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-16 z-[12] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-emerald-200/80 bg-white/96 px-4 py-2 text-[13px] font-semibold text-emerald-700 shadow-[0_22px_50px_-30px_rgba(16,185,129,0.38)] backdrop-blur-md">
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </span>
              <span>保存成功</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isSaving ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[13] flex items-center justify-center bg-slate-950/18 backdrop-blur-[3px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex min-w-[320px] max-w-[420px] flex-col items-center rounded-[28px] border border-white/80 bg-white/96 px-7 py-6 text-center shadow-[0_30px_70px_-36px_rgba(15,23,42,0.42)]"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
              </div>
              <div className="mt-4 text-[18px] font-bold text-slate-900">正在保存当前流程</div>
              <div className="mt-2 text-[13px] leading-6 text-slate-500">
                保存完成前将暂时锁定编辑器，请稍候片刻。
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isReady ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#eef3f8]/72 backdrop-blur-[2px]">
          <div className="rounded-[26px] border border-white/70 bg-white/92 px-6 py-5 text-center shadow-[0_30px_60px_-36px_rgba(15,23,42,0.35)]">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            </div>
            <div className="mt-4 text-[15px] font-semibold text-slate-900">正在载入 draw.io 编辑器</div>
            <div className="mt-1 text-[12px] text-slate-500">
              {status === 'saving' ? '正在同步当前内容...' : '首次打开会稍慢一点'}
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

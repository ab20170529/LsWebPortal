import { startTransition, useEffect, useMemo, useRef, useState } from 'react';

import {
  biApi,
  type DataAssetSavePayload,
  type DataAssetFieldSavePayload,
  type DesignMessageSendPayload,
  type DesignSessionCreatePayload,
  type DatasourceSavePayload,
  type DirectoryCanvasLayoutItemPayload,
  type DirectorySavePayload,
  type GenerateDraftPayload,
  type NodeTypeSavePayload,
  type PromptPreviewPayload,
  type PromptTemplateSavePayload,
  type RegenerateVersionPayload,
  type ScreenVersionSavePayload,
  type ScreenSavePayload,
  type ShareCreatePayload,
} from '../api/bi-api';
import type {
  BiCanvasMeta,
  BiDatasource,
  BiDesignSession,
  BiDirectoryNode,
  BiGenerationTask,
  BiNodeType,
  BiPromptPreview,
  BiPromptTemplate,
  BiScreen,
  BiScreenDesignRecord,
  BiShareToken,
} from '../types';
import {
  buildAutoLayout,
  buildNodePath,
  countAssets,
  countFields,
  flattenDirectoryNodes,
  getNodeCanvasMeta,
} from '../utils/bi-directory';
import {
  replaceDatasourceAssetFields,
  removeDirectoryNode,
  resolveSelectedScreenIdForNode,
  updateDirectoryNode,
  upsertDatasource,
  upsertDatasourceAsset,
  upsertDirectoryNode,
  upsertNodeType,
  upsertScreen,
  upsertShareToken,
} from '../utils/bi-workspace-state';

function mergeLayouts(nodes: BiDirectoryNode[]) {
  const nextLayout: Record<number, BiCanvasMeta> = {};
  flattenDirectoryNodes(nodes).forEach((node) => {
    nextLayout[node.id] = getNodeCanvasMeta(node);
  });
  return nextLayout;
}

function buildAutoLayoutMap(nodes: BiDirectoryNode[]) {
  const nextLayout: Record<number, BiCanvasMeta> = {};
  buildAutoLayout(nodes).forEach((value, key) => {
    nextLayout[key] = value;
  });
  return nextLayout;
}

function mergeScreenLists(current: BiScreen[], incoming: BiScreen[]) {
  const nextScreens = new Map(current.map((screen) => [screen.id, screen]));
  incoming.forEach((screen) => {
    nextScreens.set(screen.id, screen);
  });
  return Array.from(nextScreens.values());
}

const WORKSPACE_ERROR = 'BI 工作台操作失败。';
const WORKSPACE_LOAD_ERROR = 'BI 工作台加载失败。';
const PROMPT_PREVIEW_ERROR = '提示词预览失败。';

function resolveWorkspaceError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (/failed to fetch|connection refused|networkerror/i.test(message)) {
    return '后端服务连接失败，请确认 8080 服务正在运行后再重试。';
  }
  if (/internal server error|status of 500|\b500\b/i.test(message)) {
    return '后端处理失败，请稍后重试；如果持续出现，请查看后端日志定位具体接口。';
  }
  return message || fallback;
}

type BiWorkspaceOptions = {
  enableDesignSessions?: boolean;
  initialSelectedNodeId?: number | null;
  initialSelectedScreenId?: number | null;
};

export function useBiWorkspace(options?: BiWorkspaceOptions) {
  const optimisticNodeIdState = useMemo(() => ({ current: -1 }), []);
  const [allScreens, setAllScreens] = useState<BiScreen[]>([]);
  const [datasources, setDatasources] = useState<BiDatasource[]>([]);
  const [designRecords, setDesignRecords] = useState<BiScreenDesignRecord[]>([]);
  const [designSession, setDesignSession] = useState<BiDesignSession | null>(null);
  const [designSessions, setDesignSessions] = useState<BiDesignSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationTask, setGenerationTask] = useState<BiGenerationTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [layoutMap, setLayoutMap] = useState<Record<number, BiCanvasMeta>>({});
  const [nodes, setNodes] = useState<BiDirectoryNode[]>([]);
  const [nodeTypes, setNodeTypes] = useState<BiNodeType[]>([]);
  const [promptPreview, setPromptPreview] = useState<BiPromptPreview | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<BiPromptTemplate[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [shareTokens, setShareTokens] = useState<BiShareToken[]>([]);
  const nodeScreensRequestRef = useRef<{ nodeId: number; promise: Promise<BiScreen[]> } | null>(null);
  const allScreensRequestRef = useRef<Promise<void> | null>(null);
  const screenSideDataRequestRef = useRef<{ screenId: number; promise: Promise<void> } | null>(null);
  const supplementalDataLoadedRef = useRef(false);
  const supplementalDataRequestRef = useRef<Promise<void> | null>(null);

  const flatNodes = useMemo(() => flattenDirectoryNodes(nodes), [nodes]);
  const selectedNode = useMemo(
    () => flatNodes.find((node) => node.id === selectedNodeId) ?? null,
    [flatNodes, selectedNodeId],
  );
  const screens = useMemo(
    () => allScreens.filter((screen) => (screen.nodeId ?? null) === selectedNodeId),
    [allScreens, selectedNodeId],
  );
  const selectedScreen = useMemo(
    () => allScreens.find((screen) => screen.id === selectedScreenId) ?? null,
    [allScreens, selectedScreenId],
  );
  const boundDatasources = useMemo(() => {
    const datasourceIds = new Set(selectedScreen?.datasourceIds ?? selectedNode?.datasourceIds ?? []);
    const sourceAssetIds = new Set(selectedScreen?.sourceAssetIds ?? selectedNode?.sourceAssetIds ?? []);
    if (datasourceIds.size === 0 && sourceAssetIds.size === 0) {
      return [];
    }
    return datasources
      .map((datasource) => {
        const assets =
          sourceAssetIds.size > 0
            ? datasource.assets.filter((asset) => sourceAssetIds.has(asset.id))
            : datasourceIds.has(datasource.id)
              ? datasource.assets
              : [];
        if (assets.length === 0 && !datasourceIds.has(datasource.id)) {
          return null;
        }
        return {
          ...datasource,
          assets,
        };
      })
      .filter((datasource): datasource is BiDatasource => Boolean(datasource));
  }, [datasources, selectedNode, selectedScreen]);
  const metrics = useMemo(
    () => ({
      assetCount: countAssets(datasources),
      datasourceCount: datasources.length,
      fieldCount: countFields(datasources),
      nodeCount: flatNodes.length,
      screenCount: allScreens.length,
    }),
    [allScreens.length, datasources, flatNodes.length],
  );
  const selectedNodePath = useMemo(() => buildNodePath(selectedNode, nodes), [nodes, selectedNode]);

  function nextOptimisticNodeId() {
    const nextId = optimisticNodeIdState.current;
    optimisticNodeIdState.current -= 1;
    return nextId;
  }

  function removeLayoutEntries(
    currentLayoutMap: Record<number, BiCanvasMeta>,
    nodeIds: Iterable<number>,
  ) {
    const nextLayoutMap = { ...currentLayoutMap };
    Array.from(nodeIds).forEach((nodeId) => {
      delete nextLayoutMap[nodeId];
    });
    return nextLayoutMap;
  }

  async function loadWorkspaceBase(preferredNodeId?: number | null, preferredScreenId?: number | null) {
    const nextNodes = await biApi.listDirectoryTree();
    const nextFlatNodes = flattenDirectoryNodes(nextNodes);
    const nextSelectedNodeId =
      preferredNodeId && nextFlatNodes.some((node) => node.id === preferredNodeId)
        ? preferredNodeId
        : nextFlatNodes[0]?.id ?? null;
    const nodeScreens = nextSelectedNodeId ? await biApi.listScreens(nextSelectedNodeId) : [];
    const nextSelectedScreenId =
      preferredScreenId && nodeScreens.some((screen) => screen.id === preferredScreenId)
        ? preferredScreenId
        : resolveSelectedScreenIdForNode(nodeScreens, nextSelectedNodeId, null);

    startTransition(() => {
      setNodes(nextNodes);
      setAllScreens((current) => mergeScreenLists(current, nodeScreens));
      setLayoutMap(buildAutoLayoutMap(nextNodes));
      setSelectedNodeId(nextSelectedNodeId);
      setSelectedScreenId(nextSelectedScreenId);
    });

    return {
      screenId: nextSelectedScreenId,
      selectedNodeId: nextSelectedNodeId,
    };
  }

  async function loadWorkspaceSupplementalData() {
    if (supplementalDataLoadedRef.current) {
      return;
    }
    if (supplementalDataRequestRef.current) {
      return supplementalDataRequestRef.current;
    }

    const request = Promise.all([
      biApi.listAssetCatalog(),
      biApi.listNodeTypes(),
      biApi.listPromptTemplates('SCREEN_GENERATION'),
    ])
      .then(([nextDatasources, nextNodeTypes, nextTemplates]) => {
        startTransition(() => {
          setDatasources(nextDatasources);
          setNodeTypes(nextNodeTypes);
          setPromptTemplates(nextTemplates);
        });
        supplementalDataLoadedRef.current = true;
      })
      .finally(() => {
        supplementalDataRequestRef.current = null;
      });
    supplementalDataRequestRef.current = request;
    return request;
  }

  async function loadNodeScreens(nodeId: number | null) {
    if (!nodeId) {
      return [];
    }
    if (nodeScreensRequestRef.current?.nodeId === nodeId) {
      return nodeScreensRequestRef.current.promise;
    }
    const request = biApi.listScreens(nodeId).then((nodeScreens) => {
      startTransition(() => {
        setAllScreens((current) => mergeScreenLists(current, nodeScreens));
      });
      return nodeScreens;
    });
    nodeScreensRequestRef.current = { nodeId, promise: request };
    try {
      return await request;
    } finally {
      if (nodeScreensRequestRef.current?.promise === request) {
        nodeScreensRequestRef.current = null;
      }
    }
  }

  async function loadAllScreensInBackground() {
    if (allScreensRequestRef.current) {
      return allScreensRequestRef.current;
    }
    const request = (async () => {
      try {
        const nextAllScreens = await biApi.listScreens();
        startTransition(() => {
          setAllScreens((current) => mergeScreenLists(nextAllScreens, current));
        });
      } catch {
        // Keep the current-node screen list available; the full catalog is only for secondary counts.
      } finally {
        allScreensRequestRef.current = null;
      }
    })();
    allScreensRequestRef.current = request;
    return request;
  }

  async function loadScreenSideData(screenId: number | null, preferredSessionId?: number | null) {
    if (!screenId) {
      startTransition(() => {
        setShareTokens([]);
        setDesignRecords([]);
        setDesignSessions([]);
        setDesignSession(null);
      });
      return;
    }

    if (screenSideDataRequestRef.current?.screenId === screenId) {
      return screenSideDataRequestRef.current.promise;
    }

    let request: Promise<void>;
    request = Promise.all([
      biApi.listShareTokens(screenId),
      biApi.listDesignRecords(screenId),
      options?.enableDesignSessions ? biApi.listDesignSessions(screenId) : Promise.resolve([]),
    ]).then(async ([nextShareTokens, nextDesignRecords, nextDesignSessions]) => {
      if (screenSideDataRequestRef.current?.promise !== request) {
        return;
      }
      let nextDesignSession: BiDesignSession | null = null;
      if (options?.enableDesignSessions) {
        const nextSessionId =
          preferredSessionId && nextDesignSessions.some((session) => session.sessionId === preferredSessionId)
            ? preferredSessionId
            : nextDesignSessions[0]?.sessionId ?? null;
        nextDesignSession = nextSessionId ? await biApi.getDesignSession(nextSessionId) : null;
      }
      if (screenSideDataRequestRef.current?.promise !== request) {
        return;
      }
      startTransition(() => {
        setShareTokens(nextShareTokens);
        setDesignRecords(nextDesignRecords);
        setDesignSessions(nextDesignSessions);
        setDesignSession(nextDesignSession);
      });
    }).finally(() => {
      if (screenSideDataRequestRef.current?.promise === request) {
        screenSideDataRequestRef.current = null;
      }
    });
    screenSideDataRequestRef.current = { screenId, promise: request };
    return request;
  }

  async function hydrate(
    preferredNodeId?: number | null,
    preferredScreenId?: number | null,
    options?: { showLoading?: boolean },
  ) {
    if (options?.showLoading) {
      setIsLoading(true);
    }
    setError(null);
    try {
      await loadWorkspaceBase(preferredNodeId, preferredScreenId);
      void loadWorkspaceSupplementalData().catch(() => {
        setError(WORKSPACE_LOAD_ERROR);
      });
      window.setTimeout(() => {
        void loadAllScreensInBackground();
      }, 2000);
    } catch (loadError) {
      setError(resolveWorkspaceError(loadError, WORKSPACE_LOAD_ERROR));
    } finally {
      if (options?.showLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    void hydrate(options?.initialSelectedNodeId, options?.initialSelectedScreenId, { showLoading: true });
  }, [options?.enableDesignSessions, options?.initialSelectedNodeId, options?.initialSelectedScreenId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const nextSelectedScreenId = resolveSelectedScreenIdForNode(
      allScreens,
      selectedNodeId,
      selectedScreenId,
    );
    if (nextSelectedScreenId !== selectedScreenId) {
      setSelectedScreenId(nextSelectedScreenId);
    }
  }, [allScreens, isLoading, selectedNodeId, selectedScreenId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    void loadNodeScreens(selectedNodeId);
  }, [isLoading, selectedNodeId]);

  async function mutate(
    action: () => Promise<{ nextNodeId?: number | null; nextScreenId?: number | null } | void>,
  ) {
    setIsMutating(true);
    setError(null);
    try {
      const result = await action();
      await hydrate(result?.nextNodeId ?? selectedNodeId, result?.nextScreenId ?? selectedScreenId);
    } catch (mutationError) {
      setError(resolveWorkspaceError(mutationError, WORKSPACE_ERROR));
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function runLocalMutation<T>(action: () => Promise<T>, onSuccess?: (result: T) => Promise<void> | void) {
    setIsMutating(true);
    setError(null);
    try {
      const result = await action();
      if (onSuccess) {
        await onSuccess(result);
      }
      return result;
    } catch (mutationError) {
      setError(resolveWorkspaceError(mutationError, WORKSPACE_ERROR));
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function saveDirectory(payload: DirectorySavePayload, id?: number) {
    if (!id) {
      const tempNodeId = nextOptimisticNodeId();
      const parentNode =
        payload.parentId != null ? flatNodes.find((node) => node.id === payload.parentId) ?? null : null;
      const previousSelectedNodeId = selectedNodeId;
      const optimisticNode: BiDirectoryNode = {
        boundAssets: [],
        canvasMeta: (payload.canvasMeta as BiCanvasMeta | undefined) ?? undefined,
        children: [],
        datasourceIds: [],
        id: tempNodeId,
        level: parentNode ? Number(parentNode.level ?? 1) + 1 : 1,
        nodeCode: payload.nodeCode,
        nodeName: payload.nodeName,
        nodeType: payload.nodeType,
        nodeTypeName:
          nodeTypes.find((nodeType) => nodeType.typeCode === payload.nodeType)?.typeName ?? payload.nodeType,
        orderNo: payload.orderNo ?? 0,
        parentId: payload.parentId ?? null,
        sourceAssetIds: [],
        status: payload.status ?? 'ACTIVE',
        treePath: parentNode
          ? `${parentNode.treePath ?? `/${parentNode.nodeCode}`}/${payload.nodeCode}`
          : `/${payload.nodeCode}`,
      };
      const optimisticNodes = upsertDirectoryNode(nodes, optimisticNode);

      startTransition(() => {
        setNodes(optimisticNodes);
        setLayoutMap(buildAutoLayoutMap(optimisticNodes));
      });

      setIsMutating(true);
      setError(null);
      try {
        const saved = await biApi.createDirectory(payload);
        const nextNodes = upsertDirectoryNode(removeDirectoryNode(optimisticNodes, tempNodeId), saved);
        startTransition(() => {
          setNodes(nextNodes);
          setLayoutMap(buildAutoLayoutMap(nextNodes));
          setSelectedNodeId(saved.id);
        });
        return saved;
      } catch (mutationError) {
        startTransition(() => {
          setNodes((current) => removeDirectoryNode(current, tempNodeId));
          setLayoutMap((current) => removeLayoutEntries(current, [tempNodeId]));
          setSelectedNodeId((current) => (current === tempNodeId ? previousSelectedNodeId : current));
        });
        setError(resolveWorkspaceError(mutationError, WORKSPACE_ERROR));
        throw mutationError;
      } finally {
        setIsMutating(false);
      }
    }

    return runLocalMutation(
      async () => biApi.updateDirectory(id, payload),
      async (saved) => {
        startTransition(() => {
          setNodes((current) => upsertDirectoryNode(current, saved));
          setLayoutMap((current) => ({
            ...current,
            [saved.id]: {
              ...(current[saved.id] ?? {}),
              ...(saved.canvasMeta ?? payload.canvasMeta ?? {}),
            },
          }));
          setSelectedNodeId(saved.id);
        });
      },
    );
  }

  async function bindNodeSourceAssets(nodeId: number, sourceAssetIds: number[]) {
    await runLocalMutation(
      async () => biApi.bindNodeSourceAssets(nodeId, sourceAssetIds),
      async (savedNode) => {
        startTransition(() => {
          setNodes((current) => upsertDirectoryNode(current, savedNode));
          setSelectedNodeId(savedNode.id);
        });
      },
    );
  }

  const bindArchiveSourceAssets = async (archiveId: number, sourceAssetIds: number[]) => {
    return runLocalMutation(
      async () => biApi.bindArchiveSourceAssets(archiveId, sourceAssetIds),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId ?? null);
          setSelectedScreenId(screen.id);
        });
        await loadScreenSideData(screen.id);
      },
    );
  };

  const bindArchiveSourceAssetsForExact = async (archiveId: number, sourceAssetIds: number[]) => {
    return runLocalMutation(
      async () => biApi.bindArchiveSourceAssets(archiveId, sourceAssetIds),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId ?? null);
          setSelectedScreenId(screen.id);
        });
        void loadScreenSideData(screen.id).catch((loadError) => {
          setError(loadError instanceof Error ? loadError.message : WORKSPACE_LOAD_ERROR);
        });
      },
    );
  };

  async function createDatasource(payload: DatasourceSavePayload) {
    return runLocalMutation(
      async () => biApi.createDatasource(payload),
      async (datasource) => {
        startTransition(() => {
          setDatasources((current) => upsertDatasource(current, datasource));
        });
      },
    );
  }

  async function saveAsset(datasourceId: number, payload: DataAssetSavePayload, assetId?: number) {
    return runLocalMutation(
      async () =>
        assetId
          ? biApi.updateDatasourceAsset(datasourceId, assetId, payload)
          : biApi.createDatasourceAsset(datasourceId, payload),
      async (asset) => {
        startTransition(() => {
          setDatasources((current) => upsertDatasourceAsset(current, datasourceId, asset));
        });
      },
    );
  }

  async function replaceAssetFields(assetId: number, fields: DataAssetFieldSavePayload[]) {
    return runLocalMutation(
      async () => biApi.replaceAssetFields(assetId, fields),
      async (nextFields) => {
        startTransition(() => {
          setDatasources((current) => replaceDatasourceAssetFields(current, assetId, nextFields));
        });
      },
    );
  }

  async function updateDatasource(id: number, payload: DatasourceSavePayload) {
    return runLocalMutation(
      async () => biApi.updateDatasource(id, payload),
      async (datasource) => {
        startTransition(() => {
          setDatasources((current) => upsertDatasource(current, datasource));
        });
      },
    );
  }

  async function saveNodeType(payload: NodeTypeSavePayload, id?: number) {
    return runLocalMutation(
      async () => (id ? biApi.updateNodeType(id, payload) : biApi.createNodeType(payload)),
      async (savedNodeType) => {
        startTransition(() => {
          setNodeTypes((current) => upsertNodeType(current, savedNodeType));
        });
      },
    );
  }

  async function generateAssetBizComments(assetId: number) {
    const nextFields = await biApi.generateBizComments(assetId);
    startTransition(() => {
      setDatasources((current) => replaceDatasourceAssetFields(current, assetId, nextFields));
    });
    return nextFields;
  }

  async function createScreen(payload: ScreenSavePayload) {
    return runLocalMutation(
      async () => biApi.createArchive(payload),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId ?? null);
          setSelectedScreenId(screen.id);
        });
      },
    );
  }

  async function updateScreen(screenId: number, payload: ScreenSavePayload) {
    return runLocalMutation(
      async () => biApi.updateArchive(screenId, payload),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId ?? null);
          setSelectedScreenId(screen.id);
        });
      },
    );
  }

  async function saveScreenVersion(screenId: number, payload: ScreenVersionSavePayload) {
    return mutate(async () => {
      await biApi.saveScreenVersion(screenId, payload);
      return { nextNodeId: selectedNodeId, nextScreenId: screenId };
    });
  }

  async function publishScreenVersion(screenId: number, versionId: number) {
    await runLocalMutation(
      async () => biApi.publishScreenVersion(screenId, versionId),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId ?? null);
          setSelectedScreenId(screen.id);
        });
      },
    );
  }

  async function createShareToken(payload: ShareCreatePayload) {
    await runLocalMutation(
      async () => biApi.createShareToken(payload),
      async (token) => {
        startTransition(() => {
          setShareTokens((current) => upsertShareToken(current, token));
        });
      },
    );
  }

  async function revokeShareToken(tokenId: number) {
    await runLocalMutation(
      async () => biApi.revokeShareToken(tokenId),
      async (token) => {
        startTransition(() => {
          setShareTokens((current) => upsertShareToken(current, token));
        });
      },
    );
  }

  async function previewPrompt(payload: PromptPreviewPayload) {
    setIsMutating(true);
    setError(null);
    try {
      const preview = await biApi.previewPrompt(payload);
      startTransition(() => {
        setPromptPreview(preview);
      });
      return preview;
    } catch (previewError) {
      setError(resolveWorkspaceError(previewError, PROMPT_PREVIEW_ERROR));
      throw previewError;
    } finally {
      setIsMutating(false);
    }
  }

  async function generateDraft(payload: GenerateDraftPayload) {
    return mutate(async () => {
      const task = await biApi.generateDraft(payload);
      startTransition(() => {
        setGenerationTask(task);
      });
      return {
        nextNodeId: task.nodeId ?? payload.nodeId,
        nextScreenId: task.screenId ?? payload.screenId ?? null,
      };
    });
  }

  async function regenerateVersion(screenId: number, payload: RegenerateVersionPayload) {
    return mutate(async () => {
      const task = await biApi.regenerateVersion(screenId, payload);
      startTransition(() => {
        setGenerationTask(task);
      });
      return {
        nextNodeId: task.nodeId ?? selectedNodeId,
        nextScreenId: task.screenId ?? screenId,
      };
    });
  }

  async function createDesignSession(screenId: number, payload?: DesignSessionCreatePayload) {
    return runLocalMutation(
      async () => biApi.createDesignSession(screenId, payload),
      async (session) => {
        startTransition(() => {
          setDesignSession(session);
          setDesignSessions((current) => [
            session,
            ...current.filter((item) => item.sessionId !== session.sessionId),
          ]);
        });
      },
    );
  }

  const selectDesignSession = async (sessionId: number | null) => {
    if (!sessionId) {
      startTransition(() => {
        setDesignSession(null);
      });
      return null;
    }
    const session = await biApi.getDesignSession(sessionId);
    startTransition(() => {
      setDesignSession(session);
    });
    return session;
  };

  async function sendDesignMessage(sessionId: number, payload: DesignMessageSendPayload) {
    setIsMutating(true);
    setError(null);
    try {
      const result = await biApi.sendDesignMessage(sessionId, payload);
      startTransition(() => {
        setDesignSession(result.session);
        setGenerationTask(result.generationTask ?? null);
        setDesignSessions((current) => [
          result.session,
          ...current.filter((item) => item.sessionId !== result.session.sessionId),
        ]);
      });
      await hydrate(selectedNodeId, result.generationTask?.screenId ?? selectedScreenId);
      await loadScreenSideData(result.session.screenId, result.session.sessionId);
      return result;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : WORKSPACE_ERROR);
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function publishGeneratedVersion(screenId: number, versionId?: number | null) {
    await runLocalMutation(
      async () => biApi.publishGeneratedVersion(screenId, versionId),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId ?? null);
          setSelectedScreenId(screen.id);
        });
      },
    );
  }

  async function savePromptTemplate(payload: PromptTemplateSavePayload) {
    return mutate(async () => {
      await biApi.savePromptTemplate(payload);
      return { nextNodeId: selectedNodeId, nextScreenId: selectedScreenId ?? null };
    });
  }

  function updateNodeLayout(id: number, patch: Partial<BiCanvasMeta>) {
    setLayoutMap((current) => {
      const previous = current[id] ?? {};
      const next = {
        ...previous,
        ...patch,
      };
      if (
        previous.height === next.height &&
        previous.width === next.width &&
        previous.x === next.x &&
        previous.y === next.y
      ) {
        return current;
      }
      return {
        ...current,
        [id]: next,
      };
    });
  }

  function autoLayout() {
    const nextLayout = buildAutoLayout(nodes);
    const layoutPatch: Record<number, BiCanvasMeta> = {};
    nextLayout.forEach((value, key) => {
      layoutPatch[key] = value;
    });
    setLayoutMap(layoutPatch);
  }

  async function saveCanvasLayout() {
    const payload: DirectoryCanvasLayoutItemPayload[] = flatNodes
      .filter((node) => node.id > 0)
      .map((node) => ({
        canvasMeta: layoutMap[node.id] ?? getNodeCanvasMeta(node),
        id: node.id,
      }));

    await runLocalMutation(
      async () => biApi.saveCanvasLayout(payload),
      async (savedNodes) => {
        const nextFlatNodes = flattenDirectoryNodes(savedNodes);
        const nextSelectedNodeId =
          selectedNodeId && nextFlatNodes.some((node) => node.id === selectedNodeId)
            ? selectedNodeId
            : nextFlatNodes[0]?.id ?? null;
        startTransition(() => {
          setNodes(savedNodes);
          setLayoutMap(mergeLayouts(savedNodes));
          setSelectedNodeId(nextSelectedNodeId);
        });
      },
    );
  }

  async function deleteDirectory(nodeId: number) {
    const targetNode = flatNodes.find((node) => node.id === nodeId) ?? null;
    if (!targetNode) {
      return;
    }

    const subtreeNodeIds = new Set(flattenDirectoryNodes([targetNode]).map((node) => node.id));
    if (allScreens.some((screen) => screen.nodeId != null && subtreeNodeIds.has(screen.nodeId))) {
      const message = '当前节点或下级节点仍有关联 BI 档案，请先处理档案后再删除。';
      setError(message);
      throw new Error(message);
    }

    const previousNodes = nodes;
    const previousLayoutMap = layoutMap;
    const previousSelectedNodeId = selectedNodeId;
    const remainingNodes = removeDirectoryNode(nodes, nodeId);
    const remainingFlatNodes = flattenDirectoryNodes(remainingNodes);
    const fallbackSelectedNodeId =
      targetNode.parentId ?? remainingFlatNodes[0]?.id ?? null;

    startTransition(() => {
      setNodes(remainingNodes);
      setLayoutMap(buildAutoLayoutMap(remainingNodes));
      setSelectedNodeId((current) =>
        current != null && subtreeNodeIds.has(current) ? fallbackSelectedNodeId : current,
      );
    });

    setIsMutating(true);
    setError(null);
    try {
      await biApi.deleteDirectory(nodeId);
    } catch (mutationError) {
      startTransition(() => {
        setNodes(previousNodes);
        setLayoutMap(previousLayoutMap);
        setSelectedNodeId(previousSelectedNodeId);
      });
      setError(resolveWorkspaceError(mutationError, WORKSPACE_ERROR));
      throw mutationError;
    } finally {
      setIsMutating(false);
    }
  }

  async function refreshGenerationTask(taskId: number) {
    const task = await biApi.getGenerationTask(taskId);
    startTransition(() => {
      setGenerationTask(task);
    });
    return task;
  }

  async function refreshScreenSideData() {
    await loadScreenSideData(selectedScreenId);
  }

  return {
    allScreens,
    autoLayout,
    bindArchiveSourceAssets,
    bindArchiveSourceAssetsForExact,
    bindNodeSourceAssets,
    boundDatasources,
    clearError: () => setError(null),
    createDatasource,
    createDesignSession,
    createScreen,
    createShareToken,
    datasources,
    deleteDirectory,
    designRecords,
    designSession,
    designSessions,
    error,
    flatNodes,
    generateAssetBizComments,
    generateDraft,
    generationTask,
    hydrate,
    isLoading,
    isMutating,
    layoutMap,
    metrics,
    nodes,
    nodeTypes,
    previewPrompt,
    promptPreview,
    promptTemplates,
    publishGeneratedVersion,
    publishScreenVersion,
    replaceAssetFields,
    refreshGenerationTask,
    refreshScreenSideData,
    regenerateVersion,
    revokeShareToken,
    saveAsset,
    saveCanvasLayout,
    saveDirectory,
    saveNodeType,
    savePromptTemplate,
    saveScreenVersion,
    screens,
    selectedNode,
    selectedNodeId,
    selectedNodePath,
    selectedScreen,
    selectedScreenId,
    selectDesignSession,
    setSelectedNodeId,
    setSelectedScreenId,
    sendDesignMessage,
    shareTokens,
    updateDatasource,
    updateNodeLayout,
    updateScreen,
  };
}

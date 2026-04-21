import { startTransition, useEffect, useMemo, useState } from 'react';

import {
  biApi,
  type DataAssetSavePayload,
  type DataAssetFieldSavePayload,
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

const WORKSPACE_ERROR = 'BI 工作台操作失败。';
const WORKSPACE_LOAD_ERROR = 'BI 工作台加载失败。';
const PROMPT_PREVIEW_ERROR = '提示词预览失败。';

type BiWorkspaceOptions = {
  initialSelectedNodeId?: number | null;
  initialSelectedScreenId?: number | null;
};

export function useBiWorkspace(options?: BiWorkspaceOptions) {
  const optimisticNodeIdState = useMemo(() => ({ current: -1 }), []);
  const [allScreens, setAllScreens] = useState<BiScreen[]>([]);
  const [datasources, setDatasources] = useState<BiDatasource[]>([]);
  const [designRecords, setDesignRecords] = useState<BiScreenDesignRecord[]>([]);
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

  const flatNodes = useMemo(() => flattenDirectoryNodes(nodes), [nodes]);
  const selectedNode = useMemo(
    () => flatNodes.find((node) => node.id === selectedNodeId) ?? null,
    [flatNodes, selectedNodeId],
  );
  const screens = useMemo(
    () => allScreens.filter((screen) => screen.nodeId === selectedNodeId),
    [allScreens, selectedNodeId],
  );
  const selectedScreen = useMemo(
    () => allScreens.find((screen) => screen.id === selectedScreenId) ?? null,
    [allScreens, selectedScreenId],
  );
  const boundDatasources = useMemo(() => {
    if (!selectedNode) {
      return [];
    }
    const datasourceIds = new Set(selectedNode.datasourceIds);
    const sourceAssetIds = new Set(selectedNode.sourceAssetIds);
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
  }, [datasources, selectedNode]);
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
    const [nextNodes, nextDatasources, nextNodeTypes, nextTemplates, nextAllScreens] = await Promise.all([
      biApi.listDirectoryTree(),
      biApi.listAssetCatalog(),
      biApi.listNodeTypes(),
      biApi.listPromptTemplates('SCREEN_GENERATION'),
      biApi.listScreens(),
    ]);

    startTransition(() => {
      setNodes(nextNodes);
      setDatasources(nextDatasources);
      setNodeTypes(nextNodeTypes);
      setPromptTemplates(nextTemplates);
      setAllScreens(nextAllScreens);
      setLayoutMap(mergeLayouts(nextNodes));
    });

    const nextFlatNodes = flattenDirectoryNodes(nextNodes);
    const nextSelectedNodeId =
      preferredNodeId && nextFlatNodes.some((node) => node.id === preferredNodeId)
        ? preferredNodeId
        : nextFlatNodes[0]?.id ?? null;
    const nextSelectedScreenId =
      preferredScreenId && nextAllScreens.some((screen) => screen.id === preferredScreenId)
        ? preferredScreenId
        : resolveSelectedScreenIdForNode(nextAllScreens, nextSelectedNodeId, null);

    startTransition(() => {
      setSelectedNodeId(nextSelectedNodeId);
      setSelectedScreenId(nextSelectedScreenId);
    });

    return {
      screenId: nextSelectedScreenId,
      selectedNodeId: nextSelectedNodeId,
    };
  }

  async function loadScreenSideData(screenId: number | null) {
    if (!screenId) {
      startTransition(() => {
        setShareTokens([]);
        setDesignRecords([]);
      });
      return;
    }

    const [nextShareTokens, nextDesignRecords] = await Promise.all([
      biApi.listShareTokens(screenId),
      biApi.listDesignRecords(screenId),
    ]);

    startTransition(() => {
      setShareTokens(nextShareTokens);
      setDesignRecords(nextDesignRecords);
    });
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
      const { screenId } = await loadWorkspaceBase(preferredNodeId, preferredScreenId);
      await loadScreenSideData(screenId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : WORKSPACE_LOAD_ERROR);
    } finally {
      if (options?.showLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    void hydrate(options?.initialSelectedNodeId, options?.initialSelectedScreenId, { showLoading: true });
  }, [options?.initialSelectedNodeId, options?.initialSelectedScreenId]);

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
    void loadScreenSideData(selectedScreenId);
  }, [isLoading, selectedScreenId]);

  async function mutate(
    action: () => Promise<{ nextNodeId?: number | null; nextScreenId?: number | null } | void>,
  ) {
    setIsMutating(true);
    setError(null);
    try {
      const result = await action();
      await hydrate(result?.nextNodeId ?? selectedNodeId, result?.nextScreenId ?? selectedScreenId);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : WORKSPACE_ERROR);
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
      setError(mutationError instanceof Error ? mutationError.message : WORKSPACE_ERROR);
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

      startTransition(() => {
        setNodes((current) => upsertDirectoryNode(current, optimisticNode));
        setLayoutMap((current) => ({
          ...current,
          [tempNodeId]: {
            ...getNodeCanvasMeta(optimisticNode),
            ...(payload.canvasMeta ?? {}),
          },
        }));
        setSelectedNodeId(tempNodeId);
      });

      setIsMutating(true);
      setError(null);
      try {
        const saved = await biApi.createDirectory(payload);
        startTransition(() => {
          setNodes((current) => upsertDirectoryNode(removeDirectoryNode(current, tempNodeId), saved));
          setLayoutMap((current) => {
            const optimisticLayout = current[tempNodeId];
            return {
              ...removeLayoutEntries(current, [tempNodeId]),
              [saved.id]: {
                ...getNodeCanvasMeta(saved),
                ...(saved.canvasMeta ?? payload.canvasMeta ?? {}),
                ...(optimisticLayout ?? {}),
              },
            };
          });
          setSelectedNodeId((current) => (current === tempNodeId ? saved.id : current));
        });
        return;
      } catch (mutationError) {
        startTransition(() => {
          setNodes((current) => removeDirectoryNode(current, tempNodeId));
          setLayoutMap((current) => removeLayoutEntries(current, [tempNodeId]));
          setSelectedNodeId((current) => (current === tempNodeId ? previousSelectedNodeId : current));
        });
        setError(mutationError instanceof Error ? mutationError.message : WORKSPACE_ERROR);
        throw mutationError;
      } finally {
        setIsMutating(false);
      }
    }

    await runLocalMutation(
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
      async () => biApi.createScreen(payload),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId);
          setSelectedScreenId(screen.id);
        });
        await loadScreenSideData(screen.id);
      },
    );
  }

  async function updateScreen(screenId: number, payload: ScreenSavePayload) {
    return runLocalMutation(
      async () => biApi.updateScreen(screenId, payload),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId);
          setSelectedScreenId(screen.id);
        });
        await loadScreenSideData(screen.id);
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
          setSelectedNodeId(screen.nodeId);
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
      setError(previewError instanceof Error ? previewError.message : PROMPT_PREVIEW_ERROR);
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

  async function publishGeneratedVersion(screenId: number, versionId?: number | null) {
    await runLocalMutation(
      async () => biApi.publishGeneratedVersion(screenId, versionId),
      async (screen) => {
        startTransition(() => {
          setAllScreens((current) => upsertScreen(current, screen));
          setSelectedNodeId(screen.nodeId);
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
    const payload: DirectoryCanvasLayoutItemPayload[] = flatNodes.map((node) => ({
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
    if (allScreens.some((screen) => subtreeNodeIds.has(screen.nodeId))) {
      const message = '当前节点或下级节点仍有关联 BI 档案，请先处理档案后再删除。';
      setError(message);
      throw new Error(message);
    }

    const previousNodes = nodes;
    const previousLayoutMap = layoutMap;
    const previousSelectedNodeId = selectedNodeId;
    const remainingNodes = flatNodes.filter((node) => !subtreeNodeIds.has(node.id));
    const fallbackSelectedNodeId =
      targetNode.parentId ?? remainingNodes[0]?.id ?? null;

    startTransition(() => {
      setNodes((current) => removeDirectoryNode(current, nodeId));
      setLayoutMap((current) => removeLayoutEntries(current, subtreeNodeIds));
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
      setError(mutationError instanceof Error ? mutationError.message : WORKSPACE_ERROR);
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

  return {
    allScreens,
    autoLayout,
    bindNodeSourceAssets,
    boundDatasources,
    createDatasource,
    createScreen,
    createShareToken,
    datasources,
    deleteDirectory,
    designRecords,
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
    setSelectedNodeId,
    setSelectedScreenId,
    shareTokens,
    updateDatasource,
    updateNodeLayout,
    updateScreen,
  };
}

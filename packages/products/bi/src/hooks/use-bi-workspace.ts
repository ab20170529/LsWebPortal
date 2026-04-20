import { startTransition, useEffect, useMemo, useState } from 'react';

import {
  biApi,
  type DataAssetSavePayload,
  type DatasourceSavePayload,
  type DirectoryCanvasLayoutItemPayload,
  type DirectorySavePayload,
  type GenerateDraftPayload,
  type PromptPreviewPayload,
  type PromptTemplateSavePayload,
  type RegenerateVersionPayload,
  type ScreenSavePayload,
  type ShareCreatePayload,
} from '../api/bi-api';
import type {
  BiCanvasMeta,
  BiDatasource,
  BiDirectoryNode,
  BiGenerationTask,
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
  resolveSelectedScreenIdForNode,
  updateDirectoryNode,
  upsertDatasource,
  upsertDatasourceAsset,
  upsertDirectoryNode,
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

const WORKSPACE_ERROR = 'BI workspace action failed.';
const WORKSPACE_LOAD_ERROR = 'Failed to load BI workspace.';
const PROMPT_PREVIEW_ERROR = 'Failed to preview the prompt.';

export function useBiWorkspace() {
  const [allScreens, setAllScreens] = useState<BiScreen[]>([]);
  const [datasources, setDatasources] = useState<BiDatasource[]>([]);
  const [designRecords, setDesignRecords] = useState<BiScreenDesignRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationTask, setGenerationTask] = useState<BiGenerationTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [layoutMap, setLayoutMap] = useState<Record<number, BiCanvasMeta>>({});
  const [nodes, setNodes] = useState<BiDirectoryNode[]>([]);
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
    return datasources.filter((datasource) => datasourceIds.has(datasource.id));
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

  async function loadWorkspaceBase(preferredNodeId?: number | null, preferredScreenId?: number | null) {
    const [nextNodes, nextDatasources, nextTemplates, nextAllScreens] = await Promise.all([
      biApi.listDirectoryTree(),
      biApi.listDatasources(),
      biApi.listPromptTemplates('SCREEN_GENERATION'),
      biApi.listScreens(),
    ]);

    startTransition(() => {
      setNodes(nextNodes);
      setDatasources(nextDatasources);
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
    void hydrate(undefined, undefined, { showLoading: true });
  }, []);

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
    await runLocalMutation(
      async () => (id ? biApi.updateDirectory(id, payload) : biApi.createDirectory(payload)),
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

  async function bindNodeSources(nodeId: number, datasourceIds: number[]) {
    await runLocalMutation(
      async () => {
        await biApi.bindNodeSources(nodeId, datasourceIds);
        return nodeId;
      },
      async () => {
        startTransition(() => {
          setNodes((current) =>
            updateDirectoryNode(current, nodeId, (node) => ({
              ...node,
              datasourceIds,
            })),
          );
        });
      },
    );
  }

  async function createDatasource(payload: DatasourceSavePayload) {
    await runLocalMutation(
      async () => biApi.createDatasource(payload),
      async (datasource) => {
        startTransition(() => {
          setDatasources((current) => upsertDatasource(current, datasource));
        });
      },
    );
  }

  async function saveAsset(datasourceId: number, payload: DataAssetSavePayload, assetId?: number) {
    await runLocalMutation(
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

  async function generateAssetBizComments(assetId: number) {
    const nextFields = await biApi.generateBizComments(assetId);
    startTransition(() => {
      setDatasources((current) => replaceDatasourceAssetFields(current, assetId, nextFields));
    });
    return nextFields;
  }

  async function createScreen(payload: ScreenSavePayload) {
    await runLocalMutation(
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

    await runLocalMutation(async () => {
      await biApi.saveCanvasLayout(payload);
      return payload;
    });
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
    bindNodeSources,
    boundDatasources,
    createDatasource,
    createScreen,
    createShareToken,
    datasources,
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
    previewPrompt,
    promptPreview,
    promptTemplates,
    publishGeneratedVersion,
    publishScreenVersion,
    refreshGenerationTask,
    regenerateVersion,
    revokeShareToken,
    saveAsset,
    saveCanvasLayout,
    saveDirectory,
    savePromptTemplate,
    screens,
    selectedNode,
    selectedNodeId,
    selectedNodePath,
    selectedScreen,
    selectedScreenId,
    setSelectedNodeId,
    setSelectedScreenId,
    shareTokens,
    updateNodeLayout,
  };
}

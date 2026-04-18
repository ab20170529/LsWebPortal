import { startTransition, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type React from 'react';
import { Badge, Button, Card } from '@lserp/ui';

import {
  biApi,
  type DataAssetSavePayload,
  type DatasourceSavePayload,
  type ScreenSavePayload,
} from '../api/bi-api';
import { BiDataAssetPanel } from '../components/bi-data-asset-panel';
import { BiDirectoryTree } from '../components/bi-directory-tree';
import type { BiDatasource, BiDirectoryNode, BiScreen, BiShareToken } from '../types';

function flattenNodes(nodes: BiDirectoryNode[]): BiDirectoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function parseDatasourceBinding(value: string) {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

export function BiWorkspacePage() {
  const [bindingText, setBindingText] = useState('');
  const [datasources, setDatasources] = useState<BiDatasource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [nodeCode, setNodeCode] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('COMPANY');
  const [nodes, setNodes] = useState<BiDirectoryNode[]>([]);
  const [screenBiType, setScreenBiType] = useState<'EXTERNAL' | 'INTERNAL'>('INTERNAL');
  const [screenCode, setScreenCode] = useState('');
  const [screenExternalUrl, setScreenExternalUrl] = useState('');
  const [screenName, setScreenName] = useState('');
  const [screens, setScreens] = useState<BiScreen[]>([]);
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [shareTokens, setShareTokens] = useState<BiShareToken[]>([]);
  const [aiPrompt, setAiPrompt] = useState(
    'Generate a management-facing BI dashboard from the bound datasource assets.',
  );

  const flatNodes = useMemo(() => flattenNodes(nodes), [nodes]);
  const selectedNode = flatNodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedScreen = screens.find((screen) => screen.id === selectedScreenId) ?? null;

  async function loadWorkspace() {
    setIsLoading(true);
    setError(null);

    try {
      const [nextNodes, nextDatasources] = await Promise.all([
        biApi.listDirectoryTree(),
        biApi.listDatasources(),
      ]);

      startTransition(() => {
        setNodes(nextNodes);
        setDatasources(nextDatasources);
      });

      const flattened = flattenNodes(nextNodes);
      if (flattened.length > 0 && !flattened.some((node) => node.id === selectedNodeId)) {
        setSelectedNodeId(flattened[0]?.id ?? null);
      }
      if (
        nextDatasources.length > 0 &&
        !nextDatasources.some((datasource) => datasource.id === selectedDatasourceId)
      ) {
        setSelectedDatasourceId(nextDatasources[0]?.id ?? null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load BI workspace.');
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshScreens(nodeId: number | null) {
    if (!nodeId) {
      setScreens([]);
      setSelectedScreenId(null);
      return;
    }

    const nextScreens = await biApi.listScreens(nodeId);
    startTransition(() => {
      setScreens(nextScreens);
      if (!nextScreens.some((screen) => screen.id === selectedScreenId)) {
        setSelectedScreenId(nextScreens[0]?.id ?? null);
      }
    });
  }

  async function refreshShareTokens(screenId: number | null) {
    if (!screenId) {
      setShareTokens([]);
      return;
    }

    const nextTokens = await biApi.listShareTokens(screenId);
    startTransition(() => {
      setShareTokens(nextTokens);
    });
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!selectedNode) {
      setBindingText('');
      return;
    }
    setBindingText(selectedNode.datasourceIds.join(','));
  }, [selectedNode]);

  useEffect(() => {
    void refreshScreens(selectedNodeId);
  }, [selectedNodeId]);

  useEffect(() => {
    void refreshShareTokens(selectedScreenId);
  }, [selectedScreenId]);

  async function mutate(action: () => Promise<void>) {
    setIsMutating(true);
    setError(null);

    try {
      await action();
      await loadWorkspace();
      await refreshScreens(selectedNodeId);
      await refreshShareTokens(selectedScreenId);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Workspace mutation failed.');
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCreateNode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutate(async () => {
      await biApi.createDirectory({
        nodeCode,
        nodeName,
        nodeType,
        parentId: selectedNodeId,
      });
      setNodeCode('');
      setNodeName('');
    });
  }

  async function handleCreateDatasource(payload: DatasourceSavePayload) {
    await mutate(async () => {
      const datasource = await biApi.createDatasource(payload);
      setSelectedDatasourceId(datasource.id);
    });
  }

  async function handleSaveAsset(
    datasourceId: number,
    payload: DataAssetSavePayload,
    assetId?: number,
  ) {
    await mutate(async () => {
      if (assetId) {
        await biApi.updateDatasourceAsset(datasourceId, assetId, payload);
        return;
      }
      await biApi.createDatasourceAsset(datasourceId, payload);
    });
  }

  async function handleBindDatasourceIds() {
    if (!selectedNodeId) {
      return;
    }

    await mutate(async () => {
      await biApi.bindNodeSources(selectedNodeId, parseDatasourceBinding(bindingText));
    });
  }

  async function handleCreateScreen(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedNodeId) {
      return;
    }

    const payload: ScreenSavePayload = {
      biType: screenBiType,
      name: screenName,
      nodeId: selectedNodeId,
      screenCode,
    };

    if (screenBiType === 'EXTERNAL') {
      payload.versionDraft = {
        externalConfig: {
          allowFullscreen: true,
          openMode: 'iframe',
          queryParamMapping: {},
          sandboxPolicy: 'allow-same-origin allow-scripts allow-forms',
          targetUrl: screenExternalUrl,
          title: screenName,
        },
        publishNow: true,
        theme: 'external',
      };
    }

    await mutate(async () => {
      await biApi.createScreen(payload);
      setScreenCode('');
      setScreenName('');
      setScreenExternalUrl('');
    });
  }

  async function handleGenerateAiScreen() {
    if (!selectedNodeId) {
      return;
    }

    await mutate(async () => {
      await biApi.generateScreen({
        nodeId: selectedNodeId,
        prompt: aiPrompt,
        screenCode: screenCode || undefined,
        screenName: screenName || undefined,
      });
    });
  }

  async function handlePublish(screenId: number, versionId: number) {
    await mutate(async () => {
      await biApi.publishScreenVersion(screenId, versionId);
    });
  }

  async function handleCreateShareToken() {
    if (!selectedScreenId) {
      return;
    }

    await mutate(async () => {
      await biApi.createShareToken({
        ...(shareExpiresAt ? { expiresAt: new Date(shareExpiresAt).toISOString() } : {}),
        screenId: selectedScreenId,
      });
      setShareExpiresAt('');
    });
  }

  async function handleRevokeShareToken(id: number) {
    await mutate(async () => {
      await biApi.revokeShareToken(id);
    });
  }

  if (isLoading) {
    return (
      <Card className="rounded-[32px] p-8">
        <div className="theme-text-strong text-xl font-black tracking-tight">
          Loading BI workspace...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[36px] p-8 lg:p-10">
        <Badge tone="brand">BI Workspace</Badge>
        <h1 className="theme-text-strong mt-4 text-4xl font-black tracking-tight">
          BI design and runtime control center
        </h1>
        <p className="theme-text-muted mt-4 max-w-3xl text-sm leading-8">
          Manage organization nodes, reusable datasource assets, BI archives, runtime versions,
          and share links from one workspace.
        </p>
        {error ? (
          <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BiDirectoryTree
          nodes={nodes}
          onSelect={(node) => {
            setSelectedNodeId(node.id);
          }}
          selectedNodeId={selectedNodeId}
        />

        <Card className="rounded-[28px] p-6">
          <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
            Node Context
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone="neutral">{selectedNode?.nodeName ?? 'No node selected'}</Badge>
            {selectedNode?.nodeCode ? <Badge tone="brand">{selectedNode.nodeCode}</Badge> : null}
            {selectedNode?.nodeType ? <Badge tone="success">{selectedNode.nodeType}</Badge> : null}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <form className="space-y-3" onSubmit={handleCreateNode}>
              <div className="theme-text-strong text-lg font-black tracking-tight">
                Create child node
              </div>
              <input
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setNodeCode(event.target.value)}
                placeholder="nodeCode"
                value={nodeCode}
              />
              <input
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setNodeName(event.target.value)}
                placeholder="nodeName"
                value={nodeName}
              />
              <select
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setNodeType(event.target.value)}
                value={nodeType}
              >
                <option value="COMPANY">COMPANY</option>
                <option value="DEPARTMENT">DEPARTMENT</option>
                <option value="ANALYSIS_DIM">ANALYSIS_DIM</option>
                <option value="SUB_DIM">SUB_DIM</option>
              </select>
              <Button disabled={isMutating} type="submit">
                Save node
              </Button>
            </form>

            <div className="space-y-3">
              <div className="theme-text-strong text-lg font-black tracking-tight">
                Bind datasource ids
              </div>
              <textarea
                className="theme-input min-h-[120px] w-full rounded-[24px] px-4 py-3"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBindingText(event.target.value)}
                placeholder="1,2,3"
                value={bindingText}
              />
              <Button disabled={!selectedNodeId || isMutating} onClick={handleBindDatasourceIds}>
                Save binding
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <BiDataAssetPanel
        datasources={datasources}
        isMutating={isMutating}
        onCreateDatasource={handleCreateDatasource}
        onSaveAsset={handleSaveAsset}
        onSelectDatasource={setSelectedDatasourceId}
        selectedDatasourceId={selectedDatasourceId}
      />

      <Card className="rounded-[28px] p-6">
        <div className="theme-text-soft text-xs font-bold uppercase tracking-[0.24em]">
          BI Archives
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <form className="space-y-3" onSubmit={handleCreateScreen}>
            <div className="theme-text-strong text-lg font-black tracking-tight">
              Create BI archive
            </div>
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenCode(event.target.value)}
              placeholder="screenCode"
              value={screenCode}
            />
            <input
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setScreenName(event.target.value)}
              placeholder="screenName"
              value={screenName}
            />
            <select
              className="theme-input h-11 w-full rounded-2xl px-4"
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setScreenBiType(event.target.value as 'EXTERNAL' | 'INTERNAL')
              }
              value={screenBiType}
            >
              <option value="INTERNAL">INTERNAL</option>
              <option value="EXTERNAL">EXTERNAL</option>
            </select>
            {screenBiType === 'EXTERNAL' ? (
              <input
                className="theme-input h-11 w-full rounded-2xl px-4"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setScreenExternalUrl(event.target.value)
                }
                placeholder="targetUrl"
                value={screenExternalUrl}
              />
            ) : null}
            <Button disabled={!selectedNodeId || isMutating} type="submit">
              Save archive
            </Button>

            <div className="border-t border-[color:color-mix(in_srgb,var(--portal-color-border-soft)_80%,white)] pt-3">
              <div className="theme-text-strong text-lg font-black tracking-tight">
                AI generate and publish
              </div>
              <textarea
                className="theme-input mt-3 min-h-[120px] w-full rounded-[24px] px-4 py-3"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(event.target.value)}
                value={aiPrompt}
              />
              <div className="mt-3">
                <Button disabled={!selectedNodeId || isMutating} onClick={handleGenerateAiScreen}>
                  Generate screen
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="rounded-[22px] border px-4 py-4"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--portal-color-border-soft) 78%, white)',
                }}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setSelectedScreenId(screen.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="theme-text-strong text-sm font-black tracking-tight">
                        {screen.name}
                      </div>
                      <div className="theme-text-muted mt-1 text-xs">{screen.screenCode}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone="neutral">{screen.biType}</Badge>
                      <Badge tone="success">{screen.publishStatus ?? 'DRAFT'}</Badge>
                    </div>
                  </div>
                </button>

                <div className="mt-4 space-y-2">
                  {screen.versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-3 py-3"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--portal-color-surface-panel) 84%, white)',
                      }}
                    >
                      <div className="text-sm">
                        <span className="theme-text-strong font-semibold">
                          v{version.versionNo ?? version.id}
                        </span>
                        <span className="theme-text-muted ml-3">
                          {version.generatedByAi ? 'AI generated' : 'Manual'}
                        </span>
                      </div>
                      <Button
                        disabled={isMutating}
                        onClick={() => handlePublish(screen.id, version.id)}
                      >
                        {version.published ? 'Published' : 'Publish'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selectedScreen ? (
              <div className="rounded-[22px] border px-4 py-4">
                <div className="theme-text-strong text-sm font-black tracking-tight">
                  Share links for {selectedScreen.name}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    className="theme-input h-11 flex-1 rounded-2xl px-4"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setShareExpiresAt(event.target.value)
                    }
                    type="datetime-local"
                    value={shareExpiresAt}
                  />
                  <Button disabled={isMutating} onClick={handleCreateShareToken}>
                    Create token
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {shareTokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border px-3 py-3"
                    >
                      <div className="min-w-0">
                        <div className="theme-text-strong truncate text-sm font-semibold">
                          {token.tokenValue}
                        </div>
                        <div className="theme-text-muted mt-1 text-xs">
                          {token.expiresAt ?? 'No expiry'}
                        </div>
                      </div>
                      <Button disabled={isMutating} onClick={() => handleRevokeShareToken(token.id)} tone="ghost">
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

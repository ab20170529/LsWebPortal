import { useEffect, useMemo, useState } from 'react';

import { BiArchiveManagementPanel } from '../components/workspace/bi-archive-management-panel';
import { BiDirectoryCanvas } from '../components/workspace/bi-directory-canvas';
import { BiNodeContextPanel } from '../components/workspace/bi-node-context-panel';
import { BiSidebarNav } from '../components/workspace/bi-sidebar-nav';
import { BiSourceManagementPanel } from '../components/workspace/bi-source-management-panel';
import { BiTopToolbar } from '../components/workspace/bi-top-toolbar';
import { BiWorkspaceSettingsPanel } from '../components/workspace/bi-workspace-settings-panel';
import { BiWorkspaceShell } from '../components/workspace/bi-workspace-shell';
import { useBiWorkspace } from '../hooks/use-bi-workspace';
import type { BiNodeType } from '../types';
import {
  buildBiWorkspaceViewSearch,
  readBiWorkspaceViewState,
  type BiArchiveTab,
  type BiWorkspaceSection,
} from '../utils/bi-workspace-view-state';

function resolveLatestVersionId(versions: Array<{ id: number; versionNo?: number | null }>) {
  if (versions.length === 0) {
    return null;
  }
  return versions.reduce((latest, version) => {
    const currentNo = latest.versionNo ?? latest.id;
    const candidateNo = version.versionNo ?? version.id;
    return candidateNo > currentNo ? version : latest;
  }).id;
}

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveRootNodeType(nodeTypes: BiNodeType[]) {
  if (nodeTypes.length === 0) {
    return 'COMPANY';
  }
  const childTypeCodes = new Set(nodeTypes.flatMap((nodeType) => nodeType.allowedChildTypeCodes));
  return (
    nodeTypes.find((nodeType) => !childTypeCodes.has(nodeType.typeCode))?.typeCode ??
    nodeTypes[0]!.typeCode
  );
}

function resolveChildNodeType(nodeType: string, nodeTypes: BiNodeType[]) {
  const currentType = nodeTypes.find((item) => item.typeCode === nodeType) ?? null;
  if (currentType?.allowedChildTypeCodes?.length) {
    return currentType.allowedChildTypeCodes[0]!;
  }
  return currentType?.typeCode ?? resolveRootNodeType(nodeTypes);
}

function buildDefaultNodeName(nodeType: string, nodeTypes: BiNodeType[]) {
  const typeName = nodeTypes.find((item) => item.typeCode === nodeType)?.typeName ?? nodeType;
  return `新建${typeName}节点`;
}

export function BiWorkspacePage() {
  const initialView = useMemo(() => readBiWorkspaceViewState(window.location.search), []);
  const [activeSection, setActiveSection] = useState<BiWorkspaceSection>(initialView.section);
  const [activeArchiveTab, setActiveArchiveTab] = useState<BiArchiveTab>(initialView.tab);
  const [createPresetType, setCreatePresetType] = useState<'EXTERNAL' | 'INTERNAL' | null>(null);
  const workspace = useBiWorkspace({
    initialSelectedNodeId: initialView.nodeId,
    initialSelectedScreenId: initialView.screenId,
  });

  const selectedPreviewHref = useMemo(() => {
    if (workspace.selectedScreen) {
      return `/bi/screen/${workspace.selectedScreen.screenCode}`;
    }
    if (workspace.selectedNode) {
      return `/bi/node/${workspace.selectedNode.nodeCode}`;
    }
    return '';
  }, [workspace.selectedNode, workspace.selectedScreen]);

  const publishVersionId = useMemo(() => {
    if (
      workspace.generationTask?.screenId &&
      workspace.generationTask.screenId === workspace.selectedScreen?.id &&
      workspace.generationTask.versionId
    ) {
      return workspace.generationTask.versionId;
    }
    return resolveLatestVersionId(workspace.selectedScreen?.versions ?? []);
  }, [workspace.generationTask, workspace.selectedScreen]);

  const archiveCountByNodeId = useMemo(() => {
    const map: Record<number, number> = {};
    workspace.allScreens.forEach((screen) => {
      map[screen.nodeId] = (map[screen.nodeId] ?? 0) + 1;
    });
    return map;
  }, [workspace.allScreens]);

  const maxLevel = useMemo(
    () => workspace.flatNodes.reduce((maxValue, node) => Math.max(maxValue, Number(node.level ?? 1)), 1),
    [workspace.flatNodes],
  );

  useEffect(() => {
    const search = buildBiWorkspaceViewSearch({
      nodeId: workspace.selectedNodeId,
      screenId: workspace.selectedScreenId,
      section: activeSection,
      tab: activeArchiveTab,
    });
    const nextUrl = `${window.location.pathname}${search}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  }, [activeArchiveTab, activeSection, workspace.selectedNodeId, workspace.selectedScreenId]);

  async function createNode(parent?: typeof workspace.selectedNode) {
    const parentNode = parent ?? null;
    const suffix = String(Date.now()).slice(-4);
    const nodeType = parentNode
      ? resolveChildNodeType(parentNode.nodeType, workspace.nodeTypes)
      : resolveRootNodeType(workspace.nodeTypes);
    const baseCode =
      slugifyCode(parentNode?.nodeCode || parentNode?.nodeName || nodeType || 'bi_root') || 'bi_root';
    const nodeCode = `${baseCode}_${suffix}`;
    const parentLayout = parentNode ? workspace.layoutMap[parentNode.id] : null;

    await workspace.saveDirectory({
      canvasMeta: parentLayout
        ? {
            ...parentLayout,
            x: Number(parentLayout.x ?? 80) + 260,
            y: Number(parentLayout.y ?? 120) + 40,
          }
        : {
            x: 96,
            y: 140 + workspace.flatNodes.length * 36,
          },
      nodeCode,
      nodeName: buildDefaultNodeName(nodeType, workspace.nodeTypes),
      nodeType,
      parentId: parentNode?.id ?? null,
      status: 'ACTIVE',
    });
  }

  function openSection(section: BiWorkspaceSection) {
    setActiveSection(section);
    if (section !== 'archives') {
      setCreatePresetType(null);
    }
  }

  function openArchiveTab(tab: BiArchiveTab) {
    setActiveSection('archives');
    setActiveArchiveTab(tab);
  }

  async function handleDesignInternalArchive(targetNode = workspace.selectedNode) {
    if (!targetNode) {
      return;
    }
    workspace.setSelectedNodeId(targetNode.id);
    const internalScreen =
      workspace.allScreens.find(
        (screen) => screen.nodeId === targetNode.id && screen.biType === 'INTERNAL',
      ) ?? null;
    if (internalScreen) {
      workspace.setSelectedScreenId(internalScreen.id);
      setCreatePresetType(null);
      openArchiveTab('design');
      return;
    }

    const created = await workspace.createScreen({
      biType: 'INTERNAL',
      name: `${targetNode.nodeName}内置BI`,
      nodeId: targetNode.id,
      screenCode: `${slugifyCode(targetNode.nodeCode || targetNode.nodeName) || 'bi_screen'}_internal`,
    });
    if (created && typeof created === 'object' && 'id' in created) {
      const createdScreen = created as { id: number; nodeId: number };
      workspace.setSelectedNodeId(createdScreen.nodeId);
      workspace.setSelectedScreenId(createdScreen.id);
    }
    setCreatePresetType(null);
    openArchiveTab('design');
  }

  function handleCreateExternalArchive(targetNode = workspace.selectedNode) {
    if (!targetNode) {
      return;
    }
    workspace.setSelectedNodeId(targetNode.id);
    workspace.setSelectedScreenId(null);
    setCreatePresetType('EXTERNAL');
    openArchiveTab('base');
  }

  if (workspace.isLoading && workspace.nodes.length === 0) {
    return (
      <div className="bi-workspace-loading">
        <div className="bi-workspace-loading-card">
          <div className="bi-workspace-loading-title">正在加载 BI 设计平台...</div>
          <div className="bi-workspace-loading-text">
            正在同步目录树、分析源资产、BI 档案以及设计上下文。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bi-workspace-page">
      {workspace.error ? <div className="bi-workspace-error">{workspace.error}</div> : null}

      <BiWorkspaceShell
        canvas={
          activeSection === 'canvas' ? (
            <BiDirectoryCanvas
              archiveCountByNodeId={archiveCountByNodeId}
              assetCount={workspace.metrics.assetCount}
              layoutMap={workspace.layoutMap}
              maxLevel={maxLevel}
              nodes={workspace.nodes}
              onAutoLayout={workspace.autoLayout}
              onDesignInternalArchive={(node) => {
                void handleDesignInternalArchive(node);
              }}
              onQuickAddChild={(node) => {
                workspace.setSelectedNodeId(node.id);
                openSection('canvas');
                void createNode(node);
              }}
              onQuickAddRoot={() => {
                openSection('canvas');
                void createNode();
              }}
              onQuickCreateExternalArchive={(node) => handleCreateExternalArchive(node)}
              onSaveLayout={() => {
                void workspace.saveCanvasLayout();
              }}
              onSelectNode={(nodeId) => {
                workspace.setSelectedNodeId(nodeId);
              }}
              onUpdateNodeLayout={workspace.updateNodeLayout}
              selectedNodeId={workspace.selectedNodeId}
            />
          ) : activeSection === 'sources' ? (
            <BiSourceManagementPanel
              datasources={workspace.datasources}
              isMutating={workspace.isMutating}
              node={workspace.selectedNode}
              onBindSourceAssets={workspace.bindNodeSourceAssets}
              onCreateDatasource={workspace.createDatasource}
              onGenerateBizComments={workspace.generateAssetBizComments}
              onReplaceAssetFields={workspace.replaceAssetFields}
              onSaveAsset={workspace.saveAsset}
              onUpdateDatasource={workspace.updateDatasource}
            />
          ) : activeSection === 'archives' ? (
            <BiArchiveManagementPanel
              activeTab={activeArchiveTab}
              allNodes={workspace.flatNodes}
              boundDatasources={workspace.boundDatasources}
              createPresetType={createPresetType}
              designRecords={workspace.designRecords}
              generationTask={workspace.generationTask}
              isMutating={workspace.isMutating}
              node={workspace.selectedNode}
              onActiveTabChange={setActiveArchiveTab}
              onClearCreatePreset={() => setCreatePresetType(null)}
              onCreateScreen={workspace.createScreen}
              onCreateShareToken={workspace.createShareToken}
              onGenerateDraft={workspace.generateDraft}
              onPreviewPrompt={workspace.previewPrompt}
              onPublishGeneratedVersion={workspace.publishGeneratedVersion}
              onPublishVersion={workspace.publishScreenVersion}
              onRegenerateVersion={workspace.regenerateVersion}
              onRevokeShareToken={workspace.revokeShareToken}
              onSaveScreenVersion={workspace.saveScreenVersion}
              onSelectNode={(nodeId) => workspace.setSelectedNodeId(nodeId)}
              onSelectScreen={workspace.setSelectedScreenId}
              onUpdateScreen={workspace.updateScreen}
              promptPreview={workspace.promptPreview}
              promptTemplates={workspace.promptTemplates}
              screens={workspace.screens}
              selectedScreenId={workspace.selectedScreenId}
              shareTokens={workspace.shareTokens}
            />
          ) : (
            <div className="bi-settings-stage">
              <BiWorkspaceSettingsPanel
                isMutating={workspace.isMutating}
                nodeTypes={workspace.nodeTypes}
                onSaveNodeType={workspace.saveNodeType}
              />
            </div>
          )
        }
        contextPanel={
          <BiNodeContextPanel
            node={workspace.selectedNode}
            onOpenArchiveTab={openArchiveTab}
            onOpenSection={openSection}
            onQuickCreateExternalArchive={handleCreateExternalArchive}
            onQuickDesignInternalArchive={() => {
              void handleDesignInternalArchive();
            }}
            screens={workspace.screens}
          />
        }
        sidebar={
          <BiSidebarNav
            activeSection={activeSection}
            onChange={(section) => {
              openSection(section);
            }}
          />
        }
        toolbar={
          <BiTopToolbar
            canPublish={Boolean(workspace.selectedScreen && publishVersionId)}
            isMutating={workspace.isMutating}
            nodePath={workspace.selectedNodePath.map((item) => item.nodeName)}
            onOpenDesign={() => {
              if (workspace.selectedScreen?.biType === 'INTERNAL') {
                openArchiveTab('design');
                return;
              }
              void handleDesignInternalArchive();
            }}
            onOpenPreview={() => {
              if (selectedPreviewHref) {
                window.open(selectedPreviewHref, '_blank', 'noopener,noreferrer');
              }
            }}
            onPublish={() => {
              if (!workspace.selectedScreen || !publishVersionId) {
                return;
              }
              if (
                workspace.generationTask?.screenId === workspace.selectedScreen.id &&
                workspace.generationTask.versionId === publishVersionId
              ) {
                void workspace.publishGeneratedVersion(workspace.selectedScreen.id, publishVersionId);
                return;
              }
              void workspace.publishScreenVersion(workspace.selectedScreen.id, publishVersionId);
            }}
            screenName={workspace.selectedScreen?.name ?? workspace.selectedNode?.nodeName ?? null}
          />
        }
      />
    </div>
  );
}

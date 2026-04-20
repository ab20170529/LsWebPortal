import { useMemo, useState } from 'react';

import { BiDirectoryCanvas } from '../components/workspace/bi-directory-canvas';
import { BiNodeContextPanel } from '../components/workspace/bi-node-context-panel';
import { BiSidebarNav, type BiWorkspaceSection } from '../components/workspace/bi-sidebar-nav';
import { BiTopToolbar } from '../components/workspace/bi-top-toolbar';
import { BiWorkspaceShell } from '../components/workspace/bi-workspace-shell';
import { useBiWorkspace } from '../hooks/use-bi-workspace';

type ContextTab = 'assets' | 'info' | 'prompt';

function resolveContextTab(section: BiWorkspaceSection): ContextTab {
  if (section === 'assets') {
    return 'assets';
  }
  if (section === 'ai') {
    return 'prompt';
  }
  return 'info';
}

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

function resolveChildNodeType(nodeType: string) {
  switch (nodeType) {
    case 'COMPANY':
      return 'DEPARTMENT';
    case 'DEPARTMENT':
      return 'ANALYSIS_DIM';
    default:
      return 'SUB_DIM';
  }
}

function buildDefaultNodeName(nodeType: string) {
  switch (nodeType) {
    case 'COMPANY':
      return '新建公司节点';
    case 'DEPARTMENT':
      return '新建部门节点';
    case 'ANALYSIS_DIM':
      return '新建分析维度';
    default:
      return '新建子维度';
  }
}

export function BiWorkspacePage() {
  const [activeSection, setActiveSection] = useState<BiWorkspaceSection>('canvas');
  const [contextTab, setContextTab] = useState<ContextTab>('assets');
  const workspace = useBiWorkspace();

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
    () =>
      workspace.flatNodes.reduce((maxValue, node) => Math.max(maxValue, Number(node.level ?? 1)), 1),
    [workspace.flatNodes],
  );

  async function createNode(parent?: typeof workspace.selectedNode) {
    const parentNode = parent ?? null;
    const suffix = String(Date.now()).slice(-4);
    const nodeType = parentNode ? resolveChildNodeType(parentNode.nodeType) : 'COMPANY';
    const baseCode = slugifyCode(parentNode?.nodeCode || parentNode?.nodeName || 'bi_root') || 'bi_root';
    const nodeCode = parentNode ? `${baseCode}_${suffix}` : `${baseCode}_${suffix}`;
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
      nodeName: buildDefaultNodeName(nodeType),
      nodeType,
      parentId: parentNode?.id ?? null,
      status: 'ACTIVE',
    });
  }

  if (workspace.isLoading && workspace.nodes.length === 0) {
    return (
      <div className="bi-workspace-loading">
        <div className="bi-workspace-loading-card">
          <div className="bi-workspace-loading-title">正在加载 BI 设计平台...</div>
          <div className="bi-workspace-loading-text">
            正在同步目录树、分析源资产、BI 档案以及 AI 设计上下文。
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
          <BiDirectoryCanvas
            archiveCountByNodeId={archiveCountByNodeId}
            assetCount={workspace.metrics.assetCount}
            layoutMap={workspace.layoutMap}
            maxLevel={maxLevel}
            nodes={workspace.nodes}
            onAutoLayout={workspace.autoLayout}
            onQuickAddChild={(node) => {
              workspace.setSelectedNodeId(node.id);
              setActiveSection('canvas');
              setContextTab('info');
              void createNode(node);
            }}
            onQuickAddRoot={() => {
              setActiveSection('canvas');
              setContextTab('info');
              void createNode();
            }}
            onSaveLayout={() => {
              void workspace.saveCanvasLayout();
            }}
            onSelectNode={(nodeId) => {
              workspace.setSelectedNodeId(nodeId);
            }}
            onUpdateNodeLayout={workspace.updateNodeLayout}
            selectedNodeId={workspace.selectedNodeId}
          />
        }
        contextPanel={
          <BiNodeContextPanel
            boundDatasources={workspace.boundDatasources}
            contextTab={contextTab}
            datasources={workspace.datasources}
            designRecords={workspace.designRecords}
            generationTask={workspace.generationTask}
            isMutating={workspace.isMutating}
            node={workspace.selectedNode}
            onBindSources={workspace.bindNodeSources}
            onCreateDatasource={workspace.createDatasource}
            onCreateScreen={workspace.createScreen}
            onCreateShareToken={workspace.createShareToken}
            onGenerateAssetBizComments={workspace.generateAssetBizComments}
            onGenerateDraft={workspace.generateDraft}
            onPreviewPrompt={workspace.previewPrompt}
            onPublishGeneratedVersion={workspace.publishGeneratedVersion}
            onPublishVersion={workspace.publishScreenVersion}
            onRegenerateVersion={workspace.regenerateVersion}
            onRevokeShareToken={workspace.revokeShareToken}
            onSaveAsset={workspace.saveAsset}
            onSaveSelectedNode={(id, payload) =>
              workspace.saveDirectory(
                {
                  ...payload,
                  canvasMeta: workspace.layoutMap[id] ?? payload.canvasMeta,
                },
                id,
              )
            }
            onSelectScreen={workspace.setSelectedScreenId}
            onTabChange={setContextTab}
            promptPreview={workspace.promptPreview}
            promptTemplates={workspace.promptTemplates}
            screens={workspace.screens}
            selectedScreenId={workspace.selectedScreenId}
            shareTokens={workspace.shareTokens}
          />
        }
        sidebar={
          <BiSidebarNav
            activeSection={activeSection}
            onChange={(section) => {
              setActiveSection(section);
              if (section !== 'settings') {
                setContextTab(resolveContextTab(section));
              }
            }}
          />
        }
        toolbar={
          <BiTopToolbar
            canPublish={Boolean(workspace.selectedScreen && publishVersionId)}
            isMutating={workspace.isMutating}
            nodePath={workspace.selectedNodePath.map((node) => node.nodeName)}
            onOpenHistory={() => {
              setActiveSection('ai');
              setContextTab('prompt');
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

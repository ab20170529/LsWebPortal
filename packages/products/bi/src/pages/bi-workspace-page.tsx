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
import type { BiDirectoryNode, BiNodeType, BiScreen } from '../types';
import { flattenDirectoryNodes } from '../utils/bi-directory';
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

function resolvePreviewTarget(screen: BiScreen | null) {
  if (!screen) {
    return null;
  }

  const versionId = resolveLatestVersionId(screen.versions ?? []);
  if (!versionId) {
    return null;
  }

  return {
    screen,
    versionId,
  };
}

export function BiWorkspacePage() {
  const initialView = useMemo(() => readBiWorkspaceViewState(window.location.search), []);
  const [activeSection, setActiveSection] = useState<BiWorkspaceSection>(initialView.section);
  const [activeArchiveTab, setActiveArchiveTab] = useState<BiArchiveTab>(initialView.tab);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [createPresetType, setCreatePresetType] = useState<'EXTERNAL' | 'INTERNAL' | null>(null);
  const [canvasFocusRequest, setCanvasFocusRequest] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const workspace = useBiWorkspace({
    initialSelectedNodeId: initialView.nodeId,
    initialSelectedScreenId: initialView.screenId,
  });

  const selectedNodeScreens = useMemo(() => {
    const selectedNodeId = workspace.selectedNode?.id ?? null;
    return selectedNodeId == null
      ? []
      : workspace.allScreens.filter((screen) => screen.nodeId === selectedNodeId);
  }, [workspace.allScreens, workspace.selectedNode?.id]);

  const previewState = useMemo(() => {
    const selectedScreenTarget = resolvePreviewTarget(workspace.selectedScreen);
    if (selectedScreenTarget) {
      return {
        canPreview: true,
        href: `/bi/screen/${selectedScreenTarget.screen.screenCode}?previewVersionId=${selectedScreenTarget.versionId}`,
        statusText: null,
      };
    }

    const nodeScreenTarget =
      selectedNodeScreens
        .map((screen) => resolvePreviewTarget(screen))
        .find((target): target is NonNullable<typeof target> => Boolean(target)) ?? null;
    if (nodeScreenTarget) {
      return {
        canPreview: true,
        href: `/bi/screen/${nodeScreenTarget.screen.screenCode}?previewVersionId=${nodeScreenTarget.versionId}`,
        statusText: null,
      };
    }

    if (!workspace.selectedNode) {
      return {
        canPreview: false,
        href: '',
        statusText: null,
      };
    }

    if (selectedNodeScreens.length === 0) {
      return {
        canPreview: false,
        href: '',
        statusText: '当前节点还没有 BI 档案，请先创建档案后再预览。',
      };
    }

    return {
      canPreview: false,
      href: '',
      statusText: '当前节点下的 BI 档案还没有任何版本，请先保存一个版本后再预览。',
    };
  }, [selectedNodeScreens, workspace.selectedNode, workspace.selectedScreen]);

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

  const deleteState = useMemo(() => {
    const targetNode = workspace.selectedNode;
    if (!targetNode) {
      return {
        canDelete: false,
        hint: '请先选择一个节点。子节点在当前节点及所有下级节点都没有 BI 档案时可删除；根节点则需要先清空为“空根节点”。',
      };
    }

    if (targetNode.id < 0) {
      return {
        canDelete: false,
        hint: '新建中的节点需要先保存成功，随后才可以删除。',
      };
    }

    const subtreeNodeIds = new Set(flattenDirectoryNodes([targetNode]).map((node) => node.id));
    const blockingCount = workspace.allScreens.filter((screen) => subtreeNodeIds.has(screen.nodeId)).length;
    if (blockingCount > 0) {
      return {
        canDelete: false,
        hint: `当前节点及下级节点下还有 ${blockingCount} 个 BI 档案，先处理完它们后才可以删除。`,
      };
    }

    if (targetNode.parentId == null && targetNode.children.length > 0) {
      return {
        canDelete: false,
        hint: '当前节点是根节点，但下面还有子节点。只有没有子节点、没有 BI 档案的空根节点才可以删除。',
      };
    }

    if (targetNode.parentId == null) {
      return {
        canDelete: true,
        hint: '当前节点是空根节点，没有子节点、没有 BI 档案，可以删除。删除后会回到空白画布或其他根节点。',
      };
    }

    return {
      canDelete: true,
      hint: '当前节点及所有下级节点都没有 BI 档案，可以删除。删除后不可撤销。',
    };
  }, [workspace.allScreens, workspace.selectedNode]);

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

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  async function createNode(parent?: typeof workspace.selectedNode) {
    const parentNode = parent ?? null;
    const suffix = String(Date.now()).slice(-4);
    const nodeType = parentNode
      ? resolveChildNodeType(parentNode.nodeType, workspace.nodeTypes)
      : resolveRootNodeType(workspace.nodeTypes);
    const baseCode =
      slugifyCode(parentNode?.nodeCode || parentNode?.nodeName || nodeType || 'bi_root') || 'bi_root';
    const nodeCode = `${baseCode}_${suffix}`;

    const created = await workspace.saveDirectory({
      nodeCode,
      nodeName: buildDefaultNodeName(nodeType, workspace.nodeTypes),
      nodeType,
      parentId: parentNode?.id ?? null,
      status: 'ACTIVE',
    });
    if (created && typeof created === 'object' && 'id' in created) {
      workspace.setSelectedNodeId(Number(created.id));
    }
    setCanvasFocusRequest((request) => request + 1);
    setToastMessage('节点已新增，并已定位到画布位置。');
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

  function handleEditNode(targetNode: BiDirectoryNode | null = workspace.selectedNode) {
    if (!targetNode || targetNode.id < 0) {
      return;
    }

    const nextNodeName = window.prompt('请输入节点名称', targetNode.nodeName)?.trim();
    if (nextNodeName == null) {
      return;
    }
    if (!nextNodeName) {
      window.alert('节点名称不能为空。');
      return;
    }

    const nextNodeCodeInput = window.prompt('请输入节点编码', targetNode.nodeCode)?.trim();
    if (nextNodeCodeInput == null) {
      return;
    }

    const nextNodeCode = slugifyCode(nextNodeCodeInput);
    if (!nextNodeCode) {
      window.alert('节点编码不能为空，且需包含字母或数字。');
      return;
    }

    void workspace
      .saveDirectory(
        {
          canvasMeta: workspace.layoutMap[targetNode.id] ?? targetNode.canvasMeta ?? undefined,
          nodeCode: nextNodeCode,
          nodeName: nextNodeName,
          nodeType: targetNode.nodeType,
          orderNo: targetNode.orderNo ?? 0,
          parentId: targetNode.parentId ?? null,
          status: targetNode.status ?? 'ACTIVE',
        },
        targetNode.id,
      )
      .then(() => {
        workspace.setSelectedNodeId(targetNode.id);
        setToastMessage('节点内容已更新。');
      })
      .catch(() => undefined);
  }

  function handleDeleteNode(targetNode: BiDirectoryNode | null = workspace.selectedNode) {
    workspace.clearError();
    if (!targetNode || targetNode.id < 0) {
      return;
    }

    if (targetNode.parentId == null && targetNode.children.length > 0) {
      window.alert('根节点下还有子节点。只有没有子节点、没有 BI 档案的空根节点才可以删除。');
      return;
    }

    const subtreeNodeIds = new Set(flattenDirectoryNodes([targetNode]).map((node) => node.id));
    const blockingScreens = workspace.allScreens.filter((screen) => subtreeNodeIds.has(screen.nodeId));
    if (blockingScreens.length > 0) {
      const shouldOpenArchives = window.confirm(
        `节点“${targetNode.nodeName}”分支下还有 ${blockingScreens.length} 个 BI 档案，不能直接删除。\n\n请先到“管理 BI 档案”处理相关档案。是否现在前往处理？`,
      );
      if (shouldOpenArchives) {
        const firstScreen = blockingScreens[0]!;
        workspace.setSelectedNodeId(firstScreen.nodeId);
        workspace.setSelectedScreenId(firstScreen.id);
        setCreatePresetType(null);
        openArchiveTab('base');
      }
      return;
    }

    const childWarning =
      targetNode.children.length > 0
        ? '\n\n该操作会同时删除它的下级节点，且不可撤销。'
        : '\n\n该操作不可撤销。';
    const confirmed = window.confirm(
      `确定删除节点“${targetNode.nodeName}”？${childWarning}`,
    );
    if (!confirmed) {
      return;
    }

    const fallbackNodeName =
      workspace.flatNodes.find((node) => !subtreeNodeIds.has(node.id))?.nodeName ?? '空白画布';
    void workspace.deleteDirectory(targetNode.id)
      .then(() => {
        setCanvasFocusRequest((request) => request + 1);
        setToastMessage(`节点已删除，已回到${fallbackNodeName}。`);
      })
      .catch(() => undefined);
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
      {toastMessage ? <div className="bi-workspace-toast">{toastMessage}</div> : null}

      <BiWorkspaceShell
        canvas={
          activeSection === 'canvas' ? (
            <BiDirectoryCanvas
              archiveCountByNodeId={archiveCountByNodeId}
              assetCount={workspace.metrics.assetCount}
              focusRequest={canvasFocusRequest}
              layoutMap={workspace.layoutMap}
              maxLevel={maxLevel}
              nodes={workspace.nodes}
              onDeleteNode={handleDeleteNode}
              onDesignInternalArchive={(node) => {
                void handleDesignInternalArchive(node);
              }}
              onEditNode={handleEditNode}
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
                void workspace.saveCanvasLayout()
                  .then(() => setToastMessage('布局已保存。'))
                  .catch(() => undefined);
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
        contextCollapsed={contextCollapsed}
        contextPanel={
          <BiNodeContextPanel
            activeArchiveTab={activeArchiveTab}
            activeSection={activeSection}
            canDeleteNode={deleteState.canDelete}
            deleteHint={deleteState.hint}
            node={workspace.selectedNode}
            onDeleteNode={() => handleDeleteNode()}
            onEditNode={() => handleEditNode()}
            onOpenArchiveTab={openArchiveTab}
            onOpenSection={openSection}
            onQuickCreateExternalArchive={handleCreateExternalArchive}
            onQuickDesignInternalArchive={() => {
              void handleDesignInternalArchive();
            }}
            screens={workspace.screens}
          />
        }
        onToggleContext={() => setContextCollapsed((collapsed) => !collapsed)}
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
            canPreview={previewState.canPreview}
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
              if (!previewState.href) {
                setToastMessage(previewState.statusText ?? '请先选择节点，并确保当前已有可预览内容。');
                return;
              }
              window.open(previewState.href, '_blank', 'noopener,noreferrer');
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
            previewStatusText={previewState.statusText}
            screenName={workspace.selectedScreen?.name ?? workspace.selectedNode?.nodeName ?? null}
          />
        }
      />
    </div>
  );
}

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import type {
  DataAssetFieldSavePayload,
  DataAssetSavePayload,
  DatasourceSavePayload,
  DesignMessageSendPayload,
  DesignSessionCreatePayload,
  ScreenSavePayload,
  ScreenVersionSavePayload,
} from '../api/bi-api';
import { BoxIcon, BotIcon, DatabaseIcon, FolderIcon, LogoutIcon, PlusIcon } from '../components/workspace/bi-icons';
import { useBiWorkspace } from '../hooks/use-bi-workspace';
import type {
  BiDataAsset,
  BiDataAssetField,
  BiDatasource,
  BiDesignSession,
  BiDirectoryNode,
  BiGenerationTask,
  BiNodeType,
  BiPromptPreview,
  BiPromptTemplate,
  BiScreen,
  BiScreenDesignRecord,
  BiScreenVersion,
} from '../types';
import {
  collectAllowedTables,
  collectFieldCoverage,
  flattenDirectoryNodes,
  formatDateTime,
  getAssetTypeLabel,
  getGenerationStatusLabel,
  getNodeTypeLabel,
  getPublishedVersionId,
  getScreenDesignStatusLabel,
  getStatusLabel,
} from '../utils/bi-directory';
import {
  buildBiWorkspaceViewSearch,
  readBiWorkspaceViewState,
  type BiArchiveTab,
  type BiWorkspaceSection,
} from '../utils/bi-workspace-view-state';
import {
  getBiScreenBackground,
  getBiScreenBackgroundLabel,
  getBiScreenBackgroundStyle,
  mergeBiScreenBackground,
  type BiScreenBackground,
} from '../utils/bi-screen-background';
import { getBiGridTemplateStyle, getBiModuleGridItemStyle } from '../utils/bi-screen-layout';
import { buildBiPublicScreenPath } from '../utils/bi-public-runtime';

type ExactSection = Extract<BiWorkspaceSection, 'archives' | 'canvas' | 'sources'>;

type StageMeta = {
  breadcrumb: string[];
  no: '1' | '2' | '3';
  title: string;
};

type NavItem = {
  icon: typeof FolderIcon;
  label: string;
  section: ExactSection;
};

type ToastState = string | null;
type BiWorkspaceExactPageProps = {
  onExitSystem?: () => void;
};
type NodeEditorState = { id: number; nodeCode: string; nodeName: string } | null;
type NodePortalMode = 'ARCHIVE' | 'EXTERNAL';
type NodeExternalLinkDraft = {
  name: string;
  openMode: string;
  targetUrl: string;
};
type AiWorkbenchTab = 'context' | 'chat' | 'background' | 'versions';
type ChatReferenceImage = NonNullable<DesignMessageSendPayload['referenceImages']>[number];
type PendingChatMessage = { content: string; referenceImages: ChatReferenceImage[] } | null;
type ChatGenerationPhase = 'creating' | 'thinking' | 'drafting' | null;
type DatasourceDraft = {
  businessScope: string;
  dataScope: string;
  description: string;
  name: string;
  sourceCode: string;
  status: string;
};
type AssetDraft = {
  assetCode: string;
  assetName: string;
  assetType: 'SQL' | 'TABLE';
  comment: string;
  sourceTablesText: string;
  sqlText: string;
  tableName: string;
  tableSchema: string;
};

const DEFAULT_PROMPT = '请基于当前节点绑定的分析源资产，生成一份可用于经营分析的 BI 设计草稿。';
const MAX_CHAT_REFERENCE_IMAGES = 6;
const MAX_CHAT_REFERENCE_IMAGE_EDGE = 1280;
const MAX_SCREEN_BACKGROUND_IMAGE_EDGE = 1920;

const NAV_ITEMS: NavItem[] = [
  { icon: FolderIcon, label: '组织管理', section: 'canvas' },
  { icon: BoxIcon, label: '数据源', section: 'sources' },
  { icon: BotIcon, label: 'BI设计', section: 'archives' },
];

function resolveStageMeta(section: ExactSection): StageMeta {
  if (section === 'sources') {
    return {
      breadcrumb: ['首页', '组织管理', '节点数据源管理'],
      no: '2',
      title: '节点数据源管理',
    };
  }
  if (section === 'archives') {
    return {
      breadcrumb: ['首页', 'BI设计', '内置BI AI设计管理'],
      no: '3',
      title: '内置BI AI设计管理',
    };
  }
  return {
    breadcrumb: ['首页', '组织管理', '组织节点管理'],
    no: '1',
    title: '组织节点管理',
  };
}

function asExactSection(section: BiWorkspaceSection): ExactSection {
  return section === 'sources' || section === 'archives' ? section : 'canvas';
}

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const EXTERNAL_LINK_SANDBOX_POLICY = 'allow-same-origin allow-scripts allow-forms';

function normalizeScreenBiType(screen: BiScreen): 'EXTERNAL' | 'INTERNAL' {
  return screen.biType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL';
}

function readScreenExternalConfig(screen: BiScreen | null): Record<string, unknown> {
  return resolveVersion(screen)?.externalConfig ?? {};
}

function buildDefaultExternalLinkDraft(
  node: BiDirectoryNode | null,
  screen: BiScreen | null = null,
): NodeExternalLinkDraft {
  const externalConfig = readScreenExternalConfig(screen);
  return {
    name: screen?.name ?? (node ? `${node.nodeName}外链BI` : '外链BI'),
    openMode: typeof externalConfig.openMode === 'string' ? externalConfig.openMode : 'iframe',
    targetUrl: typeof externalConfig.targetUrl === 'string' ? externalConfig.targetUrl : '',
  };
}

function buildArchiveNodeBindPayload(screen: BiScreen, nodeId: number): ScreenSavePayload {
  return {
    accessMode: screen.accessMode ?? 'LOGIN_REQUIRED',
    biType: normalizeScreenBiType(screen),
    designBrief: screen.designBrief ?? undefined,
    designMeta: screen.designMeta ?? undefined,
    latestDesignPrompt: screen.latestDesignPrompt ?? undefined,
    name: screen.name,
    nodeId,
    screenCode: screen.screenCode,
  };
}

function buildUniqueNodeExternalScreenCode(node: BiDirectoryNode, screens: BiScreen[]) {
  const baseCode = `${slugifyCode(node.nodeCode || node.nodeName) || 'bi_node'}_external`;
  if (!screens.some((screen) => screen.screenCode === baseCode)) {
    return baseCode;
  }
  return `${baseCode}_${String(Date.now()).slice(-6)}`;
}

function buildNodeExternalLinkPayload(
  node: BiDirectoryNode,
  draft: NodeExternalLinkDraft,
  screen: BiScreen | null,
  screens: BiScreen[],
): ScreenSavePayload {
  const name = draft.name.trim() || `${node.nodeName}外链BI`;
  return {
    accessMode: screen?.accessMode ?? 'LOGIN_REQUIRED',
    biType: 'EXTERNAL',
    designBrief: screen?.designBrief ?? {
      businessNote: '',
      designNote: '组织节点外链地址',
    },
    designMeta: screen?.designMeta ?? {},
    latestDesignPrompt: screen?.latestDesignPrompt ?? undefined,
    name,
    nodeId: node.id,
    screenCode: screen?.screenCode ?? buildUniqueNodeExternalScreenCode(node, screens),
    versionDraft: {
      externalConfig: {
        allowFullscreen: true,
        openMode: draft.openMode.trim() || 'iframe',
        queryParamMapping: {},
        sandboxPolicy: EXTERNAL_LINK_SANDBOX_POLICY,
        targetUrl: draft.targetUrl.trim(),
        title: name,
      },
      filters: [],
      publishNow: true,
      theme: 'external',
    },
  };
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10}KB`;
  }
  return `${Math.round(size / 1024 / 102.4) / 10}MB`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string, mimeType: string, maxEdge: number) {
  return new Promise<{ dataUrl: string; mimeType: string }>((resolve) => {
    if (!mimeType.startsWith('image/') || mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
      resolve({ dataUrl, mimeType });
      return;
    }
    const image = new Image();
    image.onload = () => {
      const edge = Math.max(image.width, image.height);
      const scale = edge > maxEdge ? maxEdge / edge : 1;
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        resolve({ dataUrl, mimeType });
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.78), mimeType: 'image/jpeg' });
    };
    image.onerror = () => resolve({ dataUrl, mimeType });
    image.src = dataUrl;
  });
}

async function buildChatReferenceImage(file: File): Promise<ChatReferenceImage> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const compressed = await compressImage(rawDataUrl, file.type || 'image/*', MAX_CHAT_REFERENCE_IMAGE_EDGE);
  return {
    dataUrl: compressed.dataUrl,
    mimeType: compressed.mimeType,
    name: file.name,
    size: file.size,
  };
}

async function buildUploadedScreenBackground(file: File): Promise<BiScreenBackground> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const compressed = await compressImage(rawDataUrl, file.type || 'image/*', MAX_SCREEN_BACKGROUND_IMAGE_EDGE);
  return {
    description: file.name,
    fit: 'cover',
    imageUrl: compressed.dataUrl,
    overlay: 'linear-gradient(180deg, rgba(2,7,17,0.12), rgba(2,7,17,0.44))',
    position: 'center',
    source: 'upload',
    type: 'image',
  };
}

function readChatReferenceImages(meta: Record<string, unknown> | null | undefined) {
  const images = meta?.referenceImages;
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .map((image) => {
      if (!image || typeof image !== 'object') {
        return null;
      }
      const payload = image as Partial<ChatReferenceImage>;
      if (!payload.dataUrl || !payload.name) {
        return null;
      }
      return {
        dataUrl: payload.dataUrl,
        mimeType: payload.mimeType ?? 'image/*',
        name: payload.name,
        size: Number(payload.size ?? 0),
      };
    })
    .filter((image): image is ChatReferenceImage => Boolean(image));
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

function buildVersionBackgroundSavePayload(
  version: BiScreenVersion,
  background: BiScreenBackground,
): ScreenVersionSavePayload {
  return {
    externalConfig: version.externalConfig ?? {},
    filters: version.filters ?? [],
    id: version.id,
    moduleLayout: version.moduleLayout ?? { type: 'grid' },
    modules: version.modules.map((module) => ({
      layout: module.layout ?? {},
      moduleCode: module.moduleCode,
      moduleName: module.moduleName,
      moduleType: module.moduleType,
      query: module.sqlText
        ? {
            cacheSeconds: module.cacheSeconds ?? 60,
            params: module.params ?? [],
            resultFields: module.resultFields ?? [],
            sqlText: module.sqlText,
          }
        : undefined,
      sortNo: module.sortNo ?? undefined,
      style: module.style ?? {},
    })),
    pageSchema: mergeBiScreenBackground(version.pageSchema ?? {}, background),
    publishNow: false,
    theme: version.theme ?? 'enterprise',
  };
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

function getStatusTone(status?: string | null) {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'PUBLISHED' || normalized === 'GENERATED') {
    return 'success';
  }
  if (normalized === 'FAILED' || normalized === 'DISABLED') {
    return 'danger';
  }
  if (normalized === 'DRAFT' || normalized === 'DRAFT_CREATED') {
    return 'warning';
  }
  return 'muted';
}

function getAssetCoverage(asset: BiDataAsset | null) {
  if (!asset || asset.fields.length === 0) {
    return {
      documented: 0,
      percent: 0,
      total: 0,
    };
  }

  const documented = asset.fields.filter((field) =>
    Boolean(field.bizComment?.trim() || field.fieldLabel?.trim() || field.dbComment?.trim()),
  ).length;
  return {
    documented,
    percent: Math.round((documented / asset.fields.length) * 100),
    total: asset.fields.length,
  };
}

function buildAssetPayload(asset: BiDataAsset): DataAssetSavePayload {
  const base = {
    assetName: asset.assetName,
    assetType: asset.assetType === 'SQL' ? 'SQL' : 'TABLE',
    sortNo: Number(asset.sortNo ?? 0),
    status: asset.status ?? 'ACTIVE',
    ...(asset.assetCode ? { assetCode: asset.assetCode } : {}),
    ...(asset.comment ? { comment: asset.comment } : {}),
  } satisfies DataAssetSavePayload;

  if (asset.assetType === 'SQL') {
    return {
      ...base,
      sourceTables: asset.sourceTables,
      sqlText: asset.sqlText ?? '',
    };
  }

  return {
    ...base,
    tableName: asset.tableName ?? '',
    tableSchema: asset.tableSchema ?? 'dbo',
  };
}

function buildFieldDrafts(fields: BiDataAssetField[]): DataAssetFieldSavePayload[] {
  return fields.map((field, index) => ({
    bizComment: field.bizComment ?? '',
    dbComment: field.dbComment ?? '',
    exampleValue: field.exampleValue ?? '',
    fieldLabel: field.fieldLabel ?? '',
    fieldName: field.fieldName,
    fieldOrigin: field.fieldOrigin ?? '',
    fieldType: field.fieldType ?? '',
    isNullable: field.isNullable ?? true,
    sortNo: Number(field.sortNo ?? index),
  }));
}

function buildFieldPayloads(fields: DataAssetFieldSavePayload[]): DataAssetFieldSavePayload[] {
  return fields
    .map((field, index) => ({
      fieldName: field.fieldName.trim(),
      isNullable: field.isNullable ?? true,
      sortNo: Number(field.sortNo ?? index),
      ...(field.bizComment?.trim() ? { bizComment: field.bizComment.trim() } : {}),
      ...(field.dbComment?.trim() ? { dbComment: field.dbComment.trim() } : {}),
      ...(field.exampleValue?.trim() ? { exampleValue: field.exampleValue.trim() } : {}),
      ...(field.fieldLabel?.trim() ? { fieldLabel: field.fieldLabel.trim() } : {}),
      ...(field.fieldOrigin?.trim() ? { fieldOrigin: field.fieldOrigin.trim() } : {}),
      ...(field.fieldType?.trim() ? { fieldType: field.fieldType.trim() } : {}),
    }))
    .filter((field) => field.fieldName);
}

function emptyDatasourceDraft(): DatasourceDraft {
  return {
    businessScope: '',
    dataScope: 'CURRENT_DATASOURCE',
    description: '',
    name: '',
    sourceCode: '',
    status: 'ACTIVE',
  };
}

function emptyAssetDraft(): AssetDraft {
  return {
    assetCode: '',
    assetName: '',
    assetType: 'TABLE',
    comment: '',
    sourceTablesText: '',
    sqlText: '',
    tableName: '',
    tableSchema: 'dbo',
  };
}

function buildDatasourceDraftPayload(draft: DatasourceDraft): DatasourceSavePayload {
  return {
    businessScope: draft.businessScope.trim() || undefined,
    dataScope: draft.dataScope.trim() || 'CURRENT_DATASOURCE',
    description: draft.description.trim() || undefined,
    name: draft.name.trim(),
    sourceCode: slugifyCode(draft.sourceCode) || draft.sourceCode.trim(),
    status: draft.status.trim() || 'ACTIVE',
  };
}

function splitSourceTables(value: string) {
  return value
    .split(/[\n,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildAssetDraftPayload(draft: AssetDraft): DataAssetSavePayload {
  const base = {
    assetName: draft.assetName.trim(),
    assetType: draft.assetType,
    comment: draft.comment.trim() || undefined,
    status: 'ACTIVE',
    ...(draft.assetCode.trim() ? { assetCode: slugifyCode(draft.assetCode) || draft.assetCode.trim() } : {}),
  } satisfies DataAssetSavePayload;

  if (draft.assetType === 'SQL') {
    return {
      ...base,
      sourceTables: splitSourceTables(draft.sourceTablesText),
      sqlText: draft.sqlText.trim(),
    };
  }

  return {
    ...base,
    tableName: draft.tableName.trim(),
    tableSchema: draft.tableSchema.trim() || 'dbo',
  };
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function statusClass(tone: 'danger' | 'info' | 'muted' | 'success' | 'warning') {
  return `bi-exact-status is-${tone}`;
}

export function BiWorkspaceExactPage({ onExitSystem }: BiWorkspaceExactPageProps = {}) {
  const initialView = useMemo(() => readBiWorkspaceViewState(window.location.search), []);
  const [activeSection, setActiveSection] = useState<ExactSection>(asExactSection(initialView.section));
  const [activeArchiveTab, setActiveArchiveTab] = useState<BiArchiveTab>(initialView.tab);
  const [toastMessage, setToastMessage] = useState<ToastState>(null);
  const [nodeEditor, setNodeEditor] = useState<NodeEditorState>(null);
  const workspace = useBiWorkspace({
    enableDesignSessions: true,
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

  const deleteState = useMemo(() => {
    const targetNode = workspace.selectedNode;
    if (!targetNode) {
      return {
        canDelete: false,
        hint: '请先选择一个节点。',
      };
    }

    if (targetNode.id < 0) {
      return {
        canDelete: false,
        hint: '新建中的节点需要先保存成功。',
      };
    }

    const subtreeNodeIds = new Set(flattenDirectoryNodes([targetNode]).map((node) => node.id));
    const blockingCount = workspace.allScreens.filter((screen) => screen.nodeId != null && subtreeNodeIds.has(screen.nodeId)).length;
    if (blockingCount > 0) {
      return {
        canDelete: false,
        hint: `当前节点及下级节点还有 ${blockingCount} 个 BI 档案。`,
      };
    }

    if (targetNode.parentId == null && targetNode.children.length > 0) {
      return {
        canDelete: false,
        hint: '当前根节点下面还有子节点。',
      };
    }

    return {
      canDelete: true,
      hint: '当前节点可删除。',
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
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    setNodeEditor(null);
  }, [workspace.selectedNode?.id]);

  function openSection(section: ExactSection) {
    setActiveSection(section);
    if (section === 'archives') {
      setActiveArchiveTab('design');
    }
  }

  function openArchiveTab(tab: BiArchiveTab) {
    setActiveArchiveTab(tab);
    setActiveSection('archives');
  }

  async function createNode(parent?: BiDirectoryNode | null) {
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
    setToastMessage('节点已新增。');
  }

  function startEditNode(targetNode: BiDirectoryNode | null = workspace.selectedNode) {
    if (!targetNode || targetNode.id < 0) {
      return;
    }

    setNodeEditor({
      id: targetNode.id,
      nodeCode: targetNode.nodeCode,
      nodeName: targetNode.nodeName,
    });
  }

  function cancelEditNode() {
    workspace.clearError();
    setNodeEditor(null);
  }

  async function saveNodeEdit(targetNode: BiDirectoryNode | null = workspace.selectedNode) {
    workspace.clearError();
    if (!targetNode || targetNode.id < 0 || !nodeEditor || nodeEditor.id !== targetNode.id) {
      return;
    }

    const nextNodeName = nodeEditor.nodeName.trim();
    if (!nextNodeName) {
      setToastMessage('节点名称不能为空。');
      return;
    }

    const nextNodeCode = slugifyCode(nodeEditor.nodeCode);
    if (!nextNodeCode) {
      setToastMessage('节点编码不能为空。');
      return;
    }

    try {
      await workspace.saveDirectory(
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
      );
      workspace.setSelectedNodeId(targetNode.id);
      setNodeEditor(null);
      setToastMessage('节点内容已更新。');
    } catch {
      // useBiWorkspace has already surfaced the mutation error.
    }
  }

  function handleDeleteNode(targetNode: BiDirectoryNode | null = workspace.selectedNode) {
    workspace.clearError();
    if (!targetNode || targetNode.id < 0) {
      return;
    }

    const subtreeNodeIds = new Set(flattenDirectoryNodes([targetNode]).map((node) => node.id));
    const blockingScreens = workspace.allScreens.filter((screen) => screen.nodeId != null && subtreeNodeIds.has(screen.nodeId));
    if (blockingScreens.length > 0) {
      const shouldOpenArchives = window.confirm(
        `节点“${targetNode.nodeName}”分支下还有 ${blockingScreens.length} 个 BI 档案，不能直接删除。\n\n是否现在前往处理？`,
      );
      if (shouldOpenArchives) {
        const firstScreen = blockingScreens[0]!;
        workspace.setSelectedNodeId(firstScreen.nodeId);
        workspace.setSelectedScreenId(firstScreen.id);
        openArchiveTab('base');
      }
      return;
    }

    const confirmed = window.confirm(`确定删除节点“${targetNode.nodeName}”？该操作不可撤销。`);
    if (!confirmed) {
      return;
    }

    void workspace.deleteDirectory(targetNode.id)
      .then(() => setToastMessage('节点已删除。'))
      .catch(() => undefined);
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
      workspace.setSelectedScreenId(Number(created.id));
    }
    openArchiveTab('design');
  }

  async function handleBindArchiveToNode(screen: BiScreen) {
    const targetNode = workspace.selectedNode;
    if (!targetNode) {
      setToastMessage('请先选择组织节点。');
      return;
    }
    try {
      await workspace.updateScreen(screen.id, buildArchiveNodeBindPayload(screen, targetNode.id));
      workspace.setSelectedNodeId(targetNode.id);
      workspace.setSelectedScreenId(screen.id);
      setToastMessage('BI 档案已绑定到当前节点。');
    } catch {
      // useBiWorkspace has already surfaced the mutation error.
    }
  }

  async function handleSaveNodeExternalLink(draft: NodeExternalLinkDraft) {
    const targetNode = workspace.selectedNode;
    if (!targetNode) {
      setToastMessage('请先选择组织节点。');
      return;
    }
    if (!draft.targetUrl.trim()) {
      setToastMessage('请填写外链地址。');
      return;
    }

    const existingExternalScreen =
      workspace.allScreens.find((screen) => screen.nodeId === targetNode.id && screen.biType === 'EXTERNAL') ?? null;
    const payload = buildNodeExternalLinkPayload(targetNode, draft, existingExternalScreen, workspace.allScreens);
    try {
      const saved = existingExternalScreen
        ? await workspace.updateScreen(existingExternalScreen.id, payload)
        : await workspace.createScreen(payload);
      const nextScreenId =
        saved && typeof saved === 'object' && 'id' in saved ? Number(saved.id) : existingExternalScreen?.id ?? null;
      workspace.setSelectedNodeId(targetNode.id);
      if (nextScreenId) {
        workspace.setSelectedScreenId(nextScreenId);
      }
      setToastMessage('外链地址已保存到当前节点。');
    } catch {
      // useBiWorkspace has already surfaced the mutation error.
    }
  }

  function handleOpenPreview() {
    if (!previewState.href) {
      setToastMessage(previewState.statusText ?? '请先选择可预览内容。');
      return;
    }
    window.open(previewState.href, '_blank', 'noopener,noreferrer');
  }

  if (workspace.isLoading && workspace.nodes.length === 0) {
    return (
      <div className="bi-exact-loading">
        <div className="bi-exact-loading-card">
          <strong>正在加载 BI 设计平台...</strong>
          <span>正在同步目录树、分析源资产、BI 档案以及设计上下文。</span>
        </div>
      </div>
    );
  }

  const stageMeta = resolveStageMeta(activeSection);

  return (
    <div className="bi-exact-workbench">
      {workspace.error ? <div className="bi-exact-error">{workspace.error}</div> : null}
      {toastMessage ? <div className="bi-exact-toast">{toastMessage}</div> : null}
      <ExactSidebar activeSection={activeSection} onChange={openSection} />
      <main className="bi-exact-main">
        <ExactTopbar
          isMutating={workspace.isMutating}
          meta={stageMeta}
          onDesign={() => {
            void handleDesignInternalArchive();
          }}
          onExitSystem={onExitSystem}
        />
        {activeSection === 'canvas' ? (
          <ExactOrganizationStage
            canDeleteNode={deleteState.canDelete}
            isMutating={workspace.isMutating}
            node={workspace.selectedNode}
            nodeEditor={nodeEditor}
            nodes={workspace.nodes}
            onAddChild={() => {
              if (workspace.selectedNode) {
                void createNode(workspace.selectedNode);
              }
            }}
            onAddRoot={() => {
              void createNode();
            }}
            onBindArchiveToNode={(screen) => {
              void handleBindArchiveToNode(screen);
            }}
            onBindSource={() => openSection('sources')}
            onDeleteNode={() => handleDeleteNode()}
            onDesignInternal={() => {
              void handleDesignInternalArchive();
            }}
            onCancelNodeEdit={cancelEditNode}
            onChangeNodeCodeDraft={(nodeCode) => {
              setNodeEditor((current) => (current ? { ...current, nodeCode } : current));
            }}
            onChangeNodeNameDraft={(nodeName) => {
              setNodeEditor((current) => (current ? { ...current, nodeName } : current));
            }}
            onEditNode={() => startEditNode()}
            onPreviewNode={handleOpenPreview}
            onSaveNodeEdit={() => {
              void saveNodeEdit();
            }}
            onSaveNodeExternalLink={(draft) => {
              void handleSaveNodeExternalLink(draft);
            }}
            onSaveLayout={() => {
              void workspace.saveCanvasLayout().then(() => setToastMessage('布局已保存。')).catch(() => undefined);
            }}
            onSelectNode={workspace.setSelectedNodeId}
            selectedNodeId={workspace.selectedNodeId}
            screens={workspace.allScreens}
          />
        ) : activeSection === 'sources' ? (
          <ExactDatasourceStage
            datasources={workspace.datasources}
            isMutating={workspace.isMutating}
            node={workspace.selectedNode}
            onBindSourceAssets={workspace.bindNodeSourceAssets}
            onCreateDatasource={workspace.createDatasource}
            onGenerateBizComments={workspace.generateAssetBizComments}
            onReplaceAssetFields={workspace.replaceAssetFields}
            onSaveAsset={workspace.saveAsset}
          />
        ) : (
          <ExactAiStage
            boundDatasources={workspace.boundDatasources}
            datasources={workspace.datasources}
            designRecords={workspace.designRecords}
            designSession={workspace.designSession}
            designSessions={workspace.designSessions}
            generationTask={workspace.generationTask}
            isMutating={workspace.isMutating}
            node={workspace.selectedNode}
            onBindArchiveSourceAssets={workspace.bindArchiveSourceAssetsForExact}
            onCreateInternalScreen={handleDesignInternalArchive}
            onCreateDesignSession={workspace.createDesignSession}
            onPreviewPrompt={workspace.previewPrompt}
            onPublishGeneratedVersion={workspace.publishGeneratedVersion}
            onSaveScreenVersion={workspace.saveScreenVersion}
            onSelectScreen={workspace.setSelectedScreenId}
            onSelectDesignSession={workspace.selectDesignSession}
            onSendDesignMessage={workspace.sendDesignMessage}
            promptPreview={workspace.promptPreview}
            promptTemplates={workspace.promptTemplates}
            screens={workspace.screens}
            selectedScreen={workspace.selectedScreen}
            selectedScreenId={workspace.selectedScreenId}
          />
        )}
      </main>
    </div>
  );
}

function ExactSidebar({
  activeSection,
  onChange,
}: {
  activeSection: ExactSection;
  onChange: (section: ExactSection) => void;
}) {
  return (
    <aside className="bi-exact-sidebar" aria-label="BI 工作台导航">
      <nav className="bi-exact-sidebar-list">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.section === activeSection;
          return (
            <button
              className={active ? 'bi-exact-nav-item is-active' : 'bi-exact-nav-item'}
              key={item.label}
              onClick={() => {
                onChange(item.section);
              }}
              title={item.label}
              type="button"
            >
              <Icon className="bi-exact-nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ExactTopbar({
  isMutating,
  meta,
  onDesign,
  onExitSystem,
}: {
  isMutating: boolean;
  meta: StageMeta;
  onDesign: () => void;
  onExitSystem?: () => void;
}) {
  const searchText =
    meta.no === '1'
      ? '搜索节点名称'
      : meta.no === '2'
        ? '搜索数据源/资产'
        : null;

  return (
    <header className="bi-exact-topbar">
      <div className="bi-exact-title-wrap">
        <span className="bi-exact-title-no">{meta.no}</span>
        <div>
          <h1>{meta.title}</h1>
          <div className="bi-exact-breadcrumb">
            {meta.breadcrumb.map((item, index) => (
              <span key={`${item}-${index}`}>
                {index > 0 ? <i>›</i> : null}
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="bi-exact-stage-tools">
        {searchText ? (
          <div className="bi-exact-top-search">
            <span>{searchText}</span>
            <i>⌕</i>
          </div>
        ) : (
          <button className="bi-exact-top-primary" disabled={isMutating} onClick={onDesign} type="button">
            新建设计任务
          </button>
        )}
        <button className="bi-exact-icon-button" title="刷新" type="button">↻</button>
        {meta.no === '1' ? <button className="bi-exact-icon-button" title="提醒" type="button">♢</button> : null}
        <button className="bi-exact-icon-button" title="更多" type="button">⋮</button>
        {onExitSystem ? (
          <button className="bi-exact-logout-button" onClick={onExitSystem} title="退出登录" type="button">
            <LogoutIcon />
            <span>退出登录</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}

function ExactOrganizationStage({
  canDeleteNode,
  isMutating,
  node,
  nodeEditor,
  nodes,
  onAddChild,
  onAddRoot,
  onBindArchiveToNode,
  onBindSource,
  onCancelNodeEdit,
  onChangeNodeCodeDraft,
  onChangeNodeNameDraft,
  onDeleteNode,
  onDesignInternal,
  onEditNode,
  onPreviewNode,
  onSaveNodeEdit,
  onSaveNodeExternalLink,
  onSaveLayout,
  onSelectNode,
  selectedNodeId,
  screens,
}: {
  canDeleteNode: boolean;
  isMutating: boolean;
  node: BiDirectoryNode | null;
  nodeEditor: NodeEditorState;
  nodes: BiDirectoryNode[];
  onAddChild: () => void;
  onAddRoot: () => void;
  onBindArchiveToNode: (screen: BiScreen) => void;
  onBindSource: () => void;
  onCancelNodeEdit: () => void;
  onChangeNodeCodeDraft: (value: string) => void;
  onChangeNodeNameDraft: (value: string) => void;
  onDeleteNode: () => void;
  onDesignInternal: () => void;
  onEditNode: () => void;
  onPreviewNode: () => void;
  onSaveNodeEdit: () => void;
  onSaveNodeExternalLink: (draft: NodeExternalLinkDraft) => void;
  onSaveLayout: () => void;
  onSelectNode: (nodeId: number) => void;
  selectedNodeId: number | null;
  screens: BiScreen[];
}) {
  return (
    <section className="bi-exact-stage is-org">
      <ExactPanel className="bi-exact-org-tree" title="组织树">
        <div className="bi-exact-search-row is-tree-search">
          <i>⌕</i>
          <span>搜索组织节点</span>
          <b>▿</b>
        </div>
        <div className="bi-exact-tree-list">
          {nodes.length > 0 ? (
            nodes.map((item) => (
              <OrgTreeRow
                depth={0}
                key={item.id}
                node={item}
                onSelectNode={onSelectNode}
                selectedNodeId={selectedNodeId}
              />
            ))
          ) : (
            <ExactEmpty text="暂无组织节点" />
          )}
        </div>
        <button className="bi-exact-outline-wide" onClick={onAddRoot} type="button">
          <PlusIcon />
          新增根节点
        </button>
      </ExactPanel>
      <ExactPanel className="bi-exact-canvas-panel" title="节点画布" toolbar={<CanvasToolbar onAddRoot={onAddRoot} onSaveLayout={onSaveLayout} />}>
        <ExactNodeCanvas
          nodes={nodes}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
        />
      </ExactPanel>
      <ExactNodeDetail
        canDeleteNode={canDeleteNode}
        isMutating={isMutating}
        node={node}
        nodeEditor={nodeEditor}
        onAddChild={onAddChild}
        onBindArchiveToNode={onBindArchiveToNode}
        onBindSource={onBindSource}
        onCancelNodeEdit={onCancelNodeEdit}
        onChangeNodeCodeDraft={onChangeNodeCodeDraft}
        onChangeNodeNameDraft={onChangeNodeNameDraft}
        onDeleteNode={onDeleteNode}
        onDesignInternal={onDesignInternal}
        onEditNode={onEditNode}
        onPreviewNode={onPreviewNode}
        onSaveNodeEdit={onSaveNodeEdit}
        onSaveNodeExternalLink={onSaveNodeExternalLink}
        screens={screens}
      />
    </section>
  );
}

function ExactPanel({
  children,
  className,
  subtitle,
  title,
  toolbar,
}: {
  children: ReactNode;
  className?: string;
  subtitle?: string;
  title: string;
  toolbar?: React.ReactNode;
}) {
  return (
    <section className={className ? `bi-exact-panel ${className}` : 'bi-exact-panel'}>
      <div className="bi-exact-panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {toolbar ?? null}
      </div>
      <div className="bi-exact-panel-body">{children}</div>
    </section>
  );
}

function ExactEmpty({ action, text }: { action?: ReactNode; text: string }) {
  return (
    <div className={action ? 'bi-exact-empty has-action' : 'bi-exact-empty'}>
      <span>{text}</span>
      {action}
    </div>
  );
}

function OrgTreeRow({
  depth,
  node,
  onSelectNode,
  selectedNodeId,
}: {
  depth: number;
  node: BiDirectoryNode;
  onSelectNode: (nodeId: number) => void;
  selectedNodeId: number | null;
}) {
  const selected = selectedNodeId === node.id;
  const hasChildren = node.children.length > 0;
  return (
    <>
      <button
        className={[
          'bi-exact-tree-row',
          selected ? 'is-active' : '',
          hasChildren ? 'has-children' : 'is-leaf',
        ].filter(Boolean).join(' ')}
        onClick={() => onSelectNode(node.id)}
        style={{ paddingLeft: 8 + depth * 14 }}
        type="button"
      >
        <span className={hasChildren ? 'bi-exact-tree-caret is-open' : 'bi-exact-tree-caret'}>{hasChildren ? '⌄' : ''}</span>
        <span className={`bi-exact-node-mini is-${node.nodeType.toLowerCase()}`} />
        <span className="bi-exact-tree-text">
          <strong>{node.nodeName}</strong>
        </span>
      </button>
      {node.children.map((child) => (
        <OrgTreeRow
          depth={depth + 1}
          key={child.id}
          node={child}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </>
  );
}

function CanvasToolbar({ onAddRoot, onSaveLayout }: { onAddRoot: () => void; onSaveLayout: () => void }) {
  return (
    <div className="bi-exact-canvas-toolbar">
      <button title="搜索" type="button">⌕</button>
      <button title="缩小" type="button">⊖</button>
      <span>100%</span>
      <button title="移动" type="button">⌖</button>
      <button title="全屏" type="button">⛶</button>
      <button title="复制" type="button">▣</button>
      <button onClick={onAddRoot} title="新增" type="button">＋</button>
      <button onClick={onSaveLayout} title="保存" type="button">▣</button>
    </div>
  );
}

type CanvasNode = {
  depth: number;
  node: BiDirectoryNode;
  x: number;
  y: number;
};

const CANVAS_NODE_WIDTH = 150;
const CANVAS_NODE_HEIGHT = 70;
const CANVAS_LEAF_GAP = 176;
const CANVAS_LEVEL_GAP = 116;
const CANVAS_PADDING_X = 42;
const CANVAS_PADDING_Y = 36;

function buildCanvasLayout(nodes: BiDirectoryNode[]) {
  const list: CanvasNode[] = [];
  const byId = new Map<number, CanvasNode>();
  let leaf = 0;

  function visit(node: BiDirectoryNode, depth: number): CanvasNode {
    const childItems = node.children.map((child) => visit(child, depth + 1));
    const leafX = leaf * CANVAS_LEAF_GAP;
    if (childItems.length === 0) {
      leaf += 1;
    }
    const item = {
      depth,
      node,
      x:
        childItems.length > 0
          ? childItems.reduce((total, child) => total + child.x, 0) / childItems.length
          : leafX,
      y: depth * CANVAS_LEVEL_GAP,
    };
    list.push(item);
    byId.set(node.id, item);
    return item;
  }

  nodes.forEach((node) => visit(node, 0));

  const minX = list.length > 0 ? Math.min(...list.map((item) => item.x)) : 0;
  list.forEach((item) => {
    item.x = Math.round(item.x - minX + CANVAS_PADDING_X);
    item.y = Math.round(item.y + CANVAS_PADDING_Y);
  });

  return { byId, list };
}

function ExactNodeCanvas({
  nodes,
  onSelectNode,
  selectedNodeId,
}: {
  nodes: BiDirectoryNode[];
  onSelectNode: (nodeId: number) => void;
  selectedNodeId: number | null;
}) {
  const layout = useMemo(() => buildCanvasLayout(nodes), [nodes]);
  const width = Math.max(720, ...layout.list.map((item) => item.x + CANVAS_NODE_WIDTH + CANVAS_PADDING_X));
  const height = Math.max(650, ...layout.list.map((item) => item.y + CANVAS_NODE_HEIGHT + 50));

  if (nodes.length === 0) {
    return <ExactEmpty text="暂无节点" />;
  }

  return (
    <div className="bi-exact-canvas-surface">
      <div className="bi-exact-canvas-map" style={{ height, width }}>
        <svg className="bi-exact-canvas-links" height={height} width={width}>
          {layout.list.map((item) => {
            if (!item.node.parentId) {
              return null;
            }
            const parent = layout.byId.get(item.node.parentId);
            if (!parent) {
              return null;
            }
            const fromX = parent.x + CANVAS_NODE_WIDTH / 2;
            const fromY = parent.y + CANVAS_NODE_HEIGHT;
            const toX = item.x + CANVAS_NODE_WIDTH / 2;
            const toY = item.y - 6;
            const midY = fromY + (toY - fromY) * 0.48;
            return (
              <path
                d={`M${fromX} ${fromY} C${fromX} ${midY} ${toX} ${midY} ${toX} ${toY}`}
                key={`${parent.node.id}-${item.node.id}`}
              />
            );
          })}
        </svg>
        {layout.list.map((item) => (
          <button
            className={item.node.id === selectedNodeId ? 'bi-exact-canvas-node is-active' : 'bi-exact-canvas-node'}
            key={item.node.id}
            onClick={() => onSelectNode(item.node.id)}
            style={{ left: item.x, top: item.y }}
            type="button"
          >
            <span className={`bi-exact-canvas-icon is-${item.node.nodeType.toLowerCase()}`} />
            <strong>{item.node.nodeName}</strong>
            <small>{getNodeTypeLabel(item.node.nodeType, item.node.nodeTypeName)}</small>
            <em>ID: {item.node.nodeCode}</em>
            <i>{getStatusLabel(item.node.status)}</i>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExactNodeDetail({
  canDeleteNode,
  isMutating,
  node,
  nodeEditor,
  onAddChild,
  onBindArchiveToNode,
  onBindSource,
  onCancelNodeEdit,
  onChangeNodeCodeDraft,
  onChangeNodeNameDraft,
  onDeleteNode,
  onDesignInternal,
  onEditNode,
  onPreviewNode,
  onSaveNodeEdit,
  onSaveNodeExternalLink,
  screens,
}: {
  canDeleteNode: boolean;
  isMutating: boolean;
  node: BiDirectoryNode | null;
  nodeEditor: NodeEditorState;
  onAddChild: () => void;
  onBindArchiveToNode: (screen: BiScreen) => void;
  onBindSource: () => void;
  onCancelNodeEdit: () => void;
  onChangeNodeCodeDraft: (value: string) => void;
  onChangeNodeNameDraft: (value: string) => void;
  onDeleteNode: () => void;
  onDesignInternal: () => void;
  onEditNode: () => void;
  onPreviewNode: () => void;
  onSaveNodeEdit: () => void;
  onSaveNodeExternalLink: (draft: NodeExternalLinkDraft) => void;
  screens: BiScreen[];
}) {
  const isEditing = Boolean(node && nodeEditor?.id === node.id);
  const [archiveIdText, setArchiveIdText] = useState('');
  const [externalDraft, setExternalDraft] = useState<NodeExternalLinkDraft>(() => buildDefaultExternalLinkDraft(null));
  const [portalMode, setPortalMode] = useState<NodePortalMode>('ARCHIVE');
  const nodeScreens = useMemo(
    () => (node ? screens.filter((screen) => screen.nodeId === node.id) : []),
    [node, screens],
  );
  const currentExternalScreen = useMemo(
    () => nodeScreens.find((screen) => screen.biType === 'EXTERNAL') ?? null,
    [nodeScreens],
  );
  const selectedArchive = useMemo(
    () => screens.find((screen) => String(screen.id) === archiveIdText) ?? null,
    [archiveIdText, screens],
  );

  useEffect(() => {
    setPortalMode('ARCHIVE');
  }, [node?.id]);

  useEffect(() => {
    if (!node) {
      setArchiveIdText('');
      setExternalDraft(buildDefaultExternalLinkDraft(null));
      return;
    }
    const preferredScreen =
      nodeScreens.find((screen) => screen.biType !== 'EXTERNAL') ??
      nodeScreens[0] ??
      screens.find((screen) => screen.biType !== 'EXTERNAL') ??
      screens[0] ??
      null;
    setArchiveIdText(preferredScreen ? String(preferredScreen.id) : '');
    setExternalDraft(buildDefaultExternalLinkDraft(node, currentExternalScreen));
  }, [currentExternalScreen, node, nodeScreens, screens]);

  return (
    <ExactPanel className="bi-exact-node-detail" title="节点详情" toolbar={<span className="bi-exact-more">•••</span>}>
      {node ? (
        <>
          <div className="bi-exact-detail-card">
            <span className={`bi-exact-detail-icon is-${node.nodeType.toLowerCase()}`} />
            <div>
              <strong>{node.nodeName}</strong>
              <small>{getNodeTypeLabel(node.nodeType, node.nodeTypeName)}</small>
            </div>
            <span className={statusClass(getStatusTone(node.status) as 'danger' | 'muted' | 'success' | 'warning')}>
              {getStatusLabel(node.status)}
            </span>
          </div>
          <div className="bi-exact-detail-list">
            <DetailLine label="ID" value={String(node.id)} />
            <DetailLine label="编码" value={node.nodeCode} />
          </div>
          {isEditing ? (
            <div className="bi-exact-node-editor">
              <label>
                <span>节点名称</span>
                <input
                  aria-label="节点名称"
                  disabled={isMutating}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onChangeNodeNameDraft(event.target.value)}
                  value={nodeEditor?.nodeName ?? ''}
                />
              </label>
              <label>
                <span>节点编码</span>
                <input
                  aria-label="节点编码"
                  disabled={isMutating}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onChangeNodeCodeDraft(event.target.value)}
                  value={nodeEditor?.nodeCode ?? ''}
                />
              </label>
              <div className="bi-exact-editor-actions">
                <button className="bi-exact-primary-button" disabled={isMutating} onClick={onSaveNodeEdit} type="button">
                  保存
                </button>
                <button disabled={isMutating} onClick={onCancelNodeEdit} type="button">
                  取消
                </button>
              </div>
            </div>
          ) : null}
          <h3 className="bi-exact-section-label">节点状态检查</h3>
          <div className="bi-exact-check-list">
            <CheckLine label="基础信息完整性" passed meta={node.nodeCode} />
            <CheckLine label="数据源绑定" meta={`${node.boundAssets.length} 个分析源`} passed={node.boundAssets.length > 0} />
            <CheckLine label="字段覆盖率" meta={`${node.sourceAssetIds.length} 个资产`} passed={node.sourceAssetIds.length > 0} />
          </div>
          <h3 className="bi-exact-section-label">展示入口</h3>
          <div className="bi-exact-node-entry">
            <div className="bi-exact-entry-list">
              {nodeScreens.length > 0 ? (
                nodeScreens.map((screen) => {
                  const externalUrl = String(readScreenExternalConfig(screen).targetUrl ?? '').trim();
                  return (
                    <section key={screen.id}>
                      <div>
                        <strong>{screen.name}</strong>
                        <small>{screen.screenCode}</small>
                      </div>
                      <em>{screen.biType === 'EXTERNAL' ? '外链' : '内置'}</em>
                      {externalUrl ? <small>{externalUrl}</small> : null}
                    </section>
                  );
                })
              ) : (
                <span>暂无绑定档案</span>
              )}
            </div>
            <div className="bi-exact-entry-mode" role="tablist" aria-label="展示入口类型">
              <button
                aria-selected={portalMode === 'ARCHIVE'}
                className={portalMode === 'ARCHIVE' ? 'is-active' : ''}
                onClick={() => setPortalMode('ARCHIVE')}
                role="tab"
                type="button"
              >
                绑定BI档案
              </button>
              <button
                aria-selected={portalMode === 'EXTERNAL'}
                className={portalMode === 'EXTERNAL' ? 'is-active' : ''}
                onClick={() => setPortalMode('EXTERNAL')}
                role="tab"
                type="button"
              >
                外链地址
              </button>
            </div>
            {portalMode === 'ARCHIVE' ? (
              <div className="bi-exact-entry-form">
                <label>
                  <span>BI档案</span>
                  <select
                    aria-label="绑定BI档案"
                    disabled={isMutating || screens.length === 0}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setArchiveIdText(event.target.value)}
                    value={archiveIdText}
                  >
                    <option value="">请选择BI档案</option>
                    {screens.map((screen) => (
                      <option key={screen.id} value={screen.id}>
                        {screen.name} · {screen.biType === 'EXTERNAL' ? '外链' : '内置'}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="bi-exact-primary-button"
                  disabled={isMutating || !selectedArchive}
                  onClick={() => {
                    if (selectedArchive) {
                      onBindArchiveToNode(selectedArchive);
                    }
                  }}
                  type="button"
                >
                  保存档案绑定
                </button>
              </div>
            ) : (
              <div className="bi-exact-entry-form">
                <label>
                  <span>外链名称</span>
                  <input
                    aria-label="外链名称"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setExternalDraft((current) => ({ ...current, name: event.target.value }))}
                    value={externalDraft.name}
                  />
                </label>
                <label>
                  <span>外链地址</span>
                  <input
                    aria-label="外链地址"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setExternalDraft((current) => ({ ...current, targetUrl: event.target.value }))}
                    placeholder="https://"
                    value={externalDraft.targetUrl}
                  />
                </label>
                <label>
                  <span>打开方式</span>
                  <select
                    aria-label="外链打开方式"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setExternalDraft((current) => ({ ...current, openMode: event.target.value }))}
                    value={externalDraft.openMode}
                  >
                    <option value="iframe">内嵌打开</option>
                    <option value="blank">新窗口</option>
                    <option value="self">当前窗口</option>
                  </select>
                </label>
                <button
                  className="bi-exact-primary-button"
                  disabled={isMutating || !externalDraft.targetUrl.trim()}
                  onClick={() => onSaveNodeExternalLink(externalDraft)}
                  type="button"
                >
                  保存外链地址
                </button>
              </div>
            )}
          </div>
          <h3 className="bi-exact-section-label">操作</h3>
          <div className="bi-exact-detail-actions">
            <button className="bi-exact-primary-button" onClick={onAddChild} type="button">新增子节点</button>
            <button onClick={onBindSource} type="button">绑定数据源</button>
            <button onClick={onDesignInternal} type="button">AI设计BI</button>
            <button onClick={onPreviewNode} type="button">预览节点</button>
            <div className="bi-exact-detail-action-split">
              <button disabled={isMutating} onClick={onEditNode} type="button">{isEditing ? '编辑中' : '编辑节点'}</button>
              <button className="is-danger" disabled={!canDeleteNode} onClick={onDeleteNode} type="button">删除节点</button>
            </div>
          </div>
        </>
      ) : (
        <ExactEmpty text="请选择节点" />
      )}
    </ExactPanel>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="bi-exact-detail-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CheckLine({ label, meta, passed }: { label: string; meta: string; passed: boolean }) {
  return (
    <div className="bi-exact-check-line">
      <span className={passed ? 'bi-exact-dot is-success' : 'bi-exact-dot is-warning'} />
      <div>
        <strong>{label}</strong>
        <small>{meta}</small>
      </div>
      <em className={passed ? 'is-success' : 'is-warning'}>{passed ? '通过' : '注意'}</em>
    </div>
  );
}

function ExactDatasourceStage({
  datasources,
  isMutating,
  node,
  onBindSourceAssets,
  onCreateDatasource,
  onGenerateBizComments,
  onReplaceAssetFields,
  onSaveAsset,
}: {
  datasources: BiDatasource[];
  isMutating: boolean;
  node: BiDirectoryNode | null;
  onBindSourceAssets: (nodeId: number, sourceAssetIds: number[]) => Promise<void>;
  onCreateDatasource: (payload: DatasourceSavePayload) => Promise<BiDatasource | void>;
  onGenerateBizComments: (assetId: number) => Promise<BiDataAssetField[]>;
  onReplaceAssetFields: (assetId: number, fields: DataAssetFieldSavePayload[]) => Promise<BiDataAssetField[]>;
  onSaveAsset: (datasourceId: number, payload: DataAssetSavePayload, assetId?: number) => Promise<BiDataAsset>;
}) {
  const [assetDraft, setAssetDraft] = useState<AssetDraft | null>(null);
  const [bindingIds, setBindingIds] = useState<number[]>([]);
  const [datasourceDraft, setDatasourceDraft] = useState<DatasourceDraft | null>(null);
  const [fieldDrafts, setFieldDrafts] = useState<DataAssetFieldSavePayload[]>([]);
  const [selectedDatasourceId, setSelectedDatasourceId] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  useEffect(() => {
    setBindingIds(node?.sourceAssetIds ?? []);
  }, [node?.id, node?.sourceAssetIds]);

  useEffect(() => {
    if (datasources.some((datasource) => datasource.id === selectedDatasourceId)) {
      return;
    }
    const preferredDatasourceId =
      datasources.find((datasource) => datasource.assets.some((asset) => bindingIds.includes(asset.id)))?.id ??
      datasources[0]?.id ??
      null;
    setSelectedDatasourceId(preferredDatasourceId);
  }, [bindingIds, datasources, selectedDatasourceId]);

  const selectedDatasource = useMemo(
    () => datasources.find((datasource) => datasource.id === selectedDatasourceId) ?? null,
    [datasources, selectedDatasourceId],
  );
  const selectedAsset = useMemo(
    () => selectedDatasource?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [selectedAssetId, selectedDatasource],
  );

  useEffect(() => {
    if (!selectedDatasource?.assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(selectedDatasource?.assets[0]?.id ?? null);
    }
  }, [selectedAssetId, selectedDatasource]);

  useEffect(() => {
    setFieldDrafts(buildFieldDrafts(selectedAsset?.fields ?? []));
  }, [selectedAsset?.id, selectedAsset?.fields]);

  const selectedCoverage = getAssetCoverage(selectedAsset);
  const totalAssetCount = datasources.reduce((total, datasource) => total + datasource.assets.length, 0);
  const boundAssetCount = bindingIds.length;
  const canSaveDatasource = Boolean(datasourceDraft?.name.trim() && datasourceDraft.sourceCode.trim());
  const canSaveAsset =
    Boolean(selectedDatasource && assetDraft?.assetName.trim()) &&
    Boolean(
      assetDraft?.assetType === 'TABLE'
        ? assetDraft.tableName.trim()
        : assetDraft?.sqlText.trim() && assetDraft.sourceTablesText.trim(),
    );

  async function saveBinding() {
    if (!node) {
      return;
    }
    await onBindSourceAssets(node.id, bindingIds);
  }

  async function saveDatasource() {
    if (!datasourceDraft || !canSaveDatasource) {
      return;
    }
    const saved = await onCreateDatasource(buildDatasourceDraftPayload(datasourceDraft));
    if (saved && typeof saved === 'object' && 'id' in saved) {
      setSelectedDatasourceId(Number(saved.id));
    }
    setDatasourceDraft(null);
    setAssetDraft(null);
  }

  async function saveAssetDraft() {
    if (!selectedDatasource || !assetDraft || !canSaveAsset) {
      return;
    }
    const savedAsset = await onSaveAsset(selectedDatasource.id, buildAssetDraftPayload(assetDraft));
    setSelectedAssetId(savedAsset.id);
    setAssetDraft(null);
    if (node && !bindingIds.includes(savedAsset.id)) {
      const nextBindingIds = [...new Set([...bindingIds, savedAsset.id])];
      await onBindSourceAssets(node.id, nextBindingIds);
      setBindingIds(nextBindingIds);
    }
  }

  async function generateFields() {
    if (!selectedDatasource || !selectedAsset) {
      return;
    }
    await onSaveAsset(selectedDatasource.id, buildAssetPayload(selectedAsset), selectedAsset.id);
  }

  async function saveFields() {
    if (!selectedAsset) {
      return;
    }
    const nextFields = await onReplaceAssetFields(selectedAsset.id, buildFieldPayloads(fieldDrafts));
    setFieldDrafts(buildFieldDrafts(nextFields));
  }

  async function generateFieldComments() {
    if (!selectedAsset) {
      return;
    }
    const nextFields = await onGenerateBizComments(selectedAsset.id);
    setFieldDrafts(buildFieldDrafts(nextFields));
  }

  function updateFieldDraft(index: number, patch: Partial<DataAssetFieldSavePayload>) {
    setFieldDrafts((current) =>
      current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
    );
  }

  return (
    <section className="bi-exact-stage is-sources">
      <ExactPanel
        className="bi-exact-source-catalog"
        subtitle={`共 ${datasources.length} 个数据源`}
        title="数据源目录"
        toolbar={
          <button
            className="bi-exact-plus-mini"
            onClick={() => setDatasourceDraft(emptyDatasourceDraft())}
            title="新增数据源"
            type="button"
          >
            +
          </button>
        }
      >
        <div className="bi-exact-search-row"><span>搜索数据源</span><i>⌕</i></div>
        <div className="bi-exact-tree-list">
          {datasources.length > 0 ? (
            datasources.map((datasource) => (
              <button
                className={datasource.id === selectedDatasourceId ? 'bi-exact-source-row is-active' : 'bi-exact-source-row'}
                key={datasource.id}
                onClick={() => setSelectedDatasourceId(datasource.id)}
                type="button"
              >
                <DatabaseIcon />
                <span>
                  <strong>{datasource.name}</strong>
                  <small>{datasource.sourceCode}</small>
                </span>
                <em>{datasource.assets.length}</em>
              </button>
            ))
          ) : (
            <ExactEmpty text="暂无数据源" />
          )}
        </div>
        {datasourceDraft ? (
          <div className="bi-exact-source-editor">
            <label>
              <span>数据源名称</span>
              <input
                aria-label="数据源名称"
                disabled={isMutating}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setDatasourceDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                value={datasourceDraft.name}
              />
            </label>
            <label>
              <span>数据源编码</span>
              <input
                aria-label="数据源编码"
                disabled={isMutating}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDatasourceDraft((current) => (current ? { ...current, sourceCode: event.target.value } : current))
                }
                value={datasourceDraft.sourceCode}
              />
            </label>
            <div className="bi-exact-editor-actions">
              <button className="bi-exact-primary-button" disabled={isMutating || !canSaveDatasource} onClick={() => void saveDatasource()} type="button">
                保存
              </button>
              <button disabled={isMutating} onClick={() => setDatasourceDraft(null)} type="button">
                取消
              </button>
            </div>
          </div>
        ) : null}
        <div className="bi-exact-source-summary">
          <DetailMetric label="资产" value={totalAssetCount} />
          <DetailMetric label="已绑定" value={boundAssetCount} />
        </div>
      </ExactPanel>
      <ExactPanel
        className="bi-exact-asset-matrix"
        subtitle={`当前节点：${node?.nodeName ?? '未选择节点'}`}
        title="资产绑定矩阵"
        toolbar={
          <div className="bi-exact-toolbar-actions">
            <button className="bi-exact-toolbar-button" disabled={!selectedDatasource || isMutating} onClick={() => setAssetDraft(emptyAssetDraft())} type="button">
              新增资产
            </button>
            <button className="bi-exact-primary-small" disabled={!node || isMutating} onClick={() => void saveBinding()} type="button">
              保存绑定
            </button>
          </div>
        }
      >
        <div className="bi-exact-filter-row">
          <button className="is-active" type="button">已绑定 {boundAssetCount}</button>
          <button type="button">可引用 {totalAssetCount}</button>
          <span>搜索资产名称</span>
          <i>⌕</i>
        </div>
        <div className="bi-exact-asset-table">
          <div className="bi-exact-asset-head">
            <span />
            <span>资产名称</span>
            <span>类型</span>
            <span>字段覆盖率</span>
            <span>允许表</span>
            <span>状态</span>
          </div>
          {selectedDatasource?.assets.length ? (
            selectedDatasource.assets.map((asset) => {
              const coverage = getAssetCoverage(asset);
              const checked = bindingIds.includes(asset.id);
              return (
                <button
                  className={asset.id === selectedAssetId ? 'bi-exact-asset-row is-active' : 'bi-exact-asset-row'}
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  type="button"
                >
                  <span
                    className={checked ? 'bi-exact-checkbox is-checked' : 'bi-exact-checkbox'}
                    onClick={(event: { stopPropagation: () => void }) => {
                      event.stopPropagation();
                      setBindingIds((current) =>
                        checked ? current.filter((id) => id !== asset.id) : [...new Set([...current, asset.id])],
                      );
                    }}
                  />
                  <span>
                    <strong>{asset.assetName}</strong>
                    <small>{asset.assetCode}</small>
                  </span>
                  <em>{getAssetTypeLabel(asset.assetType)}</em>
                  <span className="bi-exact-progress"><i style={{ width: formatPercent(coverage.percent) }} /><b>{coverage.percent}%</b></span>
                  <span>{asset.assetType === 'TABLE' ? asset.tableName ?? '-' : asset.sourceTables.length}</span>
                  <strong className={coverage.percent >= 80 ? 'is-success' : 'is-warning'}>{coverage.percent >= 80 ? '已完成' : '部分字段'}</strong>
                </button>
              );
            })
          ) : (
            <ExactEmpty text="当前数据源暂无资产" />
          )}
        </div>
        <div className="bi-exact-matrix-footer">
          <DetailMetric label="已配资产" value={boundAssetCount} />
          <DetailMetric label="平均字段覆盖率" value={`${selectedCoverage.percent}%`} />
          <DetailMetric label="允许表缺失" value={selectedAsset && selectedAsset.sourceTables.length === 0 ? 1 : 0} />
          <DetailMetric label="未绑定资产" value={Math.max(0, totalAssetCount - boundAssetCount)} />
        </div>
        {assetDraft ? (
          <div className="bi-exact-asset-editor">
            <div className="bi-exact-asset-editor-grid">
              <label>
                <span>资产名称</span>
                <input
                  aria-label="资产名称"
                  disabled={isMutating}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setAssetDraft((current) => (current ? { ...current, assetName: event.target.value } : current))}
                  value={assetDraft.assetName}
                />
              </label>
              <label>
                <span>资产编码</span>
                <input
                  aria-label="资产编码"
                  disabled={isMutating}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setAssetDraft((current) => (current ? { ...current, assetCode: event.target.value } : current))}
                  value={assetDraft.assetCode}
                />
              </label>
              <label>
                <span>资产类型</span>
                <select
                  aria-label="资产类型"
                  disabled={isMutating}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setAssetDraft((current) =>
                      current ? { ...current, assetType: event.target.value === 'SQL' ? 'SQL' : 'TABLE' } : current,
                    )
                  }
                  value={assetDraft.assetType}
                >
                  <option value="TABLE">TABLE</option>
                  <option value="SQL">SQL</option>
                </select>
              </label>
            </div>
            {assetDraft.assetType === 'TABLE' ? (
              <div className="bi-exact-asset-editor-grid is-two">
                <label>
                  <span>表架构</span>
                  <input
                    aria-label="表架构"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setAssetDraft((current) => (current ? { ...current, tableSchema: event.target.value } : current))}
                    value={assetDraft.tableSchema}
                  />
                </label>
                <label>
                  <span>表名</span>
                  <input
                    aria-label="表名"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setAssetDraft((current) => (current ? { ...current, tableName: event.target.value } : current))}
                    value={assetDraft.tableName}
                  />
                </label>
              </div>
            ) : (
              <div className="bi-exact-asset-editor-grid is-stack">
                <label>
                  <span>SQL文本</span>
                  <textarea
                    aria-label="SQL文本"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAssetDraft((current) => (current ? { ...current, sqlText: event.target.value } : current))}
                    value={assetDraft.sqlText}
                  />
                </label>
                <label>
                  <span>来源表</span>
                  <textarea
                    aria-label="来源表"
                    disabled={isMutating}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAssetDraft((current) => (current ? { ...current, sourceTablesText: event.target.value } : current))}
                    value={assetDraft.sourceTablesText}
                  />
                </label>
              </div>
            )}
            <div className="bi-exact-editor-actions">
              <button className="bi-exact-primary-button" disabled={isMutating || !canSaveAsset} onClick={() => void saveAssetDraft()} type="button">
                生成列
              </button>
              <button disabled={isMutating} onClick={() => setAssetDraft(null)} type="button">
                取消
              </button>
            </div>
          </div>
        ) : null}
      </ExactPanel>
      <ExactPanel className="bi-exact-field-panel" subtitle={selectedAsset?.assetCode ?? '未选择资产'} title="字段质量面板">
        {selectedAsset ? (
          <>
            <div className="bi-exact-field-score">
              <span>数据源/资产</span>
              <strong>{selectedAsset.assetCode}</strong>
              <small>{getAssetTypeLabel(selectedAsset.assetType)} / 字段总数 {selectedCoverage.total}</small>
            </div>
            <div className="bi-exact-field-actions">
              <button className="bi-exact-primary-button" disabled={isMutating} onClick={() => void generateFields()} type="button">生成列</button>
              <button className="bi-exact-outline-wide" disabled={isMutating || fieldDrafts.length === 0} onClick={() => void generateFieldComments()} type="button">AI生成列注释</button>
            </div>
            <div className="bi-exact-field-tabs">
              <span className="is-active">全部字段</span>
              <span>已映射</span>
              <span>未映射</span>
            </div>
            <div className="bi-exact-field-list">
              {selectedAsset.fields.length > 0 ? (
                selectedAsset.fields.map((field, index) => {
                  const draft: DataAssetFieldSavePayload = fieldDrafts[index] ?? {
                    bizComment: field.bizComment ?? '',
                    dbComment: field.dbComment ?? '',
                    exampleValue: field.exampleValue ?? '',
                    fieldLabel: field.fieldLabel ?? '',
                    fieldName: field.fieldName,
                    fieldOrigin: field.fieldOrigin ?? '',
                    fieldType: field.fieldType ?? '',
                    isNullable: field.isNullable ?? true,
                    sortNo: Number(field.sortNo ?? index),
                  };
                  const bizComment = draft.bizComment ?? '';
                  return (
                    <div className="bi-exact-field-row is-editable" key={field.id}>
                      <span>
                        <strong>{field.fieldName}</strong>
                        <small>{field.dbComment || field.fieldLabel || field.fieldName}</small>
                      </span>
                      <input
                        aria-label={`${field.fieldName}列注释`}
                        disabled={isMutating}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => updateFieldDraft(index, { bizComment: event.target.value })}
                        placeholder={field.dbComment || field.fieldLabel || '列注释'}
                        value={bizComment}
                      />
                      <em>{field.fieldType ?? '-'}</em>
                      <b>{bizComment.trim() || field.dbComment || field.fieldLabel ? '已补' : '待补'}</b>
                    </div>
                  );
                })
              ) : (
                <ExactEmpty text="暂无字段" />
              )}
            </div>
            <button className="bi-exact-primary-button" disabled={isMutating || fieldDrafts.length === 0} onClick={() => void saveFields()} type="button">保存列注释</button>
          </>
        ) : (
          <ExactEmpty text="请选择资产" />
        )}
      </ExactPanel>
    </section>
  );
}

function DetailMetric({ label, value }: { label: number | string; value: number | string }) {
  return (
    <div className="bi-exact-mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ExactAiStage({
  boundDatasources,
  datasources,
  designRecords,
  designSession,
  designSessions,
  generationTask,
  isMutating,
  node,
  onBindArchiveSourceAssets,
  onCreateInternalScreen,
  onCreateDesignSession,
  onPreviewPrompt,
  onPublishGeneratedVersion,
  onSaveScreenVersion,
  onSelectDesignSession,
  onSelectScreen,
  onSendDesignMessage,
  promptPreview,
  promptTemplates,
  screens,
  selectedScreen,
  selectedScreenId,
}: {
  boundDatasources: BiDatasource[];
  datasources: BiDatasource[];
  designRecords: BiScreenDesignRecord[];
  designSession: BiDesignSession | null;
  designSessions: BiDesignSession[];
  generationTask: BiGenerationTask | null;
  isMutating: boolean;
  node: BiDirectoryNode | null;
  onBindArchiveSourceAssets: (archiveId: number, sourceAssetIds: number[]) => Promise<unknown>;
  onCreateInternalScreen: () => Promise<void>;
  onCreateDesignSession: (screenId: number, payload?: DesignSessionCreatePayload) => Promise<BiDesignSession>;
  onPreviewPrompt: (payload: {
    datasourceIds?: number[];
    nodeId: number;
    prompt: string;
    providerCode?: string;
    screenId?: number;
    sourceAssetIds?: number[];
    templateCode?: string;
  }) => Promise<unknown>;
  onPublishGeneratedVersion: (screenId: number, versionId?: number | null) => Promise<void>;
  onSaveScreenVersion: (screenId: number, payload: ScreenVersionSavePayload) => Promise<unknown>;
  onSelectDesignSession: (sessionId: number | null) => Promise<BiDesignSession | null>;
  onSelectScreen: (screenId: number | null) => void;
  onSendDesignMessage: (sessionId: number, payload: DesignMessageSendPayload) => Promise<unknown>;
  promptPreview: BiPromptPreview | null;
  promptTemplates: BiPromptTemplate[];
  screens: BiScreen[];
  selectedScreen: BiScreen | null;
  selectedScreenId: number | null;
}) {
  const [activeAiTab, setActiveAiTab] = useState<AiWorkbenchTab>('chat');
  const [archiveBindingIds, setArchiveBindingIds] = useState<number[]>([]);
  const [chatPrompt, setChatPrompt] = useState(DEFAULT_PROMPT);
  const [chatPhase, setChatPhase] = useState<ChatGenerationPhase>(null);
  const [pendingChatMessage, setPendingChatMessage] = useState<PendingChatMessage>(null);
  const [backgroundPrompt, setBackgroundPrompt] = useState('科技风动态网格背景，深色、流光、适合经营驾驶舱');
  const [isSavingBackground, setIsSavingBackground] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ChatReferenceImage[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('');

  const selectedTemplate = useMemo(
    () =>
      promptTemplates.find((template) => template.templateCode === selectedTemplateCode) ??
      promptTemplates.find((template) => template.defaultTemplate) ??
      promptTemplates[0] ??
      null,
    [promptTemplates, selectedTemplateCode],
  );
  const datasourceIds = useMemo(() => boundDatasources.map((datasource) => datasource.id), [boundDatasources]);
  const sourceAssetIds = useMemo(
    () => boundDatasources.flatMap((datasource) => datasource.assets.map((asset) => asset.id)),
    [boundDatasources],
  );
  const hasGenerationSources = datasourceIds.length > 0 || sourceAssetIds.length > 0;
  const templateProviderCode = selectedTemplate?.providerCode?.trim().toUpperCase();
  const chatProviderCode =
    templateProviderCode && templateProviderCode !== 'RULE_BASED'
      ? templateProviderCode
      : 'AUTO';
  const allowedTables = useMemo(() => collectAllowedTables(boundDatasources), [boundDatasources]);
  const fieldCoverage = useMemo(() => collectFieldCoverage(boundDatasources), [boundDatasources]);
  const version = useMemo(() => resolveVersion(selectedScreen), [selectedScreen]);
  const screenBackground = getBiScreenBackground(version?.pageSchema);
  const screenBackgroundStyle = getBiScreenBackgroundStyle(version?.pageSchema);
  const activeSessionId = designSession?.sessionId ?? designSessions[0]?.sessionId ?? null;
  const publishScreenId = generationTask?.screenId ?? selectedScreen?.id ?? null;
  const publishVersionId = generationTask?.versionId ?? version?.id ?? null;
  const publishVersionAlreadyPublished = Boolean(version?.published && version.id === publishVersionId);
  const publicRuntimePath = selectedScreen?.screenCode
    ? buildBiPublicScreenPath(selectedScreen.screenCode, publishVersionId)
    : null;
  const publicRuntimeUrl = publicRuntimePath && typeof window !== 'undefined'
    ? `${window.location.origin}${publicRuntimePath}`
    : null;
  const totalFields = boundDatasources.reduce(
    (total, datasource) => total + datasource.assets.reduce((sum, asset) => sum + asset.fields.length, 0),
    0,
  );
  const documentedFields = boundDatasources.reduce(
    (total, datasource) =>
      total +
      datasource.assets.reduce((sum, asset) => {
        const coverage = getAssetCoverage(asset);
        return sum + coverage.documented;
      }, 0),
    0,
  );
  const healthScore = Math.min(
    100,
    (node ? 20 : 0) +
      (hasGenerationSources ? 30 : 0) +
      (allowedTables.length > 0 ? 20 : 0) +
      (totalFields > 0 ? Math.round((documentedFields / totalFields) * 30) : 0),
  );

  useEffect(() => {
    if (!selectedTemplateCode && selectedTemplate?.templateCode) {
      setSelectedTemplateCode(selectedTemplate.templateCode);
    }
  }, [selectedTemplate, selectedTemplateCode]);

  useEffect(() => {
    setActiveAiTab('chat');
    setChatPrompt(DEFAULT_PROMPT);
    setReferenceImages([]);
    setPendingChatMessage(null);
    setChatPhase(null);
  }, [node?.id, selectedScreen?.id]);

  useEffect(() => {
    setArchiveBindingIds(selectedScreen?.sourceAssetIds ?? []);
  }, [selectedScreen?.id, selectedScreen?.sourceAssetIds]);

  const totalArchiveAssetCount = datasources.reduce((total, datasource) => total + datasource.assets.length, 0);
  const archiveBoundAssetCount = archiveBindingIds.length;

  async function createFreshSession() {
    if (!selectedScreen) {
      return null;
    }
    return onCreateDesignSession(selectedScreen.id, {
      baseVersionId: version?.id ?? selectedScreen.currentVersionId ?? null,
      title: `${selectedScreen.name} 新聊天`,
    });
  }

  async function ensureActiveSession() {
    if (activeSessionId) {
      return activeSessionId;
    }
    const session = await createFreshSession();
    return session?.sessionId ?? null;
  }

  async function sendPromptToDesignSession(promptText: string, attachedImages: ChatReferenceImage[] = []) {
    if (!node || !selectedScreen || !hasGenerationSources || !promptText || chatPhase) {
      return;
    }
    let draftingTimer: number | undefined;
    setPendingChatMessage({ content: promptText, referenceImages: attachedImages });
    setChatPhase('creating');
    try {
      const sessionId = await ensureActiveSession();
      if (!sessionId) {
        return;
      }
      setChatPhase('thinking');
      draftingTimer = window.setTimeout(() => setChatPhase('drafting'), 1200);
      await onSendDesignMessage(sessionId, {
        datasourceIds,
        prompt: promptText,
        providerCode: chatProviderCode,
        referenceImages: attachedImages,
        sourceAssetIds,
        ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
      });
    } finally {
      if (draftingTimer) {
        window.clearTimeout(draftingTimer);
      }
      setPendingChatMessage(null);
      setChatPhase(null);
    }
  }

  async function handleSendMessage() {
    const promptText = chatPrompt.trim();
    const attachedImages = referenceImages;
    await sendPromptToDesignSession(promptText, attachedImages);
    setChatPrompt('');
    setReferenceImages([]);
  }

  async function handleGenerateBackground() {
    const visualPrompt = backgroundPrompt.trim() || '生成一版适合当前大屏主题的背景';
    const promptText = [
      '只调整当前 BI 大屏的整体背景，保留现有图表、SQL、查询条件和布局。',
      '背景必须写入 pageSchema.background，不能只改变模块内部元素。',
      '请输出完整 replacement dashboard JSON，并让背景和当前大屏主题协调。',
      `背景要求：${visualPrompt}`,
    ].join('\n');
    setActiveAiTab('chat');
    await sendPromptToDesignSession(promptText);
  }

  async function handleBackgroundUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = Array.from(event.target.files ?? []).find((item) => item.type.startsWith('image/'));
    event.target.value = '';
    if (!selectedScreen || !version || !file) {
      return;
    }
    setIsSavingBackground(true);
    try {
      const background = await buildUploadedScreenBackground(file);
      await onSaveScreenVersion(selectedScreen.id, buildVersionBackgroundSavePayload(version, background));
    } finally {
      setIsSavingBackground(false);
    }
  }

  async function handlePreviewPrompt() {
    if (!node || !chatPrompt.trim()) {
      return;
    }
    await onPreviewPrompt({
      datasourceIds,
      nodeId: node.id,
      prompt: chatPrompt,
      providerCode: chatProviderCode,
      ...(selectedScreenId ? { screenId: selectedScreenId } : {}),
      sourceAssetIds,
      ...(selectedTemplate ? { templateCode: selectedTemplate.templateCode } : {}),
    });
  }

  async function handleSaveArchiveSourceBinding() {
    if (!selectedScreen) {
      return;
    }
    await onBindArchiveSourceAssets(selectedScreen.id, archiveBindingIds);
  }

  async function handleCopyPublicRuntimeLink() {
    if (!publicRuntimeUrl || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(publicRuntimeUrl);
  }

  async function handleReferenceImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (files.length === 0) {
      return;
    }
    const remainingSlots = MAX_CHAT_REFERENCE_IMAGES - referenceImages.length;
    if (remainingSlots <= 0) {
      return;
    }
    const selectedFiles = files.slice(0, remainingSlots);
    const images = await Promise.all(selectedFiles.map((file) => buildChatReferenceImage(file)));
    setReferenceImages((current) => [...current, ...images].slice(0, MAX_CHAT_REFERENCE_IMAGES));
  }

  function removeReferenceImage(index: number) {
    setReferenceImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const aiTabs: Array<{ id: AiWorkbenchTab; label: string; meta: string }> = [
    { id: 'context', label: '上下文', meta: `${healthScore}` },
    { id: 'chat', label: '聊天', meta: chatPhase ? '生成中' : `${designSession?.messages.length ?? 0}` },
    { id: 'background', label: '背景', meta: screenBackground ? '已设置' : '未设置' },
    { id: 'versions', label: '任务与版本', meta: generationTask ? getGenerationStatusLabel(generationTask.status) : `${selectedScreen?.versions.length ?? 0}` },
  ];
  const canSendChatMessage = Boolean(selectedScreen) && !isMutating && !isSavingBackground && !chatPhase && Boolean(chatPrompt.trim()) && hasGenerationSources;
  const canAdjustBackground = Boolean(selectedScreen && version) && !isMutating && !isSavingBackground && !chatPhase;

  return (
    <section className="bi-exact-stage is-ai">
      <ExactPanel
        className="bi-exact-ai-tabs-panel"
        title="AI设计工作台"
        toolbar={<span className={statusClass(healthScore >= 70 ? 'success' : 'warning')}>{healthScore >= 70 ? '可生成' : '待补上下文'}</span>}
      >
        <div className="bi-exact-tab-card-tabs" role="tablist">
          {aiTabs.map((tab) => (
            <button
              aria-selected={activeAiTab === tab.id}
              className={activeAiTab === tab.id ? 'is-active' : ''}
              key={tab.id}
              onClick={() => setActiveAiTab(tab.id)}
              role="tab"
              type="button"
            >
              <span>{tab.label}</span>
              <small>{tab.meta}</small>
            </button>
          ))}
        </div>

        <div className="bi-exact-tab-card-body">
          {activeAiTab === 'context' ? (
            <div className="bi-exact-ai-tab-pane is-context" role="tabpanel">
              <div className="bi-exact-health-ring" style={{ '--bi-score': `${healthScore * 3.6}deg` } as CSSProperties}>
                <strong>{healthScore}</strong>
                <span>健康度</span>
              </div>
              <h3 className="bi-exact-section-label">上下文检测项</h3>
              <div className="bi-exact-check-list">
                <CheckLine label="节点信息完整性" meta={node?.nodeName ?? '未选择节点'} passed={Boolean(node)} />
                <CheckLine label="数据源绑定" meta={`${datasourceIds.length} 个数据源 / ${sourceAssetIds.length} 个资产`} passed={hasGenerationSources} />
                <CheckLine label="字段覆盖率" meta={`${documentedFields}/${totalFields} 已补齐`} passed={totalFields > 0 && documentedFields >= totalFields} />
                <CheckLine label="权限配置" meta={`${allowedTables.length} 张允许表`} passed={allowedTables.length > 0} />
              </div>
              <h3 className="bi-exact-section-label">所属节点</h3>
              <div className="bi-exact-detail-card">
                <span className={`bi-exact-detail-icon is-${node?.nodeType.toLowerCase() ?? 'company'}`} />
                <div>
                  <strong>{node?.nodeName ?? '未选择节点'}</strong>
                  <small>{node?.nodeCode ?? '-'}</small>
                </div>
              </div>
              <h3 className="bi-exact-section-label">当前档案分析源绑定</h3>
              <div className="bi-exact-archive-binding">
                <div className="bi-exact-archive-binding-head">
                  <div>
                    <strong>{selectedScreen?.name ?? '未选择 BI 档案'}</strong>
                    <small>
                      已绑定 {archiveBoundAssetCount} / {totalArchiveAssetCount} 个分析资产
                    </small>
                  </div>
                  <button
                    className="bi-exact-primary-small"
                    disabled={!selectedScreen || isMutating}
                    onClick={() => {
                      void handleSaveArchiveSourceBinding();
                    }}
                    type="button"
                  >
                    保存档案绑定
                  </button>
                </div>
                {!selectedScreen ? (
                  <ExactEmpty
                    action={
                      <button
                        className="bi-exact-empty-action"
                        disabled={!node || isMutating}
                        onClick={() => {
                          void onCreateInternalScreen();
                        }}
                        type="button"
                      >
                        创建内置 BI 档案
                      </button>
                    }
                    text="先创建或选择一个 BI 档案，再为档案独立绑定分析源资产。"
                  />
                ) : datasources.length > 0 ? (
                  <div className="bi-exact-archive-binding-list">
                    {datasources.map((datasource) => (
                      <section key={datasource.id}>
                        <div>
                          <strong>{datasource.name}</strong>
                          <small>{datasource.sourceCode}</small>
                        </div>
                        {datasource.assets.length > 0 ? (
                          datasource.assets.map((asset) => {
                            const checked = archiveBindingIds.includes(asset.id);
                            return (
                              <label key={asset.id}>
                                <input
                                  checked={checked}
                                  disabled={isMutating}
                                  onChange={() =>
                                    setArchiveBindingIds((current) =>
                                      checked
                                        ? current.filter((id) => id !== asset.id)
                                        : [...new Set([...current, asset.id])],
                                    )
                                  }
                                  type="checkbox"
                                />
                                <span>
                                  <strong>{asset.assetName}</strong>
                                  <small>{asset.assetCode}</small>
                                </span>
                                <em>{getAssetTypeLabel(asset.assetType)}</em>
                              </label>
                            );
                          })
                        ) : (
                          <small>暂无资产</small>
                        )}
                      </section>
                    ))}
                  </div>
                ) : (
                  <ExactEmpty text="暂无可绑定的分析源资产。" />
                )}
              </div>
            </div>
          ) : null}

          {activeAiTab === 'chat' ? (
            <div className="bi-exact-ai-tab-pane is-chat" role="tabpanel">
              <div className="bi-exact-template-row">
                <span>选择模板</span>
                {promptTemplates.slice(0, 3).map((template) => (
                  <button
                    className={template.templateCode === selectedTemplate?.templateCode ? 'is-active' : ''}
                    key={template.id}
                    onClick={() => setSelectedTemplateCode(template.templateCode)}
                    type="button"
                  >
                    {template.templateName}
                  </button>
                ))}
                <button type="button">＋</button>
              </div>

              <div className="bi-exact-chat-toolbar">
                <label>
                  <span>设计会话</span>
                  <select
                    disabled={!selectedScreen || isMutating}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                      const value = event.target.value ? Number(event.target.value) : null;
                      void onSelectDesignSession(value);
                    }}
                    value={activeSessionId ?? ''}
                  >
                    <option value="">自动创建新聊天</option>
                    {designSessions.map((session) => (
                      <option key={session.sessionId} value={session.sessionId}>
                        {session.title ?? `会话 #${session.sessionId}`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={!selectedScreen || isMutating}
                  onClick={() => {
                    void createFreshSession();
                  }}
                  type="button"
                >
                  新开聊天
                </button>
              </div>

              <div className={chatPhase ? 'bi-exact-chat-thread is-generating' : 'bi-exact-chat-thread'}>
                {!selectedScreen ? (
                  <ExactEmpty
                    action={
                      <button
                        className="bi-exact-empty-action"
                        disabled={!node || isMutating}
                        onClick={() => {
                          void onCreateInternalScreen();
                        }}
                        type="button"
                      >
                        创建内置 BI 档案
                      </button>
                    }
                    text="还没有内置 BI 档案，先创建一个设计任务后即可开始对话生成。"
                  />
                ) : designSession?.messages.length || pendingChatMessage || chatPhase ? (
                  <>
                    {designSession?.messages.map((message) => {
                      const images = readChatReferenceImages(message.meta);
                      return (
                        <div
                          className={`bi-exact-chat-message is-${message.role.toLowerCase()}`}
                          key={message.messageId}
                        >
                          <span>{message.role === 'USER' ? '你' : 'AI'}</span>
                          <p>{message.content ?? ''}</p>
                          <ChatReferenceImageGrid images={images} />
                          {message.status === 'FAILED' ? <em className="is-danger">生成失败</em> : null}
                          {message.generatedVersionId ? <em>生成版本 #{message.generatedVersionId}</em> : null}
                        </div>
                      );
                    })}
                    {pendingChatMessage ? (
                      <div className="bi-exact-chat-message is-user is-pending">
                        <span>你</span>
                        <p>{pendingChatMessage.content}</p>
                        <ChatReferenceImageGrid images={pendingChatMessage.referenceImages} />
                        <em>发送中</em>
                      </div>
                    ) : null}
                    {chatPhase ? <ChatGenerationStatus phase={chatPhase} /> : null}
                  </>
                ) : (
                  <ExactEmpty text="输入修改意见后，系统会自动创建聊天并生成新的草稿版本。" />
                )}
              </div>

              <div className="bi-exact-prompt-box">
                <div className="bi-exact-prompt-heading">
                  <span>直接聊天</span>
                  <small>Ctrl + Enter 发送</small>
                </div>
                <textarea
                  disabled={!selectedScreen || Boolean(chatPhase)}
                  maxLength={800}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setChatPrompt(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="例如：把区域销售排行放到第一屏，增加本月/上月对比，整体色调更适合经营驾驶舱。"
                  value={chatPrompt}
                />
                <ChatReferenceImageGrid images={referenceImages} onRemove={removeReferenceImage} />
                <div className="bi-exact-reference-row">
                  <label className={referenceImages.length >= MAX_CHAT_REFERENCE_IMAGES || !selectedScreen ? 'is-disabled' : ''}>
                    <input
                      accept="image/*"
                      disabled={referenceImages.length >= MAX_CHAT_REFERENCE_IMAGES || !selectedScreen || Boolean(chatPhase)}
                      multiple
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        void handleReferenceImageChange(event);
                      }}
                      type="file"
                    />
                    上传参考图
                  </label>
                  <small>{referenceImages.length}/{MAX_CHAT_REFERENCE_IMAGES}，用于记录和人工参照</small>
                  <button
                    className="bi-exact-chat-send-button"
                    disabled={!canSendChatMessage}
                    onClick={() => {
                      void handleSendMessage();
                    }}
                    type="button"
                  >
                    {chatPhase ? '生成中' : '发送'}
                  </button>
                </div>
                <em>{chatPrompt.length}/800</em>
              </div>
              <div className="bi-exact-ai-actions">
                <button
                  disabled={isMutating || Boolean(chatPhase) || !node || !chatPrompt.trim() || !hasGenerationSources}
                  onClick={() => {
                    void handlePreviewPrompt();
                  }}
                  type="button"
                >
                  预览提示词
                </button>
              </div>
            </div>
          ) : null}

          {activeAiTab === 'background' ? (
            <div className="bi-exact-ai-tab-pane is-background" role="tabpanel">
              <div className="bi-exact-background-workbench">
                <div className="bi-exact-background-art" style={screenBackgroundStyle}>
                  <span>{getBiScreenBackgroundLabel(version?.pageSchema)}</span>
                </div>
                <div className="bi-exact-background-controls">
                  <div>
                    <strong>大屏背景</strong>
                    <small>{screenBackground?.description ?? '随草稿版本保存'}</small>
                  </div>
                  <label className={canAdjustBackground ? '' : 'is-disabled'}>
                    <input
                      accept="image/*"
                      disabled={!canAdjustBackground}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        void handleBackgroundUpload(event);
                      }}
                      type="file"
                    />
                    {isSavingBackground ? '保存背景中' : '上传背景图'}
                  </label>
                  <div className="bi-exact-background-ai-row">
                    <input
                      disabled={!canAdjustBackground || !hasGenerationSources}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setBackgroundPrompt(event.target.value)}
                      placeholder="例如：深蓝科技网格、发光数据流、城市天际线"
                      value={backgroundPrompt}
                    />
                    <button
                      disabled={!canAdjustBackground || !hasGenerationSources || !backgroundPrompt.trim()}
                      onClick={() => {
                        void handleGenerateBackground();
                      }}
                      type="button"
                    >
                      AI生成背景
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeAiTab === 'versions' ? (
            <div className="bi-exact-ai-tab-pane is-versions" role="tabpanel">
              <div className="bi-exact-task-tab-header">
                <div>
                  <strong>任务与版本</strong>
                  <small>{generationTask ? `当前任务 #${generationTask.id}` : '尚未生成任务'}</small>
                </div>
                <div className="bi-exact-task-tab-actions">
                  {publicRuntimePath ? (
                    <a href={publicRuntimePath} rel="noreferrer" target="_blank">
                      独立打开
                    </a>
                  ) : null}
                  <button
                    disabled={!publicRuntimeUrl}
                    onClick={() => {
                      void handleCopyPublicRuntimeLink();
                    }}
                    type="button"
                  >
                    复制链接
                  </button>
                  <button
                    className="bi-exact-primary-small"
                    disabled={!publishScreenId || !publishVersionId || publishVersionAlreadyPublished || isMutating}
                    onClick={() =>
                      publishScreenId ? onPublishGeneratedVersion(publishScreenId, publishVersionId ?? undefined) : Promise.resolve()
                    }
                    type="button"
                  >
                    发布
                  </button>
                </div>
              </div>
              <div className="bi-exact-task-block">
                <h3>当前任务</h3>
                <p>{generationTask ? getGenerationStatusLabel(generationTask.status) : chatPhase ? '生成中' : '尚未生成'}</p>
                {generationTask ? <small>#{generationTask.id}</small> : null}
              </div>
              <div className="bi-exact-run-list">
                <RunStep active label="草稿" meta={generationTask ? getGenerationStatusLabel(generationTask.status) : chatPhase ? '生成中' : '尚未生成'} />
                <RunStep active={Boolean(selectedScreen)} label="评审中" meta={selectedScreen ? selectedScreen.name : '待提交'} />
                <RunStep active={Boolean(selectedScreen && getPublishedVersionId(selectedScreen))} label="已发布" meta={selectedScreen && getPublishedVersionId(selectedScreen) ? '已发布' : '未发布'} />
                <RunStep active={false} label="已分享" meta="未分享" />
              </div>
              <h3 className="bi-exact-section-label">版本历史</h3>
              <div className="bi-exact-version-list">
                {selectedScreen?.versions.length ? (
                  selectedScreen.versions.map((item) => (
                    <button key={item.id} onClick={() => onSelectScreen(selectedScreen.id)} type="button">
                      <strong>v{item.versionNo ?? item.id}</strong>
                      <small>{item.generatedByAi ? 'AI生成' : '手工维护'}</small>
                      <em>{item.published ? '已发布' : '草稿'}</em>
                    </button>
                  ))
                ) : screens.length > 0 ? (
                  screens.map((screen) => (
                    <button key={screen.id} onClick={() => onSelectScreen(screen.id)} type="button">
                      <strong>{screen.name}</strong>
                      <small>{getScreenDesignStatusLabel(screen.designStatus)}</small>
                      <em>{screen.versions.length}</em>
                    </button>
                  ))
                ) : (
                  <ExactEmpty text="暂无版本" />
                )}
              </div>
              <h3 className="bi-exact-section-label">设计记录</h3>
              <div className="bi-exact-record-list">
                {designRecords.length > 0 ? (
                  designRecords.slice(0, 4).map((record) => (
                    <div key={record.id}>
                      <strong>{record.templateCode ?? '未命名模板'}</strong>
                      <small>{formatDateTime(record.createTime)}</small>
                    </div>
                  ))
                ) : (
                  <ExactEmpty text="暂无设计记录" />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </ExactPanel>

      <ExactPanel
        className="bi-exact-ai-preview-panel"
        title="生成预览"
        toolbar={<span className={statusClass(generationTask?.status === 'FAILED' ? 'danger' : version ? 'info' : 'muted')}>{version ? `v${version.versionNo ?? version.id}` : '暂无版本'}</span>}
      >
        <div className="bi-exact-ai-preview">
          <div className="bi-exact-preview-header">
            <div>
              <strong>当前生成预览</strong>
              <small>
                {generationTask
                  ? getGenerationStatusLabel(generationTask.status)
                  : version?.generatedByAi
                    ? '已生成草稿'
                    : '等待 AI 生成草稿'}
              </small>
            </div>
            <div className="bi-exact-preview-actions">
              {publicRuntimePath ? (
                <a href={publicRuntimePath} rel="noreferrer" target="_blank">
                  独立访问
                </a>
              ) : null}
              <span>
                {version?.theme ?? 'enterprise'}
                {version?.modules.length ? ` · ${version.modules.length}模块` : ''}
              </span>
            </div>
          </div>
          <div
            className={screenBackgroundStyle ? 'bi-exact-preview-canvas has-background' : 'bi-exact-preview-canvas'}
            style={screenBackgroundStyle}
          >
            {version?.modules.length ? (
              <div className="bi-exact-preview-grid" style={getBiGridTemplateStyle(version.moduleLayout, '--bi-preview-grid-columns')}>
                {version.modules.map((module, index) => (
                  <div
                    className="bi-exact-preview-card"
                    key={module.id}
                    style={getBiModuleGridItemStyle({
                      compact: true,
                      fallbackSpan: module.moduleType === 'table' ? 12 : 6,
                      layout: module.layout,
                      moduleLayout: version.moduleLayout,
                    })}
                  >
                    <strong>{module.moduleName}</strong>
                    <small>{module.moduleType}</small>
                    <ChartPreview index={index} type={module.moduleType} />
                  </div>
                ))}
              </div>
            ) : promptPreview ? (
              <pre className="bi-exact-prompt-preview">{promptPreview.userPrompt ?? promptPreview.systemPrompt ?? ''}</pre>
            ) : (
              <ExactEmpty text="暂无生成预览" />
            )}
          </div>
        </div>
      </ExactPanel>
    </section>
  );
}

function resolveVersion(screen: BiScreen | null): BiScreenVersion | null {
  if (!screen) {
    return null;
  }
  return (
    screen.versions.find((version) => version.id === screen.currentVersionId) ??
    screen.versions.find((version) => version.published) ??
    screen.versions[0] ??
    null
  );
}

function ChartPreview({ index, type }: { index: number; type?: string | null }) {
  const normalizedType = type?.toLowerCase();
  const heights = index % 3 === 0 ? [42, 72, 52, 88, 64] : index % 3 === 1 ? [64, 48, 84, 58, 74] : [36, 62, 76, 50, 90];

  if (normalizedType === 'pie-chart') {
    return <div className="bi-exact-chart-preview is-pie" />;
  }

  if (normalizedType === 'line-chart') {
    return (
      <div className="bi-exact-chart-preview is-line">
        {[24, 56, 38, 74, 62].map((point, pointIndex) => (
          <i key={`${point}-${pointIndex}`} style={{ bottom: `${point}%`, left: `${pointIndex * 24}%` }} />
        ))}
      </div>
    );
  }

  if (normalizedType === 'table') {
    return (
      <div className="bi-exact-chart-preview is-table">
        {[0, 1, 2, 3].map((item) => (
          <i key={item} />
        ))}
      </div>
    );
  }

  if (normalizedType === 'text') {
    return (
      <div className="bi-exact-chart-preview is-text">
        {[0, 1, 2].map((item) => (
          <i key={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="bi-exact-chart-preview">
      {heights.map((height, itemIndex) => (
        <i key={`${height}-${itemIndex}`} style={{ height }} />
      ))}
    </div>
  );
}

function ChatReferenceImageGrid({
  images,
  onRemove,
}: {
  images: ChatReferenceImage[];
  onRemove?: (index: number) => void;
}) {
  if (images.length === 0) {
    return null;
  }
  return (
    <div className="bi-exact-reference-grid">
      {images.map((image, index) => (
        <figure key={`${image.name}-${index}`}>
          <img alt={image.name} src={image.dataUrl} />
          <figcaption>
            <span>{image.name}</span>
            <small>{formatFileSize(image.size)}</small>
          </figcaption>
          {onRemove ? (
            <button onClick={() => onRemove(index)} title="移除参考图" type="button">
              ×
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function ChatGenerationStatus({ phase }: { phase: Exclude<ChatGenerationPhase, null> }) {
  const phaseText: Record<Exclude<ChatGenerationPhase, null>, string> = {
    creating: '正在准备设计会话',
    thinking: 'AI 正在理解你的修改意见',
    drafting: '正在生成新的 BI 草稿版本',
  };
  return (
    <div className="bi-exact-chat-message is-assistant is-thinking">
      <span>AI</span>
      <div className="bi-exact-thinking-row">
        <i />
        <i />
        <i />
        <strong>{phaseText[phase]}</strong>
      </div>
      <div className="bi-exact-thinking-steps">
        <small className={phase === 'creating' ? 'is-active' : ''}>会话</small>
        <small className={phase === 'thinking' ? 'is-active' : ''}>思考</small>
        <small className={phase === 'drafting' ? 'is-active' : ''}>生成</small>
      </div>
    </div>
  );
}

function RunStep({ active, label, meta }: { active: boolean; label: string; meta: string }) {
  return (
    <div className={active ? 'bi-exact-run-step is-active' : 'bi-exact-run-step'}>
      <span />
      <div>
        <strong>{label}</strong>
        <small>{meta}</small>
      </div>
    </div>
  );
}

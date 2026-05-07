import type { BiDirectoryNode, BiScreen } from '../types';
import { getPublishedVersionId } from './bi-directory';

export type BiWorkspaceNextStep = {
  actionLabel: string;
  hint: string;
  stage: 'select-node' | 'bind-sources' | 'create-archive' | 'design' | 'publish' | 'preview';
  title: string;
};

export function resolveBiWorkspaceNextStep({
  canPreview,
  node,
  screens,
  selectedScreen,
}: {
  canPreview: boolean;
  node: BiDirectoryNode | null;
  screens: BiScreen[];
  selectedScreen: BiScreen | null;
}): BiWorkspaceNextStep {
  if (!node) {
    return {
      actionLabel: '选择节点',
      hint: '先从目录画布中选中一个业务节点，再开始配置 BI。',
      stage: 'select-node',
      title: '先选择一个节点',
    };
  }

  if (node.sourceAssetIds.length === 0) {
    return {
      actionLabel: '去绑定分析源',
      hint: '先把当前节点和表或 SQL 资产绑定起来，后续生成和预览都会使用这些资产。',
      stage: 'bind-sources',
      title: '先绑定分析源',
    };
  }

  const internalScreen = screens.find((screen) => screen.biType === 'INTERNAL') ?? null;
  const currentScreen = selectedScreen ?? internalScreen ?? screens[0] ?? null;

  if (!currentScreen) {
    return {
      actionLabel: '创建内置 BI',
      hint: '下一步会创建当前节点的内置 BI 档案，然后进入设计与生成。',
      stage: 'create-archive',
      title: '创建 BI 档案',
    };
  }

  if (!currentScreen.versions.length) {
    return {
      actionLabel: '进入设计生成',
      hint: '下一步进入设计与生成，生成第一版草稿或手工维护版本内容。',
      stage: 'design',
      title: '生成草稿版本',
    };
  }

  if (!getPublishedVersionId(currentScreen)) {
    return {
      actionLabel: '发布版本',
      hint: '当前已有草稿版本。发布后，展示端才能稳定读取这个节点的大屏内容。',
      stage: 'publish',
      title: '发布当前版本',
    };
  }

  return {
    actionLabel: canPreview ? '打开预览页面' : '查看发布状态',
    hint: canPreview
      ? '下一步打开预览页面，确认当前节点的大屏内容和展示效果。'
      : '当前节点已有发布版本，可以继续检查发布和分享入口。',
    stage: 'preview',
    title: '验证预览效果',
  };
}

import { describe, expect, it } from 'vitest';

import type { BiDirectoryNode, BiScreen } from '../types';
import { resolveBiWorkspaceNextStep } from './bi-workspace-next-step';

function createNode(patch: Partial<BiDirectoryNode> = {}): BiDirectoryNode {
  return {
    boundAssets: [],
    children: [],
    datasourceIds: [],
    id: 1,
    level: 1,
    nodeCode: 'root',
    nodeName: 'Root',
    nodeType: 'COMPANY',
    parentId: null,
    sourceAssetIds: [],
    status: 'ACTIVE',
    ...patch,
  };
}

function createScreen(patch: Partial<BiScreen> = {}): BiScreen {
  return {
    biType: 'INTERNAL',
    id: 10,
    name: 'Internal BI',
    nodeId: 1,
    screenCode: 'internal_bi',
    versions: [],
    ...patch,
  };
}

describe('resolveBiWorkspaceNextStep', () => {
  it('asks the user to select a node first', () => {
    const nextStep = resolveBiWorkspaceNextStep({
      canPreview: false,
      node: null,
      screens: [],
      selectedScreen: null,
    });

    expect(nextStep.stage).toBe('select-node');
    expect(nextStep.actionLabel).toBe('选择节点');
  });

  it('asks for source binding before archive work', () => {
    const nextStep = resolveBiWorkspaceNextStep({
      canPreview: false,
      node: createNode(),
      screens: [],
      selectedScreen: null,
    });

    expect(nextStep.stage).toBe('bind-sources');
  });

  it('asks to create an archive after sources are bound', () => {
    const nextStep = resolveBiWorkspaceNextStep({
      canPreview: false,
      node: createNode({ sourceAssetIds: [100] }),
      screens: [],
      selectedScreen: null,
    });

    expect(nextStep.stage).toBe('create-archive');
  });

  it('asks to design when an archive has no versions', () => {
    const screen = createScreen();
    const nextStep = resolveBiWorkspaceNextStep({
      canPreview: false,
      node: createNode({ sourceAssetIds: [100] }),
      screens: [screen],
      selectedScreen: screen,
    });

    expect(nextStep.stage).toBe('design');
  });

  it('asks to publish when a draft exists but is not published', () => {
    const screen = createScreen({
      versions: [
        {
          filters: [],
          id: 11,
          modules: [],
          published: false,
          screenId: 10,
        },
      ],
    });
    const nextStep = resolveBiWorkspaceNextStep({
      canPreview: false,
      node: createNode({ sourceAssetIds: [100] }),
      screens: [screen],
      selectedScreen: screen,
    });

    expect(nextStep.stage).toBe('publish');
  });

  it('asks to preview after a version is published', () => {
    const screen = createScreen({
      versions: [
        {
          filters: [],
          id: 11,
          modules: [],
          published: true,
          screenId: 10,
        },
      ],
    });
    const nextStep = resolveBiWorkspaceNextStep({
      canPreview: true,
      node: createNode({ sourceAssetIds: [100] }),
      screens: [screen],
      selectedScreen: screen,
    });

    expect(nextStep.stage).toBe('preview');
    expect(nextStep.actionLabel).toBe('打开预览页面');
  });
});

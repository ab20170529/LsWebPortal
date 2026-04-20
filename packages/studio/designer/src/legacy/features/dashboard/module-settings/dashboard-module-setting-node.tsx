import { buildModuleSettingNode, type BuildModuleSettingNodeInput } from './dashboard-workspace-nodes';

type BuildDashboardModuleSettingNodeInput = {
  container: Pick<BuildModuleSettingNodeInput, 'moduleSettingsSectionRef'>;
  shell: Pick<BuildModuleSettingNodeInput, 'moduleSettingStepShellProps'>;
};

export function buildDashboardModuleSettingNode(
  input: BuildDashboardModuleSettingNodeInput,
) {
  return buildModuleSettingNode({
    ...input.container,
    ...input.shell,
  });
}

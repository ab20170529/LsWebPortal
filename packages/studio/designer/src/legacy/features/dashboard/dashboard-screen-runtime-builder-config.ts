import { buildDashboardConfigBridgeModalsBuilderConfig } from './module-settings/dashboard-config-bridge-modals-builder-config';
import { buildDashboardConfigBridgeRestrictionConfig } from './module-settings/dashboard-config-bridge-restriction-config';
import { buildDashboardConfigBridgeWizardConfig } from './module-settings/dashboard-config-bridge-wizard-config';
import { buildDashboardConfigBridgeWorkspaceBuilderConfig } from './module-settings/dashboard-config-bridge-workspace-builder-config';
import type { UseDashboardScreenRuntimeInput } from './use-dashboard-screen-runtime';

type DashboardScreenRuntimeBridgeInputs = UseDashboardScreenRuntimeInput['bridgeInputs'];
export type DashboardScreenRuntimeBuilderOutput = Omit<UseDashboardScreenRuntimeInput, 'bridgeInputs'> & {
  bridgeInputs: Omit<DashboardScreenRuntimeBridgeInputs, 'moduleSettingConfig'>;
};

export function buildDashboardScreenRuntimeBuilderConfig({
  modals,
  restriction,
  screen,
  wizard,
  workspace,
}: {
  modals: Parameters<typeof buildDashboardConfigBridgeModalsBuilderConfig>[0];
  restriction: Parameters<typeof buildDashboardConfigBridgeRestrictionConfig>[0];
  screen: UseDashboardScreenRuntimeInput['screen'];
  wizard: Parameters<typeof buildDashboardConfigBridgeWizardConfig>[0];
  workspace: Parameters<typeof buildDashboardConfigBridgeWorkspaceBuilderConfig>[0];
}): DashboardScreenRuntimeBuilderOutput {
  return {
    bridgeInputs: {
      modalsConfig: buildDashboardConfigBridgeModalsBuilderConfig(modals),
      restrictionConfig: buildDashboardConfigBridgeRestrictionConfig(restriction),
      wizardConfig: buildDashboardConfigBridgeWizardConfig(wizard),
      workspaceConfig: buildDashboardConfigBridgeWorkspaceBuilderConfig(workspace),
    },
    screen,
  };
}

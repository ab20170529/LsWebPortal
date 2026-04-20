import { useMemo } from 'react';

import { buildDashboardConfigBridgeModalsConfig } from './dashboard-config-bridge-modals-config';
import { buildDashboardConfigBridgeModuleSettingConfig } from './dashboard-config-bridge-module-setting-config';
import { buildDashboardConfigBridgeNodes } from './dashboard-config-bridge-nodes';
import { buildDashboardConfigBridgeRestrictionInput } from './dashboard-config-bridge-restriction-input';
import { buildDashboardConfigBridgeWizardInput } from './dashboard-config-bridge-wizard-input';
import { buildDashboardConfigBridgeWorkspaceConfig } from './dashboard-config-bridge-workspace-config';

type DashboardConfigBridgeWorkspaceConfig = Parameters<typeof buildDashboardConfigBridgeWorkspaceConfig>[0];
type DashboardConfigBridgeModuleSettingConfig = Parameters<typeof buildDashboardConfigBridgeModuleSettingConfig>[0];
type DashboardConfigBridgeRestrictionConfig = Parameters<typeof buildDashboardConfigBridgeRestrictionInput>[0];
type DashboardConfigBridgeModalsConfig = Parameters<typeof buildDashboardConfigBridgeModalsConfig>[0];
type DashboardConfigBridgeWizardConfig = Parameters<typeof buildDashboardConfigBridgeWizardInput>[0];

export function useDashboardConfigBridgeNodes({
  workspaceConfig,
  moduleSettingConfig,
  restrictionConfig,
  modalsConfig,
  wizardConfig,
}: {
  workspaceConfig: DashboardConfigBridgeWorkspaceConfig;
  moduleSettingConfig: DashboardConfigBridgeModuleSettingConfig;
  restrictionConfig: DashboardConfigBridgeRestrictionConfig;
  modalsConfig: DashboardConfigBridgeModalsConfig;
  wizardConfig: DashboardConfigBridgeWizardConfig;
}) {
  return useMemo(() => buildDashboardConfigBridgeNodes({
    workspace: buildDashboardConfigBridgeWorkspaceConfig(workspaceConfig),
    moduleSetting: buildDashboardConfigBridgeModuleSettingConfig(moduleSettingConfig),
    restriction: buildDashboardConfigBridgeRestrictionInput(restrictionConfig),
    modals: buildDashboardConfigBridgeModalsConfig(modalsConfig),
    wizard: buildDashboardConfigBridgeWizardInput(wizardConfig),
  }), [
    moduleSettingConfig,
    modalsConfig,
    restrictionConfig,
    wizardConfig,
    workspaceConfig,
  ]);
}

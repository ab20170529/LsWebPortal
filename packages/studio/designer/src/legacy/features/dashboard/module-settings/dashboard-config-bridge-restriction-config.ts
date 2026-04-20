import { buildDashboardConfigBridgeRestrictionInput } from './dashboard-config-bridge-restriction-input';

type DashboardConfigBridgeRestrictionConfig = Parameters<typeof buildDashboardConfigBridgeRestrictionInput>[0];

export function buildDashboardConfigBridgeRestrictionConfig({
  buildRestrictionMeasure,
  buildRestrictionNumberRule,
  buildRestrictionProcessDesign,
  buildRestrictionTopStructure,
  currentModuleName,
  handleSaveRestrictionTab,
  restrictionActiveTab,
  restrictionMeasures,
  restrictionNumberRules,
  restrictionProcessDesigns,
  restrictionSelection,
  restrictionTopStructures,
  setLongTextEditorState,
  setRestrictionActiveTab,
  setRestrictionMeasures,
  setRestrictionNumberRules,
  setRestrictionProcessDesigns,
  setRestrictionSelection,
  setRestrictionTopStructures,
  showToast,
  workspaceThemeTableSurfaceClass,
  workspaceThemeVars,
}: {
  buildRestrictionMeasure: DashboardConfigBridgeRestrictionConfig['builders']['buildRestrictionMeasure'];
  buildRestrictionNumberRule: DashboardConfigBridgeRestrictionConfig['builders']['buildRestrictionNumberRule'];
  buildRestrictionProcessDesign: DashboardConfigBridgeRestrictionConfig['builders']['buildRestrictionProcessDesign'];
  buildRestrictionTopStructure: DashboardConfigBridgeRestrictionConfig['builders']['buildRestrictionTopStructure'];
  currentModuleName: DashboardConfigBridgeRestrictionConfig['state']['currentModuleName'];
  handleSaveRestrictionTab: DashboardConfigBridgeRestrictionConfig['ui']['onSaveRestrictionTab'];
  restrictionActiveTab: DashboardConfigBridgeRestrictionConfig['state']['restrictionActiveTab'];
  restrictionMeasures: DashboardConfigBridgeRestrictionConfig['state']['restrictionMeasures'];
  restrictionNumberRules: DashboardConfigBridgeRestrictionConfig['state']['restrictionNumberRules'];
  restrictionProcessDesigns: DashboardConfigBridgeRestrictionConfig['state']['restrictionProcessDesigns'];
  restrictionSelection: DashboardConfigBridgeRestrictionConfig['state']['restrictionSelection'];
  restrictionTopStructures: DashboardConfigBridgeRestrictionConfig['state']['restrictionTopStructures'];
  setLongTextEditorState: DashboardConfigBridgeRestrictionConfig['ui']['onOpenLongTextEditor'];
  setRestrictionActiveTab: DashboardConfigBridgeRestrictionConfig['setters']['setRestrictionActiveTab'];
  setRestrictionMeasures: DashboardConfigBridgeRestrictionConfig['setters']['setRestrictionMeasures'];
  setRestrictionNumberRules: DashboardConfigBridgeRestrictionConfig['setters']['setRestrictionNumberRules'];
  setRestrictionProcessDesigns: DashboardConfigBridgeRestrictionConfig['setters']['setRestrictionProcessDesigns'];
  setRestrictionSelection: DashboardConfigBridgeRestrictionConfig['setters']['setRestrictionSelection'];
  setRestrictionTopStructures: DashboardConfigBridgeRestrictionConfig['setters']['setRestrictionTopStructures'];
  showToast: DashboardConfigBridgeRestrictionConfig['ui']['showToast'];
  workspaceThemeTableSurfaceClass: DashboardConfigBridgeRestrictionConfig['ui']['workspaceThemeTableSurfaceClass'];
  workspaceThemeVars: DashboardConfigBridgeRestrictionConfig['ui']['workspaceThemeVars'];
}): DashboardConfigBridgeRestrictionConfig {
  return {
    builders: {
      buildRestrictionMeasure,
      buildRestrictionNumberRule,
      buildRestrictionProcessDesign,
      buildRestrictionTopStructure,
    },
    setters: {
      setRestrictionActiveTab,
      setRestrictionMeasures,
      setRestrictionNumberRules,
      setRestrictionProcessDesigns,
      setRestrictionSelection,
      setRestrictionTopStructures,
    },
    state: {
      currentModuleName,
      restrictionActiveTab,
      restrictionMeasures,
      restrictionNumberRules,
      restrictionProcessDesigns,
      restrictionSelection,
      restrictionTopStructures,
    },
    ui: {
      onOpenLongTextEditor: setLongTextEditorState,
      onSaveRestrictionTab: handleSaveRestrictionTab,
      showToast,
      workspaceThemeTableSurfaceClass,
      workspaceThemeVars,
    },
  };
}

import { buildDashboardConfigBridgeModuleSettingConfig } from './dashboard-config-bridge-module-setting-config';

type DashboardModuleSettingRuntimeConfig = Parameters<typeof buildDashboardConfigBridgeModuleSettingConfig>[0];
type DashboardModuleSettingRuntimeConfigBuilderOutput = Omit<
  DashboardModuleSettingRuntimeConfig,
  'moduleSettingsSectionRef'
>;

export function buildDashboardModuleSettingRuntimeBuilderConfig({
  activeDetailGridConfig,
  activateGridActionSelection,
  inspectorTarget,
  mainTableConfig,
  mainTableHiddenColumnsCount,
  setIsFullscreenConfig,
  showDetailGridActionBar,
  ...rest
}: Omit<
  DashboardModuleSettingRuntimeConfig,
  | 'detailGridActionConfig'
  | 'isDetailFillSelected'
  | 'isDetailViewSelected'
  | 'mainGridActionConfig'
  | 'mainTableHiddenColumnsCount'
  | 'moduleSettingsSectionRef'
  | 'onSelectDetailGridAction'
  | 'onSelectMainGridAction'
  | 'onToggleFullscreen'
> & {
  activeDetailGridConfig: any;
  activateGridActionSelection: (scope: 'main' | 'detail', actionKey: string) => void;
  inspectorTarget: { kind: string; id?: string | null };
  mainTableConfig: DashboardModuleSettingRuntimeConfig['mainGridActionConfig'];
  mainTableHiddenColumnsCount: number;
  setIsFullscreenConfig: (updater: (prev: boolean) => boolean) => void;
  showDetailGridActionBar: boolean;
}): DashboardModuleSettingRuntimeConfigBuilderOutput {
  return {
    ...rest,
    detailGridActionConfig: showDetailGridActionBar ? activeDetailGridConfig : null,
    isDetailFillSelected: inspectorTarget.kind === 'detail-grid' && inspectorTarget.id === rest.currentDetailFillTypeValue,
    isDetailViewSelected: inspectorTarget.kind === 'detail-grid' && inspectorTarget.id === rest.currentDetailFillTypeValue,
    mainGridActionConfig: mainTableConfig,
    mainTableHiddenColumnsCount,
    onSelectDetailGridAction: (actionKey) => activateGridActionSelection('detail', actionKey),
    onSelectMainGridAction: (actionKey) => activateGridActionSelection('main', actionKey),
    onToggleFullscreen: () => setIsFullscreenConfig((prev) => !prev),
    showDetailGridActionBar,
  };
}

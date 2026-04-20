import type { useDetailGridSourceConfig } from './use-detail-grid-source-config';

type DetailGridSourceConfigInput = Parameters<typeof useDetailGridSourceConfig>[0];

type DashboardDetailGridSourceConfigBuilder = {
  builders: {
    buildColumn: DetailGridSourceConfigInput['buildColumn'];
    buildDetailTabConfig: DetailGridSourceConfigInput['buildDetailTabConfig'];
    buildGridConfig: DetailGridSourceConfigInput['buildGridConfig'];
  };
  detailState: {
    detailTabConfigs: DetailGridSourceConfigInput['detailTabConfigs'];
    detailTabs: DetailGridSourceConfigInput['detailTabs'];
    detailTableConfigs: DetailGridSourceConfigInput['detailTableConfigs'];
    mainTableColumns: DetailGridSourceConfigInput['mainTableColumns'];
    mainTableConfig: DetailGridSourceConfigInput['mainTableConfig'];
  };
  feedback: {
    showToast: DetailGridSourceConfigInput['showToast'];
  };
  helpers: {
    normalizeColumn: DetailGridSourceConfigInput['normalizeColumn'];
    normalizeDetailChartConfig: DetailGridSourceConfigInput['normalizeDetailChartConfig'];
    parseSqlFieldNames: DetailGridSourceConfigInput['parseSqlFieldNames'];
    resolveDetailModuleSnapshotByCode: DetailGridSourceConfigInput['resolveDetailModuleSnapshotByCode'];
  };
  moduleState: {
    businessType: DetailGridSourceConfigInput['businessType'];
    currentModuleCode: DetailGridSourceConfigInput['currentModuleCode'];
    currentModuleName: DetailGridSourceConfigInput['currentModuleName'];
    currentPrimaryTableName: DetailGridSourceConfigInput['currentPrimaryTableName'];
    restrictionTopStructures: DetailGridSourceConfigInput['restrictionTopStructures'];
  };
  setters: {
    setDetailTabConfigs: DetailGridSourceConfigInput['setDetailTabConfigs'];
    setDetailTableColumns: DetailGridSourceConfigInput['setDetailTableColumns'];
    setDetailTableConfigs: DetailGridSourceConfigInput['setDetailTableConfigs'];
  };
};

export function buildDashboardDetailGridSourceConfigBuilderConfig({
  builders,
  detailState,
  feedback,
  helpers,
  moduleState,
  setters,
}: DashboardDetailGridSourceConfigBuilder): DetailGridSourceConfigInput {
  return {
    ...builders,
    ...detailState,
    ...feedback,
    ...helpers,
    ...moduleState,
    ...setters,
  };
}

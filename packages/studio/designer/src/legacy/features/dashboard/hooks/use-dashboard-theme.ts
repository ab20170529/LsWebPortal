import { useMemo } from 'react';

import {
  buildModuleSettingStageStyle,
  getWorkspaceThemeStyles,
  getWorkspaceThemeVars,
} from '../utils/workspace-theme';

type UseDashboardThemeOptions = {
  isConfigFullscreenActive: boolean;
  workspaceTheme: string;
};

export function useDashboardTheme({
  isConfigFullscreenActive,
  workspaceTheme,
}: UseDashboardThemeOptions) {
  const workspaceThemeVars = useMemo(
    () => getWorkspaceThemeVars(workspaceTheme),
    [workspaceTheme],
  );
  const workspaceThemeStyles = useMemo(
    () => getWorkspaceThemeStyles(workspaceTheme),
    [workspaceTheme],
  );
  const moduleSettingStageStyle = useMemo(
    () => buildModuleSettingStageStyle(workspaceThemeVars, isConfigFullscreenActive),
    [isConfigFullscreenActive, workspaceThemeVars],
  );

  return {
    moduleSettingStageStyle,
    workspaceThemeStyles,
    workspaceThemeVars,
  };
}

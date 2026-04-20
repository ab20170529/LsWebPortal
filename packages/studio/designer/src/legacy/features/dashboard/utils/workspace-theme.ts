import type { CSSProperties } from 'react';

import {
  DETAIL_BOARD_DEFAULT_THEME,
  getDetailBoardTheme,
} from '../module-settings/detail-board-config';

export const WORKSPACE_THEME_VARS: Record<string, Record<string, string>> = {
  aurora: {
    '--workspace-accent': '#2563eb',
    '--workspace-accent-strong': '#1d4ed8',
    '--workspace-accent-soft': 'rgba(37,99,235,0.12)',
    '--workspace-accent-soft-strong': 'rgba(37,99,235,0.18)',
    '--workspace-accent-tint': 'rgba(239,246,255,0.92)',
    '--workspace-accent-surface': 'rgba(245,250,255,0.96)',
    '--workspace-accent-border': 'rgba(37,99,235,0.18)',
    '--workspace-accent-border-strong': 'rgba(96,165,250,0.44)',
    '--workspace-accent-shadow': 'rgba(37,99,235,0.34)',
    '--app-scrollbar-size': '9px',
    '--app-scrollbar-track': 'rgba(219, 234, 254, 0.72)',
    '--app-scrollbar-thumb': 'rgba(96, 165, 250, 0.72)',
    '--app-scrollbar-thumb-hover': 'rgba(59, 130, 246, 0.86)',
    '--app-scrollbar-thumb-border': 'rgba(248, 250, 252, 0.96)',
  },
  sunset: {
    '--workspace-accent': '#ea580c',
    '--workspace-accent-strong': '#c2410c',
    '--workspace-accent-soft': 'rgba(249,115,22,0.12)',
    '--workspace-accent-soft-strong': 'rgba(249,115,22,0.18)',
    '--workspace-accent-tint': 'rgba(255,247,237,0.94)',
    '--workspace-accent-surface': 'rgba(255,249,244,0.96)',
    '--workspace-accent-border': 'rgba(249,115,22,0.2)',
    '--workspace-accent-border-strong': 'rgba(251,146,60,0.46)',
    '--workspace-accent-shadow': 'rgba(234,88,12,0.32)',
    '--app-scrollbar-size': '9px',
    '--app-scrollbar-track': 'rgba(255, 237, 213, 0.74)',
    '--app-scrollbar-thumb': 'rgba(251, 146, 60, 0.74)',
    '--app-scrollbar-thumb-hover': 'rgba(234, 88, 12, 0.86)',
    '--app-scrollbar-thumb-border': 'rgba(255, 251, 235, 0.96)',
  },
  jade: {
    '--workspace-accent': '#059669',
    '--workspace-accent-strong': '#047857',
    '--workspace-accent-soft': 'rgba(5,150,105,0.12)',
    '--workspace-accent-soft-strong': 'rgba(5,150,105,0.18)',
    '--workspace-accent-tint': 'rgba(236,253,245,0.94)',
    '--workspace-accent-surface': 'rgba(244,253,249,0.96)',
    '--workspace-accent-border': 'rgba(5,150,105,0.2)',
    '--workspace-accent-border-strong': 'rgba(52,211,153,0.42)',
    '--workspace-accent-shadow': 'rgba(5,150,105,0.28)',
    '--app-scrollbar-size': '9px',
    '--app-scrollbar-track': 'rgba(209, 250, 229, 0.72)',
    '--app-scrollbar-thumb': 'rgba(52, 211, 153, 0.74)',
    '--app-scrollbar-thumb-hover': 'rgba(5, 150, 105, 0.84)',
    '--app-scrollbar-thumb-border': 'rgba(244, 253, 249, 0.96)',
  },
};

export function getWorkspaceThemeVars(theme?: string): CSSProperties {
  const normalizedTheme = theme || DETAIL_BOARD_DEFAULT_THEME;
  return WORKSPACE_THEME_VARS[normalizedTheme] ?? WORKSPACE_THEME_VARS[DETAIL_BOARD_DEFAULT_THEME];
}

export function getWorkspaceThemeStyles(theme?: string) {
  return getDetailBoardTheme(theme);
}

export function buildModuleSettingStageStyle(
  workspaceThemeVars: CSSProperties,
  isConfigFullscreenActive: boolean,
): CSSProperties {
  if (isConfigFullscreenActive) {
    return workspaceThemeVars;
  }

  return {
    ...workspaceThemeVars,
    minHeight: 'clamp(620px, calc(100dvh - 220px), 704px)',
  };
}

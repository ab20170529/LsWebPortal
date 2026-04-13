import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type PortalThemeId = 'graphite' | 'ocean' | 'sunrise';

export type PortalThemeTokens = {
  brand500: string;
  brand600: string;
  brand700: string;
  borderSoft: string;
  borderStrong: string;
  glowPrimary: string;
  glowSecondary: string;
  surfaceCanvas: string;
  surfaceCanvasAlt: string;
  surfaceMuted: string;
  surfacePanel: string;
  textPrimary: string;
  textSecondary: string;
  textSoft: string;
};

export type PortalThemeOverrides = Partial<PortalThemeTokens>;

export type PortalThemePreset = {
  description: string;
  id: PortalThemeId;
  label: string;
  tokens: PortalThemeTokens;
};

type PortalThemeContextValue = {
  overrides: PortalThemeOverrides;
  presetId: PortalThemeId;
  presets: PortalThemePreset[];
  resetOverrides: () => void;
  setPreset: (presetId: PortalThemeId) => void;
  tokens: PortalThemeTokens;
  updateOverrides: (next: PortalThemeOverrides) => void;
};

const STORAGE_KEY = 'lserp.portal.theme.v1';

const CSS_VAR_MAP: Record<keyof PortalThemeTokens, string> = {
  brand500: '--portal-color-brand-500',
  brand600: '--portal-color-brand-600',
  brand700: '--portal-color-brand-700',
  borderSoft: '--portal-color-border-soft',
  borderStrong: '--portal-color-border-strong',
  glowPrimary: '--portal-color-glow-primary',
  glowSecondary: '--portal-color-glow-secondary',
  surfaceCanvas: '--portal-color-surface-canvas',
  surfaceCanvasAlt: '--portal-color-surface-canvas-alt',
  surfaceMuted: '--portal-color-surface-muted',
  surfacePanel: '--portal-color-surface-panel',
  textPrimary: '--portal-color-text-primary',
  textSecondary: '--portal-color-text-secondary',
  textSoft: '--portal-color-text-soft',
};

export const portalThemePresets: PortalThemePreset[] = [
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Blue-led portal theme for the default ERP mother shell.',
    tokens: {
      brand500: '#1877f2',
      brand600: '#0c5fd1',
      brand700: '#0d4ba3',
      borderSoft: '#d6e3f1',
      borderStrong: '#c4d3e2',
      glowPrimary: 'rgba(24, 119, 242, 0.16)',
      glowSecondary: 'rgba(14, 165, 233, 0.16)',
      surfaceCanvas: '#f5fbff',
      surfaceCanvasAlt: '#edf4fb',
      surfaceMuted: '#eef4fa',
      surfacePanel: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textSoft: '#94a3b8',
    },
  },
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'Neutral enterprise skin for conservative business deployments.',
    tokens: {
      brand500: '#2463eb',
      brand600: '#1d4ed8',
      brand700: '#1e3a8a',
      borderSoft: '#d7dde6',
      borderStrong: '#b8c2d1',
      glowPrimary: 'rgba(36, 99, 235, 0.12)',
      glowSecondary: 'rgba(71, 85, 105, 0.14)',
      surfaceCanvas: '#f7f8fb',
      surfaceCanvasAlt: '#eef1f5',
      surfaceMuted: '#eef2f6',
      surfacePanel: '#ffffff',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textSoft: '#9ca3af',
    },
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    description: 'Warmer portal skin for product demos and visual differentiation.',
    tokens: {
      brand500: '#ea580c',
      brand600: '#c2410c',
      brand700: '#9a3412',
      borderSoft: '#ead7cb',
      borderStrong: '#dcc0b0',
      glowPrimary: 'rgba(234, 88, 12, 0.14)',
      glowSecondary: 'rgba(250, 204, 21, 0.16)',
      surfaceCanvas: '#fff8f2',
      surfaceCanvasAlt: '#fcefe3',
      surfaceMuted: '#fbefe6',
      surfacePanel: '#fffdfb',
      textPrimary: '#1f2937',
      textSecondary: '#5b4638',
      textSoft: '#a78b7a',
    },
  },
];

const PortalThemeContext = createContext<PortalThemeContextValue | null>(null);

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      overrides: PortalThemeOverrides;
      presetId: PortalThemeId;
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredTheme(value: {
  overrides: PortalThemeOverrides;
  presetId: PortalThemeId;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function getPresetById(presetId: PortalThemeId) {
  const matchedPreset = portalThemePresets.find((preset) => preset.id === presetId);
  const fallbackPreset = portalThemePresets[0];

  if (matchedPreset) {
    return matchedPreset;
  }

  if (!fallbackPreset) {
    throw new Error('At least one portal theme preset must exist.');
  }

  return fallbackPreset;
}

function mergeTokens(
  presetId: PortalThemeId,
  overrides: PortalThemeOverrides,
): PortalThemeTokens {
  return {
    ...getPresetById(presetId).tokens,
    ...overrides,
  };
}

export function applyPortalThemeTokens(
  tokens: PortalThemeTokens,
  target: HTMLElement = document.documentElement,
) {
  (Object.entries(CSS_VAR_MAP) as Array<[keyof PortalThemeTokens, string]>).forEach(
    ([tokenName, cssVarName]) => {
      target.style.setProperty(cssVarName, tokens[tokenName]);
    },
  );
}

export function PortalThemeProvider({ children }: PropsWithChildren) {
  const stored = readStoredTheme();
  const [presetId, setPresetId] = useState<PortalThemeId>(
    () => stored?.presetId ?? 'ocean',
  );
  const [overrides, setOverrides] = useState<PortalThemeOverrides>(
    () => stored?.overrides ?? {},
  );

  const tokens = useMemo(
    () => mergeTokens(presetId, overrides),
    [overrides, presetId],
  );

  useEffect(() => {
    applyPortalThemeTokens(tokens);
    writeStoredTheme({ presetId, overrides });
  }, [overrides, presetId, tokens]);

  const value = useMemo<PortalThemeContextValue>(
    () => ({
      overrides,
      presetId,
      presets: portalThemePresets,
      resetOverrides: () => {
        setOverrides({});
      },
      setPreset: (nextPresetId) => {
        setPresetId(nextPresetId);
      },
      tokens,
      updateOverrides: (next) => {
        setOverrides((current) => ({
          ...current,
          ...next,
        }));
      },
    }),
    [overrides, presetId, tokens],
  );

  return (
    <PortalThemeContext.Provider value={value}>
      {children}
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  const context = useContext(PortalThemeContext);

  if (!context) {
    throw new Error('usePortalTheme must be used within PortalThemeProvider.');
  }

  return context;
}

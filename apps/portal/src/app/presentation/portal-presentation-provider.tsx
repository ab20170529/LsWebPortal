import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type PortalShellLayoutId = 'sidebar' | 'topbar';

type PortalPresentationState = {
  shellLayoutId: PortalShellLayoutId;
};

type PortalPresentationContextValue = {
  setShellLayoutId: (layoutId: PortalShellLayoutId) => void;
  shellLayoutId: PortalShellLayoutId;
};

const STORAGE_KEY = 'lserp.portal.presentation.v1';

const PortalPresentationContext =
  createContext<PortalPresentationContextValue | null>(null);

function readStoredPresentationState() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PortalPresentationState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredPresentationState(state: PortalPresentationState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function PortalPresentationProvider({
  children,
}: PropsWithChildren) {
  const storedState = readStoredPresentationState();
  const [shellLayoutId, setShellLayoutId] = useState<PortalShellLayoutId>(
    () => storedState?.shellLayoutId ?? 'sidebar',
  );

  useEffect(() => {
    writeStoredPresentationState({ shellLayoutId });
    document.documentElement.dataset.portalShellLayout = shellLayoutId;
  }, [shellLayoutId]);

  const value = useMemo<PortalPresentationContextValue>(
    () => ({
      setShellLayoutId,
      shellLayoutId,
    }),
    [shellLayoutId],
  );

  return (
    <PortalPresentationContext.Provider value={value}>
      {children}
    </PortalPresentationContext.Provider>
  );
}

export function usePortalPresentation() {
  const context = useContext(PortalPresentationContext);

  if (!context) {
    throw new Error(
      'usePortalPresentation must be used within PortalPresentationProvider.',
    );
  }

  return context;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';

export type ProjectToastTone = 'danger' | 'success';

type ProjectToastInput = {
  durationMs?: number;
  message: string;
  tone: ProjectToastTone;
};

type ProjectToastItem = ProjectToastInput & {
  id: number;
};

type ProjectToastContextValue = {
  pushToast: (toast: ProjectToastInput) => void;
};

const ProjectToastContext = createContext<ProjectToastContextValue | null>(null);

function toneClassName(tone: ProjectToastTone) {
  return tone === 'danger'
    ? 'border-rose-200/90 bg-white/96 text-rose-700 shadow-[0_20px_45px_-28px_rgba(190,24,93,0.38)]'
    : 'border-emerald-200/90 bg-white/96 text-emerald-700 shadow-[0_20px_45px_-28px_rgba(5,150,105,0.38)]';
}

function toneIcon(tone: ProjectToastTone) {
  return tone === 'danger' ? (
    <CircleAlert className="h-4 w-4" />
  ) : (
    <CheckCircle2 className="h-4 w-4" />
  );
}

export function ProjectToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ProjectToastItem[]>([]);
  const [timeoutMap] = useState(() => new Map<number, number>());

  const dismissToast = useCallback((toastId: number) => {
    const timerId = timeoutMap.get(toastId);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timeoutMap.delete(toastId);
    }

    setToasts((current) => current.filter((item) => item.id !== toastId));
  }, [timeoutMap]);

  const pushToast = useCallback(
    ({ durationMs = 3200, message, tone }: ProjectToastInput) => {
      if (!message.trim()) {
        return;
      }

      const toastId = Date.now() + Math.floor(Math.random() * 100000);
      setToasts((current) =>
        [{ durationMs, id: toastId, message, tone }, ...current].slice(0, 3),
      );

      const timerId = window.setTimeout(() => {
        dismissToast(toastId);
      }, durationMs);
      timeoutMap.set(toastId, timerId);
    },
    [dismissToast, timeoutMap],
  );

  useEffect(() => {
    return () => {
      timeoutMap.forEach((timerId: number) => {
        window.clearTimeout(timerId);
      });
      timeoutMap.clear();
    };
  }, [timeoutMap]);

  const contextValue = useMemo(
    () => ({
      pushToast,
    }),
    [pushToast],
  );

  return (
    <ProjectToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[140] flex justify-center px-4">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-2">
          {toasts.map((toast) => (
            <button
              key={toast.id}
              className={`pointer-events-auto flex w-full items-center gap-2 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 ${toneClassName(
                toast.tone,
              )}`}
              onClick={() => {
                dismissToast(toast.id);
              }}
              type="button"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-current/8">
                {toneIcon(toast.tone)}
              </span>
              <span className="min-w-0 flex-1 truncate">{toast.message}</span>
            </button>
          ))}
        </div>
      </div>
    </ProjectToastContext.Provider>
  );
}

export function useProjectToast() {
  const context = useContext(ProjectToastContext);

  if (!context) {
    throw new Error('useProjectToast must be used within ProjectToastProvider.');
  }

  return context;
}

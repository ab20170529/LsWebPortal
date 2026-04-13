declare namespace JSX {
  interface IntrinsicAttributes {
    key?: any;
  }

  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module 'react' {
  export type CSSProperties = Record<string, string | number | undefined>;
  export type ChangeEvent<T = unknown> = {
    target: T & {
      value: string;
    };
  };
  export type ReactNode = any;
  export type PropsWithChildren<P = unknown> = P & { children?: any };
  export type HTMLAttributes<T = unknown> = Record<string, unknown>;
  export type ButtonHTMLAttributes<T = unknown> = Record<string, unknown>;
  export type Context<T> = {
    Consumer: any;
    Provider: any;
    _currentValue?: T;
  };

  export function createContext<T>(value: T): Context<T>;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly unknown[]): T;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useSyncExternalStore<T>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T,
  ): T;

  export const StrictMode: any;
  export const startTransition: (scope: () => void) => void;

  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: any): void;
  };
}

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createSingleTableModuleConfig,
  fetchSingleTableModuleConfig,
  type SingleTableModuleConfigDto,
} from '../../../lib/backend-module-config';
import { ApiError } from '../../../lib/http';

type UseEnsureSingleTableModuleOptions = {
  currentModuleCode: string;
  currentModuleName: string;
  isActive: boolean;
  onShowToast: (message: string) => void;
};

type EnsureSingleTableModuleState = 'idle' | 'checking' | 'creating' | 'ready' | 'error';

function getEnsureErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '单表模块初始化失败。';
}

export function useEnsureSingleTableModule({
  currentModuleCode,
  currentModuleName,
  isActive,
  onShowToast,
}: UseEnsureSingleTableModuleOptions) {
  const moduleCode = useMemo(() => currentModuleCode.trim(), [currentModuleCode]);
  const isReadyToEnsure = isActive && moduleCode.length > 0;
  const [state, setState] = useState<EnsureSingleTableModuleState>('idle');
  const [moduleConfig, setModuleConfig] = useState<SingleTableModuleConfigDto | null>(null);
  const ensuredModuleCodeRef = useRef<string>('');

  useEffect(() => {
    if (!isReadyToEnsure) {
      ensuredModuleCodeRef.current = '';
      return;
    }

    if (ensuredModuleCodeRef.current === moduleCode) {
      return;
    }

    const moduleName = currentModuleName.trim() || moduleCode;
    let isActiveRequest = true;

    const ensureModule = async () => {
      setState('checking');
      setModuleConfig(null);

      try {
        const existing = await fetchSingleTableModuleConfig(moduleCode);
        if (!isActiveRequest) {
          return;
        }

        ensuredModuleCodeRef.current = moduleCode;
        setModuleConfig(existing);
        setState('ready');
        return;
      } catch (error) {
        if (!isActiveRequest) {
          return;
        }

        if (!(error instanceof ApiError) || error.status !== 404) {
          setState('error');
          onShowToast(getEnsureErrorMessage(error));
          return;
        }
      }

      setState('creating');

      try {
        const created = await createSingleTableModuleConfig({
          dllcoid: moduleCode,
          toolsname: moduleName,
        });
        if (!isActiveRequest) {
          return;
        }

        ensuredModuleCodeRef.current = moduleCode;
        setModuleConfig(created);
        setState('ready');
        onShowToast(`已自动创建单表模块：${moduleName}`);
      } catch (createError) {
        if (!isActiveRequest) {
          return;
        }

        try {
          const createdByOtherRequest = await fetchSingleTableModuleConfig(moduleCode);
          if (!isActiveRequest) {
            return;
          }

          ensuredModuleCodeRef.current = moduleCode;
          setModuleConfig(createdByOtherRequest);
          setState('ready');
          return;
        } catch {
          setState('error');
          onShowToast(getEnsureErrorMessage(createError));
        }
      }
    };

    void ensureModule();

    return () => {
      isActiveRequest = false;
    };
  }, [currentModuleName, isReadyToEnsure, moduleCode, onShowToast]);

  const ensureState = isReadyToEnsure ? state : 'idle';
  const resolvedModuleConfig = isReadyToEnsure ? moduleConfig : null;

  return {
    ensureState,
    isReady: ensureState === 'ready',
    isLoading: ensureState === 'checking' || ensureState === 'creating',
    moduleConfig: resolvedModuleConfig,
  };
}

import { useEffect, useRef } from 'react';

export function useDashboardModuleSettingFullscreenInit({
  configStep,
  isConfigOpen,
  moduleSettingStep,
  processDesignStep,
  restrictionStep,
}: {
  configStep: number;
  isConfigOpen: boolean;
  moduleSettingStep: number;
  processDesignStep: number;
  restrictionStep: number;
}) {
  const moduleSettingFullscreenInitRef = useRef(false);

  useEffect(() => {
    if (!isConfigOpen) {
      moduleSettingFullscreenInitRef.current = false;
      return;
    }

    if (
      (configStep === moduleSettingStep || configStep === restrictionStep || configStep === processDesignStep)
      && !moduleSettingFullscreenInitRef.current
    ) {
      moduleSettingFullscreenInitRef.current = true;
    }
  }, [
    configStep,
    isConfigOpen,
    moduleSettingStep,
    processDesignStep,
    restrictionStep,
  ]);

  return moduleSettingFullscreenInitRef;
}

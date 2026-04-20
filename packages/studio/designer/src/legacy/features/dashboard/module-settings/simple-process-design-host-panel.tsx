import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getStoredAuthSession } from '../../../lib/auth-session';
import {
  buildSimpleProcessDesignerUrl,
  createSimpleProcessDesignerHydrateMessage,
  isSimpleProcessDesignerHostMessage,
  type ApprovalFlowFamily,
  type SimpleProcessSchema,
  type SimpleProcessSchemaVersion,
} from '../../../lib/simple-process-designer-host';

type ProcessDesignValue = {
  actionDescription: string;
  approvalFamily: ApprovalFlowFamily;
  businessCode: string;
  businessType: string;
  legacyFlowTypeId?: number;
  permissionScope: string;
  planValue: string;
  schemeCode: string;
  schemeName: string;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
};

type SimpleProcessDesignHostPanelProps = {
  currentModuleName: string;
  currentUserName?: string;
  emptyHint?: string;
  mode?: 'wizard' | 'workspace';
  onCreate?: () => void;
  onToast?: (message: string) => void;
  onUpdate: (patch: Partial<ProcessDesignValue>) => void;
  processDesign: ProcessDesignValue | null;
};

export function SimpleProcessDesignHostPanel({
  currentModuleName,
  currentUserName,
  emptyHint = '请先创建流程方案，再进入新的 Vue Simple 设计器。',
  onCreate,
  onToast,
  onUpdate,
  processDesign,
}: SimpleProcessDesignHostPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastChildDraftFingerprintRef = useRef<string | null>(null);
  const lastHydratedFingerprintRef = useRef<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bridgeState, setBridgeState] = useState<'idle' | 'ready'>('idle');
  const [retryCount, setRetryCount] = useState(0);

  const designerUrl = useMemo(() => {
    if (!processDesign) {
      return null;
    }

    return buildSimpleProcessDesignerUrl({
      approvalFamily: processDesign.approvalFamily,
      businessCode: processDesign.businessCode,
      businessType: processDesign.businessType,
      currentUserName,
      moduleName: currentModuleName,
      schemeCode: processDesign.schemeCode,
      schemeName: processDesign.schemeName,
    });
  }, [currentModuleName, currentUserName, processDesign]);

  const postHydrateMessage = useCallback((target: Window | null) => {
    if (!target || !processDesign) {
      return;
    }

    lastHydratedFingerprintRef.current = JSON.stringify(processDesign.simpleSchema ?? null);
    target.postMessage(
      createSimpleProcessDesignerHydrateMessage({
        authSession: getStoredAuthSession(),
        simpleSchema: processDesign.simpleSchema,
        simpleSchemaVersion: processDesign.simpleSchemaVersion,
      }),
      '*',
    );
  }, [processDesign]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isSimpleProcessDesignerHostMessage(event.data)) {
        return;
      }

      if (event.data.type === 'ready') {
        setBridgeState('ready');
        setRetryCount(0);
        postHydrateMessage(iframeRef.current?.contentWindow ?? null);
        onToast?.('Vue Simple 流程设计器已就绪');
        return;
      }

      if (event.data.type === 'save-draft') {
        lastChildDraftFingerprintRef.current = JSON.stringify(event.data.payload.simpleSchema ?? null);
        onUpdate({
          simpleSchema: event.data.payload.simpleSchema,
          simpleSchemaVersion: event.data.payload.simpleSchemaVersion,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onToast, onUpdate, postHydrateMessage]);

  useEffect(() => {
    if (bridgeState !== 'ready') {
      return;
    }

    const currentFingerprint = JSON.stringify(processDesign?.simpleSchema ?? null);
    if (currentFingerprint === lastChildDraftFingerprintRef.current) {
      return;
    }
    if (currentFingerprint === lastHydratedFingerprintRef.current) {
      return;
    }

    postHydrateMessage(iframeRef.current?.contentWindow ?? null);
  }, [bridgeState, postHydrateMessage, processDesign?.simpleSchema]);

  useEffect(() => {
    if (!designerUrl || bridgeState === 'ready' || retryCount >= 6) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRefreshKey((value) => value + 1);
      setRetryCount((value) => value + 1);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [bridgeState, designerUrl, retryCount]);

  if (!processDesign || !designerUrl) {
    return (
      <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-white/70 px-6 text-center dark:border-slate-700 dark:bg-slate-950/30">
        <div className="text-[18px] font-black tracking-[-0.03em] text-slate-900 dark:text-white">流程方案尚未创建</div>
        <div className="mt-2 max-w-[460px] text-[13px] leading-6 text-slate-500 dark:text-slate-300">{emptyHint}</div>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-[16px] bg-primary px-4 py-2 text-[12px] font-bold text-white shadow-[0_18px_36px_-24px_rgba(49,98,255,0.35)] transition-all hover:-translate-y-0.5 hover:bg-erp-blue"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            创建流程方案
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[780px] w-full flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_60px_-40px_rgba(15,23,42,0.32)] dark:border-slate-700 dark:bg-slate-950/60">
      <div className="min-h-0 min-w-0 flex-1 bg-white dark:bg-slate-950">
        <iframe
          ref={iframeRef}
          key={refreshKey}
          src={designerUrl}
          title="Simple Process Designer"
          className="block h-full min-h-[780px] w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}

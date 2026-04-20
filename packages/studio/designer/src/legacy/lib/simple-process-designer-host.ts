import type { AuthSession } from './backend-auth';

export type ApprovalFlowFamily = 'bill' | 'archive';
export type SimpleProcessSchema = Record<string, unknown>;
export type SimpleProcessSchemaVersion = 'v1';

export type SimpleProcessDesignerBootstrapPayload = {
  approvalFamily?: ApprovalFlowFamily;
  businessCode?: string;
  businessType?: string;
  currentUserName?: string;
  moduleName?: string;
  schemeCode?: string;
  schemeName?: string;
};

export type SimpleProcessDesignerHostMessage =
  | {
      source: 'lserp-simple-process-designer';
      type: 'ready';
      payload: SimpleProcessDesignerBootstrapPayload;
    }
  | {
      source: 'lserp-simple-process-designer';
      type: 'save-draft';
      payload: SimpleProcessDesignerBootstrapPayload & {
        simpleSchema: SimpleProcessSchema;
        simpleSchemaVersion: SimpleProcessSchemaVersion;
      };
    };

export type SimpleProcessDesignerChildMessage = {
  source: 'lserp-simple-process-designer-host';
  type: 'hydrate';
  payload: {
    authSession?: AuthSession | null;
    simpleSchema?: SimpleProcessSchema;
    simpleSchemaVersion?: SimpleProcessSchemaVersion;
  };
};

// In local Vite dev, `/simple-process-designer/` can fall back to the host SPA
// index.html. Point directly at the child app entry to avoid recursively
// loading the main workbench inside the iframe.
const DEFAULT_SIMPLE_PROCESS_DESIGNER_URL = '/simple-process-designer/index.html';

export function resolveSimpleProcessDesignerBaseUrl() {
  const envValue = import.meta.env.VITE_SIMPLE_PROCESS_DESIGNER_URL;
  if (envValue && String(envValue).trim()) {
    return String(envValue).trim();
  }

  return DEFAULT_SIMPLE_PROCESS_DESIGNER_URL;
}

export function buildSimpleProcessDesignerUrl(payload: SimpleProcessDesignerBootstrapPayload) {
  const baseUrl = resolveSimpleProcessDesignerBaseUrl();
  const url = /^https?:\/\//i.test(baseUrl)
    ? new URL(baseUrl)
    : new URL(baseUrl, typeof window === 'undefined' ? 'http://127.0.0.1' : window.location.origin);

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export function isSimpleProcessDesignerHostMessage(
  value: unknown,
): value is SimpleProcessDesignerHostMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return record.source === 'lserp-simple-process-designer' && typeof record.type === 'string';
}

export function createSimpleProcessDesignerHydrateMessage(payload: {
  authSession?: AuthSession | null;
  simpleSchema?: SimpleProcessSchema;
  simpleSchemaVersion?: SimpleProcessSchemaVersion;
}): SimpleProcessDesignerChildMessage {
  return {
    source: 'lserp-simple-process-designer-host',
    type: 'hydrate',
    payload,
  };
}

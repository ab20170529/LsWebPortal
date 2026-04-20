function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value: string) {
  return value.replace(/^\/+/, '');
}

function resolveAbsoluteUrl(value: string) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (typeof window === 'undefined') {
    return value;
  }

  return new URL(trimLeadingSlash(value), `${window.location.origin}/`).toString();
}

export const DEFAULT_RESEARCH_RECORD_WORD_TEMPLATE_PATH = '/research-record-template.blank.docx';

export type ResearchRecordWordEditorRuntime = {
  callbackUrl: string;
  canSave: boolean;
  documentServerUrl: string;
  enabled: boolean;
  templateUrl: string;
};

export function getResearchRecordWordEditorRuntime(): ResearchRecordWordEditorRuntime {
  const configuredDocumentServerUrl = trimTrailingSlash(import.meta.env.VITE_ONLYOFFICE_DOCUMENT_SERVER_URL?.trim() || '');
  const configuredCallbackUrl = import.meta.env.VITE_RESEARCH_RECORD_TEMPLATE_CALLBACK_URL?.trim() || '';
  const configuredTemplateUrl = import.meta.env.VITE_RESEARCH_RECORD_TEMPLATE_DOCX_URL?.trim() || DEFAULT_RESEARCH_RECORD_WORD_TEMPLATE_PATH;
  const templateUrl = resolveAbsoluteUrl(configuredTemplateUrl);

  return {
    callbackUrl: configuredCallbackUrl,
    canSave: Boolean(configuredCallbackUrl),
    documentServerUrl: configuredDocumentServerUrl,
    enabled: Boolean(configuredDocumentServerUrl && templateUrl),
    templateUrl,
  };
}

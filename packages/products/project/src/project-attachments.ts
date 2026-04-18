import { ApiClientError, createApiClient } from '@lserp/http';

type CommonResult<T> = {
  code: number;
  data: T;
  message: string;
};

export type ProjectAttachmentRecord = {
  downloadUrl?: string | null;
  fileCategory?: string | null;
  fileExt?: string | null;
  fileName: string;
  filePath?: string | null;
  fileSize?: number | null;
  id: number;
  projectId: number;
  projectNodeId?: number | null;
  projectTaskId?: number | null;
  remark?: string | null;
  uploadTime?: string | null;
  uploaderId?: string | null;
  uploaderName?: string | null;
};

export type UploadProjectAttachmentInput = {
  file: File;
  fileCategory?: string | null;
  projectNodeId?: number | null;
  projectTaskId?: number | null;
  remark?: string | null;
  uploaderId: string;
  uploaderName: string;
};

const AUTH_KEYS = ['lserp.portal.auth.v2', 'lserp.portal.auth.session'];

export const PROJECT_API_BASE_URL =
  (import.meta.env.VITE_PROJECT_API_BASE_URL as string | undefined)?.trim() ||
  'http://127.0.0.1:8080';

const attachmentApiClient = createApiClient({
  baseUrl: PROJECT_API_BASE_URL,
});

function trimToNull(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildProjectApiUrl(path: string) {
  const normalizedBaseUrl = PROJECT_API_BASE_URL.endsWith('/')
    ? PROJECT_API_BASE_URL
    : `${PROJECT_API_BASE_URL}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBaseUrl).toString();
}

function readStoredPortalAuthorizationHeader() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageCandidates = [window.localStorage, window.sessionStorage];

  for (const storage of storageCandidates) {
    for (const key of AUTH_KEYS) {
      const portalSessionRaw = storage.getItem(key);
      if (!portalSessionRaw) {
        continue;
      }

      try {
        const session = JSON.parse(portalSessionRaw) as {
          accessToken?: string;
          tokenType?: string;
        };

        if (!session.accessToken) {
          continue;
        }

        return `${session.tokenType?.trim() || 'Bearer'} ${session.accessToken}`;
      } catch {
        continue;
      }
    }
  }

  return null;
}

async function parseDownloadError(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as { message?: unknown };
      return String(payload.message ?? `Request failed with status ${response.status}`);
    } catch {
      return `Request failed with status ${response.status}`;
    }
  }

  const text = await response.text();
  return text || `Request failed with status ${response.status}`;
}

function resolveDownloadPath(
  attachment: Pick<ProjectAttachmentRecord, 'downloadUrl' | 'fileName'>,
  fallbackProjectId?: number,
  fallbackAttachmentId?: number,
) {
  const fromPayload = trimToNull(attachment.downloadUrl);
  if (fromPayload) {
    return buildProjectApiUrl(fromPayload);
  }

  if (
    typeof fallbackProjectId === 'number' &&
    Number.isFinite(fallbackProjectId) &&
    typeof fallbackAttachmentId === 'number' &&
    Number.isFinite(fallbackAttachmentId)
  ) {
    return buildProjectApiUrl(
      `/api/project/projects/${fallbackProjectId}/attachments/${fallbackAttachmentId}/download`,
    );
  }

  return null;
}

export async function fetchProjectAttachments(projectId: number) {
  const response = await attachmentApiClient.request<CommonResult<ProjectAttachmentRecord[]>>(
    `/api/project/projects/${projectId}/attachments`,
    {
      method: 'GET',
    },
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function uploadProjectAttachment(
  projectId: number,
  input: UploadProjectAttachmentInput,
) {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('uploaderId', input.uploaderId);
  formData.append('uploaderName', input.uploaderName);

  const fileCategory = trimToNull(input.fileCategory);
  const remark = trimToNull(input.remark);

  if (fileCategory) {
    formData.append('fileCategory', fileCategory);
  }
  if (remark) {
    formData.append('remark', remark);
  }
  if (typeof input.projectNodeId === 'number' && Number.isFinite(input.projectNodeId)) {
    formData.append('projectNodeId', String(input.projectNodeId));
  }
  if (typeof input.projectTaskId === 'number' && Number.isFinite(input.projectTaskId)) {
    formData.append('projectTaskId', String(input.projectTaskId));
  }

  const response = await attachmentApiClient.request<CommonResult<ProjectAttachmentRecord>>(
    `/api/project/projects/${projectId}/attachments/upload`,
    {
      body: formData,
      method: 'POST',
    },
  );

  return response.data;
}

export async function deleteProjectAttachment(projectId: number, attachmentId: number) {
  const response = await attachmentApiClient.request<CommonResult<boolean>>(
    `/api/project/projects/${projectId}/attachments/${attachmentId}`,
    {
      method: 'DELETE',
    },
  );
  return response.data;
}

export async function downloadProjectAttachment(
  attachment: Pick<ProjectAttachmentRecord, 'downloadUrl' | 'fileName' | 'id'>,
  fallbackProjectId?: number,
) {
  const downloadUrl = resolveDownloadPath(
    attachment,
    fallbackProjectId,
    typeof attachment.id === 'number' ? attachment.id : undefined,
  );

  if (!downloadUrl) {
    throw new Error('Attachment download endpoint is unavailable.');
  }

  const headers = new Headers();
  const authorizationHeader = readStoredPortalAuthorizationHeader();
  if (authorizationHeader) {
    headers.set('Authorization', authorizationHeader);
  }

  const response = await fetch(downloadUrl, {
    headers,
    method: 'GET',
  });

  if (!response.ok) {
    throw new ApiClientError(
      await parseDownloadError(response),
      response.status,
      null,
    );
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = attachment.fileName || 'attachment';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

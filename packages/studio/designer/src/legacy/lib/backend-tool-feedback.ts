import { apiRequest } from '../shared/api/http';

export interface ToolFeedbackAttachment {
  id: number;
  sortOrder: number;
  originalFileName: string;
  contentType?: string | null;
  fileSize: number;
  fileUrl: string;
  createdAt?: string | null;
}

export interface ToolFeedbackItem {
  id: number;
  status: string;
  title: string;
  content: string;
  expectedResult?: string | null;
  affectedPage?: string | null;
  datasourceCode?: string | null;
  companyTitle?: string | null;
  submitterEmployeeId: number;
  submitterLoginAccount?: string | null;
  submitterEmployeeName?: string | null;
  submitterDepartmentId?: number | null;
  submitterDepartmentName?: string | null;
  reviewerEmployeeId?: number | null;
  reviewerLoginAccount?: string | null;
  reviewerEmployeeName?: string | null;
  reviewerDepartmentId?: number | null;
  reviewerDepartmentName?: string | null;
  decisionRemark?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  attachments: ToolFeedbackAttachment[];
  codexPrompt: string;
}

export interface ToolFeedbackWorkspace {
  currentEmployeeId: number;
  currentLoginAccount?: string | null;
  currentEmployeeName?: string | null;
  currentDepartmentId?: number | null;
  currentDepartmentName?: string | null;
  currentCompanyTitle?: string | null;
  currentDatasourceCode?: string | null;
  canReview: boolean;
  mySuggestions: ToolFeedbackItem[];
  reviewSuggestions: ToolFeedbackItem[];
}

export interface CreateToolFeedbackInput {
  title: string;
  content: string;
  expectedResult?: string;
  affectedPage?: string;
  images?: File[];
}

export interface UpdateToolFeedbackInput extends CreateToolFeedbackInput {
  retainedAttachmentIds?: number[];
}

export type ToolFeedbackDecision = 'approved' | 'rejected' | 'completed';

export interface DecideToolFeedbackInput {
  decision: ToolFeedbackDecision;
  remark?: string;
}

export async function fetchToolFeedbackWorkspace() {
  return apiRequest<ToolFeedbackWorkspace>('/api/system/tool-feedback/workspace', {
    auth: true,
    method: 'GET',
  });
}

export async function createToolFeedback(input: CreateToolFeedbackInput) {
  const formData = new FormData();
  formData.set('title', input.title);
  formData.set('content', input.content);

  if (input.expectedResult) {
    formData.set('expectedResult', input.expectedResult);
  }

  if (input.affectedPage) {
    formData.set('affectedPage', input.affectedPage);
  }

  (input.images ?? []).forEach((file) => {
    formData.append('images', file);
  });

  return apiRequest<ToolFeedbackWorkspace>('/api/system/tool-feedback', {
    auth: true,
    body: formData,
    method: 'POST',
  });
}

export async function updateToolFeedback(id: number, input: UpdateToolFeedbackInput) {
  const formData = new FormData();
  formData.set('title', input.title);
  formData.set('content', input.content);
  formData.set('retainedAttachmentIds', JSON.stringify(input.retainedAttachmentIds ?? []));

  if (input.expectedResult) {
    formData.set('expectedResult', input.expectedResult);
  }

  if (input.affectedPage) {
    formData.set('affectedPage', input.affectedPage);
  }

  (input.images ?? []).forEach((file) => {
    formData.append('images', file);
  });

  return apiRequest<ToolFeedbackWorkspace>(`/api/system/tool-feedback/${id}`, {
    auth: true,
    body: formData,
    method: 'PUT',
  });
}

export async function decideToolFeedback(id: number, input: DecideToolFeedbackInput) {
  return apiRequest<ToolFeedbackWorkspace>(`/api/system/tool-feedback/${id}/decision`, {
    auth: true,
    body: input,
    method: 'PUT',
  });
}

export async function completeToolFeedback(id: number, remark?: string) {
  return decideToolFeedback(id, {
    decision: 'completed',
    remark,
  });
}

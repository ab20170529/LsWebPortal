import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type RefObject,
} from 'react';

import {
  completeToolFeedback,
  createToolFeedback,
  decideToolFeedback,
  fetchToolFeedbackWorkspace,
  type CreateToolFeedbackInput,
  type ToolFeedbackAttachment,
  type ToolFeedbackItem,
  type ToolFeedbackWorkspace,
  updateToolFeedback,
} from '../../lib/backend-tool-feedback';
import { ApiError } from '../../shared/api/http';

type ToolFeedbackWorkbenchProps = {
  activeFirstLevelMenuName: string;
  activeSubsystemName: string;
  currentUserName: string;
};

type ToolFeedbackDraftImage = {
  file: File;
  id: string;
  previewUrl: string;
};

type ToolFeedbackDraft = {
  affectedPage: string;
  content: string;
  existingAttachments: ToolFeedbackAttachment[];
  expectedResult: string;
  images: ToolFeedbackDraftImage[];
  mode: 'create' | 'resubmit';
  suggestionId: number | null;
  title: string;
};

type ToolFeedbackDraftTextPatch = Partial<Omit<ToolFeedbackDraft, 'existingAttachments' | 'images'>>;

type ToolFeedbackListSource = 'mine' | 'review';
type ToolFeedbackListTab = 'active' | 'completed';

type ToolFeedbackSelectedEntry = {
  id: number;
  source: ToolFeedbackListSource;
} | null;

type ToolFeedbackListRowProps = {
  item: ToolFeedbackItem;
  key?: number | string;
  onOpen: (item: ToolFeedbackItem, source: ToolFeedbackListSource) => void;
  source: ToolFeedbackListSource;
};

type ToolFeedbackDetailModalProps = {
  actionInProgressId: number | null;
  canReview: boolean;
  copiedSuggestionId: number | null;
  item: ToolFeedbackItem;
  onApprove: (item: ToolFeedbackItem) => void;
  onClose: () => void;
  onComplete: (item: ToolFeedbackItem) => void;
  onCopy: (item: ToolFeedbackItem) => void;
  onReject: (item: ToolFeedbackItem) => void;
  onResubmit: (item: ToolFeedbackItem) => void;
  source: ToolFeedbackListSource;
};

type ToolFeedbackCreateModalProps = {
  affectedPagePlaceholder: string;
  draft: ToolFeedbackDraft;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  onAddImages: (files: Iterable<File> | FileList | null | undefined) => void;
  onChange: (patch: ToolFeedbackDraftTextPatch) => void;
  onClose: () => void;
  onImageInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenImagePicker: () => void;
  onRemoveExistingAttachment: (attachmentId: number) => void;
  onRemoveImage: (imageId: string) => void;
  onSubmit: () => void;
};

const TOOL_FEEDBACK_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const EMPTY_TOOL_FEEDBACK_LIST: ToolFeedbackItem[] = [];
const TOOL_FEEDBACK_ALLOWED_IMAGE_TYPES = new Set([
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
const TOOL_FEEDBACK_MAX_IMAGE_COUNT = 8;
const TOOL_FEEDBACK_MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const TOOL_FEEDBACK_UPLOAD_GRID_SLOTS = 9;

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '请求失败，请稍后重试。';
}

function trimText(value?: string | null) {
  return String(value || '').trim();
}

function normalizeStatus(status?: string | null) {
  return trimText(status).toLowerCase();
}

function isCompletedStatus(status?: string | null) {
  return normalizeStatus(status) === 'completed';
}

function isHiddenCompanyIdentifier(value?: string | null) {
  const normalizedValue = trimText(value);
  if (!normalizedValue) {
    return true;
  }

  return /^company_[a-z0-9]+$/i.test(normalizedValue);
}

function getDisplayCompanyLabel(value?: string | null) {
  const normalizedValue = trimText(value);
  if (isHiddenCompanyIdentifier(normalizedValue)) {
    return '';
  }

  return normalizedValue;
}

function buildDefaultAffectedPage(activeSubsystemName: string, activeFirstLevelMenuName: string) {
  return [activeSubsystemName, activeFirstLevelMenuName]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' / ');
}

function createEmptyDraft(): ToolFeedbackDraft {
  return {
    affectedPage: '',
    content: '',
    existingAttachments: [],
    expectedResult: '',
    images: [],
    mode: 'create',
    suggestionId: null,
    title: '',
  };
}

function createDraftFromSuggestion(item: ToolFeedbackItem): ToolFeedbackDraft {
  return {
    affectedPage: trimText(item.affectedPage),
    content: item.content || '',
    existingAttachments: item.attachments.map((attachment) => ({ ...attachment })),
    expectedResult: trimText(item.expectedResult),
    images: [],
    mode: 'resubmit',
    suggestionId: item.id,
    title: item.title || '',
  };
}

function revokeDraftImages(images: ToolFeedbackDraftImage[]) {
  images.forEach((image) => {
    URL.revokeObjectURL(image.previewUrl);
  });
}

function createDraftImageId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `draft-image-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildDraftImages(files: File[]) {
  return files.map((file) => ({
    file,
    id: createDraftImageId(),
    previewUrl: URL.createObjectURL(file),
  }));
}

function formatFeedbackTime(value?: string | null) {
  const normalizedValue = trimText(value);
  if (!normalizedValue) {
    return '刚刚';
  }

  const parsed = new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) {
    return normalizedValue;
  }

  return TOOL_FEEDBACK_DATE_FORMATTER.format(parsed);
}

function formatFileSize(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)}MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)}KB`;
  }

  return `${Math.max(0, Math.round(value))}B`;
}

function getStatusMeta(status: string) {
  switch (normalizeStatus(status)) {
    case 'completed':
      return {
        badgeClass: 'border-emerald-200 bg-emerald-100 text-emerald-700',
        icon: 'task_alt',
        label: '已完成',
      };
    case 'approved':
      return {
        badgeClass: 'border-sky-100 bg-sky-50 text-sky-700',
        icon: 'thumb_up',
        label: '已同意',
      };
    case 'rejected':
      return {
        badgeClass: 'border-rose-100 bg-rose-50 text-rose-700',
        icon: 'block',
        label: '已驳回',
      };
    default:
      return {
        badgeClass: 'border-amber-100 bg-amber-50 text-amber-700',
        icon: 'hourglass_top',
        label: '待处理',
      };
  }
}

function buildRowSnippet(item: ToolFeedbackItem) {
  const normalizedContent = trimText(item.content);
  if (!normalizedContent) {
    return '未填写问题描述';
  }

  return normalizedContent.length > 64 ? `${normalizedContent.slice(0, 64)}...` : normalizedContent;
}

function buildRowContext(item: ToolFeedbackItem, source: ToolFeedbackListSource) {
  if (source === 'review') {
    const submitterLabel = [item.submitterEmployeeName, item.submitterDepartmentName].filter(Boolean).join(' / ');
    return {
      primary: submitterLabel || '未识别提出人',
      secondary: trimText(item.affectedPage) || '未填写涉及页面',
    };
  }

  return {
    primary: trimText(item.affectedPage) || '未填写涉及页面',
    secondary: getDisplayCompanyLabel(item.companyTitle) || '未识别帐套',
  };
}

async function copyTextToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error('当前浏览器不支持剪贴板复制。');
}

function extractImageFiles(files: Iterable<File> | FileList | null | undefined) {
  return Array.from(files ?? []).filter((file) => file instanceof File);
}

function normalizeIncomingDraftImages(files: File[], currentCount: number) {
  const acceptedFiles: File[] = [];
  const problems: string[] = [];
  let remainingSlots = Math.max(0, TOOL_FEEDBACK_MAX_IMAGE_COUNT - currentCount);

  files.forEach((file, index) => {
    const contentType = trimText(file.type).toLowerCase();
    if (!TOOL_FEEDBACK_ALLOWED_IMAGE_TYPES.has(contentType)) {
      problems.push(`第 ${index + 1} 张不是支持的图片格式。`);
      return;
    }

    if (file.size > TOOL_FEEDBACK_MAX_IMAGE_SIZE) {
      problems.push(`第 ${index + 1} 张图片超过 10MB 限制。`);
      return;
    }

    if (remainingSlots <= 0) {
      problems.push(`最多只能上传 ${TOOL_FEEDBACK_MAX_IMAGE_COUNT} 张图片。`);
      return;
    }

    acceptedFiles.push(file);
    remainingSlots -= 1;
  });

  return {
    acceptedFiles,
    message: problems[0] ?? null,
  };
}

function ToolFeedbackStatusBadge({ status }: { status: string }) {
  const statusMeta = getStatusMeta(status);

  return (
    <div className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.badgeClass}`}>
      <span className="material-symbols-outlined text-[16px]">{statusMeta.icon}</span>
      {statusMeta.label}
    </div>
  );
}

function ToolFeedbackListTabBar({
  activeCount,
  activeTab,
  completedCount,
  onChange,
}: {
  activeCount: number;
  activeTab: ToolFeedbackListTab;
  completedCount: number;
  onChange: (tab: ToolFeedbackListTab) => void;
}) {
  return (
    <div className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      <button
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
          activeTab === 'active'
            ? 'bg-white text-slate-900 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.45)]'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        type="button"
        onClick={() => onChange('active')}
      >
        <span>当前记录</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{activeCount}</span>
      </button>
      <button
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
          activeTab === 'completed'
            ? 'bg-white text-slate-900 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.45)]'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        type="button"
        onClick={() => onChange('completed')}
      >
        <span>已完成归档</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{completedCount}</span>
      </button>
    </div>
  );
}

function ToolFeedbackAttachmentGallery({ attachments }: { attachments: ToolFeedbackAttachment[] }) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-black tracking-tight text-slate-950">问题截图</h4>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          共 {attachments.length} 张
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            className="group overflow-hidden rounded-[18px] border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_36px_-28px_rgba(8,145,178,0.45)]"
            href={attachment.fileUrl}
            rel="noreferrer"
            target="_blank"
          >
            <div className="aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.1),transparent_45%),linear-gradient(180deg,#f8fafc,#e2e8f0)]">
              <img
                alt={attachment.originalFileName}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                loading="lazy"
                src={attachment.fileUrl}
              />
            </div>
            <div className="space-y-1 px-3 py-3">
              <div className="truncate text-sm font-semibold text-slate-800">{attachment.originalFileName}</div>
              <div className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function ToolFeedbackListRow({
  item,
  onOpen,
  source,
}: ToolFeedbackListRowProps) {
  const context = buildRowContext(item, source);

  return (
    <button
      className="grid w-full gap-3 border-b border-slate-200/80 px-4 py-4 text-left transition-colors hover:bg-slate-50/80 md:grid-cols-[112px_minmax(0,1.85fr)_minmax(0,0.92fr)_72px_132px_28px] md:items-center"
      type="button"
      onClick={() => onOpen(item, source)}
    >
      <div className="flex items-center">
        <ToolFeedbackStatusBadge status={item.status} />
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-slate-900">{item.title}</div>
        <div className="mt-1 truncate text-xs text-slate-500">{buildRowSnippet(item)}</div>
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-700">{context.primary}</div>
        <div className="mt-1 truncate text-xs text-slate-500">{context.secondary}</div>
      </div>

      <div className="text-sm font-semibold text-slate-600">
        {item.attachments.length > 0 ? `${item.attachments.length} 张` : '无图片'}
      </div>

      <div className="text-sm text-slate-500">{formatFeedbackTime(item.reviewedAt || item.updatedAt || item.createdAt)}</div>

      <div className="hidden justify-self-end text-slate-400 md:block">
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </div>
    </button>
  );
}

function ToolFeedbackListEmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: string;
  title: string;
}) {
  return (
    <div className="flex h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full border border-slate-200 bg-slate-50 p-3 text-slate-400">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <div className="mt-4 text-base font-bold text-slate-900">{title}</div>
      <div className="mt-2 max-w-md text-sm leading-7 text-slate-500">{description}</div>
    </div>
  );
}

function ToolFeedbackDetailModal({
  actionInProgressId,
  canReview,
  copiedSuggestionId,
  item,
  onApprove,
  onClose,
  onComplete,
  onCopy,
  onReject,
  onResubmit,
  source,
}: ToolFeedbackDetailModalProps) {
  const normalizedStatus = normalizeStatus(item.status);
  const allowDecision = canReview && source === 'review' && normalizedStatus === 'pending';
  const allowComplete = canReview && normalizedStatus === 'approved';
  const allowResubmit = source === 'mine' && normalizedStatus === 'rejected';
  const isActing = actionInProgressId === item.id;
  const submitterLabel = [item.submitterEmployeeName, item.submitterDepartmentName].filter(Boolean).join(' / ');
  const reviewerLabel = [item.reviewerEmployeeName, item.reviewerDepartmentName].filter(Boolean).join(' / ');
  const companyLabel = getDisplayCompanyLabel(item.companyTitle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/38 p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(92vh,980px)] w-full max-w-[1240px] flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_48px_120px_-48px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200/80 px-7 py-4">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ToolFeedbackStatusBadge status={item.status} />
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  {formatFeedbackTime(item.createdAt)}
                </div>
              </div>
              <h3 className="mt-3 truncate text-[24px] font-black tracking-tight text-slate-950">{item.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {submitterLabel ? <span>提出人：{submitterLabel}</span> : null}
                {companyLabel ? <span>帐套：{companyLabel}</span> : null}
              </div>
            </div>

            <button
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-5">
              <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">问题描述</div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-700">{item.content}</div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">期望效果</div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-700">
                  {trimText(item.expectedResult) || '未单独填写，默认按问题描述理解。'}
                </div>
              </section>

              {trimText(item.decisionRemark) ? (
                <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">处理备注</div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-700">{item.decisionRemark}</div>
                </section>
              ) : null}

              <ToolFeedbackAttachmentGallery attachments={item.attachments} />
            </div>

            <aside className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_34px_-34px_rgba(15,23,42,0.3)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">快捷操作</div>
                <div className="mt-4 grid gap-3">
                  {allowResubmit ? (
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100"
                      type="button"
                      onClick={() => onResubmit(item)}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_square</span>
                      修改后重新上报
                    </button>
                  ) : null}

                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/30 hover:text-primary"
                    type="button"
                    onClick={() => void onCopy(item)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedSuggestionId === item.id ? 'done' : 'content_copy'}
                    </span>
                    {copiedSuggestionId === item.id ? '已复制到 Codex' : '复制到 Codex'}
                  </button>

                  {allowDecision ? (
                    <>
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isActing}
                        type="button"
                        onClick={() => onApprove(item)}
                      >
                        <span className="material-symbols-outlined text-[18px]">{isActing ? 'progress_activity' : 'task_alt'}</span>
                        同意这条意见
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isActing}
                        type="button"
                        onClick={() => onReject(item)}
                      >
                        <span className="material-symbols-outlined text-[18px]">{isActing ? 'progress_activity' : 'block'}</span>
                        驳回这条意见
                      </button>
                    </>
                  ) : null}

                  {allowComplete ? (
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isActing}
                      type="button"
                      onClick={() => onComplete(item)}
                    >
                      <span className="material-symbols-outlined text-[18px]">{isActing ? 'progress_activity' : 'task_alt'}</span>
                      标记为已完成
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_34px_-34px_rgba(15,23,42,0.24)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">详细信息</div>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">涉及页面</dt>
                    <dd className="mt-1 leading-7">{trimText(item.affectedPage) || '未填写'}</dd>
                  </div>
                  {companyLabel ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">帐套</dt>
                      <dd className="mt-1 leading-7">{companyLabel}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">提出人</dt>
                    <dd className="mt-1 leading-7">{submitterLabel || '未识别'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">处理人</dt>
                    <dd className="mt-1 leading-7">{reviewerLabel || '尚未处理'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">更新时间</dt>
                    <dd className="mt-1 leading-7">{formatFeedbackTime(item.reviewedAt || item.updatedAt || item.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">图片数量</dt>
                    <dd className="mt-1 leading-7">{item.attachments.length > 0 ? `${item.attachments.length} 张` : '无'}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolFeedbackCreateModal({
  affectedPagePlaceholder,
  draft,
  fileInputRef,
  isSubmitting,
  onAddImages,
  onChange,
  onClose,
  onImageInputChange,
  onOpenImagePicker,
  onRemoveExistingAttachment,
  onRemoveImage,
  onSubmit,
}: ToolFeedbackCreateModalProps) {
  const dragCounterRef = useRef(0);
  const [isDropActive, setIsDropActive] = useState(false);
  const totalImageCount = draft.existingAttachments.length + draft.images.length;
  const gridPlaceholderCount = Math.max(0, TOOL_FEEDBACK_UPLOAD_GRID_SLOTS - totalImageCount - 1);
  const isResubmit = draft.mode === 'resubmit';

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedImageFiles = extractImageFiles(event.clipboardData?.files).filter((file) => file.type.startsWith('image/'));
    if (pastedImageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    onAddImages(pastedImageFiles);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDropActive(false);
    onAddImages(event.dataTransfer.files);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
      onPaste={handlePaste}
    >
      <div className="flex w-full max-w-[1240px] flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_48px_120px_-48px_rgba(15,23,42,0.45)]">
        <input
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
          className="hidden"
          multiple
          type="file"
          onChange={onImageInputChange}
        />

        <div className="border-b border-slate-200/80 px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                {isResubmit ? '修改重提' : '新增意见'}
              </div>
              <h3 className="mt-2 text-[24px] font-black tracking-tight text-slate-950">
                {isResubmit ? '把被驳回的意见改好后重新上报' : '把问题整理成研发可直接处理的说明'}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {isResubmit
                  ? '左边直接修改标题、描述和期望效果，右侧保留或替换原截图，提交后会重新进入待处理。'
                  : '左边写问题，右上角九宫格补截图。涉及页面按实际情况填写，不默认带值。'}
              </p>
            </div>

            <button
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="px-7 py-5">
          <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid content-start gap-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">意见标题</label>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="例如：审批列表点击后最好先看详情再处理"
                    type="text"
                    value={draft.title}
                    onChange={(event) => onChange({ title: event.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">涉及页面</label>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={affectedPagePlaceholder}
                    type="text"
                    value={draft.affectedPage}
                    onChange={(event) => onChange({ affectedPage: event.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">问题描述</label>
                <textarea
                  className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="把复现步骤、当前表现、影响范围写清楚。"
                  value={draft.content}
                  onChange={(event) => onChange({ content: event.target.value })}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">期望效果</label>
                <textarea
                  className="min-h-[164px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="例如：希望列表是行数据样式，点开后再看详情，详情里再决定是否同意。"
                  value={draft.expectedResult}
                  onChange={(event) => onChange({ expectedResult: event.target.value })}
                />
              </div>
            </div>

            <aside className="self-stretch">
              <section className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#ffffff)] px-4 py-4 shadow-[0_18px_34px_-32px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">问题截图</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">右上角九宫格上传</div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {totalImageCount}/{TOOL_FEEDBACK_MAX_IMAGE_COUNT}
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-[22px] border p-3 transition-all ${
                    isDropActive
                      ? 'border-cyan-300 bg-cyan-50/80 shadow-[0_18px_40px_-28px_rgba(8,145,178,0.35)]'
                      : 'border-slate-200 bg-white'
                  }`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    dragCounterRef.current += 1;
                    setIsDropActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
                    if (dragCounterRef.current === 0) {
                      setIsDropActive(false);
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDropActive(true);
                  }}
                  onDrop={handleDrop}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="group flex aspect-square flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                      type="button"
                      onClick={onOpenImagePicker}
                    >
                      <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">上传</span>
                    </button>

                    {draft.existingAttachments.map((attachment) => (
                      <div
                        key={`existing-${attachment.id}`}
                        className="group relative aspect-square overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100"
                        title={attachment.originalFileName}
                      >
                        <img alt={attachment.originalFileName} className="h-full w-full object-cover" src={attachment.fileUrl} />
                        <div className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          原图
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 to-transparent px-2 pb-1 pt-5 text-[10px] font-semibold text-white">
                          <div className="truncate">{formatFileSize(attachment.fileSize)}</div>
                        </div>
                        <button
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                          type="button"
                          onClick={() => onRemoveExistingAttachment(attachment.id)}
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}

                    {draft.images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100"
                        title={image.file.name}
                      >
                        <img alt={image.file.name} className="h-full w-full object-cover" src={image.previewUrl} />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/60 to-transparent px-2 pb-1 pt-5 text-[10px] font-semibold text-white">
                          <div className="truncate">{formatFileSize(image.file.size)}</div>
                        </div>
                        <button
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                          type="button"
                          onClick={() => onRemoveImage(image.id)}
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}

                    {Array.from({ length: gridPlaceholderCount }).map((_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className="aspect-square rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-3">
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-6 text-slate-500">
                    {isResubmit
                      ? '原截图会继续保留，删除后则不再随这次重提一起上报。支持拖拽、点击和直接粘贴继续补图。'
                      : '图片会缩成小图显示。支持拖拽、点击和直接粘贴截图，不再铺成大预览卡片。'}
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 px-7 py-5">
          <button
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            type="button"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-erp-blue disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            disabled={isSubmitting}
            type="button"
            onClick={onSubmit}
          >
            <span className="material-symbols-outlined text-[18px]">{isSubmitting ? 'progress_activity' : 'send'}</span>
            {isSubmitting ? '提交中...' : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToolFeedbackWorkbench({
  activeFirstLevelMenuName,
  activeSubsystemName,
  currentUserName,
}: ToolFeedbackWorkbenchProps) {
  const affectedPagePlaceholder = useMemo(() => {
    const currentPath = buildDefaultAffectedPage(activeSubsystemName, activeFirstLevelMenuName);
    return currentPath ? `例如：${currentPath}` : '例如：采购管理 / 意见上报';
  }, [activeFirstLevelMenuName, activeSubsystemName]);
  const [workspace, setWorkspace] = useState<ToolFeedbackWorkspace | null>(null);
  const [draft, setDraft] = useState<ToolFeedbackDraft>(() => createEmptyDraft());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<number | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myListTab, setMyListTab] = useState<ToolFeedbackListTab>('active');
  const [reviewListTab, setReviewListTab] = useState<ToolFeedbackListTab>('active');
  const [selectedEntry, setSelectedEntry] = useState<ToolFeedbackSelectedEntry>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestDraftExistingAttachmentsRef = useRef<ToolFeedbackAttachment[]>([]);
  const latestDraftImagesRef = useRef<ToolFeedbackDraftImage[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    latestDraftExistingAttachmentsRef.current = draft.existingAttachments;
  }, [draft.existingAttachments]);

  useEffect(() => {
    latestDraftImagesRef.current = draft.images;
  }, [draft.images]);

  useEffect(() => () => {
    revokeDraftImages(latestDraftImagesRef.current);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadWorkspace = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchToolFeedbackWorkspace();
        if (!isActive) {
          return;
        }

        startTransition(() => setWorkspace(data));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      isActive = false;
    };
  }, []);

  const mySuggestions = workspace?.mySuggestions ?? EMPTY_TOOL_FEEDBACK_LIST;
  const reviewSuggestions = workspace?.reviewSuggestions ?? EMPTY_TOOL_FEEDBACK_LIST;
  const canReview = workspace?.canReview ?? false;
  const myCompletedSuggestions = useMemo(
    () => mySuggestions.filter((item) => isCompletedStatus(item.status)),
    [mySuggestions],
  );
  const myActiveSuggestions = useMemo(
    () => mySuggestions.filter((item) => !isCompletedStatus(item.status)),
    [mySuggestions],
  );
  const reviewCompletedSuggestions = useMemo(
    () => reviewSuggestions.filter((item) => isCompletedStatus(item.status)),
    [reviewSuggestions],
  );
  const reviewActiveSuggestions = useMemo(
    () => reviewSuggestions.filter((item) => !isCompletedStatus(item.status)),
    [reviewSuggestions],
  );
  const visibleMySuggestions = myListTab === 'completed' ? myCompletedSuggestions : myActiveSuggestions;
  const visibleReviewSuggestions = reviewListTab === 'completed' ? reviewCompletedSuggestions : reviewActiveSuggestions;
  const myPendingCount = useMemo(
    () => mySuggestions.filter((item) => normalizeStatus(item.status) === 'pending').length,
    [mySuggestions],
  );
  const reviewPendingCount = useMemo(
    () => reviewSuggestions.filter((item) => normalizeStatus(item.status) === 'pending').length,
    [reviewSuggestions],
  );

  const selectedItem = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }

    const sourceList = selectedEntry.source === 'review' ? reviewSuggestions : mySuggestions;
    return sourceList.find((item) => item.id === selectedEntry.id) ?? null;
  }, [mySuggestions, reviewSuggestions, selectedEntry]);

  useEffect(() => {
    if (selectedEntry && !selectedItem) {
      setSelectedEntry(null);
    }
  }, [selectedEntry, selectedItem]);

  useEffect(() => {
    if (!isCreateModalOpen && !selectedEntry) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (selectedEntry) {
        setSelectedEntry(null);
        return;
      }

      setIsCreateModalOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, selectedEntry]);

  const resetDraft = () => {
    setDraft((prev) => {
      revokeDraftImages(prev.images);
      return createEmptyDraft();
    });
  };

  const handleDraftChange = (patch: ToolFeedbackDraftTextPatch) => {
    setDraft((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const openCreateModal = () => {
    resetDraft();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreateModalOpen(true);
  };

  const openResubmitModal = (item: ToolFeedbackItem) => {
    setDraft((prev) => {
      revokeDraftImages(prev.images);
      return createDraftFromSuggestion(item);
    });
    setSelectedEntry(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreateModalOpen(true);
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAddImages = (incomingFiles: Iterable<File> | FileList | null | undefined) => {
    const imageFiles = extractImageFiles(incomingFiles);
    if (imageFiles.length === 0) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const { acceptedFiles, message } = normalizeIncomingDraftImages(
      imageFiles,
      latestDraftImagesRef.current.length + latestDraftExistingAttachmentsRef.current.length,
    );
    if (acceptedFiles.length > 0) {
      const nextDraftImages = buildDraftImages(acceptedFiles);
      setDraft((prev) => ({
        ...prev,
        images: [...prev.images, ...nextDraftImages],
      }));
    }

    if (message) {
      setErrorMessage(message);
    }
  };

  const handleRemoveExistingAttachment = (attachmentId: number) => {
    setDraft((prev) => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter((attachment) => attachment.id !== attachmentId),
    }));
  };

  const handleRemoveDraftImage = (imageId: string) => {
    setDraft((prev) => {
      const targetImage = prev.images.find((image) => image.id === imageId);
      if (targetImage) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      return {
        ...prev,
        images: prev.images.filter((image) => image.id !== imageId),
      };
    });
  };

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleAddImages(event.target.files);
    event.target.value = '';
  };

  const handleSubmit = async () => {
    const normalizedTitle = trimText(draft.title);
    const normalizedContent = trimText(draft.content);
    const isResubmit = draft.mode === 'resubmit' && Number.isInteger(draft.suggestionId) && Number(draft.suggestionId) > 0;

    if (!normalizedTitle) {
      setErrorMessage('请先填写意见标题。');
      return;
    }

    if (!normalizedContent) {
      setErrorMessage('请先填写问题描述。');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const submitPayload = {
        affectedPage: trimText(draft.affectedPage),
        content: normalizedContent,
        expectedResult: trimText(draft.expectedResult),
        images: draft.images.map((image) => image.file),
        title: normalizedTitle,
      } satisfies CreateToolFeedbackInput;
      const nextWorkspace = isResubmit
        ? await updateToolFeedback(Number(draft.suggestionId), {
          ...submitPayload,
          retainedAttachmentIds: draft.existingAttachments.map((attachment) => attachment.id),
        })
        : await createToolFeedback(submitPayload);

      startTransition(() => setWorkspace(nextWorkspace));
      setIsCreateModalOpen(false);
      resetDraft();
      setSuccessMessage(
        isResubmit
          ? '意见已修改并重新上报。'
          : draft.images.length > 0
            ? `意见和 ${draft.images.length} 张补充图片都已提交。`
            : '意见已提交。',
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (item: ToolFeedbackItem, decision: 'approved' | 'rejected') => {
    setActionInProgressId(item.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nextWorkspace = await decideToolFeedback(item.id, { decision });
      startTransition(() => setWorkspace(nextWorkspace));
      setSuccessMessage(decision === 'approved' ? '该意见已同意。' : '该意见已驳回。');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleComplete = async (item: ToolFeedbackItem) => {
    setActionInProgressId(item.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nextWorkspace = await completeToolFeedback(item.id);
      startTransition(() => setWorkspace(nextWorkspace));
      setSuccessMessage('该意见已标记完成。');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCopy = async (item: ToolFeedbackItem) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await copyTextToClipboard(item.codexPrompt);
      setCopiedSuggestionId(item.id);
      setSuccessMessage('需求内容已复制，可以直接粘贴到 Codex。');
      window.setTimeout(() => {
        setCopiedSuggestionId((current) => (current === item.id ? null : current));
      }, 1800);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const openDetail = (item: ToolFeedbackItem, source: ToolFeedbackListSource) => {
    setSelectedEntry({
      id: item.id,
      source,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_18px_34px_-34px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-black tracking-tight text-slate-950">意见上报</div>
            <div className="mt-1 text-sm text-slate-500">列表按行展示，点击任意一条进入详情，再决定复制或审批。</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                当前人员：{workspace?.currentEmployeeName || currentUserName}
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                部门：{workspace?.currentDepartmentName || '未识别'}
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                canReview ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                {canReview ? `审批队列 ${reviewPendingCount} 条待处理` : '当前账号无审批权限'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              我的待处理 <span className="ml-2 font-black text-slate-950">{myPendingCount}</span>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              已完成归档 <span className="ml-2 font-black text-slate-950">{myCompletedSuggestions.length}</span>
            </div>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#0f766e,#155e75)] px-5 text-sm font-bold text-white shadow-[0_20px_36px_-28px_rgba(15,118,110,0.85)] transition-transform hover:-translate-y-0.5"
              type="button"
              onClick={openCreateModal}
            >
              <span className="material-symbols-outlined text-[18px]">add_comment</span>
              新增意见
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-h-[460px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_22px_46px_-40px_rgba(15,23,42,0.24)]">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-950">我的上报记录</h4>
                <div className="mt-1 text-xs text-slate-500">当前记录展示未完成项目，已完成会自动收进归档页签。</div>
                <ToolFeedbackListTabBar
                  activeCount={myActiveSuggestions.length}
                  activeTab={myListTab}
                  completedCount={myCompletedSuggestions.length}
                  onChange={setMyListTab}
                />
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                共 {visibleMySuggestions.length} 条
              </div>
            </div>
          </div>

          {!isLoading && visibleMySuggestions.length > 0 ? (
            <div className="grid border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 md:grid-cols-[112px_minmax(0,1.85fr)_minmax(0,0.92fr)_72px_132px_28px]">
              <div>状态</div>
              <div>标题 / 概要</div>
              <div>涉及页面 / 帐套</div>
              <div>图片</div>
              <div>时间</div>
              <div />
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex h-[420px] items-center justify-center text-slate-400">正在加载意见记录...</div>
          ) : visibleMySuggestions.length > 0 ? (
            <div className="h-full overflow-y-auto">
              {visibleMySuggestions.map((item) => (
                <ToolFeedbackListRow
                  key={item.id}
                  item={item}
                  onOpen={openDetail}
                  source="mine"
                />
              ))}
            </div>
          ) : (
            <ToolFeedbackListEmptyState
              description={myListTab === 'completed'
                ? '研发把意见处理完成后，会自动收进这里暂存归档。'
                : '点击右上角“新增意见”，把问题和截图一起提交给研发。'}
              icon={myListTab === 'completed' ? 'inventory_2' : 'rate_review'}
              title={myListTab === 'completed' ? '还没有已完成归档' : '还没有提交过意见'}
            />
          )}
        </section>

        <section className="min-h-[460px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_22px_46px_-40px_rgba(15,23,42,0.24)]">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-950">研发审批队列</h4>
                <div className="mt-1 text-xs text-slate-500">
                  {canReview ? '未完成项目留在当前记录里，完成后的项目会进入归档页签。' : '当前账号不是研发部门，仅展示权限状态。'}
                </div>
                {canReview ? (
                  <ToolFeedbackListTabBar
                    activeCount={reviewActiveSuggestions.length}
                    activeTab={reviewListTab}
                    completedCount={reviewCompletedSuggestions.length}
                    onChange={setReviewListTab}
                  />
                ) : null}
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                canReview
                  ? 'border-cyan-100 bg-cyan-50 text-cyan-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                {canReview
                  ? `${reviewListTab === 'completed' ? '归档' : '待处理'} ${reviewListTab === 'completed' ? reviewCompletedSuggestions.length : reviewPendingCount}`
                  : '无审批权限'}
              </div>
            </div>
          </div>

          {canReview && !isLoading && visibleReviewSuggestions.length > 0 ? (
            <div className="grid border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 md:grid-cols-[112px_minmax(0,1.85fr)_minmax(0,0.92fr)_72px_132px_28px]">
              <div>状态</div>
              <div>标题 / 概要</div>
              <div>提出人 / 页面</div>
              <div>图片</div>
              <div>时间</div>
              <div />
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex h-[420px] items-center justify-center text-slate-400">正在加载审批队列...</div>
          ) : canReview ? (
            visibleReviewSuggestions.length > 0 ? (
              <div className="h-full overflow-y-auto">
                {visibleReviewSuggestions.map((item) => (
                  <ToolFeedbackListRow
                    key={item.id}
                    item={item}
                    onOpen={openDetail}
                    source="review"
                  />
                ))}
              </div>
            ) : (
              <ToolFeedbackListEmptyState
                description={reviewListTab === 'completed'
                  ? '研发处理完成的意见会暂时收进这里，避免影响当前审批观感。'
                  : '实施同事提交的新意见会自动进入这里。'}
                icon={reviewListTab === 'completed' ? 'inventory_2' : 'hourglass_top'}
                title={reviewListTab === 'completed' ? '当前没有完成归档' : '当前没有未完成意见'}
              />
            )
          ) : (
            <ToolFeedbackListEmptyState
              description="研发部门登录后会自动识别并开放审批队列。"
              icon="shield_lock"
              title="当前账号无研发审批权限"
            />
          )}
        </section>
      </div>

      {isCreateModalOpen ? (
        <ToolFeedbackCreateModal
          affectedPagePlaceholder={affectedPagePlaceholder}
          draft={draft}
          fileInputRef={fileInputRef}
          isSubmitting={isSubmitting}
          onAddImages={handleAddImages}
          onChange={handleDraftChange}
          onClose={() => setIsCreateModalOpen(false)}
          onImageInputChange={handleImageInputChange}
          onOpenImagePicker={openImagePicker}
          onRemoveExistingAttachment={handleRemoveExistingAttachment}
          onRemoveImage={handleRemoveDraftImage}
          onSubmit={() => void handleSubmit()}
        />
      ) : null}

      {selectedEntry && selectedItem ? (
        <ToolFeedbackDetailModal
          actionInProgressId={actionInProgressId}
          canReview={canReview}
          copiedSuggestionId={copiedSuggestionId}
          item={selectedItem}
          onApprove={(item) => void handleDecision(item, 'approved')}
          onClose={() => setSelectedEntry(null)}
          onComplete={(item) => void handleComplete(item)}
          onCopy={handleCopy}
          onReject={(item) => void handleDecision(item, 'rejected')}
          onResubmit={openResubmitModal}
          source={selectedEntry.source}
        />
      ) : null}
    </div>
  );
}

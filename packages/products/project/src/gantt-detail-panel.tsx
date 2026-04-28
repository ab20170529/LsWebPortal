import React, { useState, type ChangeEvent } from 'react';
import { Plus, X } from 'lucide-react';

import { downloadProjectAttachment } from './project-attachments';
import { getFileCategoryLabel } from './project-display';
import type {
  AttachmentItem,
  BudgetItem,
  DetailEditState,
  DetailPanelState,
  MemberItem,
  TaskParticipantItem,
  TaskDependency,
  TimelineRow,
} from './gantt-types';
import { formatDateInput } from './gantt-utils';
import { SystemUserPicker } from './system-user-picker';
import { useSystemUserOptions } from './system-user-directory';
import type { SystemUserOption } from './system-user-directory';
import { useProjectToast } from './project-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

type AddMemberPayload = {
  userId: string;
  userName: string;
  roleCode: string | null;
  roleName: string | null;
  dutyContent: string | null;
  isManager: boolean;
  remark: string | null;
};

type AddBudgetPayload = {
  feeItem: string;
  feeType: string | null;
  planAmount: number | null;
  actualAmount: number | null;
  operatorName: string | null;
  operatorId: string | null;
  overRate: number | null;
  feeDesc: string | null;
  remark: string | null;
};

type GanttDetailPanelProps = {
  actionLoading: boolean;
  attachments: AttachmentItem[];
  currentUserId: string;
  currentUserName: string;
  budgets: BudgetItem[];
  detailEditState: DetailEditState | null;
  detailPanel: DetailPanelState;
  members: MemberItem[];
  readOnly?: boolean;
  row: TimelineRow | null;
  selectedProjectBudgetAmount?: number | null;
  taskDependencies: TaskDependency[];
  onClose: () => void;
  onDelete: (row: TimelineRow) => void;
  onDeleteBudget: (projectId: number, budgetId: number) => void;
  onDeleteMember: (projectId: number, memberId: number) => void;
  onDeleteAttachment: (projectId: number, attachmentId: number) => void;
  onUploadAttachment: (
    projectId: number,
    payload: {
      file: File;
      fileCategory?: string | null;
      projectNodeId?: number | null;
      projectTaskId?: number | null;
      remark?: string | null;
      uploaderId: string;
      uploaderName: string;
    },
  ) => Promise<void>;
  onAddMember: (projectId: number, member: AddMemberPayload) => void;
  onAddBudget: (projectId: number, budget: AddBudgetPayload) => void;
  onSave: () => void;
  onTabChange: (tab: DetailPanelState['activeTab']) => void;
  onEditStateChange: (updater: (prev: DetailEditState | null) => DetailEditState | null) => void;
  projectId: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// 状态配置
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: '待开始', color: 'text-slate-600',  bg: 'bg-slate-100 border-slate-200' },
  IN_PROGRESS: { label: '进行中', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  COMPLETED:   { label: '已完成', color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200' },
  CANCELLED:   { label: '已取消', color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-200' },
};

const DEP_TYPE_COLOR: Record<string, string> = {
  FS: 'bg-blue-100 text-blue-600',
  FF: 'bg-emerald-100 text-emerald-600',
  SS: 'bg-amber-100 text-amber-600',
  SF: 'bg-purple-100 text-purple-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────────────

export function GanttDetailPanel({
  actionLoading,
  attachments,
  currentUserId,
  currentUserName,
  budgets,
  detailEditState,
  detailPanel,
  members,
  readOnly = false,
  row,
  selectedProjectBudgetAmount,
  taskDependencies,
  onClose,
  onDelete,
  onDeleteBudget,
  onDeleteMember,
  onDeleteAttachment,
  onUploadAttachment,
  onAddMember,
  onAddBudget,
  onSave,
  onTabChange,
  onEditStateChange,
  projectId,
}: GanttDetailPanelProps) {
  if (!row) return null;

  const isTask = row.entityKind === 'task';
  const totalActual = budgets.reduce((s, b) => s + (b.actualAmount ?? 0), 0);
  const budgetUsageRate = selectedProjectBudgetAmount
    ? Math.round((totalActual / selectedProjectBudgetAmount) * 100)
    : 0;
  const budgetOverrun = selectedProjectBudgetAmount ? totalActual > selectedProjectBudgetAmount : false;

  const relatedDeps = isTask
    ? taskDependencies.filter((d) => d.predecessorTaskId === row.entityId || d.successorTaskId === row.entityId)
    : [];

  return (
    <div
      className="fixed right-0 top-0 z-50 h-full w-[420px] shadow-[-20px_0_60px_rgba(0,0,0,0.15)]"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <div className="flex h-full flex-col bg-white">
        {/* ── 标题栏 ── */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-5">
          {/* 背景纹理 */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 shadow-lg backdrop-blur-sm">
                {isTask ? (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-white/80">
                  {isTask ? '任务详情' : '节点详情'}
                </div>
                <h2 className="mt-1 max-w-[240px] truncate text-lg font-bold text-white">{row.title}</h2>
              </div>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Tab 导航 ── */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4">
          {[
            { key: 'info',        label: '基本信息' },
            { key: 'members',     label: '项目团队' },
            { key: 'budget',      label: '预算'     },
            { key: 'attachments', label: '附件'     },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                detailPanel.activeTab === tab.key ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => onTabChange(tab.key as DetailPanelState['activeTab'])}
              type="button"
            >
              {tab.label}
              {detailPanel.activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
              )}
            </button>
          ))}
        </div>

        {/* ── 内容区 ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 基本信息 */}
          {detailPanel.activeTab === 'info' && detailEditState && (
            <InfoTab
              row={row}
              editState={detailEditState}
              members={members}
              taskDependencies={relatedDeps}
              onChange={onEditStateChange}
            />
          )}

          {/* 成员 */}
          {detailPanel.activeTab === 'members' && (
            <MembersTab
              members={members}
              projectId={projectId}
              onDeleteMember={onDeleteMember}
              onAddMember={onAddMember}
            />
          )}

          {/* 预算 */}
          {detailPanel.activeTab === 'budget' && (
            <BudgetTab
              budgets={budgets}
              budgetAmount={selectedProjectBudgetAmount}
              projectId={projectId}
              totalActual={totalActual}
              usageRate={budgetUsageRate}
              overrun={budgetOverrun}
              onDeleteBudget={onDeleteBudget}
              onAddBudget={onAddBudget}
            />
          )}

          {/* 附件 */}
          {detailPanel.activeTab === 'attachments' && (
            <AttachmentsTab
              attachments={attachments}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              projectId={projectId}
              row={row}
              onDeleteAttachment={onDeleteAttachment}
              onUploadAttachment={onUploadAttachment}
            />
          )}
        </div>

        {/* ── 底部操作栏 ── */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
              disabled={actionLoading || readOnly}
              onClick={() => onDelete(row)}
              type="button"
            >
              删除
            </button>
            <button
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-700"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="group relative flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actionLoading || readOnly}
              onClick={onSave}
              type="button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                {actionLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    保存中...
                  </>
                ) : (
                  <>
                    保存修改
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 基本信息 Tab
// ─────────────────────────────────────────────────────────────────────────────

type InfoTabProps = {
  row: TimelineRow;
  editState: DetailEditState;
  members: MemberItem[];
  taskDependencies: TaskDependency[];
  onChange: (updater: (prev: DetailEditState | null) => DetailEditState | null) => void;
};

function InfoTab({ row, editState, members, taskDependencies, onChange }: InfoTabProps) {
  const isTask = row.entityKind === 'task';
  const participantUserIds = new Set(editState.participantMembers.map((member) => member.userId));

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <FormField label="标题" icon="edit">
        <input
          className="h-11 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-sm transition-all focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
          value={editState.taskTitle}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange((p) => p ? { ...p, taskTitle: e.target.value } : p)}
        />
      </FormField>

      {/* 内容/描述 */}
      <FormField label={isTask ? '任务内容' : '节点描述'} icon="text">
        <textarea
          className="min-h-[100px] w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
          placeholder="请输入内容描述..."
          value={editState.taskContent}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange((p) => p ? { ...p, taskContent: e.target.value } : p)}
        />
      </FormField>

      {/* 责任人（任务可编辑，节点只读） */}
      {isTask ? (
        <FormField label="责任人" icon="user">
          <select
            className="h-11 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-sm transition-all focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
            value={editState.responsibleUserId ?? ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              const uid = e.target.value;
              const member = members.find((m) => m.userId === uid);
              onChange((p) => p ? {
                ...p,
                participantMembers: p.participantMembers.filter((item) => item.userId !== uid),
                responsibleUserId: uid || null,
                responsibleName: uid ? (member?.userName ?? uid) : '',
              } : p);
            }}
          >
            <option value="">未分配</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.userName}{m.roleName ? `（${m.roleName}）` : ''}
              </option>
            ))}
          </select>
          {editState.responsibleName ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-[10px] font-bold text-white">
                {editState.responsibleName.charAt(0)}
              </div>
              <span className="text-xs font-medium text-violet-600">{editState.responsibleName}</span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400">请从项目成员中选择负责人</div>
          )}
        </FormField>
      ) : (
        <FormField label="负责人" icon="user">
          <div className="flex items-center gap-2 rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
            <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{row.owner || '未分配'}</span>
          </div>
        </FormField>
      )}

      {isTask ? (
        <FormField label="参与人" icon="users">
          {members.length ? (
            <div className="space-y-2 rounded-xl border-2 border-slate-100 bg-slate-50 p-3">
              <div className="text-xs text-slate-400">任务参与人仅可从项目团队中选择</div>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {members
                  .filter((member) => member.userId !== editState.responsibleUserId)
                  .map((member) => {
                    const checked = participantUserIds.has(member.userId);
                    return (
                      <label
                        key={member.userId}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? 'border-violet-200 bg-violet-50 text-violet-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{member.userName}</div>
                          <div className="truncate text-xs text-slate-400">{member.roleName ?? member.dutyContent ?? '项目成员'}</div>
                        </div>
                        <input
                          checked={checked}
                          className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-300"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            onChange((current) => {
                              if (!current) {
                                return current;
                              }
                              const nextMembers = e.target.checked
                                ? [...current.participantMembers, { userId: member.userId, userName: member.userName }]
                                : current.participantMembers.filter((item) => item.userId !== member.userId);
                              return {
                                ...current,
                                participantMembers: nextMembers,
                              };
                            });
                          }}
                          type="checkbox"
                        />
                      </label>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
              请先在“项目团队”中添加成员，再分配任务人员。
            </div>
          )}
          {editState.participantMembers.length ? (
            <div className="flex flex-wrap gap-2">
              {editState.participantMembers.map((member: TaskParticipantItem) => (
                <span
                  key={member.userId}
                  className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
                >
                  {member.userName}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">当前未设置参与人</div>
          )}
        </FormField>
      ) : null}

      {/* 状态 */}
      <FormField label="状态" icon="check">
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                editState.status === key
                  ? `${cfg.color} ${cfg.bg}`
                  : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
              }`}
              onClick={() => onChange((p) => p ? { ...p, status: key } : p)}
              type="button"
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </FormField>

      {/* 进度 */}
      <FormField label="进度" icon="bar">
        <div className="flex items-center gap-4">
          <input
            className="flex-1 accent-violet-500"
            max={100} min={0} type="range"
            value={editState.progressRate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange((p) => p ? { ...p, progressRate: parseInt(e.target.value) } : p)}
          />
          <span className="min-w-[48px] rounded-lg bg-violet-50 px-2 py-1 text-center text-sm font-bold text-violet-600">
            {editState.progressRate}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 transition-all"
            style={{ width: `${editState.progressRate}%` }}
          />
        </div>
      </FormField>

      {/* 备注 */}
      <FormField label="备注" icon="comment">
        <textarea
          className="min-h-[80px] w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm transition-all focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
          placeholder="添加备注信息..."
          value={editState.taskRemark}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange((p) => p ? { ...p, taskRemark: e.target.value } : p)}
        />
      </FormField>

      {/* 时间信息（可编辑） */}
      <FormField label="时间范围" icon="calendar">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">计划开始</label>
            <input
              className="h-10 w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-3 text-sm transition-all focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
              type="date"
              value={editState.planStartTime ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange((p) => p ? { ...p, planStartTime: e.target.value || null } : p)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">计划结束</label>
            <input
              className="h-10 w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-3 text-sm transition-all focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
              type="date"
              value={editState.planEndTime ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange((p) => p ? { ...p, planEndTime: e.target.value || null } : p)}
            />
          </div>
        </div>
      </FormField>

      {/* 依赖信息 */}
      {isTask && taskDependencies.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4">
          <div className="mb-3 text-xs font-semibold text-amber-600">依赖关系</div>
          <div className="space-y-2">
            {taskDependencies.slice(0, 3).map((dep) => (
              <div key={dep.id} className="flex items-center gap-2 text-xs">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${DEP_TYPE_COLOR[dep.dependencyType] ?? ''}`}>
                  {dep.dependencyType}
                </span>
                <span className="text-slate-500">
                  {dep.predecessorTaskId === row.entityId ? dep.successorTaskTitle : dep.predecessorTaskTitle}
                </span>
              </div>
            ))}
            {taskDependencies.length > 3 && (
              <div className="text-xs text-amber-600">还有 {taskDependencies.length - 3} 个依赖关系</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 成员 Tab
// ─────────────────────────────────────────────────────────────────────────────

type MembersTabProps = {
  members: MemberItem[];
  projectId: number;
  onDeleteMember: (projectId: number, memberId: number) => void;
  onAddMember: (projectId: number, member: {
    userId: string;
    userName: string;
    roleCode: string | null;
    roleName: string | null;
    dutyContent: string | null;
    isManager: boolean;
    remark: string | null;
  }) => void;
};

function MembersTab({ members, projectId, onDeleteMember, onAddMember }: MembersTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { loading: userLoading, options: userOptions } = useSystemUserOptions();
  const [selectedUsers, setSelectedUsers] = useState<SystemUserOption[]>([]);
  const [form, setForm] = useState({
    roleCode: '',
    roleName: '',
    dutyContent: '',
    isManager: false,
    remark: '',
  });

  const handleAdd = () => {
    if (selectedUsers.length === 0) {
      window.alert('请选择项目团队成员');
      return;
    }
    // 批量添加选中的用户
    selectedUsers.forEach((user) => {
      onAddMember(projectId, {
        userId: user.userId,
        userName: user.userName,
        roleCode: form.roleCode || null,
        roleName: form.roleName || null,
        dutyContent: form.dutyContent || null,
        isManager: form.isManager,
        remark: form.remark || null,
      });
    });
    setShowAddModal(false);
    setSelectedUsers([]);
    setForm({ roleCode: '', roleName: '', dutyContent: '', isManager: false, remark: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-600">项目团队</div>
        <button
          className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100"
          type="button"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-3 w-3" /> 添加成员
        </button>
      </div>
      {members.length > 0 ? (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-sm font-bold text-white">
                {m.userName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700">{m.userName}</div>
                <div className="text-xs text-slate-400">{m.roleName || '成员'}</div>
              </div>
              {m.isManager && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">负责人</span>
              )}
              <button
                className="invisible flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:visible"
                onClick={() => {
                  if (window.confirm(`确认移除成员"${m.userName}"吗？`)) {
                    onDeleteMember(projectId, m.id);
                  }
                }}
                title="移除成员"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPlaceholder label="暂无成员" />
      )}

      {/* 添加成员弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-bold text-slate-800">添加成员</div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600" type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">选择成员 *（可多选）</label>
                <SystemUserPicker
                  disabled={userLoading}
                  mode="multiple"
                  options={userOptions}
                  placeholder={userLoading ? '加载中...' : '搜索并选择成员'}
                  values={selectedUsers.map((u) => u.userId)}
                  onChangeMany={(userIds, userItems) => {
                    setSelectedUsers(userItems);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">角色名称</label>
                <input
                  type="text"
                  value={form.roleName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, roleName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="如：开发工程师"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">职责内容</label>
                <textarea
                  value={form.dutyContent}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, dutyContent: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="描述该成员的职责"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">备注</label>
                <input
                  type="text"
                  value={form.remark}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="备注信息"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={form.isManager}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, isManager: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-300"
                />
                <label htmlFor="isManager" className="text-sm text-slate-600">设为项目负责人</label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                type="button"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600"
                type="button"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 预算 Tab
// ─────────────────────────────────────────────────────────────────────────────

type BudgetTabProps = {
  budgets: BudgetItem[];
  budgetAmount?: number | null;
  projectId: number;
  totalActual: number;
  usageRate: number;
  overrun: boolean;
  onDeleteBudget: (projectId: number, budgetId: number) => void;
  onAddBudget: (projectId: number, budget: AddBudgetPayload) => void;
};

function BudgetTab({ budgets, budgetAmount, projectId, totalActual, usageRate, overrun, onDeleteBudget, onAddBudget }: BudgetTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    feeItem: '',
    feeType: '',
    planAmount: '',
    actualAmount: '',
    operatorName: '',
    operatorId: '',
    overRate: '',
    feeDesc: '',
    remark: '',
  });

  const handleAdd = () => {
    if (!form.feeItem) {
      alert('请填写费用项名称');
      return;
    }
    onAddBudget(projectId, {
      feeItem: form.feeItem,
      feeType: form.feeType || null,
      planAmount: form.planAmount ? Number(form.planAmount) : null,
      actualAmount: form.actualAmount ? Number(form.actualAmount) : null,
      operatorName: form.operatorName || null,
      operatorId: form.operatorId || null,
      overRate: form.overRate ? Number(form.overRate) : null,
      feeDesc: form.feeDesc || null,
      remark: form.remark || null,
    });
    setShowAddModal(false);
    setForm({ feeItem: '', feeType: '', planAmount: '', actualAmount: '', operatorName: '', operatorId: '', overRate: '', feeDesc: '', remark: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-600">预算概览</div>
        <button
          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
          type="button"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-3 w-3" /> 添加预算
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <div className="text-xs text-emerald-600">计划预算</div>
          <div className="mt-1 text-[18px] font-bold text-emerald-700">
            ¥{(budgetAmount ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <div className="text-xs text-amber-600">实际费用</div>
          <div className="mt-1 text-[18px] font-bold text-amber-700">¥{totalActual.toLocaleString()}</div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">预算使用</span>
          <span className="font-semibold text-slate-600">{usageRate}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${overrun ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
            style={{ width: `${Math.min(100, usageRate)}%` }}
          />
        </div>
      </div>
      {budgets.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">费用明细</div>
          {budgets.slice(0, 5).map((b) => (
            <div key={b.id} className="group flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 transition-colors hover:bg-slate-50">
              <div>
                <div className="text-sm text-slate-600">{b.feeItem}</div>
                <div className="text-xs text-slate-400">{b.feeType || '其他'}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-700">¥{(b.actualAmount ?? 0).toLocaleString()}</div>
                <button
                  className="invisible flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:visible"
                  onClick={() => {
                    if (window.confirm(`确认删除费用项"${b.feeItem}"吗？`)) {
                      onDeleteBudget(projectId, b.id);
                    }
                  }}
                  title="删除"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {budgets.length > 5 && (
            <div className="text-center text-xs text-slate-400">还有 {budgets.length - 5} 项费用</div>
          )}
        </div>
      ) : (
        <EmptyPlaceholder label="暂无费用记录" />
      )}

      {/* 添加预算弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[480px] rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-bold text-slate-800">添加预算</div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600" type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">费用项 *</label>
                  <input
                    type="text"
                    value={form.feeItem}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, feeItem: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="如：设备采购"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">费用类型</label>
                  <input
                    type="text"
                    value={form.feeType}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, feeType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="如：采购"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">计划金额</label>
                  <input
                    type="number"
                    value={form.planAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, planAmount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">实际金额</label>
                  <input
                    type="number"
                    value={form.actualAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, actualAmount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">操作人</label>
                  <input
                    type="text"
                    value={form.operatorName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, operatorName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="操作人姓名"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">超标比率 (%)</label>
                  <input
                    type="number"
                    value={form.overRate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, overRate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">费用说明</label>
                <textarea
                  value={form.feeDesc}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, feeDesc: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="费用详细说明"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">备注</label>
                <input
                  type="text"
                  value={form.remark}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="备注信息"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                type="button"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                type="button"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 附件 Tab
// ─────────────────────────────────────────────────────────────────────────────

type AttachmentsTabProps = {
  attachments: AttachmentItem[];
  currentUserId: string;
  currentUserName: string;
  projectId: number;
  row: TimelineRow;
  onDeleteAttachment: (projectId: number, attachmentId: number) => void;
  onUploadAttachment: (
    projectId: number,
    payload: {
      file: File;
      fileCategory?: string | null;
      projectNodeId?: number | null;
      projectTaskId?: number | null;
      remark?: string | null;
      uploaderId: string;
      uploaderName: string;
    },
  ) => Promise<void>;
};

function AttachmentsTab({
  attachments,
  currentUserId,
  currentUserName,
  projectId,
  row,
  onDeleteAttachment,
  onUploadAttachment,
}: AttachmentsTabProps) {
  const { pushToast } = useProjectToast();
  const [fileInputRef] = useState<{ current: HTMLInputElement | null }>(() => ({ current: null }));
  const [attachmentRemark, setAttachmentRemark] = useState('');
  const [fileCategory, setFileCategory] = useState('OTHER');

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (!currentUserId || !currentUserName)) {
      pushToast({
        message: '当前登录人信息不完整，暂时无法上传附件。',
        tone: 'danger',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file) {
      void onUploadAttachment(projectId, {
        file,
        fileCategory,
        projectNodeId: row.entityKind === 'node' ? row.entityId : row.parentNodeId ?? null,
        projectTaskId: row.entityKind === 'task' ? row.entityId : null,
        remark: attachmentRemark,
        uploaderId: currentUserId,
        uploaderName: currentUserName,
      })
        .then(() => {
          setAttachmentRemark('');
          setFileCategory('OTHER');
          pushToast({ message: '附件已上传。', tone: 'success' });
        })
        .catch((error: unknown) => {
          pushToast({
            message: error instanceof Error ? error.message : '附件上传失败，请稍后重试。',
            tone: 'danger',
          });
        });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredAttachments = attachments.filter((attachment) => {
    if (row.entityKind === 'task') {
      return attachment.projectTaskId === row.entityId;
    }
    return attachment.projectNodeId === row.entityId && !attachment.projectTaskId;
  });
  const canUpload = Boolean(currentUserId && currentUserName);
  const scopeLabel = row.entityKind === 'task' ? '当前任务附件' : '当前节点附件';
  const scopeDescription =
    row.entityKind === 'task'
      ? '上传后的附件会绑定到当前任务，适合整理交付件、汇报材料和任务备注。'
      : '上传后的附件会绑定到当前节点，适合沉淀阶段资料、合同和里程碑文档。';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700">{scopeLabel}</div>
              <div className="mt-1 text-xs leading-6 text-slate-500">{scopeDescription}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-50 px-1.5 text-blue-600">
                {filteredAttachments.length}
              </span>
              已上传附件
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)_150px]">
            <label className="block">
              <div className="text-xs font-semibold text-slate-500">附件分类</div>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setFileCategory(event.target.value)}
                value={fileCategory}
              >
                <option value="MILESTONE">里程碑</option>
                <option value="DELIVERABLE">交付件</option>
                <option value="CONTRACT">合同</option>
                <option value="REPORT">报告</option>
                <option value="OTHER">其他</option>
              </select>
            </label>

            <label className="block">
              <div className="text-xs font-semibold text-slate-500">备注说明</div>
              <textarea
                className="mt-2 min-h-[92px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAttachmentRemark(event.target.value)}
                placeholder="补充说明附件用途、版本或交付背景"
                rows={3}
                value={attachmentRemark}
              />
            </label>

            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
              />
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canUpload}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Plus className="h-4 w-4" />
                上传附件
              </button>
              <div className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-500">
                {canUpload ? `上传人：${currentUserName}` : '当前登录人信息不完整，暂时无法上传附件。'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredAttachments.length > 0 ? (
        <div className="space-y-2">
          {filteredAttachments.map((a) => (
            <div key={a.id} className="group rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-medium text-slate-700">{a.fileName}</div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {getFileCategoryLabel(a.fileCategory)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    {a.uploaderName || '未知上传人'}
                    {a.uploadTime ? ` / ${formatAttachmentTime(a.uploadTime)}` : ''}
                    {a.fileSize ? ` / ${formatAttachmentSize(a.fileSize)}` : ''}
                  </div>
                  {a.remark ? <div className="mt-2 text-xs leading-5 text-slate-500">{a.remark}</div> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-800"
                    onClick={() => {
                      void downloadProjectAttachment(a, projectId).catch((error: unknown) => {
                        pushToast({
                          message: error instanceof Error ? error.message : '附件下载失败，请稍后重试。',
                          tone: 'danger',
                        });
                      });
                    }}
                    type="button"
                  >
                    下载
                  </button>
                  <button
                    className="invisible flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:visible"
                    onClick={() => {
                      if (window.confirm(`确认删除附件“${a.fileName}”吗？`)) {
                        onDeleteAttachment(projectId, a.id);
                      }
                    }}
                    title="删除"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPlaceholder label="暂无附件" />
      )}
    </div>
  );
}

function formatAttachmentSize(fileSize?: number | null) {
  if (!fileSize || fileSize <= 0) {
    return '未知大小';
  }

  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(fileSize / 1024).toFixed(1)} KB`;
}

function formatAttachmentTime(value?: string | null) {
  if (!value) {
    return '时间未知';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 通用子组件
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_ICONS: Record<string, string> = {
  edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  text:    'M4 6h16M4 12h16M4 18h7',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  check:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  bar:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  comment: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

function FormField({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="group">
      <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={FIELD_ICONS[icon] ?? ''} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </label>
      {children}
    </div>
  );
}

function EmptyPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

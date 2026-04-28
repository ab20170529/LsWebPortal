import React, { useMemo, useState, type ChangeEvent } from 'react';
import { Plus, X } from 'lucide-react';

import type { MemberItem } from './gantt-types';
import { useProjectToast } from './project-toast';
import { SystemUserPicker } from './system-user-picker';
import { useSystemUserOptions } from './system-user-directory';
import type { SystemUserOption } from './system-user-directory';

export type ProjectTeamMemberPayload = {
  dutyContent: string | null;
  isManager: boolean;
  remark: string | null;
  roleCode: string | null;
  roleName: string | null;
  userId: string;
  userName: string;
};

type ProjectTeamManagerProps = {
  members: MemberItem[];
  projectId: number;
  onAddMember: (projectId: number, member: ProjectTeamMemberPayload) => Promise<void>;
  onDeleteMember: (projectId: number, memberId: number) => Promise<void>;
  onUpdateMember: (projectId: number, memberId: number, member: ProjectTeamMemberPayload) => Promise<void>;
};

export function ProjectTeamManager({
  members,
  projectId,
  onAddMember,
  onDeleteMember,
  onUpdateMember,
}: ProjectTeamManagerProps) {
  const { pushToast } = useProjectToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const { loading: userLoading, options: userOptions } = useSystemUserOptions();
  const [selectedUsers, setSelectedUsers] = useState<SystemUserOption[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'manager' | 'member'>('all');
  const [form, setForm] = useState({
    dutyContent: '',
    isManager: false,
    remark: '',
    roleCode: '',
    roleName: '',
  });

  const existingUserIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const memberStats = useMemo(() => {
    const managerCount = members.filter((member) => member.isManager).length;
    const roleCount = new Set(
      members
        .map((member) => (member.roleName ?? '').trim())
        .filter(Boolean),
    ).size;

    return {
      managerCount,
      roleCount,
      totalCount: members.length,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return [...members]
      .filter((member) => {
        if (memberFilter === 'manager' && !member.isManager) {
          return false;
        }
        if (memberFilter === 'member' && member.isManager) {
          return false;
        }
        if (!normalizedKeyword) {
          return true;
        }

        const searchableText = [
          member.userName,
          member.roleCode ?? '',
          member.roleName ?? '',
          member.dutyContent ?? '',
          member.remark ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return searchableText.includes(normalizedKeyword);
      })
      .sort((left, right) => {
        if (Boolean(left.isManager) !== Boolean(right.isManager)) {
          return left.isManager ? -1 : 1;
        }
        return left.userName.localeCompare(right.userName, 'zh-CN');
      });
  }, [memberFilter, members, normalizedKeyword]);

  const resetForm = () => {
    setForm({
      dutyContent: '',
      isManager: false,
      remark: '',
      roleCode: '',
      roleName: '',
    });
  };

  const handleAdd = async () => {
    if (selectedUsers.length === 0) {
      pushToast({
        message: '请先选择要加入项目团队的成员。',
        tone: 'danger',
      });
      return;
    }

    const usersToAdd = selectedUsers.filter((user) => !existingUserIds.has(user.userId));
    if (usersToAdd.length === 0) {
      pushToast({
        message: '所选成员已在项目团队中，无需重复添加。',
        tone: 'danger',
      });
      return;
    }

    try {
      for (const user of usersToAdd) {
        await onAddMember(projectId, {
          dutyContent: form.dutyContent || null,
          isManager: form.isManager,
          remark: form.remark || null,
          roleCode: form.roleCode || null,
          roleName: form.roleName || null,
          userId: user.userId,
          userName: user.userName,
        });
      }

      setShowAddModal(false);
      setSelectedUsers([]);
      resetForm();
      pushToast({
        message: `已加入 ${usersToAdd.length} 位项目团队成员。`,
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : '项目团队成员添加失败。',
        tone: 'danger',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMember) {
      return;
    }

    try {
      await onUpdateMember(projectId, editingMember.id, {
        dutyContent: form.dutyContent || null,
        isManager: form.isManager,
        remark: form.remark || null,
        roleCode: form.roleCode || null,
        roleName: form.roleName || null,
        userId: editingMember.userId,
        userName: editingMember.userName,
      });

      setEditingMember(null);
      resetForm();
      pushToast({
        message: `已更新成员“${editingMember.userName}”的信息。`,
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        message: error instanceof Error ? error.message : '项目团队成员更新失败。',
        tone: 'danger',
      });
    }
  };

  const openEditMember = (member: MemberItem) => {
    setEditingMember(member);
    setForm({
      dutyContent: member.dutyContent ?? '',
      isManager: Boolean(member.isManager),
      remark: member.remark ?? '',
      roleCode: member.roleCode ?? '',
      roleName: member.roleName ?? '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-600">项目团队</div>
          <div className="mt-1 text-xs text-slate-400">先维护项目团队，再在任务中选择负责人和参与人。</div>
        </div>
        <button
          className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100"
          onClick={() => setShowAddModal(true)}
          type="button"
        >
          <Plus className="h-3 w-3" /> 添加成员
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <div className="text-[11px] font-semibold text-slate-400">团队人数</div>
          <div className="mt-2 text-[18px] font-bold text-slate-800">{memberStats.totalCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-3">
          <div className="text-[11px] font-semibold text-amber-500">负责人</div>
          <div className="mt-2 text-[18px] font-bold text-amber-700">{memberStats.managerCount}</div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 px-3 py-3">
          <div className="text-[11px] font-semibold text-violet-500">角色数</div>
          <div className="mt-2 text-[18px] font-bold text-violet-700">{memberStats.roleCount}</div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
        <div className="relative">
          <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchKeyword(event.target.value)}
            placeholder="搜索成员、角色、职责"
            value={searchKeyword}
          />
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `全部 ${memberStats.totalCount}` },
            { key: 'manager', label: `负责人 ${memberStats.managerCount}` },
            { key: 'member', label: `普通成员 ${Math.max(memberStats.totalCount - memberStats.managerCount, 0)}` },
          ].map((item) => (
            <button
              key={item.key}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                memberFilter === item.key
                  ? 'border-violet-200 bg-violet-100 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
              onClick={() => setMemberFilter(item.key as 'all' | 'manager' | 'member')}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {members.length > 0 ? (
        filteredMembers.length > 0 ? (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-sm font-bold text-white">
                  {member.userName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-medium text-slate-700">{member.userName}</div>
                    {member.roleCode ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {member.roleCode}
                      </span>
                    ) : null}
                    {member.roleName ? (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                        {member.roleName}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{member.dutyContent || '未填写职责内容'}</div>
                  {member.remark ? (
                    <div className="mt-1 truncate text-[11px] text-slate-400">备注：{member.remark}</div>
                  ) : null}
                </div>
                {member.isManager ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">项目负责人</span>
                ) : null}
                <button
                  className="invisible flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-500 group-hover:visible"
                  onClick={() => {
                    openEditMember(member);
                  }}
                  title="编辑成员"
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16">
                    <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                  </svg>
                </button>
                <button
                  className="invisible flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:visible"
                  onClick={() => {
                    if (window.confirm(`确认移除成员“${member.userName}”吗？`)) {
                      void onDeleteMember(projectId, member.id)
                        .then(() => {
                          pushToast({
                            message: `已移除成员“${member.userName}”。`,
                            tone: 'success',
                          });
                        })
                        .catch((error) => {
                          pushToast({
                            message: error instanceof Error ? error.message : '项目团队成员移除失败。',
                            tone: 'danger',
                          });
                        });
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
          <EmptyPlaceholder label="没有符合筛选条件的项目成员" />
        )
      ) : (
        <EmptyPlaceholder label="暂无成员" />
      )}

      {editingMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-800">编辑项目团队成员</div>
                <div className="mt-1 text-xs text-slate-400">{editingMember.userName}</div>
              </div>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setEditingMember(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">角色编码</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, roleCode: event.target.value }))}
                  placeholder="如：DEV"
                  type="text"
                  value={form.roleCode}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">角色名称</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, roleName: event.target.value }))}
                  placeholder="如：前端开发"
                  type="text"
                  value={form.roleName}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">职责内容</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((current) => ({ ...current, dutyContent: event.target.value }))}
                  placeholder="描述该成员在项目中的职责"
                  rows={3}
                  value={form.dutyContent}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">备注</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, remark: event.target.value }))}
                  placeholder="备注信息"
                  type="text"
                  value={form.remark}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  checked={form.isManager}
                  className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-300"
                  id="editing-is-manager"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, isManager: event.target.checked }))}
                  type="checkbox"
                />
                <label className="text-sm text-slate-600" htmlFor="editing-is-manager">设为项目负责人</label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                onClick={() => setEditingMember(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600"
                onClick={() => {
                  void handleSaveEdit();
                }}
                type="button"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-bold text-slate-800">添加成员</div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowAddModal(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">选择成员（可多选）</label>
                <SystemUserPicker
                  disabled={userLoading}
                  mode="multiple"
                  onChangeMany={(_userIds, userItems) => {
                    setSelectedUsers(userItems);
                  }}
                  options={userOptions}
                  placeholder={userLoading ? '加载中...' : '搜索并选择成员'}
                  values={selectedUsers.map((user) => user.userId)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">角色名称</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, roleName: event.target.value }))}
                  placeholder="如：开发工程师"
                  type="text"
                  value={form.roleName}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">职责内容</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm((current) => ({ ...current, dutyContent: event.target.value }))}
                  placeholder="描述该成员的职责"
                  rows={2}
                  value={form.dutyContent}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">备注</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, remark: event.target.value }))}
                  placeholder="备注信息"
                  type="text"
                  value={form.remark}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  checked={form.isManager}
                  className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-300"
                  id="isManager"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, isManager: event.target.checked }))}
                  type="checkbox"
                />
                <label className="text-sm text-slate-600" htmlFor="isManager">设为项目负责人</label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                onClick={() => setShowAddModal(false)}
                type="button"
              >
                取消
              </button>
              <button
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600"
                onClick={() => {
                  void handleAdd();
                }}
                type="button"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { FunctionFlowEdgeDetail } from './function-flow-types';
import { shadcnSectionCardClass, shadcnSectionTitleClass, shadcnMutedLabelClass } from '../../components/ui/shadcn-inspector';

type EdgeDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetNodeName: string;
  edgeDetails: FunctionFlowEdgeDetail[];
  onSave: (details: FunctionFlowEdgeDetail[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

// 连接类型映射
const joinTypeMap = {
  left: 'LEFT JOIN',
  inner: 'INNER JOIN',
  right: 'RIGHT JOIN',
  full: 'FULL JOIN',
};

// 可排序的页签组件
interface SortableTabProps {
  id: string;
  index: number;
  key?: React.Key;
  sourceNodeName: string;
  isActive: boolean;
  onClick: () => void;
}

function SortableTab({ id, index, sourceNodeName, isActive, onClick }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex min-w-[100px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-bold transition-all
        ${isActive
          ? 'border-slate-300 bg-white text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
          : 'border-transparent bg-slate-100/50 text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'
        }
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={onClick}
      {...attributes}
    >
      <span
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-symbols-outlined text-[14px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
          drag_indicator
        </span>
      </span>
      <span className="truncate">{sourceNodeName}</span>
      <span className="text-[10px] font-semibold text-slate-400">#{index + 1}</span>
    </div>
  );
}

// 连线详情内容组件
interface EdgeDetailContentProps {
  detail: FunctionFlowEdgeDetail;
  onUpdate: (detail: FunctionFlowEdgeDetail) => void;
}

function EdgeDetailContent({ detail, onUpdate }: EdgeDetailContentProps) {
  return (
    <div className="space-y-4">
      <div className={shadcnSectionCardClass}>
        <div className={shadcnSectionTitleClass}>
          <span className="material-symbols-outlined text-[16px]">link</span>
          基础连接
        </div>
        <div className="space-y-4">
          <div>
            <label className={shadcnMutedLabelClass}>连接类型</label>
            <div className="flex flex-wrap gap-2">
              {(['left', 'inner', 'right', 'full'] as const).map((joinType) => (
                <label
                  key={joinType}
                  className={`
                    flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all
                    ${detail.inferredJoinType === joinType
                      ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-950/30 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`joinType-${detail.edgeId}`}
                    value={joinType}
                    checked={detail.inferredJoinType === joinType}
                    onChange={() => onUpdate({ ...detail, inferredJoinType: joinType })}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-[14px]">
                    {joinType === 'left' ? 'arrow_back' : joinType === 'inner' ? 'call_merge' : joinType === 'right' ? 'arrow_forward' : 'all_inclusive'}
                  </span>
                  {joinTypeMap[joinType]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                来源
              </div>
              <div className="mt-2 text-[14px] font-bold text-slate-800 dark:text-slate-100">
                {detail.sourceNodeName || '未命名来源'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                单据
              </div>
              <div className="mt-2 text-[14px] font-bold text-slate-800 dark:text-slate-100">
                {detail.targetNodeName || '未命名单据'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-[12px] leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            单据弹窗现在只保留最基础的连接类型配置，其他推断信息和附加配置已清理。
          </div>
        </div>
      </div>
    </div>
  );
}

export function EdgeDetailModal({
  isOpen,
  onClose,
  targetNodeName,
  edgeDetails: initialEdgeDetails,
  onSave,
  onReorder,
}: EdgeDetailModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [localDetails, setLocalDetails] = useState<FunctionFlowEdgeDetail[]>([]);

  // 同步外部数据到本地状态
  React.useEffect(() => {
    if (isOpen) {
      setLocalDetails(initialEdgeDetails);
      setActiveIndex(0);
    }
  }, [isOpen, initialEdgeDetails]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localDetails.findIndex((d) => d.edgeId === active.id);
      const newIndex = localDetails.findIndex((d) => d.edgeId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDetails = arrayMove(localDetails, oldIndex, newIndex);
        setLocalDetails(newDetails);
        setActiveIndex(newIndex);
        onReorder(oldIndex, newIndex);
      }
    }
  };

  const handleUpdateDetail = (updatedDetail: FunctionFlowEdgeDetail) => {
    setLocalDetails((prev) =>
      prev.map((d) => (d.edgeId === updatedDetail.edgeId ? updatedDetail : d))
    );
  };

  const handleSave = () => {
    onSave(localDetails);
    onClose();
  };

  const activeDetail = localDetails[activeIndex];

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/28 px-4 backdrop-blur-[6px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edge-detail-modal-title"
          className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,251,255,0.96))] p-6 shadow-[0_36px_90px_-42px_rgba(15,23,42,0.6)] dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94))]"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="edge-detail-modal-title" className="text-[20px] font-black tracking-tight text-slate-900 dark:text-white">
                单据来源配置
              </h2>
              <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                单据: <span className="text-slate-700 dark:text-slate-300">{targetNodeName}</span>
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                页签按来源区分，调整后只保存当前来源到该单据的基础连接类型。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Tab List with Drag and Drop */}
          {localDetails.length > 0 && (
            <div className="mb-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localDetails.map((d) => d.edgeId)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-2">
                    {localDetails.map((detail, idx) => (
                      <SortableTab
                        key={detail.edgeId}
                        id={detail.edgeId}
                        index={idx}
                        sourceNodeName={detail.sourceNodeName}
                        isActive={idx === activeIndex}
                        onClick={() => setActiveIndex(idx)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {localDetails.length > 0 && activeDetail ? (
              <EdgeDetailContent
                detail={activeDetail}
                onUpdate={handleUpdateDetail}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-[13px] text-slate-400">
                暂无来源连入
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-w-[108px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-bold text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-[13px] font-bold text-white shadow-[0_20px_40px_-24px_rgba(14,165,233,0.72)] transition-all hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              保存
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

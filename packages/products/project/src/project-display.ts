export function getProjectStatusLabel(status?: string | null) {
  const normalized = (status ?? '').trim().toUpperCase();

  if (!normalized) {
    return '未设置';
  }

  if (normalized === 'READY') {
    return '已就绪';
  }

  if (normalized === 'WAITING') {
    return '待处理';
  }

  if (normalized === 'DRAFT') {
    return '草稿';
  }

  if (normalized === 'NOT_STARTED') {
    return '未开始';
  }

  if (normalized === 'PAUSED') {
    return '已暂停';
  }

  if (normalized === 'PENDING') {
    return '待审批';
  }

  if (normalized === 'APPROVED') {
    return '已通过';
  }

  if (normalized === 'REJECTED') {
    return '已驳回';
  }

  if (normalized.includes('DONE') || normalized.includes('SUCCESS') || normalized.includes('FINISH') || normalized.includes('COMPLETE')) {
    return '已完成';
  }

  if (normalized.includes('RISK') || normalized.includes('ERROR') || normalized.includes('STOP')) {
    return '风险中';
  }

  if (normalized.includes('RUNNING') || normalized.includes('PROGRESS') || normalized.includes('PROCESS')) {
    return '进行中';
  }

  return status ?? '未设置';
}

export function getProjectStatusTone(status?: string | null): 'brand' | 'danger' | 'neutral' | 'success' {
  const normalized = (status ?? '').trim().toUpperCase();

  if (normalized.includes('DONE') || normalized.includes('SUCCESS') || normalized.includes('READY') || normalized.includes('COMPLETE') || normalized.includes('APPROVED')) {
    return 'success';
  }

  if (normalized.includes('RISK') || normalized.includes('ERROR') || normalized.includes('STOP') || normalized.includes('REJECTED')) {
    return 'danger';
  }

  if (normalized.includes('RUNNING') || normalized.includes('PROGRESS') || normalized.includes('PROCESS') || normalized.includes('WAITING') || normalized.includes('PENDING')) {
    return 'brand';
  }

  return 'neutral';
}

export function getRowKindLabel(kind: 'node' | 'task') {
  return kind === 'node' ? '节点' : '任务';
}

export function getCheckinResultLabel(result?: string | null) {
  const normalized = (result ?? '').trim().toUpperCase();

  if (!normalized) {
    return '未记录';
  }

  if (normalized === 'NORMAL') {
    return '正常';
  }

  if (normalized === 'LATE') {
    return '迟到';
  }

  if (normalized === 'ABSENT') {
    return '缺勤';
  }

  if (normalized === 'FIELD') {
    return '外勤';
  }

  return result ?? '未记录';
}

export function getFileCategoryLabel(category?: string | null) {
  const normalized = (category ?? '').trim().toUpperCase();

  if (!normalized) {
    return '通用附件';
  }

  if (normalized === 'MILESTONE') {
    return '里程碑附件';
  }

  if (normalized === 'DELIVERABLE') {
    return '交付物';
  }

  if (normalized === 'CONTRACT') {
    return '合同资料';
  }

  if (normalized === 'REPORT') {
    return '汇报材料';
  }

  if (normalized === 'OTHER') {
    return '其他资料';
  }

  return category ?? '通用附件';
}

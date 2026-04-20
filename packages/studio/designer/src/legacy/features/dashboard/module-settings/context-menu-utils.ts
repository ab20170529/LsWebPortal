export function normalizePopupMenuNumber(value: any, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

export function normalizeContextMenuItem(item: Record<string, any> = {}, index = 1) {
  const rawPersistedId = item.id ?? item.backendId ?? null;
  const persistedId = typeof rawPersistedId === 'number'
    ? rawPersistedId
    : (typeof rawPersistedId === 'string' && /^\d+$/.test(rawPersistedId.trim()) ? Number(rawPersistedId.trim()) : null);
  const menuName = item.menuname ?? item.menuName ?? item.label ?? `右键功能 ${index}`;
  const templateName = item.dllname ?? item.dllName ?? item.actionKey ?? `action_${index}`;
  const conditionValue = item.menuCond ?? item.menuCondition ?? item.disabledCondition ?? '';
  const actionValue = item.action ?? item.actionSql ?? '';
  const actionTypeValue = item.actiontype ?? item.actionType;
  const orderValue = item.orderid ?? item.orderId;
  const menuIdValue = item.menuid ?? item.menuId;
  const beforeMessageValue = item.beforeMsg ?? item.beforeMessage ?? '';

  return {
    id: rawPersistedId ?? `ctx_${Date.now()}_${index}`,
    backendId: persistedId,
    tab: item.tab ?? '',
    label: menuName,
    menuname: menuName,
    dllname: templateName,
    actionKey: templateName,
    dllpar1: item.dllpar1 ?? '',
    dllpar2: item.dllpar2 ?? '',
    dllpar3: item.dllpar3 ?? '',
    dllpar4: item.dllpar4 ?? '',
    dllpar5: item.dllpar5 ?? '',
    dllpar6: item.dllpar6 ?? '',
    dllpar7: item.dllpar7 ?? '',
    dllpar8: item.dllpar8 ?? '',
    dllpar9: item.dllpar9 ?? '',
    dllpar10: item.dllpar10 ?? '',
    visible: normalizePopupMenuNumber(item.visible, 0),
    action: actionValue,
    actiontype: normalizePopupMenuNumber(actionTypeValue, 0),
    orderid: normalizePopupMenuNumber(orderValue, index),
    beforeMsg: beforeMessageValue,
    msgSuccess: item.msgSuccess ?? '',
    msgError: item.msgError ?? '',
    menuid: menuIdValue ?? '',
    menuCond: conditionValue,
    disabledCondition: conditionValue,
    menuType: normalizePopupMenuNumber(item.menuType ?? item.menutype, 0),
    visible1: normalizePopupMenuNumber(item.visible1, 0),
    visible2: normalizePopupMenuNumber(item.visible2, 0),
    maxwindow: normalizePopupMenuNumber(item.maxwindow, 0),
    ifRefresh: normalizePopupMenuNumber(item.ifRefresh, 0),
    showMobile: normalizePopupMenuNumber(item.showMobile, 0),
    privilegeOper: item.privilegeOper ?? '',
    DBClickEvent: normalizePopupMenuNumber(item.DBClickEvent, 0),
    ifMoreClick: normalizePopupMenuNumber(item.ifMoreClick, 0),
    ShowToolBar: normalizePopupMenuNumber(item.ShowToolBar, 0),
    defailtimage: item.defailtimage ?? '',
    showMode: normalizePopupMenuNumber(item.showMode, 0),
    addShowMode: normalizePopupMenuNumber(item.addShowMode, 0),
    stepcode: item.stepcode ?? '',
    Fremark: item.Fremark ?? '',
    mergeExec: normalizePopupMenuNumber(item.mergeExec, 0),
    isCopy: normalizePopupMenuNumber(item.isCopy, 0),
    beforeTab: item.beforeTab ?? '',
    isStartRun: normalizePopupMenuNumber(item.isStartRun, 0),
    isMrpClickBtn: normalizePopupMenuNumber(item.isMrpClickBtn, 0),
    disabled: Boolean(item.disabled),
  };
}

export function buildContextMenuItem(index: number, overrides: Record<string, any> = {}) {
  return normalizeContextMenuItem({
    id: `ctx_${Date.now()}_${index}`,
    orderid: index,
    ...overrides,
  }, index);
}

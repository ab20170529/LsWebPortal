export type GridOperationActionKey = 'add' | 'delete' | 'modify' | 'save';

export type GridOperationFieldKey = 'addEnable' | 'deleteEnable' | 'modifyEnable';

type GridOperationDefinition = {
  fieldKey?: GridOperationFieldKey;
  icon: string;
  key: GridOperationActionKey;
  label: string;
  locked?: boolean;
};

export const GRID_OPERATION_DEFINITIONS: ReadonlyArray<GridOperationDefinition> = [
  { key: 'add', label: '增加', icon: 'add_circle', fieldKey: 'addEnable' },
  { key: 'delete', label: '删除', icon: 'delete', fieldKey: 'deleteEnable' },
  { key: 'modify', label: '修改', icon: 'edit_square', fieldKey: 'modifyEnable' },
  { key: 'save', label: '保存', icon: 'save', locked: true },
];

export function isGridOperationActionKey(value: unknown): value is GridOperationActionKey {
  return GRID_OPERATION_DEFINITIONS.some((item) => item.key === value);
}

export function normalizeGridOperationEnable(value: unknown, fallback = 1): 0 | 1 {
  if (value === true || value === 1 || value === '1') {
    return 1;
  }

  if (value === false || value === 0 || value === '0') {
    return 0;
  }

  return fallback === 0 ? 0 : 1;
}

export function getGridOperationDefinition(actionKey: GridOperationActionKey) {
  return GRID_OPERATION_DEFINITIONS.find((item) => item.key === actionKey) ?? GRID_OPERATION_DEFINITIONS[0];
}

export function getGridOperationEnabled(config: Record<string, any> | null | undefined, actionKey: GridOperationActionKey) {
  const definition = getGridOperationDefinition(actionKey);
  if (definition.locked || !definition.fieldKey) {
    return true;
  }

  return normalizeGridOperationEnable(config?.[definition.fieldKey], 1) === 1;
}

export function buildGridOperationConfigSnapshot(config: Record<string, any> | null | undefined) {
  return {
    addEnable: normalizeGridOperationEnable(config?.addEnable, 1),
    deleteEnable: normalizeGridOperationEnable(config?.deleteEnable, 1),
    modifyEnable: normalizeGridOperationEnable(config?.modifyEnable, 1),
  };
}

export function areGridOperationConfigsEqual(
  left: Record<string, any> | null | undefined,
  right: Record<string, any> | null | undefined,
) {
  const leftSnapshot = buildGridOperationConfigSnapshot(left);
  const rightSnapshot = buildGridOperationConfigSnapshot(right);

  return (
    leftSnapshot.addEnable === rightSnapshot.addEnable
    && leftSnapshot.deleteEnable === rightSnapshot.deleteEnable
    && leftSnapshot.modifyEnable === rightSnapshot.modifyEnable
  );
}

import type { BackendMenuNode } from '../../../lib/backend-menus';

export type ModuleTypeProfile = {
  badgeClass: string;
  icon: string;
  label: string;
};

const MODULE_TYPE_PROFILES: Record<'bill' | 'single-table', ModuleTypeProfile> = {
  'single-table': {
    badgeClass: 'border-sky-100 bg-sky-50 text-sky-600',
    icon: 'table_view',
    label: 'Single Table',
  },
  bill: {
    badgeClass: 'border-indigo-100 bg-indigo-50 text-indigo-600',
    icon: 'receipt_long',
    label: 'Bill',
  },
};

export function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

export function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

export function getEnabledMenuNodes<T extends { enabled: boolean }>(nodes?: readonly T[] | null): T[] {
  return (nodes ?? []).filter((node): node is T => node.enabled !== false);
}

export function isUseflagEnabled(useflag: number | string | undefined, enabled: boolean) {
  if (useflag === 1 || useflag === '1') {
    return true;
  }

  if (useflag === 0 || useflag === '0') {
    return false;
  }

  return enabled;
}

export function getMenuModuleTypeProfile(moduleType?: string) {
  const normalizedType = moduleType?.trim().toLowerCase() || '';

  if (normalizedType === 'single-table' || normalizedType === 'bill') {
    return MODULE_TYPE_PROFILES[normalizedType];
  }

  return null;
}

export function getModuleBrowserErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Failed to load module menus. Please retry in a moment.';
}

export function resolveModuleCardAccent(index: number) {
  const accents = [
    {
      actionClass: 'hover:text-primary',
      icon: 'account_balance',
      iconClass: 'bg-primary/5 border-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
    },
    {
      actionClass: 'hover:text-indigo-600',
      icon: 'groups',
      iconClass: 'bg-indigo-50 border-indigo-100 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white',
    },
    {
      actionClass: 'hover:text-cyan-600',
      icon: 'inventory_2',
      iconClass: 'bg-cyan-50 border-cyan-100 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white',
    },
  ] as const;

  return accents[index % accents.length];
}

export function resolveModuleStatus(menu: BackendMenuNode) {
  const enabled = isUseflagEnabled(menu.useflag, menu.enabled);

  return enabled
    ? {
        badgeClass: 'border-emerald-100 bg-emerald-50 text-emerald-600',
        dotClass: 'bg-emerald-500',
        label: 'Active',
      }
    : {
        badgeClass: 'border-amber-100 bg-amber-50 text-amber-600',
        dotClass: 'bg-amber-500',
        label: 'Disabled',
      };
}

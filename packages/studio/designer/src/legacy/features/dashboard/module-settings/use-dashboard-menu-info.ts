import { useMemo } from 'react';

import {
  MENU_CONFIG_SECTIONS,
  MENU_DEFAULT_COMMON_FIELD_KEYS,
  MODULE_GUIDE_PROFILES,
  filterMenuSectionsByKeys,
  type BusinessType,
  type ModuleMenuDraft,
  type ModuleMenuFieldSchema,
  type ModuleMenuValue,
} from './dashboard-menu-config-helpers';

function isMenuFieldFilled(field: ModuleMenuFieldSchema, value: ModuleMenuValue | undefined) {
  if (field.kind === 'switch') {
    return value === 'true';
  }

  return String(value ?? '').trim().length > 0;
}

export function useDashboardMenuInfo({
  businessType,
  menuConfigDraft,
  menuPinnedFields,
}: {
  businessType: BusinessType;
  menuConfigDraft: ModuleMenuDraft;
  menuPinnedFields: Record<BusinessType, string[]>;
}) {
  const currentModuleGuide = MODULE_GUIDE_PROFILES[businessType] ?? MODULE_GUIDE_PROFILES.document;
  const currentMenuSections = MENU_CONFIG_SECTIONS;
  const currentMenuDraft = menuConfigDraft;

  const filledMenuFieldCount = useMemo(() => {
    return currentMenuSections.reduce((total, section) => {
      return total + section.fields.filter((field) => {
        const value = currentMenuDraft[field.key];
        return isMenuFieldFilled(field, value);
      }).length;
    }, 0);
  }, [currentMenuDraft, currentMenuSections]);

  const currentMenuFieldEntries = useMemo(
    () =>
      currentMenuSections.flatMap((section) =>
        section.fields.map((field) => ({
          sectionTitle: section.title,
          sectionDescription: section.description,
          field,
        })),
      ),
    [currentMenuSections],
  );

  const currentMenuFieldMap = useMemo(
    () => new Map(currentMenuFieldEntries.map((entry) => [entry.field.key, entry.field])),
    [currentMenuFieldEntries],
  );

  const currentPinnedMenuKeys = useMemo(() => {
    const defaultKeys = MENU_DEFAULT_COMMON_FIELD_KEYS[businessType] ?? MENU_DEFAULT_COMMON_FIELD_KEYS.document;
    const preferredKeys = menuPinnedFields[businessType] ?? defaultKeys;
    const availableKeys = new Set(currentMenuFieldEntries.map((entry) => entry.field.key));
    return preferredKeys.filter((key, index) => availableKeys.has(key) && preferredKeys.indexOf(key) === index);
  }, [businessType, currentMenuFieldEntries, menuPinnedFields]);

  const currentPinnedMenuKeySet = useMemo(() => new Set(currentPinnedMenuKeys), [currentPinnedMenuKeys]);

  const currentAdvancedMenuKeys = useMemo(() => {
    return currentMenuFieldEntries
      .map((entry) => entry.field.key)
      .filter((key) => !currentPinnedMenuKeySet.has(key));
  }, [currentMenuFieldEntries, currentPinnedMenuKeySet]);

  const currentCommonMenuSections = useMemo(
    () => filterMenuSectionsByKeys(currentMenuSections, currentPinnedMenuKeys),
    [currentMenuSections, currentPinnedMenuKeys],
  );

  const currentAdvancedMenuSections = useMemo(
    () => filterMenuSectionsByKeys(currentMenuSections, currentAdvancedMenuKeys),
    [currentAdvancedMenuKeys, currentMenuSections],
  );

  const commonFilledMenuFieldCount = useMemo(() => {
    return currentPinnedMenuKeys.reduce((total, key) => {
      const field = currentMenuFieldMap.get(key);
      if (!field) return total;
      return total + (isMenuFieldFilled(field, currentMenuDraft[key]) ? 1 : 0);
    }, 0);
  }, [currentMenuDraft, currentMenuFieldMap, currentPinnedMenuKeys]);

  const advancedFilledMenuFieldCount = useMemo(() => {
    return currentAdvancedMenuKeys.reduce((total, key) => {
      const field = currentMenuFieldMap.get(key);
      if (!field) return total;
      return total + (isMenuFieldFilled(field, currentMenuDraft[key]) ? 1 : 0);
    }, 0);
  }, [currentAdvancedMenuKeys, currentMenuDraft, currentMenuFieldMap]);

  return {
    advancedFilledMenuFieldCount,
    commonFilledMenuFieldCount,
    currentAdvancedMenuKeys,
    currentAdvancedMenuSections,
    currentMenuDraft,
    currentMenuFieldEntries,
    currentMenuFieldMap,
    currentModuleGuide,
    currentPinnedMenuKeys,
    currentPinnedMenuKeySet,
    currentCommonMenuSections,
    filledMenuFieldCount,
  };
}

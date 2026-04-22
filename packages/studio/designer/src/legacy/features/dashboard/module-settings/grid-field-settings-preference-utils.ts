import type {
  GridFieldSettingsPreferencePayload,
  GridFieldSettingsPreferenceScope,
} from '../../../lib/backend-grid-field-settings-preferences';
import { singleTableMainFieldSettings } from './single-table-main-field-settings-schema';

const SETTING_KEY_SET = new Set(singleTableMainFieldSettings.map((definition) => definition.key));

export const DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE: GridFieldSettingsPreferencePayload = {
  columnWidths: Object.fromEntries(
    singleTableMainFieldSettings.map((definition) => [definition.key, definition.width]),
  ),
  orderedSettingKeys: singleTableMainFieldSettings.map((definition) => definition.key),
};

export function normalizeGridFieldSettingsPreference(
  preference?: Partial<GridFieldSettingsPreferencePayload> | null,
): GridFieldSettingsPreferencePayload {
  const normalizedOrderedSettingKeys: string[] = [];
  const seenSettingKeys = new Set<string>();

  for (const rawKey of preference?.orderedSettingKeys ?? []) {
    const normalizedKey = String(rawKey ?? '').trim();
    if (!normalizedKey || seenSettingKeys.has(normalizedKey) || !SETTING_KEY_SET.has(normalizedKey)) {
      continue;
    }

    seenSettingKeys.add(normalizedKey);
    normalizedOrderedSettingKeys.push(normalizedKey);
  }

  for (const defaultSettingKey of DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE.orderedSettingKeys) {
    if (!seenSettingKeys.has(defaultSettingKey)) {
      normalizedOrderedSettingKeys.push(defaultSettingKey);
    }
  }

  const normalizedColumnWidths = {
    ...DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE.columnWidths,
  };

  if (preference?.columnWidths && typeof preference.columnWidths === 'object') {
    for (const [settingKey, widthValue] of Object.entries(preference.columnWidths)) {
      if (!SETTING_KEY_SET.has(settingKey)) {
        continue;
      }

      const numericWidth = Number(widthValue);
      if (!Number.isFinite(numericWidth) || numericWidth <= 0) {
        continue;
      }

      normalizedColumnWidths[settingKey] = Math.round(numericWidth);
    }
  }

  return {
    columnWidths: normalizedColumnWidths,
    orderedSettingKeys: normalizedOrderedSettingKeys,
  };
}

export function serializeGridFieldSettingsPreference(preference: GridFieldSettingsPreferencePayload) {
  return JSON.stringify({
    columnWidths: Object.fromEntries(
      DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE.orderedSettingKeys.map((settingKey) => [
        settingKey,
        preference.columnWidths[settingKey],
      ]),
    ),
    orderedSettingKeys: preference.orderedSettingKeys,
  });
}

export function serializeGridFieldSettingsScope(scope?: GridFieldSettingsPreferenceScope | null) {
  if (!scope) {
    return '';
  }

  const ownerCode = String(scope.ownerCode ?? '').trim();
  if (!ownerCode) {
    return '';
  }

  return [
    scope.ownerType,
    ownerCode,
    scope.viewScope,
    scope.detailTabKey ? String(scope.detailTabKey).trim() : '',
  ].join('::');
}

import { apiRequest } from './http';

export type GridFieldSettingsPreferenceOwnerType = 'single-table' | 'bill';
export type GridFieldSettingsPreferenceViewScope = 'main' | 'detail';

export type GridFieldSettingsPreferenceScope = {
  detailTabKey?: string | null;
  ownerCode: string;
  ownerType: GridFieldSettingsPreferenceOwnerType;
  viewScope: GridFieldSettingsPreferenceViewScope;
};

export type GridFieldSettingsPreferencePayload = {
  columnWidths: Record<string, number>;
  orderedSettingKeys: string[];
};

export type GridFieldSettingsPreferenceResponse = {
  hasUserPreference: boolean;
  meta: {
    detailTabKey?: string | null;
    ownerCode: string;
    ownerType: GridFieldSettingsPreferenceOwnerType;
    updatedAt?: string | null;
    viewScope: GridFieldSettingsPreferenceViewScope;
  };
  preference: GridFieldSettingsPreferencePayload | null;
};

function normalizeScope(scope: GridFieldSettingsPreferenceScope) {
  return {
    detailTabKey: scope.detailTabKey ? String(scope.detailTabKey).trim() : undefined,
    ownerCode: String(scope.ownerCode ?? '').trim(),
    ownerType: scope.ownerType,
    viewScope: scope.viewScope,
  };
}

export async function fetchGridFieldSettingsPreference(scope: GridFieldSettingsPreferenceScope) {
  return apiRequest<GridFieldSettingsPreferenceResponse>('/api/system/grid-field-settings-preferences', {
    auth: true,
    method: 'GET',
    query: normalizeScope(scope),
  });
}

export async function saveGridFieldSettingsPreference(
  scope: GridFieldSettingsPreferenceScope,
  preference: GridFieldSettingsPreferencePayload,
) {
  const normalizedScope = normalizeScope(scope);
  return apiRequest<GridFieldSettingsPreferenceResponse>('/api/system/grid-field-settings-preferences', {
    auth: true,
    body: {
      ...normalizedScope,
      columnWidths: preference.columnWidths,
      orderedSettingKeys: preference.orderedSettingKeys,
    },
    method: 'PUT',
  });
}

export async function resetGridFieldSettingsPreference(scope: GridFieldSettingsPreferenceScope) {
  return apiRequest<GridFieldSettingsPreferenceResponse>('/api/system/grid-field-settings-preferences', {
    auth: true,
    method: 'DELETE',
    query: normalizeScope(scope),
  });
}

const PUBLIC_RUNTIME_DATASOURCE_PARAM = 'datasourceCode';
const PUBLIC_RUNTIME_VERSION_PARAM = 'versionId';
const AUTH_STORAGE_KEYS = ['lserp.portal.auth.v2', 'lserp.portal.auth.session'];

type StoredAuthSession = {
  activeCompany?: {
    companyKey?: string;
    datasourceCode?: string;
  } | null;
  companyKey?: string;
  datasourceCode?: string;
};

function readStorageValue(storage: Storage | null, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function resolveDatasourceCode(session: StoredAuthSession | null) {
  return (
    session?.activeCompany?.datasourceCode?.trim() ||
    session?.datasourceCode?.trim() ||
    session?.activeCompany?.companyKey?.trim() ||
    session?.companyKey?.trim() ||
    null
  );
}

export function readBiActiveDatasourceCode() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageCandidates = [window.sessionStorage, window.localStorage];
  for (const storage of storageCandidates) {
    for (const key of AUTH_STORAGE_KEYS) {
      const raw = readStorageValue(storage, key);
      if (!raw) {
        continue;
      }

      try {
        const datasourceCode = resolveDatasourceCode(JSON.parse(raw) as StoredAuthSession);
        if (datasourceCode) {
          return datasourceCode;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

export function buildBiPublicScreenPath(screenCode: string, versionId?: number | null, datasourceCode = readBiActiveDatasourceCode()) {
  const params = new URLSearchParams();
  if (versionId != null) {
    params.set(PUBLIC_RUNTIME_VERSION_PARAM, String(versionId));
  }
  if (datasourceCode) {
    params.set(PUBLIC_RUNTIME_DATASOURCE_PARAM, datasourceCode);
  }

  const search = params.toString();
  return `/bi/public/screen/${encodeURIComponent(screenCode)}${search ? `?${search}` : ''}`;
}

export function readBiPublicRuntimeOptions(search: string) {
  const params = new URLSearchParams(search);
  const versionIdRaw = params.get(PUBLIC_RUNTIME_VERSION_PARAM) ?? params.get('previewVersionId');
  const versionId = versionIdRaw && Number.isFinite(Number(versionIdRaw)) ? Number(versionIdRaw) : null;
  const datasourceCode = params.get(PUBLIC_RUNTIME_DATASOURCE_PARAM)?.trim() || params.get('ds')?.trim() || null;

  return { datasourceCode, versionId };
}

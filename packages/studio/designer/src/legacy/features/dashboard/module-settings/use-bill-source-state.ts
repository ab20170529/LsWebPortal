import { useCallback, useMemo, useState } from 'react';

export type BillSourceEntry = {
  id: string;
  configType: string;
  sourceName: string;
  sourceSql: string;
  sourceDetail: string;
  sourceType: string;
};

type UseBillSourceStateOptions = {
  showToast: (message: string) => void;
};

function parseBillSourceDetailFields(sourceDetail?: string) {
  if (!sourceDetail) {
    return [];
  }

  return sourceDetail
    .split(/[\n,，;；|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function useBillSourceState({ showToast }: UseBillSourceStateOptions) {
  const buildBillSourceEntry = useCallback((index: number, overrides: Partial<BillSourceEntry> = {}): BillSourceEntry => ({
    id: `bill-source-${Date.now()}-${index}`,
    configType: '普通来源',
    sourceName: '',
    sourceSql: '',
    sourceDetail: '',
    sourceType: 'SQL',
    ...overrides,
  }), []);

  const [billSources, setBillSources] = useState<BillSourceEntry[]>([]);
  const [activeBillSourceId, setActiveBillSourceId] = useState('');
  const [billSourceDraft, setBillSourceDraft] = useState<BillSourceEntry>(() => buildBillSourceEntry(1));
  const [billSourceDraftMode, setBillSourceDraftMode] = useState<'create' | 'edit'>('create');

  const billSourceFieldMap = useMemo(
    () => billSources.reduce<Record<string, string[]>>((accumulator, item) => {
      accumulator[item.id] = parseBillSourceDetailFields(item.sourceDetail);
      return accumulator;
    }, {}),
    [billSources],
  );

  const selectBillSourceDraft = useCallback((source: BillSourceEntry) => {
    setActiveBillSourceId(source.id);
    setBillSourceDraft({ ...source });
    setBillSourceDraftMode('edit');
  }, []);

  const createBillSourceDraft = useCallback(() => {
    const nextDraft = buildBillSourceEntry(billSources.length + 1);
    setActiveBillSourceId(nextDraft.id);
    setBillSourceDraft(nextDraft);
    setBillSourceDraftMode('create');
  }, [billSources.length, buildBillSourceEntry]);

  const saveBillSourceDraft = useCallback(() => {
    const normalizedDraft = {
      ...billSourceDraft,
      sourceName: billSourceDraft.sourceName.trim(),
      sourceSql: billSourceDraft.sourceSql.trim(),
      sourceDetail: billSourceDraft.sourceDetail.trim(),
    };

    setBillSources((prev) => (
      prev.some((item) => item.id === normalizedDraft.id)
        ? prev.map((item) => (item.id === normalizedDraft.id ? normalizedDraft : item))
        : [...prev, normalizedDraft]
    ));
    setActiveBillSourceId(normalizedDraft.id);
    setBillSourceDraft(normalizedDraft);
    setBillSourceDraftMode('edit');
    showToast('来源配置已保存');
  }, [billSourceDraft, showToast]);

  const updateBillSourceDraft = useCallback((patch: Partial<BillSourceEntry>) => {
    setBillSourceDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetBillSourceState = useCallback(() => {
    setBillSources([]);
    setActiveBillSourceId('');
    setBillSourceDraft(buildBillSourceEntry(1));
    setBillSourceDraftMode('create');
  }, [buildBillSourceEntry]);

  return {
    activeBillSourceId,
    billSourceDraft,
    billSourceDraftMode,
    billSourceFieldMap,
    billSources,
    buildBillSourceEntry,
    createBillSourceDraft,
    resetBillSourceState,
    saveBillSourceDraft,
    selectBillSourceDraft,
    setBillSourceDraft,
    updateBillSourceDraft,
  };
}

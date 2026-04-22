import { useCallback, useMemo, useState } from 'react';

export type BillSourceEntry = {
  id: string;
  configType: string;
  disabled: boolean;
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
    disabled: false,
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

  const updateBillSourceById = useCallback((sourceId: string, patch: Partial<BillSourceEntry>) => {
    setBillSources((prev) => prev.map((item) => (
      item.id === sourceId ? { ...item, ...patch } : item
    )));
    setBillSourceDraft((prev) => (
      prev.id === sourceId ? { ...prev, ...patch } : prev
    ));
  }, []);

  const deleteBillSourceById = useCallback((sourceId: string) => {
    setBillSources((prev) => {
      const nextSources = prev.filter((item) => item.id !== sourceId);
      const nextActiveSource = nextSources[0] ?? null;

      setActiveBillSourceId(nextActiveSource?.id ?? '');

      if (nextActiveSource) {
        setBillSourceDraft({ ...nextActiveSource });
        setBillSourceDraftMode('edit');
      } else {
        setBillSourceDraft(buildBillSourceEntry(1));
        setBillSourceDraftMode('create');
      }

      return nextSources;
    });
    showToast('来源已删除');
  }, [buildBillSourceEntry, showToast]);

  const hydrateBillSources = useCallback((nextSources: BillSourceEntry[]) => {
    const availableSources = Array.isArray(nextSources) ? nextSources : [];
    const nextActiveSource = availableSources.find((item) => item.id === activeBillSourceId) ?? availableSources[0] ?? null;

    setBillSources(availableSources);
    setActiveBillSourceId(nextActiveSource?.id ?? '');

    if (nextActiveSource) {
      setBillSourceDraft({ ...nextActiveSource });
      setBillSourceDraftMode('edit');
      return;
    }

    setBillSourceDraft(buildBillSourceEntry(availableSources.length + 1));
    setBillSourceDraftMode('create');
  }, [activeBillSourceId, buildBillSourceEntry]);

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
    deleteBillSourceById,
    hydrateBillSources,
    resetBillSourceState,
    saveBillSourceDraft,
    selectBillSourceDraft,
    setBillSourceDraft,
    updateBillSourceById,
    updateBillSourceDraft,
  };
}

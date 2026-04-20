import { useEffect, useState } from 'react';

import {
  fetchFieldSqlTagOptions,
  type FieldSqlTagOptionDto,
} from '../../../lib/backend-system';

export function useDashboardFieldSqlTagOptions({
  defaultFieldSqlTagOptions,
  getFieldSqlTagOptionLabel,
  normalizeFieldSqlTagId,
}: {
  defaultFieldSqlTagOptions: FieldSqlTagOptionDto[];
  getFieldSqlTagOptionLabel: (option: FieldSqlTagOptionDto | null | undefined) => string;
  normalizeFieldSqlTagId: (value: unknown, fallback?: number) => number;
}) {
  const [fieldSqlTagOptions, setFieldSqlTagOptions] = useState<FieldSqlTagOptionDto[]>(defaultFieldSqlTagOptions);

  useEffect(() => {
    let isActive = true;

    const loadFieldSqlTagOptions = async () => {
      try {
        const rows = await fetchFieldSqlTagOptions();

        if (!isActive || !Array.isArray(rows) || rows.length === 0) {
          return;
        }

        const dedupedRows = rows.reduce<FieldSqlTagOptionDto[]>((collection, row) => {
          const optionId = normalizeFieldSqlTagId(row?.showid, -1);
          if (optionId < 0 || collection.some((item) => normalizeFieldSqlTagId(item.showid, -1) === optionId)) {
            return collection;
          }

          collection.push({
            showid: optionId,
            showname: getFieldSqlTagOptionLabel(row),
          });
          return collection;
        }, []);

        if (dedupedRows.length > 0) {
          setFieldSqlTagOptions(dedupedRows);
        }
      } catch {
        if (!isActive) {
          return;
        }

        setFieldSqlTagOptions(defaultFieldSqlTagOptions);
      }
    };

    void loadFieldSqlTagOptions();

    return () => {
      isActive = false;
    };
  }, [
    defaultFieldSqlTagOptions,
    getFieldSqlTagOptionLabel,
    normalizeFieldSqlTagId,
  ]);

  return fieldSqlTagOptions;
}

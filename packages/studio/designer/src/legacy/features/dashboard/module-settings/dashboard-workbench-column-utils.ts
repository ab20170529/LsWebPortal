export function parsePastedWorkbenchColumnNames(text: string) {
  return text
    .split(/[\t\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function estimateWorkbenchColumnWidth(
  rawColumn: any,
  normalizeColumn: (column: any) => any,
  {
    minWidth,
    maxWidth,
  }: {
    minWidth: number;
    maxWidth: number;
  },
) {
  const column = normalizeColumn(rawColumn);
  const normalizedMinWidth = Number.isFinite(minWidth) ? minWidth : 48;
  const normalizedMaxWidth = Number.isFinite(maxWidth) ? maxWidth : 680;
  const contentLength = Math.max(
    column.name?.length ?? 0,
    column.placeholder?.length ?? 0,
    column.defaultValue?.length ?? 0,
    column.type?.length ?? 0,
  );
  const baseWidth =
    column.type === '日期框'
      ? 188
      : column.type === '数字'
        ? 144
        : column.type === '搜索框'
          ? 228
          : column.type === '下拉框'
            ? 176
            : 124;

  return Math.max(normalizedMinWidth, Math.min(normalizedMaxWidth, baseWidth + contentLength * 15));
}

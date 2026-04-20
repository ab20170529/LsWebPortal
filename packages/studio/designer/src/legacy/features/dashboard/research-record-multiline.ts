export type ResearchLineColorTone = 'default' | 'red';

export type ResearchLineColorMap = Record<string, ResearchLineColorTone>;

export type ResearchDisplayLine = {
  color: ResearchLineColorTone;
  numberedText: string;
  order: number;
  rawIndex: number;
  text: string;
};

export function normalizeLineColorMap(raw: unknown): ResearchLineColorMap {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const next: ResearchLineColorMap = {};
  Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
    if (!/^\d+$/.test(key)) {
      return;
    }
    if (value === 'red' || value === 'default') {
      next[key] = value;
    }
  });
  return next;
}

export function normalizeMultilineValue(value: string, delimiters: RegExp = /\r?\n/) {
  return value
    .split(delimiters)
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n');
}

export function buildMultilineDisplayLines(
  value: string,
  lineColors: ResearchLineColorMap = {},
  delimiters: RegExp = /\r?\n/,
): ResearchDisplayLine[] {
  return value
    .split(delimiters)
    .map((rawLine, rawIndex) => ({
      rawIndex,
      text: rawLine.trim(),
    }))
    .filter((line) => line.text)
    .map((line, visibleIndex) => ({
      color: lineColors[String(line.rawIndex)] === 'red' ? 'red' : 'default',
      numberedText: `${visibleIndex + 1}、${line.text}`,
      order: visibleIndex + 1,
      rawIndex: line.rawIndex,
      text: line.text,
    }));
}

export function getLineIndexFromSelection(value: string, selectionStart: number) {
  const safeIndex = Math.max(0, Math.min(selectionStart, value.length));
  return value.slice(0, safeIndex).split(/\r?\n/).length - 1;
}

export function getLineTextByIndex(value: string, index: number) {
  return (value.split(/\r?\n/)[index] || '').trim();
}

export function applyLineColor(
  current: ResearchLineColorMap,
  lineIndex: number,
  color: ResearchLineColorTone,
): ResearchLineColorMap {
  const next = { ...current };
  if (color === 'default') {
    delete next[String(lineIndex)];
    return next;
  }
  next[String(lineIndex)] = color;
  return next;
}

export function buildUniformLineColorMap(
  value: string,
  color: ResearchLineColorTone,
  delimiters: RegExp = /\r?\n/,
): ResearchLineColorMap {
  if (color === 'default') {
    return {};
  }

  const next: ResearchLineColorMap = {};
  value.split(delimiters).forEach((rawLine, rawIndex) => {
    if (rawLine.trim()) {
      next[String(rawIndex)] = color;
    }
  });
  return next;
}

import type { CSSProperties } from 'react';

export type BiScreenBackground = {
  accentColor?: string;
  css?: string;
  description?: string;
  fit?: string;
  imageUrl?: string;
  overlay?: string;
  position?: string;
  prompt?: string;
  source?: string;
  type?: string;
};

const SAFE_GRADIENT_PATTERN = /^(linear-gradient|radial-gradient|conic-gradient)\(/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asTrimmedString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isSafeGradientLayer(value: string) {
  const normalized = value.trim();
  return normalized.length <= 1400
    && !/[;]/.test(normalized)
    && !/url\s*\(/i.test(normalized)
    && normalized
      .split(/,(?=\s*(?:linear-gradient|radial-gradient|conic-gradient)\()/i)
      .every((layer) => SAFE_GRADIENT_PATTERN.test(layer.trim()));
}

function isSafeImageUrl(value: string) {
  return value.startsWith('data:image/') || value.startsWith('/assets/') || value.startsWith('/bi-assets/');
}

function readBackgroundValue(record: Record<string, unknown>): BiScreenBackground {
  return {
    accentColor: asTrimmedString(record.accentColor) ?? undefined,
    css: asTrimmedString(record.css) ?? undefined,
    description: asTrimmedString(record.description) ?? undefined,
    fit: asTrimmedString(record.fit) ?? undefined,
    imageUrl: asTrimmedString(record.imageUrl) ?? undefined,
    overlay: asTrimmedString(record.overlay) ?? undefined,
    position: asTrimmedString(record.position) ?? undefined,
    prompt: asTrimmedString(record.prompt) ?? undefined,
    source: asTrimmedString(record.source) ?? undefined,
    type: asTrimmedString(record.type) ?? undefined,
  };
}

export function getBiScreenBackground(pageSchema?: Record<string, unknown> | null): BiScreenBackground | null {
  const pageSchemaRecord = asRecord(pageSchema);
  const backgroundRecord = asRecord(pageSchemaRecord?.background);
  return backgroundRecord ? readBackgroundValue(backgroundRecord) : null;
}

export function mergeBiScreenBackground(
  pageSchema: Record<string, unknown> | null | undefined,
  background: BiScreenBackground,
) {
  return {
    ...(pageSchema ?? {}),
    background,
  };
}

export function getBiScreenBackgroundStyle(pageSchema?: Record<string, unknown> | null): CSSProperties | undefined {
  const background = getBiScreenBackground(pageSchema);
  if (!background) {
    return undefined;
  }

  const layers: string[] = [];
  if (background.overlay && isSafeGradientLayer(background.overlay)) {
    layers.push(background.overlay);
  }
  if (background.imageUrl && isSafeImageUrl(background.imageUrl)) {
    layers.push(`url("${background.imageUrl}")`);
  }
  if (background.css && isSafeGradientLayer(background.css)) {
    layers.push(background.css);
  }
  if (layers.length === 0) {
    return undefined;
  }

  return {
    '--bi-display-accent': background.accentColor,
    backgroundImage: layers.join(', '),
    backgroundPosition: background.position ?? 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: background.imageUrl ? (background.fit ?? 'cover') : 'cover',
  } as CSSProperties;
}

export function getBiScreenBackgroundLabel(pageSchema?: Record<string, unknown> | null) {
  const background = getBiScreenBackground(pageSchema);
  if (!background) {
    return '未设置背景';
  }
  if (background.type === 'image' || background.source === 'upload') {
    return '上传背景图';
  }
  if (background.source === 'ai' || background.type === 'generated') {
    return 'AI生成背景';
  }
  return background.description ?? '自定义背景';
}

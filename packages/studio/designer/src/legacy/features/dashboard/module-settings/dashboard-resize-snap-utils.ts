const WIDTH_RESIZE_SNAP_THRESHOLD = 10;
const WIDTH_RESIZE_GRID_STEP = 4;

export function buildResizeSnapCandidates(
  widths: number[],
  {
    minWidth,
    maxWidth,
    baseWidth,
  }: {
    minWidth: number;
    maxWidth: number;
    baseWidth: number;
  },
) {
  const candidates = new Set<number>([minWidth, maxWidth, baseWidth]);
  widths
    .map((width) => Math.round(width))
    .filter((width) => Number.isFinite(width) && width >= minWidth && width <= maxWidth)
    .forEach((width) => candidates.add(width));

  return Array.from(candidates).sort((left, right) => left - right);
}

export function resolveResizeWidthWithSnap(
  rawWidth: number,
  {
    minWidth,
    maxWidth,
    snapCandidates,
    snapThreshold = WIDTH_RESIZE_SNAP_THRESHOLD,
  }: {
    minWidth: number;
    maxWidth: number;
    snapCandidates: number[];
    snapThreshold?: number;
  },
) {
  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, rawWidth));
  const gridWidth = Math.max(
    minWidth,
    Math.min(maxWidth, Math.round(clampedWidth / WIDTH_RESIZE_GRID_STEP) * WIDTH_RESIZE_GRID_STEP),
  );
  const snappedCandidate = snapCandidates.reduce<number | null>((closest, candidate) => {
    if (Math.abs(candidate - clampedWidth) > snapThreshold) return closest;
    if (closest === null) return candidate;
    return Math.abs(candidate - clampedWidth) < Math.abs(closest - clampedWidth) ? candidate : closest;
  }, null);
  const width = Math.round(snappedCandidate ?? gridWidth);

  return {
    width,
    snappedTo: snappedCandidate,
  };
}

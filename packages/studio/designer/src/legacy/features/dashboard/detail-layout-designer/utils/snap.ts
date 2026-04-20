import type { DetailLayoutRect } from '../types';

export function snapToGrid(value: number, gridSize: number) {
  if (gridSize <= 1) {
    return Math.round(value);
  }

  return Math.round(value / gridSize) * gridSize;
}

export function snapSize(value: number, gridSize: number, minValue = gridSize) {
  return Math.max(minValue, snapToGrid(value, gridSize));
}

export function snapRectToGrid(rect: DetailLayoutRect, gridSize: number): DetailLayoutRect {
  return {
    x: snapToGrid(rect.x, gridSize),
    y: snapToGrid(rect.y, gridSize),
    w: snapSize(rect.w, gridSize),
    h: snapSize(rect.h, gridSize),
  };
}

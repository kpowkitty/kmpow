import { CELL_PX } from './config';

export const wrap = (n, size) => ((n % size) + size) % size;

export const cellKey = (col, row) => `${col},${row}`;

export const cellCenter = (col, row, cellPx = CELL_PX) => ({
  x: (col + 0.5) * cellPx,
  y: (row + 0.5) * cellPx,
});

// Shortest signed step from a to b on a ring of `size`; exactly half the ring resolves to +size/2.
export function torusDelta(a, b, size) {
  const d = wrap(b - a, size);
  return d > size / 2 ? d - size : d;
}

export const worldSize = (galaxy, cellPx = CELL_PX) => ({
  width: galaxy.cols * cellPx,
  height: galaxy.rows * cellPx,
});

// Wrap-aware offset from the camera to a world point; the shader does the same.
export function offsetFromCamera(point, camera, galaxy, cellPx = CELL_PX) {
  const { width, height } = worldSize(galaxy, cellPx);
  return {
    dx: torusDelta(camera.x, point.x, width),
    dy: torusDelta(camera.y, point.y, height),
  };
}

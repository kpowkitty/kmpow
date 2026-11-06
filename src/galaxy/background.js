import { hash2, mulberry32 } from '../lib/random';
import { BG_STAR_MIN_GAP_PX, BG_STAR_SIZE, BG_STAR_TRIES, BLOG_CLEAR_RADIUS, CELL_PX, DENSITY } from './config';
import { cellKey, wrap } from './grid';

const DEFAULTS = { cellPx: CELL_PX, density: DENSITY, size: BG_STAR_SIZE, minGap: BG_STAR_MIN_GAP_PX, tries: BG_STAR_TRIES };

export function blockedCells(blogCells, galaxy, radius = BLOG_CLEAR_RADIUS) {
  const blocked = new Set();
  for (const { col, row } of blogCells) {
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) blocked.add(cellKey(wrap(col + dc, galaxy.cols), wrap(row + dr, galaxy.rows)));
    }
  }
  return blocked;
}

const farEnough = (stars, x, y, minGap) => stars.every((s) => (s.x - x) ** 2 + (s.y - y) ** 2 >= minGap ** 2);

export function starsForCell(col, row, seed, options = {}) {
  const { cellPx, density, size, minGap, tries } = { ...DEFAULTS, ...options };
  const rng = mulberry32(hash2(col, row, seed));
  const count = density.min + Math.floor(rng() * (density.max - density.min + 1));
  const stars = [];
  for (let i = 0; i < count; i++) {
    for (let t = 0; t < tries; t++) {
      const x = (col + rng()) * cellPx;
      const y = (row + rng()) * cellPx;
      if (!farEnough(stars, x, y, minGap)) continue;
      stars.push({ x, y, size: size.min + rng() * (size.max - size.min), phase: rng() });
      break;
    }
  }
  return stars;
}

export function backgroundStars(galaxy, blocked = new Set(), options = {}) {
  const stars = [];
  for (let col = 0; col < galaxy.cols; col++) {
    for (let row = 0; row < galaxy.rows; row++) {
      if (!blocked.has(cellKey(col, row))) stars.push(...starsForCell(col, row, galaxy.seed, options));
    }
  }
  return stars;
}

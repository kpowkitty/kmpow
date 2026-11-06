import { backgroundStars, blockedCells, starsForCell } from '../../src/galaxy/background';
import { cellKey } from '../../src/galaxy/grid';

const GALAXY = { cols: 16, rows: 8, seed: 3 };
const CELL = 100;
const OPTIONS = { cellPx: CELL, density: { min: 0, max: 4 }, size: { min: 1, max: 20 }, minGap: 24, tries: 8 };
const cellOf = (star) => cellKey(Math.floor(star.x / CELL), Math.floor(star.y / CELL));

describe('blockedCells', () => {
  test('blocks the blog cell and its 8 neighbors', () => {
    const blocked = blockedCells([{ col: 5, row: 4 }], GALAXY, 1);
    expect(blocked.size).toBe(9);
    for (const [c, r] of [[4, 3], [5, 3], [6, 3], [4, 4], [5, 4], [6, 4], [4, 5], [5, 5], [6, 5]]) expect(blocked.has(cellKey(c, r))).toBe(true);
  });

  test('wraps across the seam', () => {
    const blocked = blockedCells([{ col: 0, row: 0 }], GALAXY, 1);
    for (const [c, r] of [[15, 7], [0, 7], [1, 7], [15, 0], [15, 1]]) expect(blocked.has(cellKey(c, r))).toBe(true);
  });

  test('radius 0 blocks only the blog cell; overlapping areas are not double counted', () => {
    expect(blockedCells([{ col: 2, row: 2 }], GALAXY, 0)).toEqual(new Set([cellKey(2, 2)]));
    expect(blockedCells([{ col: 2, row: 2 }, { col: 3, row: 2 }], GALAXY, 1).size).toBe(12);
  });
});

describe('starsForCell', () => {
  test('same cell and seed give the same stars', () => {
    expect(starsForCell(7, 2, 3, OPTIONS)).toEqual(starsForCell(7, 2, 3, OPTIONS));
  });

  test('a different seed gives different stars', () => {
    const cells = Array.from({ length: 20 }, (_, i) => i);
    expect(cells.map((c) => starsForCell(c, 0, 1, OPTIONS))).not.toEqual(cells.map((c) => starsForCell(c, 0, 2, OPTIONS)));
  });

  test('count, size and phase stay in range, and every star lies inside its cell', () => {
    for (let col = 0; col < 30; col++) {
      for (let row = 0; row < 30; row++) {
        const stars = starsForCell(col, row, 3, OPTIONS);
        expect(stars.length).toBeLessThanOrEqual(4);
        for (const s of stars) {
          expect(cellOf(s)).toBe(cellKey(col, row));
          expect(s.size).toBeGreaterThanOrEqual(1);
          expect(s.size).toBeLessThan(20);
          expect(s.phase).toBeGreaterThanOrEqual(0);
          expect(s.phase).toBeLessThan(1);
        }
      }
    }
  });

  test('stars in a cell keep the minimum gap', () => {
    const dense = { ...OPTIONS, density: { min: 6, max: 6 } };
    for (let col = 0; col < 30; col++) {
      const stars = starsForCell(col, 0, 3, dense);
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) expect(Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y)).toBeGreaterThanOrEqual(24);
      }
    }
  });

  test('a cell with no room drops stars instead of looping forever', () => {
    const crowded = { ...OPTIONS, density: { min: 50, max: 50 }, minGap: 90 };
    expect(starsForCell(0, 0, 3, crowded).length).toBeLessThan(50);
  });
});

describe('backgroundStars', () => {
  test('the whole galaxy generates the same result twice', () => {
    expect(backgroundStars(GALAXY, new Set(), OPTIONS)).toEqual(backgroundStars(GALAXY, new Set(), OPTIONS));
  });

  test('is every unblocked cell\'s stars, in one flat array', () => {
    const expected = [];
    for (let col = 0; col < GALAXY.cols; col++) {
      for (let row = 0; row < GALAXY.rows; row++) expected.push(...starsForCell(col, row, GALAXY.seed, OPTIONS));
    }
    expect(backgroundStars(GALAXY, new Set(), OPTIONS)).toEqual(expected);
  });

  test('blocked cells get no stars, including across the seam', () => {
    const blocked = blockedCells([{ col: 0, row: 0 }, { col: 8, row: 4 }], GALAXY, 1);
    const stars = backgroundStars(GALAXY, blocked, OPTIONS);
    expect(stars.length).toBeGreaterThan(0);
    for (const s of stars) expect(blocked.has(cellOf(s))).toBe(false);
  });
});

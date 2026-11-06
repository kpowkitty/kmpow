import { cellCenter, cellKey, offsetFromCamera, torusDelta, worldSize, wrap } from '../../src/galaxy/grid';

const GALAXY = { cols: 64, rows: 32 };
const CELL = 100;

describe('wrap', () => {
  test.each([
    [0, 0], [63, 63], [64, 0], [65, 1], [-1, 63], [-64, 0], [-65, 63], [130, 2],
  ])('wrap(%i, 64) is %i', (n, expected) => {
    expect(wrap(n, 64)).toBe(expected);
  });
});

describe('cellKey / cellCenter / worldSize', () => {
  test('cellKey is stable and distinguishes col from row', () => {
    expect(cellKey(1, 2)).toBe(cellKey(1, 2));
    expect(cellKey(1, 2)).not.toBe(cellKey(2, 1));
  });

  test('cellCenter is the middle of the cell', () => {
    expect(cellCenter(0, 0, CELL)).toEqual({ x: 50, y: 50 });
    expect(cellCenter(3, 1, CELL)).toEqual({ x: 350, y: 150 });
  });

  test('worldSize is the grid in pixels', () => {
    expect(worldSize(GALAXY, CELL)).toEqual({ width: 6400, height: 3200 });
  });
});

describe('torusDelta', () => {
  test.each([
    [10, 12, 2],
    [12, 10, -2],
    [63, 0, 1],
    [0, 63, -1],
    [5, 5, 0],
    [0, 32, 32],
    [32, 0, 32],
  ])('from %i to %i on a ring of 64 is %i', (a, b, expected) => {
    expect(torusDelta(a, b, 64)).toBe(expected);
  });
});

describe('offsetFromCamera', () => {
  test('a nearby point is a plain difference', () => {
    expect(offsetFromCamera({ x: 1200, y: 900 }, { x: 1000, y: 1000 }, GALAXY, CELL)).toEqual({ dx: 200, dy: -100 });
  });

  test('a point past the seam is reached the short way', () => {
    const camera = { x: 6350, y: 3150 };
    expect(offsetFromCamera({ x: 50, y: 50 }, camera, GALAXY, CELL)).toEqual({ dx: 100, dy: 100 });
    expect(offsetFromCamera(camera, { x: 50, y: 50 }, GALAXY, CELL)).toEqual({ dx: -100, dy: -100 });
  });

  test('a camera outside the world range gives the same offset as its wrapped position', () => {
    const point = { x: 500, y: 500 };
    const a = offsetFromCamera(point, { x: 300, y: 300 }, GALAXY, CELL);
    const b = offsetFromCamera(point, { x: 300 + 6400 * 3, y: 300 - 3200 * 2 }, GALAXY, CELL);
    expect(b).toEqual(a);
  });
});

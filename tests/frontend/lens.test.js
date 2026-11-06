import { readFileSync } from 'fs';
import { join } from 'path';
import { lensInvRadius } from '../../src/galaxy/config';
import { LENS_GLSL, lens } from '../../src/galaxy/shaders/lens.generated';

const INV_R = 1 / 400;
const result = (d, invR = INV_R) => {
  const [x, y, scale] = lens(d, invR);
  return { x, y, scale };
};

describe('lens', () => {
  test('the center is unchanged at full size', () => {
    expect(result([0, 0])).toEqual({ x: 0, y: 0, scale: 1 });
  });

  test('invR 0 is flat: no movement, full size', () => {
    expect(result([300, -200], 0)).toEqual({ x: 300, y: -200, scale: 1 });
  });

  test('matches R·sin(|d|/R) and cos(|d|/R) worked by hand', () => {
    const { x, y, scale } = result([400, 0]);
    expect(x).toBeCloseTo(400 * Math.sin(1), 3);
    expect(y).toBe(0);
    expect(scale).toBeCloseTo(Math.cos(1), 5);
  });

  test('keeps direction and pulls stars toward the center', () => {
    const d = [240, 180];
    const { x, y } = result(d);
    expect(Math.atan2(y, x)).toBeCloseTo(Math.atan2(d[1], d[0]), 5);
    expect(Math.hypot(x, y)).toBeLessThan(Math.hypot(...d));
  });

  test('scale shrinks with distance', () => {
    const scales = [0, 100, 200, 300, 400, 500, 600].map((dx) => result([dx, 0]).scale);
    for (let i = 1; i < scales.length; i++) expect(scales[i]).toBeLessThan(scales[i - 1]);
  });

  test('is the same in all four directions', () => {
    const { x, scale } = result([300, 0]);
    expect(result([-300, 0])).toEqual({ x: -x, y: 0, scale });
    expect(result([0, 300])).toEqual({ x: 0, y: x, scale });
    expect(result([0, -300])).toEqual({ x: 0, y: -x, scale });
  });

  test('stars past a quarter turn are on the far side and hidden', () => {
    expect(result([400 * 1.58, 0]).scale).toBe(0);
    expect(result([400 * 3, 400 * 3]).scale).toBe(0);
    expect(result([400 * 1.5, 0]).scale).toBeGreaterThan(0);
  });

  test('does not modify its input', () => {
    const d = [120, 80];
    lens(d, INV_R);
    expect(d).toEqual([120, 80]);
  });
});

describe('lensInvRadius', () => {
  test('R is half the longer side divided by strength', () => {
    expect(lensInvRadius({ width: 1600, height: 900 }, 1)).toBeCloseTo(1 / 800);
    expect(lensInvRadius({ width: 900, height: 1600 }, 2)).toBeCloseTo(2 / 800);
  });

  test('strength 0 means flat', () => {
    expect(lensInvRadius({ width: 1600, height: 900 }, 0)).toBe(0);
  });

  test('a star at the far edge is about half size at strength 1', () => {
    const viewport = { width: 1600, height: 900 };
    expect(result([800, 0], lensInvRadius(viewport, 1)).scale).toBeCloseTo(Math.cos(1), 5);
  });
});

describe('generated module', () => {
  test('LENS_GLSL is the .glsl source, unchanged', () => {
    expect(LENS_GLSL).toBe(readFileSync(join(__dirname, '../../src/galaxy/shaders/lens.glsl'), 'utf8'));
  });
});

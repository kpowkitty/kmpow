import { hash2, mulberry32 } from '../../src/lib/random';

const take = (rng, n) => Array.from({ length: n }, rng);

describe('mulberry32', () => {
  test('same seed gives the same sequence', () => {
    expect(take(mulberry32(42), 20)).toEqual(take(mulberry32(42), 20));
  });

  test('different seeds give different sequences', () => {
    expect(take(mulberry32(1), 20)).not.toEqual(take(mulberry32(2), 20));
  });

  test('values stay in [0, 1)', () => {
    const values = take(mulberry32(7), 10000);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });

  test('values are spread evenly', () => {
    const values = take(mulberry32(7), 10000);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });
});

describe('hash2', () => {
  test('is deterministic', () => {
    expect(hash2(3, -5, 9)).toBe(hash2(3, -5, 9));
  });

  test('returns an unsigned 32-bit integer', () => {
    for (const [c, r] of [[0, 0], [-1, -1], [1e6, -1e6]]) {
      const h = hash2(c, r, 1);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });

  test('swapping col and row gives a different hash', () => {
    expect(hash2(1, 2, 0)).not.toBe(hash2(2, 1, 0));
  });

  test('the seed changes the hash', () => {
    expect(hash2(4, 4, 1)).not.toBe(hash2(4, 4, 2));
  });

  test('neighboring cells get unrelated sequences', () => {
    const firstValues = [];
    for (let col = 0; col < 50; col++) {
      for (let row = 0; row < 50; row++) firstValues.push(mulberry32(hash2(col, row, 1))());
    }
    expect(new Set(firstValues).size).toBe(firstValues.length);
    const mean = firstValues.reduce((a, b) => a + b, 0) / firstValues.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });
});

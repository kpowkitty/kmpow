import { buildConstellations } from '../../src/galaxy/constellations';

const GALAXY = { cols: 10, rows: 10 };
const OPTIONS = { cellPx: 100 };
const post = (slug, category, grid_col, grid_row) => ({ slug, category, grid_col, grid_row });
const build = (blogs, options = OPTIONS) => buildConstellations(blogs, GALAXY, options);
const slugs = (posts) => posts.map((p) => p.slug);

// Deliberately not alphabetical within categories, and categories interleaved, to catch any sorting.
const BLOGS = [
  post('zeta', 'jails', 1, 1),
  post('one', 'gsoc', 5, 5),
  post('alpha', 'jails', 2, 1),
  post('two', 'gsoc', 6, 7),
  post('mid', 'jails', 4, 3),
  post('solo', 'storybook', 8, 8),
];

describe('groups', () => {
  test('group by category, keeping the input order (no sorting)', () => {
    const { groups } = build(BLOGS);
    expect([...groups.keys()]).toEqual(['jails', 'gsoc', 'storybook']);
    expect(slugs(groups.get('jails'))).toEqual(['zeta', 'alpha', 'mid']);
    expect(slugs(groups.get('gsoc'))).toEqual(['one', 'two']);
  });

  test('an order field is ignored: the API order wins', () => {
    const { groups } = build([{ ...BLOGS[0], order: 9 }, { ...BLOGS[2], order: 1 }]);
    expect(slugs(groups.get('jails'))).toEqual(['zeta', 'alpha']);
  });

  test('no posts gives nothing', () => {
    const { groups, edges, neighbors } = build([]);
    expect([groups.size, edges.length, neighbors.size]).toEqual([0, 0, 0]);
  });
});

describe('edges', () => {
  test('link consecutive posts per category, cell center to cell center', () => {
    const { edges } = build(BLOGS);
    expect(edges.map((e) => `${e.from}>${e.to}`)).toEqual(['zeta>alpha', 'alpha>mid', 'one>two']);
    expect(edges[0]).toEqual({ category: 'jails', from: 'zeta', to: 'alpha', start: { x: 150, y: 150 }, delta: { dx: 100, dy: 0 } });
    expect(edges[1].delta).toEqual({ dx: 200, dy: 200 });
  });

  test('a single-post category has none', () => {
    expect(build([post('solo', 'storybook', 8, 8)]).edges).toEqual([]);
  });

  test('a line across the seam takes the short way', () => {
    const [edge] = build([post('a', 'c', 9, 0), post('b', 'c', 0, 9)]).edges;
    expect(edge.start).toEqual({ x: 950, y: 50 });
    expect(edge.delta).toEqual({ dx: 100, dy: -100 });
  });

  test('pairs with an unplaced post are skipped', () => {
    expect(build([post('a', 'c', 1, 1), post('b', 'c', null, null), post('d', 'c', 3, 3)]).edges).toEqual([]);
  });

  test('where a post sits is configurable', () => {
    const blogs = [{ slug: 'a', category: 'c', cell: [0, 0] }, { slug: 'b', category: 'c', cell: [1, 0] }];
    const cellOf = (b) => ({ col: b.cell[0], row: b.cell[1] });
    expect(build(blogs, { ...OPTIONS, cellOf }).edges[0].delta).toEqual({ dx: 100, dy: 0 });
  });
});

describe('neighbors', () => {
  test.each([
    ['zeta', null, 'alpha'],
    ['alpha', 'zeta', 'mid'],
    ['mid', 'alpha', null],
    ['solo', null, null],
  ])('%s: prev %s, next %s', (slug, prev, next) => {
    const result = build(BLOGS).neighbors.get(slug);
    expect(result.prev?.slug ?? null).toBe(prev);
    expect(result.next?.slug ?? null).toBe(next);
  });

  test('stay within the category even when other categories sit between', () => {
    expect(build(BLOGS).neighbors.get('one').next.slug).toBe('two');
  });

  test('work for posts without a cell', () => {
    expect(build([post('a', 'c', null, null), post('b', 'c', null, null)]).neighbors.get('a').next.slug).toBe('b');
  });

  test('an unknown slug has no entry', () => {
    expect(build(BLOGS).neighbors.has('nope')).toBe(false);
  });

  test('every post has an entry', () => {
    expect([...build(BLOGS).neighbors.keys()].sort()).toEqual(slugs(BLOGS).sort());
  });
});

test('does not modify its input', () => {
  const blogs = Object.freeze(BLOGS.map((b) => Object.freeze({ ...b })));
  expect(() => build(blogs)).not.toThrow();
});

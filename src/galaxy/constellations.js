import { CELL_PX } from './config';
import { cellCenter, torusDelta, worldSize } from './grid';

const DEFAULTS = { cellPx: CELL_PX, cellOf: (blog) => ({ col: blog.grid_col, row: blog.grid_row }) };
const isPlaced = ({ col, row }) => Number.isInteger(col) && Number.isInteger(row);

// Built once per blog list. Never sorts: the backend owns ordering, so groups keep the API's order.
//   groups:    category → posts
//   edges:     consecutive placed posts per category, as a start point plus the short-way offset across the seam
//   neighbors: slug → { prev, next } within its category (null at either end)
export function buildConstellations(blogs, galaxy, options = {}) {
  const { cellPx, cellOf } = { ...DEFAULTS, ...options };
  const { width, height } = worldSize(galaxy, cellPx);

  const groups = new Map();
  for (const blog of blogs) {
    if (!groups.has(blog.category)) groups.set(blog.category, []);
    groups.get(blog.category).push(blog);
  }

  const edges = [];
  const neighbors = new Map();
  for (const [category, posts] of groups) {
    posts.forEach((blog, i) => {
      neighbors.set(blog.slug, { prev: posts[i - 1] ?? null, next: posts[i + 1] ?? null });
      if (i === 0) return;
      const a = cellOf(posts[i - 1]);
      const b = cellOf(blog);
      if (!isPlaced(a) || !isPlaced(b)) return;
      const start = cellCenter(a.col, a.row, cellPx);
      const end = cellCenter(b.col, b.row, cellPx);
      edges.push({
        category,
        from: posts[i - 1].slug,
        to: blog.slug,
        start,
        delta: { dx: torusDelta(start.x, end.x, width), dy: torusDelta(start.y, end.y, height) },
      });
    });
  }

  return { groups, edges, neighbors };
}

"""
Fixed grid of boxes (each galaxy.box_cells × box_cells star cells). Each category is assigned a rectangular region of boxes.
Regions never cross the seam: they always sit inside [0, box_cols) × [0, box_rows).

`galaxy` is anything with the Galaxy model's fields (the model itself in production).
Regions are anything with box_col/box_row/width/height; `Region` is for ones that don't exist yet.
"""
from dataclasses import dataclass
from itertools import combinations


@dataclass(frozen=True)
class Region:
    box_col: int
    box_row: int
    width: int = 1
    height: int = 1


def region_boxes(region):
    return {(c, r) for c in range(region.box_col, region.box_col + region.width) for r in range(region.box_row, region.box_row + region.height)}


def overlaps(a, b):
    return (
        a.box_col < b.box_col + b.width and b.box_col < a.box_col + a.width
        and a.box_row < b.box_row + b.height and b.box_row < a.box_row + a.height
    )


def fits(region, galaxy):
    return region.box_col >= 0 and region.box_row >= 0 and region.box_col + region.width <= galaxy.box_cols and region.box_row + region.height <= galaxy.box_rows


def is_free(region, others, galaxy):
    return fits(region, galaxy) and not any(overlaps(region, o) for o in others)


def interior(region, galaxy):
    """Inclusive cell bounds (col0, row0, col1, row1) stars may use: the region minus its outer margin."""
    size, margin = galaxy.box_cells, galaxy.box_margin
    return (
        region.box_col * size + margin,
        region.box_row * size + margin,
        (region.box_col + region.width) * size - margin - 1,
        (region.box_row + region.height) * size - margin - 1,
    )


def in_interior(cell, region, galaxy):
    c0, r0, c1, r1 = interior(region, galaxy)
    return c0 <= cell[0] <= c1 and r0 <= cell[1] <= r1


def interior_cells(region, galaxy):
    c0, r0, c1, r1 = interior(region, galaxy)
    return [(c, r) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]


def grow_options(region, others, galaxy):
    """Free regions one box bigger that contain `region`: shorter side first, then right/down before left/up."""
    col, row, w, h = region.box_col, region.box_row, region.width, region.height
    wider = [Region(col, row, w + 1, h), Region(col - 1, row, w + 1, h)]
    taller = [Region(col, row, w, h + 1), Region(col, row - 1, w, h + 1)]
    ordered = wider + taller if w <= h else taller + wider
    return [r for r in ordered if is_free(r, others, galaxy)]


def _ring(a, b, size):
    d = abs(a - b) % size
    return min(d, size - d)


def box_distance(a, b, galaxy):
    """Wrap-aware Chebyshev distance between two boxes."""
    return max(_ring(a[0], b[0], galaxy.box_cols), _ring(a[1], b[1], galaxy.box_rows))


def _spread(a, b, galaxy):
    """(Chebyshev, Manhattan) wrap-aware distance; the second breaks ties so 'farthest' means truly across."""
    dc, dr = _ring(a[0], b[0], galaxy.box_cols), _ring(a[1], b[1], galaxy.box_rows)
    return max(dc, dr), dc + dr


def free_spots(width, height, others, galaxy, near):
    """Every free width×height region, closest to `near` (by top-left box) first. Ties: top row first, then left."""
    spots = [
        Region(c, r, width, height)
        for r in range(galaxy.box_rows - height + 1)
        for c in range(galaxy.box_cols - width + 1)
        if is_free(Region(c, r, width, height), others, galaxy)
    ]
    return sorted(spots, key=lambda s: _spread((s.box_col, s.box_row), (near.box_col, near.box_row), galaxy))


def nearest_free(width, height, others, galaxy, near):
    """The free width×height region closest to `near`, or None."""
    return next(iter(free_spots(width, height, others, galaxy, near)), None)


def farthest_free_box(others, galaxy):
    """The free single box farthest from every taken box, or None. Ties: top row first, then left."""
    taken = set().union(*(region_boxes(o) for o in others))
    best, best_distance = None, None
    for r in range(galaxy.box_rows):
        for c in range(galaxy.box_cols):
            if (c, r) in taken:
                continue
            distance = min((_spread((c, r), t, galaxy) for t in taken), default=(0, 0))
            if best_distance is None or distance > best_distance:
                best, best_distance = Region(c, r), distance
    return best


def grown_size(galaxy):
    """(box_cols, box_rows) after adding a column or row at the end (past the seam), so existing coordinates never change."""
    if galaxy.box_cols <= galaxy.box_rows:
        return galaxy.box_cols + 1, galaxy.box_rows
    return galaxy.box_cols, galaxy.box_rows + 1


def validate_regions(regions, galaxy):
    """Problems with a {category: region} layout; empty means valid."""
    problems = [f'{name}: outside the {galaxy.box_cols}×{galaxy.box_rows} grid' for name, region in regions.items() if not fits(region, galaxy)]
    problems += [f'{a} and {b} overlap' for (a, ra), (b, rb) in combinations(regions.items(), 2) if overlaps(ra, rb)]
    return problems


def touches_seam(region, galaxy):
    """(touches the left/right seam, touches the top/bottom seam)."""
    return (
        region.box_col == 0 or region.box_col + region.width == galaxy.box_cols,
        region.box_row == 0 or region.box_row + region.height == galaxy.box_rows,
    )


def best_seam(region, regions, count, axis):
    """
    The box border (0..count-1, along axis 'col' or 'row') to move the seam to: one no region straddles, as far from
    `region` as possible. None if only the current seam (0) qualifies. The torus means moving the seam changes nothing
    visible; it only changes where coordinates start.
    """
    def span(r):
        return (r.box_col, r.width) if axis == 'col' else (r.box_row, r.height)

    start, size = span(region)

    def straddled(b):
        return any(s < b < s + n for s, n in map(span, regions))

    def distance(b):
        return min((start - b) % count, (b - start - size) % count)

    candidates = [b for b in range(count) if not straddled(b)]
    best = max(candidates, key=lambda b: (distance(b), -b), default=0)
    return best if best != 0 and distance(best) > 0 else None

"""
Seeded placement of one star in a constellation. Pure: ordered cells in, a cell out.
`galaxy` is anything with the Galaxy model's fields (the model itself in production).
`stars` is the constellation in order; `index` is where the new star goes (len(stars) = append).

Appends also keep an escape route: the new star must be able to draw a valid line to somewhere outside the
constellation's outline (convex hull), possibly beyond the region, which can grow. This stops a constellation from
sealing its newest star into a pocket of its own lines (measured: 72% of 40-star constellations got stuck without it, 1% with).

Line lengths are never fixed: any valid cell in the region can be picked, weighted by how natural its line
length is (a curve peaking at the category's typical length, trailing off toward long lines). Each category
gets its own typical length, so some constellations are tight and others sprawl.
"""
import hashlib
import math
import random

from .boxes import in_interior, interior_cells
from .geometry import chebyshev, convex_hull, distance_sq, outside_hull, segments_cross

MIN_VARIETY = 1e-3   # line_variety 0 means "always the typical length"; avoids dividing by zero
ESCAPE_RADIUS = 10   # cells searched around the newest star for an escape route


def _rng(seed, key):
    digest = hashlib.sha256(f'{seed}:{key}'.encode()).digest()
    return random.Random(int.from_bytes(digest[:8], 'big'))


def typical_length(category, galaxy):
    """The category's own typical line length: line_length scaled by up to e^±line_variety, fixed per name."""
    spread = 2 * _rng(galaxy.seed, f'category:{category}').random() - 1
    return galaxy.line_length * math.exp(spread * galaxy.line_variety)


def length_weight(length, typical, variety):
    """How natural a line of `length` is: 1 at the typical length, falling off on a log scale."""
    sigma = max(variety, MIN_VARIETY)
    return math.exp(-(math.log(length / typical) ** 2) / (2 * sigma ** 2))


def _ends(stars, index):
    return (stars[index - 1] if index > 0 else None), (stars[index] if index < len(stars) else None)


def is_valid(stars, index, cell, region, galaxy):
    return in_interior(cell, region, galaxy) and _fits_lines(stars, index, cell, galaxy)


def _fits_lines(stars, index, cell, galaxy):
    """The star and line rules, without the region limit."""
    if any(chebyshev(cell, s) < galaxy.min_gap for s in stars):
        return False
    prev, nxt = _ends(stars, index)

    clearance_sq = galaxy.line_clearance ** 2
    new_lines = [line for line in ((prev, cell), (cell, nxt)) if None not in line]
    # The prev → nxt line is replaced by the insert, so it no longer counts.
    old_lines = [(stars[i], stars[i + 1]) for i in range(len(stars) - 1) if not (prev and nxt and i == index - 1)]

    if len(new_lines) == 2 and segments_cross(*new_lines[0], *new_lines[1]):
        return False
    for a, b in new_lines:
        if any(segments_cross(a, b, c, d) for c, d in old_lines):
            return False
        if any(distance_sq(s, a, b) < clearance_sq for s in stars if s not in (a, b)):
            return False
    return all(distance_sq(cell, c, d) >= clearance_sq for c, d in old_lines)


def can_escape(stars, galaxy):
    """
    True if the newest star can still draw a valid line to a cell outside the constellation's outline.
    Any direction counts: other regions and the seam never block for good (the region can move, the seam can move,
    the galaxy can grow). Only the constellation's own lines can trap it.
    """
    hull = convex_hull(stars)
    hx, hy = stars[-1]
    return any(
        outside_hull((x, y), hull) and _fits_lines(stars, len(stars), (x, y), galaxy)
        for x in range(hx - ESCAPE_RADIUS, hx + ESCAPE_RADIUS + 1)
        for y in range(hy - ESCAPE_RADIUS, hy + ESCAPE_RADIUS + 1)
    )


def _has_room(stars, region, galaxy):
    return any(is_valid(stars, len(stars), cell, region, galaxy) for cell in interior_cells(region, galaxy))


def _draw_order(stars, index, region, galaxy, category, rng, exclude):
    """Region cells in weighted-random order (Efraimidis–Spirakis): natural line lengths tend to come first."""
    typical = typical_length(category, galaxy)
    ends = [e for e in _ends(stars, index) if e]
    keyed = []
    for cell in interior_cells(region, galaxy):
        u = rng.random()
        if cell in exclude or cell in stars:
            continue
        # Divided by length: there are more cells at larger distances, so per-cell weights would favor long lines.
        weight = math.prod(length_weight(math.dist(cell, e), typical, galaxy.line_variety) / math.dist(cell, e) for e in ends)
        keyed.append((math.log(u) / weight if weight > 0 else -math.inf, cell))
    keyed.sort(key=lambda k: k[0], reverse=True)
    return [cell for _, cell in keyed]


def place(stars, index, region, galaxy, slug, category, exclude=(), strict=True):
    """A cell for a star inserted at `index`, or None if the region has no valid cell. `exclude` rules cells out.
    strict (appends): only cells with an escape route; None tells the caller to find more space first."""
    appending = index == len(stars)
    escapes = fallback = None
    for cell in _draw_order(stars, index, region, galaxy, category, _rng(galaxy.seed, slug), exclude):
        if not is_valid(stars, index, cell, region, galaxy):
            continue
        if not appending:
            return cell
        # Appends, best first: keeps an escape route and room in this region; keeps an escape route; anything valid.
        after = [*stars, cell]
        if len(after) < 3 or can_escape(after, galaxy):
            if _has_room(after, region, galaxy):
                return cell
            escapes = escapes or cell
        fallback = fallback or cell
    return escapes or (None if strict else fallback)

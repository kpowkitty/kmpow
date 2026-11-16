"""
Exact integer geometry on grid cells (col, row). No wrapping: constellations never straddle the seam.
"""
from fractions import Fraction


def chebyshev(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def _cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def _dot(o, a, b):
    return (a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1])


def _sign(n):
    return (n > 0) - (n < 0)


def _on_segment(p, a, b):
    return _cross(a, b, p) == 0 and min(a[0], b[0]) <= p[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= p[1] <= max(a[1], b[1])


def _touch(p, q, r, s):
    d1, d2 = _sign(_cross(p, q, r)), _sign(_cross(p, q, s))
    d3, d4 = _sign(_cross(r, s, p)), _sign(_cross(r, s, q))
    if d1 != d2 and d3 != d4 and 0 not in (d1, d2, d3, d4):
        return True
    return _on_segment(r, p, q) or _on_segment(s, p, q) or _on_segment(p, r, s) or _on_segment(q, r, s)


def segments_cross(p, q, r, s):
    """True if segments pq and rs share any point, except two segments meeting only at one shared endpoint."""
    shared = {p, q} & {r, s}
    if not shared:
        return _touch(p, q, r, s)
    if len(shared) == 2:
        return True
    (e,) = shared
    a = q if p == e else p
    b = s if r == e else r
    # Meeting at e is fine unless they run back along the same line.
    return _cross(e, a, b) == 0 and _dot(e, a, b) > 0


def distance_sq(p, a, b):
    """Exact squared distance from point p to segment ab."""
    if a == b:
        return Fraction(_dot(a, p, p))
    length_sq = _dot(a, b, b)
    t = _dot(a, b, p)
    if t <= 0:
        return Fraction(_dot(a, p, p))
    if t >= length_sq:
        return Fraction(_dot(b, p, p))
    return Fraction(_cross(a, b, p) ** 2, length_sq)


def convex_hull(points):
    """Hull vertices counter-clockwise (Andrew's monotone chain); fewer than 3 distinct points are returned as-is."""
    pts = sorted(set(points))
    if len(pts) <= 2:
        return pts
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and _cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and _cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def outside_hull(p, hull):
    """True if p is strictly outside the hull (on an edge counts as inside)."""
    if len(hull) < 3:
        return p not in hull and not (len(hull) == 2 and _on_segment(p, *hull))
    return any(_cross(a, b, p) < 0 for a, b in zip(hull, hull[1:] + hull[:1]))

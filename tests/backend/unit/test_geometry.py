from fractions import Fraction

import pytest

from blog.geometry import chebyshev, convex_hull, distance_sq, outside_hull, segments_cross

pytestmark = pytest.mark.unit


@pytest.mark.parametrize('a, b, expected', [
    pytest.param((0, 0), (0, 0), 0, id='same cell'),
    pytest.param((0, 0), (3, 1), 3, id='larger axis wins'),
    pytest.param((2, 5), (0, 0), 5, id='either order'),
    pytest.param((-1, -1), (1, 1), 2, id='diagonal'),
])
def test_chebyshev(a, b, expected):
    assert chebyshev(a, b) == expected


CROSSING = {
    'x shape': ((0, 0), (4, 4), (0, 4), (4, 0)),
    't shape: endpoint on the other line': ((0, 0), (4, 0), (2, 0), (2, 3)),
    'collinear overlap': ((0, 0), (4, 0), (2, 0), (6, 0)),
    'one inside the other': ((0, 0), (6, 0), (2, 0), (4, 0)),
    'same segment': ((0, 0), (3, 3), (0, 0), (3, 3)),
    'same segment reversed': ((0, 0), (3, 3), (3, 3), (0, 0)),
    'shared endpoint, doubling back along the same line': ((0, 0), (4, 0), (0, 0), (2, 0)),
}

APART = {
    'parallel': ((0, 0), (4, 0), (0, 1), (4, 1)),
    'collinear with a gap': ((0, 0), (2, 0), (3, 0), (5, 0)),
    'would cross if extended': ((0, 0), (2, 2), (4, 0), (3, 1)),
    'consecutive lines sharing a star': ((0, 0), (2, 1), (2, 1), (4, 0)),
    'shared endpoint, straight on': ((0, 0), (2, 0), (2, 0), (4, 0)),
    'shared endpoint, sharp turn back': ((0, 0), (4, 0), (4, 0), (0, 1)),
}


@pytest.mark.parametrize('name', CROSSING)
def test_crossing_segments(name):
    p, q, r, s = CROSSING[name]
    assert segments_cross(p, q, r, s)


@pytest.mark.parametrize('name', APART)
def test_separate_segments(name):
    p, q, r, s = APART[name]
    assert not segments_cross(p, q, r, s)


@pytest.mark.parametrize('name', [*CROSSING, *APART])
def test_crossing_is_symmetric(name):
    p, q, r, s = {**CROSSING, **APART}[name]
    expected = segments_cross(p, q, r, s)
    assert segments_cross(r, s, p, q) == expected
    assert segments_cross(q, p, s, r) == expected


@pytest.mark.parametrize('p, a, b, expected', [
    pytest.param((2, 3), (0, 0), (4, 0), 9, id='above the middle'),
    pytest.param((-3, 4), (0, 0), (4, 0), 25, id='past the start: nearest endpoint'),
    pytest.param((7, 4), (0, 0), (4, 0), 25, id='past the end: nearest endpoint'),
    pytest.param((2, 0), (0, 0), (4, 0), 0, id='on the line'),
    pytest.param((1, 1), (0, 0), (0, 0), 2, id='zero-length segment'),
    pytest.param((0, 2), (0, 0), (2, 2), Fraction(2), id='diagonal line'),
    pytest.param((1, 0), (0, 0), (3, 1), Fraction(1, 10), id='fractional, still exact'),
])
def test_distance_sq(p, a, b, expected):
    assert distance_sq(p, a, b) == expected
    assert distance_sq(p, b, a) == expected


class TestHull:
    SQUARE = [(0, 0), (4, 0), (4, 4), (0, 4)]

    def test_interior_points_are_dropped(self):
        assert sorted(convex_hull([*self.SQUARE, (2, 2), (1, 3)])) == sorted(self.SQUARE)

    def test_collinear_points_collapse_to_the_ends(self):
        assert convex_hull([(0, 0), (1, 1), (2, 2), (3, 3)]) == [(0, 0), (3, 3)]

    @pytest.mark.parametrize('p, expected', [
        pytest.param((2, 2), False, id='inside'),
        pytest.param((4, 2), False, id='on an edge'),
        pytest.param((0, 0), False, id='a corner'),
        pytest.param((5, 2), True, id='beside'),
        pytest.param((-1, -1), True, id='past a corner'),
    ])
    def test_outside(self, p, expected):
        assert outside_hull(p, convex_hull(self.SQUARE)) == expected

    def test_outside_a_line_or_point(self):
        assert not outside_hull((1, 1), [(0, 0), (2, 2)])
        assert outside_hull((1, 2), [(0, 0), (2, 2)])
        assert outside_hull((1, 1), [(0, 0)])

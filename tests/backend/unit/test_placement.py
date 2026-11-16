import math
import statistics

import pytest

from blog.boxes import Region, in_interior
from blog.placement import can_escape, is_valid, length_weight, place, typical_length
from stubs import galaxy

pytestmark = pytest.mark.unit

GALAXY = galaxy(box_cells=8, box_margin=1, min_gap=2, line_length=3, line_variety=0.5, line_clearance=1, seed=1)
BOX = Region(0, 0)          # interior cells 1..6
WIDE = Region(0, 0, 2, 1)   # interior cols 1..14, rows 1..6
SQUARE = Region(0, 0, 2, 2)


def grow(region, slug, count=100, category='jails', using=GALAXY):
    """Appends stars until the region is full (or `count` is reached)."""
    stars = []
    for i in range(count):
        cell = place(stars, len(stars), region, using, f'{slug}-{i}', category)
        if cell is None:
            break
        stars.append(cell)
    return stars


def line_lengths(stars):
    return [math.dist(a, b) for a, b in zip(stars, stars[1:])]


class TestDeterminism:
    def test_same_inputs_same_cell(self):
        stars = [(2, 2)]
        assert place(stars, 1, BOX, GALAXY, 'kyua', 'jails') == place(stars, 1, BOX, GALAXY, 'kyua', 'jails')

    def test_slug_and_seed_change_the_cell(self):
        by_slug = {place([], 0, WIDE, GALAXY, f'post-{i}', 'jails') for i in range(20)}
        by_seed = {place([], 0, WIDE, galaxy(seed=seed), 'post', 'jails') for seed in range(20)}
        assert len(by_slug) > 1
        assert len(by_seed) > 1

    def test_whole_constellation_is_reproducible(self):
        assert grow(WIDE, 'jails') == grow(WIDE, 'jails')


class TestLineLengths:
    def test_weight_peaks_at_the_typical_length(self):
        assert length_weight(3, 3, 0.5) == 1
        assert length_weight(6, 3, 0.5) < length_weight(4, 3, 0.5) < 1
        assert length_weight(1.5, 3, 0.5) < 1

    def test_weight_is_symmetric_on_a_log_scale(self):
        assert length_weight(6, 3, 0.5) == pytest.approx(length_weight(1.5, 3, 0.5))

    def test_zero_variety_only_likes_the_typical_length(self):
        assert length_weight(3, 3, 0) == 1
        assert length_weight(3.5, 3, 0) < 1e-6

    def test_lines_are_never_all_the_same_length(self):
        lengths = line_lengths(grow(SQUARE, 'mix', count=12))
        assert len({round(x, 2) for x in lengths}) >= 4

    def test_long_lines_are_possible_but_rare(self):
        lengths = [x for i in range(40) for x in line_lengths(grow(SQUARE, f'run{i}', count=12))]
        assert max(lengths) > 6
        assert statistics.median(lengths) < 4.5


class TestCharacter:
    def test_each_category_gets_its_own_fixed_typical_length(self):
        typicals = {c: typical_length(c, GALAXY) for c in ['jails', 'gsoc', 'music', 'edge-cases']}
        assert len(set(typicals.values())) == 4
        assert typical_length('jails', GALAXY) == typicals['jails']

    def test_typical_lengths_stay_within_the_variety_range(self):
        low, high = 3 * math.exp(-0.5), 3 * math.exp(0.5)
        for i in range(200):
            assert low <= typical_length(f'cat-{i}', GALAXY) <= high

    def test_zero_variety_gives_every_category_the_same_length(self):
        flat = galaxy(line_variety=0)
        assert {typical_length(c, flat) for c in ['a', 'b', 'c']} == {3}

    def test_tight_and_sprawling_categories_look_different(self):
        # 'music' draws a short typical length and 'edge-cases' a long one (seed 1).
        assert typical_length('music', GALAXY) < 2.5 < 4.5 < typical_length('edge-cases', GALAXY)

        def mean_line(category):
            return statistics.mean(x for i in range(30) for x in line_lengths(grow(SQUARE, f'{category}{i}', 12, category)))
        assert mean_line('music') + 1 < mean_line('edge-cases')


class TestRules:
    def test_must_be_inside_the_interior(self):
        assert not is_valid([], 0, (0, 3), BOX, GALAXY)
        assert not is_valid([], 0, (7, 3), BOX, GALAXY)
        assert is_valid([], 0, (1, 3), BOX, GALAXY)

    def test_min_gap(self):
        assert not is_valid([(3, 3)], 1, (4, 4), BOX, GALAXY)
        assert is_valid([(3, 3)], 1, (5, 3), BOX, GALAXY)

    def test_no_length_limit(self):
        assert is_valid([(1, 1)], 1, (14, 6), WIDE, GALAXY)

    def test_new_line_may_not_cross_an_old_line(self):
        stars = [(1, 1), (5, 5), (5, 1)]
        assert not is_valid(stars, 3, (1, 5), BOX, GALAXY)
        assert is_valid(stars, 3, (3, 1), BOX, GALAXY)

    def test_new_line_keeps_clear_of_stars(self):
        stars, cell = [(1, 3), (1, 1)], (2, 5)
        assert not is_valid(stars, 2, cell, BOX, GALAXY)
        assert is_valid(stars, 2, cell, BOX, galaxy(line_clearance=0))

    def test_new_star_keeps_clear_of_old_lines(self):
        stars, cell = [(1, 1), (2, 5)], (1, 3)
        assert not is_valid(stars, 2, cell, BOX, GALAXY)
        assert is_valid(stars, 2, cell, BOX, galaxy(line_clearance=0))


class TestInsertInMiddle:
    def test_the_replaced_line_does_not_count(self):
        # (3, 3) sits right on the (1, 3) → (5, 3) line, which the insert replaces, so it's allowed.
        assert is_valid([(1, 3), (5, 3)], 1, (3, 3), BOX, GALAXY)

    def test_other_lines_still_count(self):
        # Inserting (3, 5) between (1, 1) and (5, 1) crosses (5, 4) → (1, 4); not a clearance issue.
        stars = [(1, 1), (5, 1), (5, 4), (1, 4)]
        assert not is_valid(stars, 1, (3, 5), BOX, GALAXY)
        assert not is_valid(stars, 1, (3, 5), BOX, galaxy(line_clearance=0))

    def test_inserted_star_tends_to_sit_between_its_neighbors(self):
        # Both new lines are weighted, so cells hugging one neighbor (one very long line) are unlikely, not forbidden.
        cells = [place([(1, 1), (14, 1)], 1, WIDE, GALAXY, f'mid-{i}', 'jails') for i in range(100)]
        assert sum(3 <= c[0] <= 12 for c in cells) >= 80


class TestPlace:
    def test_result_is_always_valid_and_inside(self):
        for i in range(50):
            stars = grow(WIDE, f'c{i}', count=8)
            for n, cell in enumerate(stars):
                assert in_interior(cell, WIDE, GALAXY)
                assert is_valid(stars[:n], n, cell, WIDE, GALAXY)

    def test_excluded_cells_are_never_chosen(self):
        first = place([(2, 2)], 1, BOX, GALAXY, 'kyua', 'jails')
        assert place([(2, 2)], 1, BOX, GALAXY, 'kyua', 'jails', exclude={first}) not in (first, None)

    def test_full_region_returns_none(self):
        stars = grow(BOX, 'fill')
        assert place(stars, len(stars), BOX, GALAXY, 'one-more', 'jails') is None

    def test_lookahead_avoids_a_dead_end(self):
        # From here, (5, 2) is valid but leaves the next star nowhere to go.
        stars = [(1, 5), (5, 5), (2, 3), (1, 1)]
        assert is_valid(stars, 4, (5, 2), BOX, GALAXY)
        assert place([*stars, (5, 2)], 5, BOX, GALAXY, 'after', 'jails') is None
        for i in range(50):
            assert place(stars, 4, BOX, GALAXY, f'next-{i}', 'jails') != (5, 2)

    def test_a_cornered_constellation_escapes_with_a_long_line(self):
        # Every valid cell is at least 10 away; a fixed reach would leave this constellation stuck.
        stars = [(2, 4), (10, 5), (2, 6)]
        cell = place(stars, 3, WIDE, GALAXY, 'escape', 'jails')
        assert cell is not None
        assert math.dist(cell, stars[-1]) >= 10

    def test_strict_placement_never_walks_into_a_pocket(self):
        # (44, 44) is the only valid cell, but it sits inside a pocket of the first lines with no way back out.
        stars, region = [(46, 42), (41, 44), (45, 46), (46, 44)], Region(5, 5)
        assert is_valid(stars, 4, (44, 44), region, GALAXY)
        assert not can_escape([*stars, (44, 44)], GALAXY)
        assert place(stars, 4, region, GALAXY, 'p', 'jails') is None
        assert place(stars, 4, region, GALAXY, 'p', 'jails', strict=False) == (44, 44)

    def test_appended_stars_always_keep_an_escape_route(self):
        for i in range(30):
            stars = grow(SQUARE, f'esc{i}', count=12)
            for n in range(3, len(stars) + 1):
                assert can_escape(stars[:n], GALAXY)

    def test_a_box_holds_about_seven_stars(self):
        counts = [len(grow(BOX, f'stat-{i}')) for i in range(200)]
        assert min(counts) >= 3
        assert 6 <= statistics.median(counts) <= 8

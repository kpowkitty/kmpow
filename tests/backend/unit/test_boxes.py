import pytest

from blog.boxes import (
    Region, best_seam, box_distance, farthest_free_box, grow_options, grown_size, in_interior, interior,
    interior_cells, nearest_free, overlaps, region_boxes, touches_seam, validate_regions,
)
from stubs import galaxy

pytestmark = pytest.mark.unit

GALAXY = galaxy(box_cols=4, box_rows=4, box_cells=8, box_margin=1)


@pytest.mark.parametrize('a, b, expected', [
    pytest.param(Region(0, 0), Region(0, 0), True, id='same box'),
    pytest.param(Region(0, 0), Region(1, 0), False, id='side by side'),
    pytest.param(Region(0, 0, 2, 1), Region(1, 0), True, id='wide region covers its neighbor'),
    pytest.param(Region(0, 0, 2, 2), Region(1, 1, 2, 2), True, id='corner overlap'),
    pytest.param(Region(0, 0, 2, 2), Region(2, 2), False, id='diagonal touch only'),
])
def test_overlaps(a, b, expected):
    assert overlaps(a, b) == expected
    assert overlaps(b, a) == expected


class TestInterior:
    def test_single_box_loses_one_cell_on_each_side(self):
        assert interior(Region(0, 0), GALAXY) == (1, 1, 6, 6)
        assert len(interior_cells(Region(0, 0), GALAXY)) == 36

    def test_offset_box(self):
        assert interior(Region(2, 1), GALAXY) == (17, 9, 22, 14)

    def test_wide_region_has_no_margin_down_its_middle(self):
        assert interior(Region(0, 0, 2, 1), GALAXY) == (1, 1, 14, 6)
        assert in_interior((7, 3), Region(0, 0, 2, 1), GALAXY)
        assert in_interior((8, 3), Region(0, 0, 2, 1), GALAXY)

    def test_margin_cells_are_outside(self):
        for cell in [(0, 3), (7, 3), (3, 0), (3, 7)]:
            assert not in_interior(cell, Region(0, 0), GALAXY)

    def test_neighboring_interiors_keep_two_cells_apart(self):
        _, _, right_edge, _ = interior(Region(0, 0), GALAXY)
        left_edge, _, _, _ = interior(Region(1, 0), GALAXY)
        assert left_edge - right_edge == 3


class TestGrowOptions:
    def test_square_grows_wider_first_right_then_left(self):
        options = grow_options(Region(1, 1), [], GALAXY)
        assert options[:2] == [Region(1, 1, 2, 1), Region(0, 1, 2, 1)]
        assert options[2:] == [Region(1, 1, 1, 2), Region(1, 0, 1, 2)]

    def test_wide_region_grows_taller_first(self):
        assert grow_options(Region(1, 1, 2, 1), [], GALAXY)[0] == Region(1, 1, 2, 2)

    def test_taken_neighbors_are_skipped(self):
        assert grow_options(Region(1, 1), [Region(2, 1)], GALAXY)[0] == Region(0, 1, 2, 1)

    def test_never_grows_across_the_seam(self):
        options = grow_options(Region(0, 0), [], GALAXY)
        assert all(o.box_col >= 0 and o.box_row >= 0 for o in options)
        assert options == [Region(0, 0, 2, 1), Region(0, 0, 1, 2)]

    def test_boxed_in_has_no_options(self):
        others = [Region(0, 1), Region(2, 1), Region(1, 0), Region(1, 2)]
        assert grow_options(Region(1, 1), others, GALAXY) == []

    def test_contain_the_original(self):
        original = Region(1, 1, 2, 1)
        for option in grow_options(original, [], GALAXY):
            assert region_boxes(original) < region_boxes(option)


class TestPlacementSearch:
    def test_box_distance_wraps(self):
        assert box_distance((0, 0), (3, 0), GALAXY) == 1
        assert box_distance((0, 0), (2, 2), GALAXY) == 2

    def test_nearest_free_prefers_close_spots(self):
        others = [Region(0, 0, 2, 2)]
        assert nearest_free(2, 1, others, GALAXY, near=Region(0, 0)) == Region(0, 3, 2, 1)

    def test_nearest_free_counts_distance_across_the_seam(self):
        others = [Region(0, 0, 4, 1), Region(0, 1, 4, 1)]
        assert nearest_free(1, 1, others, GALAXY, near=Region(0, 0)) == Region(0, 3)

    def test_nearest_free_is_none_when_full(self):
        assert nearest_free(1, 1, [Region(0, 0, 4, 4)], GALAXY, near=Region(0, 0)) is None

    def test_farthest_free_box_on_empty_grid(self):
        assert farthest_free_box([], GALAXY) == Region(0, 0)

    def test_farthest_free_box_is_across_the_galaxy(self):
        assert farthest_free_box([Region(0, 0)], GALAXY) == Region(2, 2)

    def test_farthest_free_box_is_none_when_full(self):
        assert farthest_free_box([Region(0, 0, 4, 4)], GALAXY) is None


class TestGrownSize:
    @pytest.mark.parametrize('before, after', [
        pytest.param((4, 4), (5, 4), id='square: add a column'),
        pytest.param((5, 4), (5, 5), id='wide: add a row'),
        pytest.param((4, 6), (5, 6), id='tall: add a column'),
    ])
    def test_adds_to_the_shorter_side(self, before, after):
        assert grown_size(galaxy(box_cols=before[0], box_rows=before[1])) == after

    def test_existing_regions_stay_valid(self):
        regions = {'a': Region(0, 0), 'b': Region(3, 3)}
        cols, rows = grown_size(GALAXY)
        assert validate_regions(regions, galaxy(box_cols=cols, box_rows=rows)) == []


class TestValidateRegions:
    def test_valid_layout(self):
        assert validate_regions({'a': Region(0, 0, 2, 2), 'b': Region(2, 0), 'c': Region(3, 3)}, GALAXY) == []

    def test_overlap_is_reported(self):
        assert validate_regions({'a': Region(0, 0, 2, 1), 'b': Region(1, 0)}, GALAXY) == ['a and b overlap']

    def test_outside_the_grid_is_reported(self):
        assert validate_regions({'a': Region(3, 0, 2, 1)}, GALAXY) == ['a: outside the 4×4 grid']


class TestSeam:
    @pytest.mark.parametrize('region, expected', [
        pytest.param(Region(1, 1), (False, False), id='middle'),
        pytest.param(Region(0, 1), (True, False), id='left edge'),
        pytest.param(Region(3, 1), (True, False), id='right edge'),
        pytest.param(Region(1, 0, 1, 4), (False, True), id='full height'),
        pytest.param(Region(0, 0), (True, True), id='corner'),
    ])
    def test_touches_seam(self, region, expected):
        assert touches_seam(region, GALAXY) == expected

    def test_best_seam_is_opposite_the_region(self):
        region = Region(0, 0)
        assert best_seam(region, [region], 4, 'col') == 2

    def test_best_seam_never_cuts_through_a_region(self):
        region, wide = Region(0, 0), Region(2, 1, 2, 1)  # wide covers cols 2-3, so border 3 is inside it
        assert best_seam(region, [region, wide], 4, 'col') == 2

    def test_a_seam_right_against_the_region_does_not_count(self):
        region, wide = Region(0, 0), Region(1, 1, 3, 1)  # only borders 0 and 1 are free, and both touch region
        assert best_seam(region, [region, wide], 4, 'col') is None

    def test_best_seam_works_per_axis(self):
        region = Region(1, 0)
        assert best_seam(region, [region], 4, 'row') == 2

    def test_no_seam_when_every_border_is_taken(self):
        region = Region(0, 0, 4, 1)  # spans every column
        assert best_seam(region, [region], 4, 'col') is None

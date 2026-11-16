import pytest

from blog import galaxy as service
from blog.boxes import in_interior
from blog.models import Blog, Galaxy, Region

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

RULES = dict(seed=1, box_cells=8, box_margin=1, min_gap=2, line_length=3, line_variety=0.5, line_clearance=1)


@pytest.fixture
def make_galaxy():
    def make(cols=4, rows=4, **rules):
        with service._operation():  # test setup: sets the galaxy row directly
            g, _ = Galaxy.objects.update_or_create(id=1, defaults=dict(box_cols=cols, box_rows=rows, origin_col=0, origin_row=0, **{**RULES, **rules}))
        return g
    return make


@pytest.fixture
def galaxy(make_galaxy):
    return make_galaxy()


def post(slug, category='jails'):
    return Blog(id=slug, slug=slug, category=category, title=slug, description='d', content='c')


def add(slug, category='jails'):
    p = post(slug, category)
    changes = service.add(p)
    return Blog.objects.get(pk=p.pk), changes


def chain(category='jails'):
    return list(Blog.objects.filter(category=category))


def cells(category='jails'):
    return {p.slug: (p.grid_col, p.grid_row) for p in chain(category)}


def fill_until(category, word, limit=60):
    """Adds posts to `category` until an add reports a change containing `word`; returns those changes."""
    for i in range(limit):
        _, changes = add(f'{category}-fill-{i}', category)
        if any(word in c for c in changes):
            return changes
    raise AssertionError(f'no {word!r} change after {limit} posts')


class TestAdd:
    def test_first_post_gets_a_region_and_a_cell_inside_it(self, galaxy):
        p, changes = add('kyua')
        region = Region.objects.get(category='jails')
        assert in_interior((p.grid_col, p.grid_row), region, Galaxy.objects.get())
        assert p.order == 1
        assert any('gets box' in c for c in changes)
        assert service.validate() == []

    def test_posts_join_the_end_in_order(self, galaxy):
        for slug in ['a', 'b', 'c']:
            add(slug)
        assert [(p.slug, p.order) for p in chain()] == [('a', 1), ('b', 2), ('c', 3)]

    def test_new_categories_get_separate_far_apart_boxes(self, galaxy):
        add('a', 'jails')
        add('b', 'gsoc')
        jails, gsoc = Region.objects.get(category='jails'), Region.objects.get(category='gsoc')
        assert (jails.box_col, jails.box_row) == (0, 0)
        assert (gsoc.box_col, gsoc.box_row) == (2, 2)

    def test_full_region_grows_into_free_neighbors(self, galaxy):
        changes = fill_until('jails', 'grows to')
        region = Region.objects.get(category='jails')
        assert region.width * region.height == 2
        assert service.validate() == []
        assert not any('moves' in c for c in changes)

    def test_boxed_in_region_moves_as_a_unit_and_keeps_its_shape(self, make_galaxy):
        g = make_galaxy(cols=3, rows=2)
        add('b-0', 'b')
        with service._operation():
            Region.objects.filter(category='b').update(box_col=1, box_row=0)
            Blog.objects.filter(slug='b-0').update(grid_col=11, grid_row=3)
        for name, (col, row) in {'a': (0, 0), 'c': (2, 0), 'd': (1, 1)}.items():
            add(f'{name}-0', name)
            with service._operation():
                Region.objects.filter(category=name).update(box_col=col, box_row=row)
                Blog.objects.filter(slug=f'{name}-0').update(grid_col=col * 8 + 3, grid_row=row * 8 + 3)
        assert service.validate() == []

        def shape():
            """Every pair of b's stars and their shortest signed offset: unchanged by moves, rotations and growth."""
            g = Galaxy.objects.get()
            width, height = g.box_cols * g.box_cells, g.box_rows * g.box_cells

            def delta(a, b, size):
                d = (b - a) % size
                return d - size if d > size / 2 else d

            stars = sorted(cells('b').items())
            return {(a, b): (delta(ca[0], cb[0], width), delta(ca[1], cb[1], height)) for a, ca in stars for b, cb in stars if a < b}

        for i in range(60):
            before = shape()
            _, changes = add(f'b-fill-{i}', 'b')
            if any('moves to' in c for c in changes):
                break
        else:
            raise AssertionError('b never moved')
        after = shape()
        assert {pair: after[pair] for pair in before} == before
        assert service.validate() == []

    @pytest.mark.parametrize('name', ['big', 'huge', 'vast'])
    def test_a_big_constellation_starting_in_the_corner_never_gets_stuck(self, galaxy, name):
        for i in range(40):
            add(f'{name}-{i}')
        assert len(chain()) == 40
        assert service.validate() == []

    def test_a_post_already_in_the_galaxy_is_refused(self, galaxy):
        p, _ = add('a')
        with pytest.raises(service.LayoutError, match='already in the galaxy'):
            service.add(p)

    def test_galaxy_grows_when_a_new_category_has_no_box(self, make_galaxy):
        make_galaxy(cols=1, rows=1)
        add('a', 'jails')
        _, changes = add('b', 'gsoc')
        assert 'galaxy grows to 2×1 boxes' in changes
        assert service.validate() == []


class TestSeam:
    def torus_offsets(self):
        g = Galaxy.objects.get()
        width, height = g.box_cols * g.box_cells, g.box_rows * g.box_cells
        stars = sorted(cells().items())
        return {
            (a, b): ((cb[0] - ca[0]) % width, (cb[1] - ca[1]) % height)
            for (a, ca) in stars for (b, cb) in stars if a < b
        }

    def test_rotating_changes_nothing_visible(self, galaxy):
        for slug in ['a', 'b', 'c']:
            add(slug)
        add('x', 'gsoc')
        before, regions = self.torus_offsets(), {r.category: r.box_col for r in Region.objects.all()}
        with service._operation():
            g = Galaxy.objects.get()
            service._rotate('col', 1, g, [])
        assert self.torus_offsets() == before
        assert {r.category: r.box_col for r in Region.objects.all()} == {c: (col + 1) % 4 for c, col in regions.items()}
        assert Galaxy.objects.get().origin_col == 8
        assert service.validate() == []

    def test_a_region_on_the_seam_is_reanchored_when_it_needs_room(self, galaxy):
        # The first category starts in box (0, 0), on the seam; once it needs room the seam moves away from it.
        fill_until('jails', 're-anchored')
        g = Galaxy.objects.get()
        assert (g.origin_col, g.origin_row) != (0, 0)
        assert service.validate() == []


class TestRemove:
    def test_neighbors_link_up_and_nothing_moves(self, galaxy):
        for slug in ['a', 'b', 'c', 'd']:
            add(slug)
        before = cells()
        changes = service.remove(Blog.objects.get(slug='b'))
        assert changes == ['b removed']
        assert cells() == {k: v for k, v in before.items() if k != 'b'}
        assert [(p.slug, p.order) for p in chain()] == [('a', 1), ('c', 2), ('d', 3)]

    def test_last_post_frees_the_region(self, galaxy):
        add('a')
        changes = service.remove(Blog.objects.get(slug='a'))
        assert 'jails region freed' in changes
        assert not Region.objects.exists()
        assert service.validate() == []


class TestMove:
    @pytest.fixture
    def four(self, galaxy):
        for slug in ['a', 'b', 'c', 'd']:
            add(slug)
        return {p.slug: p for p in chain()}

    def test_moving_to_where_it_already_is_does_nothing(self, four):
        assert service.move(four['c'], after=four['b']) == []

    def test_move_reorders_and_keeps_a_still_valid_cell(self, four):
        d = four['d']
        before = (d.grid_col, d.grid_row)
        service.move(d, after=four['c'])
        assert [p.slug for p in chain()] == ['a', 'b', 'c', 'd']
        service.move(Blog.objects.get(slug='a'), after=four['d'])
        assert [p.slug for p in chain()] == ['b', 'c', 'd', 'a']
        assert (Blog.objects.get(slug='d').grid_col, Blog.objects.get(slug='d').grid_row) == before
        assert service.validate() == []

    def test_earlier_and_later_are_no_ops_at_the_ends(self, four):
        assert service.move_earlier(four['a']) == []
        assert service.move_later(four['d']) == []

    def test_earlier_and_later_step_one_place(self, four):
        service.move_later(four['a'])
        assert [p.slug for p in chain()] == ['b', 'a', 'c', 'd']
        service.move_earlier(Blog.objects.get(slug='a'))
        assert [p.slug for p in chain()] == ['a', 'b', 'c', 'd']

    def test_moved_star_is_replaced_when_its_cell_no_longer_fits(self, galaxy):
        for slug in ['a', 'b', 'c', 'd']:
            add(slug)
        with service._operation():
            for slug, cell in {'a': (1, 1), 'b': (5, 1), 'c': (5, 5), 'd': (1, 5)}.items():
                Blog.objects.filter(slug=slug).update(grid_col=cell[0], grid_row=cell[1])
        # a → c → b → d: the new a → c line would cross b → d, so c must be re-placed.
        changes = service.move(Blog.objects.get(slug='c'), after=Blog.objects.get(slug='a'))
        assert any('c re-placed' in x for x in changes)
        assert [p.slug for p in chain()] == ['a', 'c', 'b', 'd']
        assert cells()['c'] != (5, 5)
        assert service.validate() == []


class TestChangeCategory:
    def test_joins_the_end_of_the_other_category(self, galaxy):
        add('a', 'jails')
        add('b', 'jails')
        add('x', 'gsoc')
        service.change_category(Blog.objects.get(slug='a'), 'gsoc')
        assert [p.slug for p in chain('gsoc')] == ['x', 'a']
        assert [(p.slug, p.order) for p in chain('jails')] == [('b', 1)]
        assert in_interior(cells('gsoc')['a'], Region.objects.get(category='gsoc'), Galaxy.objects.get())
        assert service.validate() == []

    def test_last_post_leaving_frees_the_old_region(self, galaxy):
        add('a', 'jails')
        changes = service.change_category(Blog.objects.get(slug='a'), 'gsoc')
        assert 'jails region freed' in changes
        assert list(Region.objects.values_list('category', flat=True)) == ['gsoc']

    def test_same_category_is_a_no_op(self, galaxy):
        add('a')
        assert service.change_category(Blog.objects.get(slug='a'), 'jails') == []


class TestReplace:
    def test_moves_to_a_different_valid_cell(self, galaxy):
        for slug in ['a', 'b', 'c']:
            add(slug)
        before = cells()
        service.replace(Blog.objects.get(slug='b'))
        after = cells()
        assert after['b'] != before['b']
        assert {k: v for k, v in after.items() if k != 'b'} == {k: v for k, v in before.items() if k != 'b'}
        assert service.validate() == []


class TestRules:
    def test_valid_change_is_saved(self, galaxy):
        add('a')
        assert service.change_rules(line_length=4) == ['line_length is now 4']
        assert Galaxy.objects.get().line_length == 4

    def test_change_that_breaks_the_layout_is_refused(self, galaxy):
        add('a')
        add('b')
        with service._operation():
            Blog.objects.filter(slug='a').update(grid_col=1, grid_row=1)
            Blog.objects.filter(slug='b').update(grid_col=3, grid_row=1)
        with pytest.raises(service.LayoutError) as error:
            service.change_rules(min_gap=3)
        assert error.value.problems == ['a and b: closer than min_gap 3']
        assert Galaxy.objects.get().min_gap == 2

    def test_rules_the_database_rejects_are_refused(self, galaxy):
        with pytest.raises(service.LayoutError, match='rejected by the database'):
            service.change_rules(line_length=1)

    def test_unknown_rule_is_refused(self, galaxy):
        with pytest.raises(service.LayoutError, match='unknown rules: bogus'):
            service.change_rules(bogus=1)


class TestDeterminism:
    def test_same_operations_give_the_same_layout(self, make_galaxy):
        def build():
            make_galaxy()
            for i in range(10):
                add(f'j{i}', 'jails')
            add('g0', 'gsoc')
            return cells('jails'), cells('gsoc')

        first = build()
        for p in Blog.objects.all():
            service.remove(p)
        assert build() == first


class TestValidate:
    def test_reports_a_star_outside_its_region(self, galaxy):
        add('a')
        with service._operation():
            Blog.objects.filter(slug='a').update(grid_col=20)
        assert service.validate() == ['a: outside the jails region']

    def test_reports_unplaced_posts_and_missing_regions(self, galaxy):
        with service._operation():  # deliberately broken data, written behind the service's back
            Blog.objects.create(id='z', slug='z', category='new', title='t', description='d', content='c')
        assert service.validate() == ['new: has posts but no region']

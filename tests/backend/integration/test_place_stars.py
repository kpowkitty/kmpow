from io import StringIO

import pytest
from django.core.management import CommandError, call_command

from blog import galaxy as service
from blog.models import Blog, Region
from blog.writes import layout_writes

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

# Like prod right after the migrations: posts with an order but no cell.
UNPLACED = [('jails', 'kyua', 1), ('jails', 'part-two', 2), ('jails', 'part-three', 3), ('gsoc', 'writeup', 1), ('gsoc', 'follow-up', 2)]


@pytest.fixture
def unplaced():
    with layout_writes():
        for category, slug, order in UNPLACED:
            Blog.objects.create(id=slug, slug=slug, category=category, order=order, title=slug, description='d', content='c')


def run(*args):
    out = StringIO()
    call_command('place_stars', *args, stdout=out)
    return out.getvalue()


def cells():
    return {p.slug: (p.grid_col, p.grid_row) for p in Blog.objects.all()}


def test_places_every_unplaced_post_in_order(unplaced):
    output = run()
    assert 'galaxy is valid' in output
    assert None not in {c for cell in cells().values() for c in cell}
    assert [(p.slug, p.order) for p in Blog.objects.filter(category='jails')] == [('kyua', 1), ('part-two', 2), ('part-three', 3)]
    assert set(Region.objects.values_list('category', flat=True)) == {'jails', 'gsoc'}


def test_running_again_changes_nothing(unplaced):
    run()
    before = cells()
    assert 'nothing to place' in run()
    assert cells() == before


def test_new_posts_join_the_end_and_placed_posts_stay_put(unplaced):
    run()
    before = cells()
    with layout_writes():
        Blog.objects.create(id='new', slug='new', category='jails', order=0, title='t', description='d', content='c')
    run()
    after = cells()
    assert {k: after[k] for k in before} == before
    assert [p.slug for p in Blog.objects.filter(category='jails')][-1] == 'new'


def test_reset_places_everything_fresh_and_deterministically(unplaced):
    run()
    first = cells()
    output = run('--reset')
    assert 'every star and region cleared' in output
    assert cells() == first
    assert service.validate() == []


def test_an_invalid_layout_fails_the_command(unplaced):
    run()
    with layout_writes():
        Blog.objects.filter(slug='kyua').update(grid_col=31, grid_row=31)
    with pytest.raises(CommandError, match='kyua: outside the jails region'):
        run()

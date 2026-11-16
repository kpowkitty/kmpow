import pytest

from blog.models import Blog, Galaxy
from blog.writes import layout_writes
from seed.loader import read

pytestmark = pytest.mark.integration

GALAXY_FIELDS = {'box_cols', 'box_rows', 'seed', 'box_cells', 'box_margin', 'min_gap', 'line_length', 'line_variety', 'line_clearance', 'origin_col', 'origin_row'}
STAR_FIELDS = {'id', 'slug', 'title', 'description', 'category', 'order', 'grid_col', 'grid_row'}


@pytest.fixture
def galaxy(api, seeded):
    res = api.get('/api/galaxy/')
    assert res.status_code == 200
    return res.json()


def test_galaxy_fields_use_the_model_names(galaxy):
    assert set(galaxy) == GALAXY_FIELDS | {'stars', 'regions'}
    row = Galaxy.objects.get()
    assert {k: galaxy[k] for k in GALAXY_FIELDS} == {k: getattr(row, k) for k in GALAXY_FIELDS}


def test_every_placed_post_is_a_star_without_content(galaxy):
    assert {s['slug'] for s in galaxy['stars']} == {row['slug'] for row in read('blogs')}
    for star in galaxy['stars']:
        assert set(star) == STAR_FIELDS
        assert isinstance(star['grid_col'], int) and isinstance(star['grid_row'], int)


def test_stars_come_in_constellation_order(galaxy):
    jails = [(s['slug'], s['order']) for s in galaxy['stars'] if s['category'] == 'jails']
    assert jails == [('kyua-test', 1), ('jails-part-two', 2), ('jails-part-three', 3)]


def test_every_category_has_a_region(galaxy):
    assert {r['category'] for r in galaxy['regions']} == {s['category'] for s in galaxy['stars']}
    assert set(galaxy['regions'][0]) == {'category', 'box_col', 'box_row', 'width', 'height'}


def test_unplaced_posts_are_skipped_not_sent_as_nulls(api, seeded):
    with layout_writes():
        Blog.objects.create(id='draft', slug='draft', category='jails', title='t', description='d', content='c')
    slugs = {s['slug'] for s in api.get('/api/galaxy/').json()['stars']}
    assert 'draft' not in slugs
    assert len(slugs) == len(read('blogs'))


def test_blog_list_has_no_content(api, seeded):
    assert all('content' not in post for post in api.get('/api/blogs/').json())


def test_blog_detail_keeps_content(api, seeded):
    assert api.get('/api/blogs/kyua-test/').json()['content'].startswith('# Kyua')

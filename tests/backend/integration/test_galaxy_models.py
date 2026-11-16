import pytest
from django.db import IntegrityError, connection, transaction

from blog.models import Blog, Galaxy, Region
from blog.writes import layout_writes

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

VALID = dict(box_cols=4, box_rows=4, seed=1, box_cells=8, box_margin=1, min_gap=2, line_length=3, line_variety=0.5, line_clearance=1)


@pytest.fixture(autouse=True)
def direct_writes():
    """These tests check the database's own constraints, so they write rows directly, starting from an empty Galaxy table."""
    with layout_writes():
        Galaxy.objects.all().delete()
        yield


def rejected(make):
    with pytest.raises(IntegrityError), transaction.atomic():
        make()


def test_valid_galaxy_saves():
    Galaxy.objects.create(**VALID)
    assert Galaxy.objects.get().box_cells == 8


@pytest.mark.parametrize('field, value', [
    pytest.param('id', 2, id='a second row'),
    pytest.param('box_cols', 0, id='zero columns'),
    pytest.param('box_margin', 4, id='margin leaves no interior'),
    pytest.param('min_gap', 0, id='zero gap'),
    pytest.param('line_length', 1, id='line length shorter than the gap'),
    pytest.param('line_variety', -0.1, id='negative variety'),
])
def test_invalid_galaxy_is_rejected(field, value):
    rejected(lambda: Galaxy.objects.create(**{**VALID, field: value}))


def test_region_category_is_unique():
    Region.objects.create(category='jails', box_col=0, box_row=0)
    rejected(lambda: Region.objects.create(category='jails', box_col=1, box_row=0))


def test_region_needs_at_least_one_box():
    rejected(lambda: Region.objects.create(category='gsoc', box_col=0, box_row=0, width=0))


def check_deferred_now():
    # Deferred constraints run at commit; tests never commit, so ask Postgres to check now (what a commit would do).
    with connection.cursor() as cursor:
        cursor.execute('SET CONSTRAINTS ALL IMMEDIATE')


def test_one_star_per_cell():
    post = dict(category='c', title='t', description='d', content='x')
    Blog.objects.create(id='a', slug='a', grid_col=3, grid_row=4, **post)

    def duplicate():
        Blog.objects.create(id='b', slug='b', grid_col=3, grid_row=4, **post)
        check_deferred_now()
    rejected(duplicate)


def test_swapping_cells_mid_transaction_is_allowed():
    post = dict(category='c', title='t', description='d', content='x')
    a = Blog.objects.create(id='a', slug='a', grid_col=1, grid_row=1, **post)
    b = Blog.objects.create(id='b', slug='b', grid_col=3, grid_row=1, **post)
    with transaction.atomic():
        Blog.objects.filter(pk=a.pk).update(grid_col=3)
        Blog.objects.filter(pk=b.pk).update(grid_col=1)
    check_deferred_now()
    assert Blog.objects.get(pk='a').grid_col == 3


def test_unplaced_posts_do_not_collide():
    post = dict(category='c', title='t', description='d', content='x')
    Blog.objects.create(id='a', slug='a', **post)
    Blog.objects.create(id='b', slug='b', **post)
    assert Blog.objects.filter(grid_col__isnull=True).count() == 2

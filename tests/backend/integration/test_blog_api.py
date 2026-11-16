import pytest

from seed.loader import read

pytestmark = pytest.mark.integration


def test_list_returns_every_post(api, seeded):
    res = api.get('/api/blogs/')
    assert res.status_code == 200
    assert {post['slug'] for post in res.json()} == {row['slug'] for row in read('blogs')}


def test_list_is_ordered_by_category_then_constellation_order(api, seeded):
    # Order within a category is the order posts joined it (seed file order), not alphabetical.
    res = api.get('/api/blogs/')
    assert [post['slug'] for post in res.json()] == [
        'long-title-no-position',                           # edge-cases
        'gsoc-writeup', 'gsoc-follow-up',                   # gsoc
        'kyua-test', 'jails-part-two', 'jails-part-three',  # jails
        'storybook',
    ]


def test_detail_by_slug_returns_content(api, seeded):
    res = api.get('/api/blogs/gsoc-follow-up/')
    assert res.status_code == 200
    assert '日本語' in res.json()['content']


def test_unknown_slug_is_404(api, seeded):
    assert api.get('/api/blogs/does-not-exist/').status_code == 404


def test_post_without_position_is_served(api, seeded):
    res = api.get('/api/blogs/long-title-no-position/')
    assert res.status_code == 200
    assert res.json()['position'] is None

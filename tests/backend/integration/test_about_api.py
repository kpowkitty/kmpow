import pytest

pytestmark = pytest.mark.integration


def test_returns_only_the_latest_entry(api, seeded):
    res = api.get('/api/about/')
    assert res.status_code == 200
    [about] = res.json()
    assert about['title'] == 'About Me'
    assert about['section_2'] is None
    assert about['section_3'] is None

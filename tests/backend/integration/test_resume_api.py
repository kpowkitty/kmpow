import pytest

pytestmark = pytest.mark.integration


@pytest.mark.parametrize('path, field, expected', [
    ('/api/resume/work-experience/', 'company', ['First Listed Co', 'Second Listed Co']),
    ('/api/resume/projects/', 'name', ['kmpow', 'Tagless Project']),
    ('/api/resume/education/', 'school', ['Seed University', 'Minimal College']),
])
def test_items_are_sorted_by_order(api, seeded, path, field, expected):
    res = api.get(path)
    assert res.status_code == 200
    assert [item[field] for item in res.json()] == expected


def test_tech_stack_is_consolidated_by_category(api, seeded):
    res = api.get('/api/tech-stack/')
    assert res.status_code == 200
    assert res.json() == [
        {'category': 'Language', 'tags': ['Python']},
        {'category': 'API', 'tags': ['GraphQL', 'REST']},
        {'category': 'Backend', 'tags': ['Django', 'Docker']},
        {'category': 'Tool', 'tags': ['Docker']},
    ]

import pytest

pytestmark = pytest.mark.integration


SORTED_SECTIONS = {
    'work-experience': ('company', ['First Listed Co', 'Second Listed Co']),
    'projects': ('name', ['kmpow', 'Tagless Project']),
    'education': ('school', ['Seed University', 'Minimal College']),
}


@pytest.mark.parametrize('section', SORTED_SECTIONS)
def test_items_are_sorted_by_order(api, seeded, section):
    field, expected = SORTED_SECTIONS[section]
    res = api.get(f'/api/resume/{section}/')
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

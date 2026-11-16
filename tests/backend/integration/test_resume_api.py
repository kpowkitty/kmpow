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
        {'category': 'Language', 'tags': ['.NET', 'C++', 'Python', 'aws']},
        {'category': 'API', 'tags': ['GraphQL', 'REST']},
        {'category': 'Backend', 'tags': ['Django', 'Docker']},
        {'category': 'Tool', 'tags': ['Docker']},
    ]


def test_tech_stack_tags_are_in_byte_order_like_python(api, seeded):
    # Same order as Python's sorted(), whatever the database's locale; a locale sort would put 'aws' first.
    for category in api.get('/api/tech-stack/').json():
        assert category['tags'] == sorted(category['tags'])


@pytest.mark.django_db
def test_equal_order_falls_back_to_creation_order(api):
    from resume.models import Project

    for name in ['Zeta', 'Alpha', 'Mid']:
        Project.objects.create(name=name, url='https://example.com', description='d', order=5)
    assert [p['name'] for p in api.get('/api/resume/projects/').json()] == ['Zeta', 'Alpha', 'Mid']


def test_item_tags_keep_the_order_they_were_added(api, seeded):
    kmpow = next(p for p in api.get('/api/resume/projects/').json() if p['name'] == 'kmpow')
    assert [t['name'] for t in kmpow['tech_tags']] == ['Python', 'Docker', 'Docker', 'aws', 'C++', '.NET']

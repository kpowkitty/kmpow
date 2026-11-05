import pytest

from seed.loader import DATA_DIR, LOADERS, read

pytestmark = pytest.mark.unit


def test_every_data_file_has_a_loader_and_vice_versa():
    files = {path.stem for path in DATA_DIR.glob('*.json')}
    assert files == set(LOADERS)


@pytest.mark.parametrize('field', ['id', 'slug'])
def test_blog_keys_are_unique(field):
    values = [row[field] for row in read('blogs')]
    assert len(values) == len(set(values))


def test_resume_tags_only_use_declared_categories():
    resume = read('resume')
    declared = {row['name'] for row in resume['tech_categories']}
    sections = ('work_experience', 'projects', 'education')
    used = {
        tag['category']
        for section in sections
        for row in resume[section]
        for tag in row['tech_tags']
        if tag['category']
    }
    assert used <= declared

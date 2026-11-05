import pytest
from about.models import AboutContent
from blog.models import Blog
from resume.models import Education, Project, TechCategory, TechTag, WorkExperience

pytestmark = pytest.mark.integration

MODELS = (Blog, AboutContent, TechCategory, TechTag, WorkExperience, Project, Education)


def counts():
    return {model.__name__: model.objects.count() for model in MODELS}


def test_loading_twice_changes_nothing(seed):
    seed()
    first = counts()
    assert all(first.values()), first
    seed()
    assert counts() == first


def test_tags_keep_their_categories(seeded):
    assert TechTag.objects.get(name='Uncategorized Thing').category is None
    docker_categories = TechTag.objects.filter(name='Docker').values_list('category__name', flat=True)
    assert sorted(docker_categories) == ['Backend', 'Tool']

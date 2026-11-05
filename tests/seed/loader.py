"""
Idempotent seed loader. Every row is upserted on a natural key.
"""

import json
from pathlib import Path

from django.db import transaction

DATA_DIR = Path(__file__).resolve().parent / 'data'


def read(component):
    return json.loads((DATA_DIR / f'{component}.json').read_text(encoding='utf-8'))


def upsert(model, row, keys):
    row = dict(row)
    lookup = {key: row.pop(key) for key in keys}
    obj, _ = model.objects.update_or_create(**lookup, defaults=row)
    return obj


def load_blogs(rows):
    from blog.models import Blog

    for row in rows:
        upsert(Blog, row, ('id',))


def load_about(rows):
    from about.models import AboutContent

    # Saved in file order, so the last entry is the most recently updated.
    for row in rows:
        upsert(AboutContent, row, ('title',))


def load_resume(data):
    from resume.models import Education, Project, TechCategory, TechTag, WorkExperience

    categories = {row['name']: upsert(TechCategory, row, ('name',)) for row in data['tech_categories']}

    def tags(entries):
        return [
            TechTag.objects.get_or_create(
                name=tag['name'],
                category=categories[tag['category']] if tag['category'] else None,
            )[0]
            for tag in entries
        ]

    sections = (
        (WorkExperience, ('company', 'title'), data['work_experience']),
        (Project, ('name',), data['projects']),
        (Education, ('school', 'degree'), data['education']),
    )
    for model, keys, rows in sections:
        for row in rows:
            row = dict(row)
            tech_tags = row.pop('tech_tags')
            upsert(model, row, keys).tech_tags.set(tags(tech_tags))


LOADERS = {
    'blogs': load_blogs,
    'about': load_about,
    'resume': load_resume,
}


@transaction.atomic
def load(*components):
    for name in components or LOADERS:
        LOADERS[name](read(name))

"""
API snapshots of the seeded database, consumed by the frontend tests as fetch mocks.
Filename rule (mirrored in tests/frontend/support/mockApi.js):
    /api/blogs/kyua-test/  ->  api__blogs__kyua-test.json
"""

from pathlib import Path

from seed.loader import read

SNAPSHOT_DIR = Path(__file__).resolve().parent / 'api'


def snapshot_path(url):
    return SNAPSHOT_DIR / f"{url.strip('/').replace('/', '__')}.json"


def snapshot_urls():
    return [
        '/api/blogs/',
        *(f"/api/blogs/{row['slug']}/" for row in read('blogs')),
        '/api/about/',
        '/api/resume/work-experience/',
        '/api/resume/projects/',
        '/api/resume/education/',
        '/api/tech-stack/',
    ]

import json

import pytest

from seed.snapshots import snapshot_path, snapshot_urls

pytestmark = [pytest.mark.integration, pytest.mark.snapshot]


@pytest.mark.django_db(reset_sequences=True)
@pytest.mark.parametrize('url', snapshot_urls())
def test_api_matches_snapshot(api, seeded, request, url):
    res = api.get(url)
    assert res.status_code == 200
    path = snapshot_path(url)

    if request.config.getoption('update_snapshots'):
        path.parent.mkdir(exist_ok=True)
        path.write_text(json.dumps(res.json(), indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    assert path.exists(), f'{path.name} missing; run: python tests/run.py update-snapshots'
    assert json.loads(path.read_text(encoding='utf-8')) == res.json()

import pytest

pytestmark = pytest.mark.integration

URL = '/contact/submit_contact_form/'
VALID = {'name': 'Seed Person', 'email': 'seed@example.com', 'message': 'Hello!'}


@pytest.mark.xfail(
    strict=True,
    reason='ContactForm.subject is NOT NULL but ContactFormSerializer never accepts it',
)
def test_valid_submission_is_saved(api, db):
    res = api.post(URL, VALID, format='json')
    assert res.status_code == 201


def test_invalid_email_is_rejected(api, db):
    res = api.post(URL, {**VALID, 'email': 'not-an-email'}, format='json')
    assert res.status_code == 400
    assert 'email' in res.json()

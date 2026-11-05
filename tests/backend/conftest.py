import pytest
from rest_framework.test import APIClient

from seed.loader import load


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def seed(db):
    return load


@pytest.fixture
def seeded(seed):
    seed()

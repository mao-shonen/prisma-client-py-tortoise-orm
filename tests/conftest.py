import pytest
from tortoise.contrib.test import finalizer, initializer  # py >= 3.8


@pytest.fixture(scope='session', autouse=True)
def initialize_tests(request: pytest.FixtureRequest):
    db_url = 'sqlite://:memory:'
    initializer(['prisma.generated.models'], db_url=db_url)
    request.addfinalizer(finalizer)

pytest_plugins = ['reporting']


def pytest_addoption(parser):
    parser.addoption('--update-snapshots', action='store_true', help='rewrite tests/seed/api/*.json')

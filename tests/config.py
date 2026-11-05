"""
Named test configs. This is the only place test selection is defined.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Suite:
    service: str
    args: tuple = ()


@dataclass(frozen=True)
class Config:
    description: str
    suites: tuple


BACKEND = Suite('backend')
BACKEND_UNIT = Suite('backend', ('-m', 'unit'))
BACKEND_INTEGRATION = Suite('backend', ('-m', 'integration'))
FRONTEND = Suite('frontend')
UPDATE_SNAPSHOTS = Suite('snapshots', ('-m', 'snapshot', '--update-snapshots'))

CONFIGS = {
    'all': Config('Every backend and frontend test', (BACKEND, FRONTEND)),
    'unit': Config('Fast feedback: backend unit + frontend', (BACKEND_UNIT, FRONTEND)),
    'backend': Config('All backend tests', (BACKEND,)),
    'backend-unit': Config('Backend tests that need no database', (BACKEND_UNIT,)),
    'backend-integration': Config('Backend tests against Postgres', (BACKEND_INTEGRATION,)),
    'frontend': Config('All frontend tests', (FRONTEND,)),
    'update-snapshots': Config('Regenerate tests/seed/api/*.json from the seeded API', (UPDATE_SNAPSHOTS,)),
}

# Run as parallel jobs on pull requests (.github/workflows/tests.yml reads this).
CI_CONFIGS = ('backend-unit', 'backend-integration', 'frontend')

CONFIGS['ci'] = Config(
    'Everything pull requests run, in one go',
    tuple(suite for name in CI_CONFIGS for suite in CONFIGS[name].suites),
)

"""
Shared Docker Compose helper for the test and seed CLIs.
"""

import os
import subprocess
from pathlib import Path

COMPOSE_FILE = Path(__file__).resolve().parent / 'docker' / 'compose.yml'

# Separate projects so tearing down tests can never touch the dev database.
TEST_PROJECT = 'kmpow-tests'
DEV_PROJECT = 'kmpow-dev'


def host_ids():
    # Lets containers that write into the checkout create files owned by you.
    if not hasattr(os, 'getuid'):
        return {}
    return {'HOST_UID': str(os.getuid()), 'HOST_GID': str(os.getgid())}


def compose(project, *args, check=True):
    cmd = ['docker', 'compose', '-p', project, '-f', str(COMPOSE_FILE), *args]
    return subprocess.run(cmd, check=check, env={**os.environ, **host_ids()}).returncode

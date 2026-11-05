#!/usr/bin/env python3
"""
Start the persistent dev database and load seed data into it.

    python tests/seed_dev.py [component ...]
"""

import os
import sys

from dockerctl import DEV_PROJECT, compose


def main():
    components = sys.argv[1:]
    compose(DEV_PROJECT, '--profile', 'dev', 'up', '--detach', '--wait', 'devdb')
    compose(DEV_PROJECT, 'build', 'backend')
    code = compose(
        DEV_PROJECT, 'run', '--rm', '--no-deps', '--env', 'DB_HOST=devdb',
        '--entrypoint', 'python', 'backend', '-m', 'seed', *components, check=False,
    )
    if code == 0:
        port = os.environ.get('DEVDB_PORT', '5433')
        print(f'Dev DB: postgres://postgres:postgres@localhost:{port}/kmpow')
    return code


if __name__ == '__main__':
    sys.exit(main())

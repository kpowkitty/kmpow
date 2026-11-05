#!/usr/bin/env python3
"""
Run a named test config (see config.py) in Docker.

    python tests/run.py <config> [-- extra runner args]
    python tests/run.py --list
"""

import argparse
import sys

from config import CONFIGS
from dockerctl import TEST_PROJECT, compose


def run_config(name, extra):
    config = CONFIGS[name]
    if extra and len(config.suites) > 1:
        sys.exit(f"'{name}' runs {len(config.suites)} suites; extra args need a single-suite config")

    failed = []
    try:
        compose(TEST_PROJECT, 'build', *sorted({s.service for s in config.suites}))
        for suite in config.suites:
            code = compose(TEST_PROJECT, 'run', '--rm', suite.service, *suite.args, *extra, check=False)
            if code != 0:
                failed.append(f"{suite.service} {' '.join(suite.args)}".strip())
    finally:
        compose(TEST_PROJECT, 'down', '--volumes', '--remove-orphans', check=False)

    for suite in failed:
        print(f'FAILED: {suite}', file=sys.stderr)
    return 1 if failed else 0


def main():
    argv = sys.argv[1:]
    extra = []
    if '--' in argv:
        split = argv.index('--')
        argv, extra = argv[:split], argv[split + 1:]

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('config', nargs='?', choices=CONFIGS)
    parser.add_argument('--list', action='store_true', help='show available configs')
    args = parser.parse_args(argv)

    if args.list or not args.config:
        for name, config in CONFIGS.items():
            print(f'{name:22} {config.description}')
        return 0
    return run_config(args.config, extra)


if __name__ == '__main__':
    sys.exit(main())

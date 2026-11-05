"""
Migrate, then load seed data into the database Django is configured for.

    python -m seed [component ...]
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'backend'))

import django  # noqa: E402

django.setup()

from django.core.management import call_command  # noqa: E402

from seed.loader import LOADERS, load  # noqa: E402

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('components', nargs='*', help=f"any of: {', '.join(LOADERS)} (default: all)")
args = parser.parse_args()
unknown = set(args.components) - set(LOADERS)
if unknown:
    parser.error(f"unknown component(s): {', '.join(sorted(unknown))}")

call_command('migrate', interactive=False)
load(*args.components)
print(f"Seeded: {', '.join(args.components or LOADERS)}")

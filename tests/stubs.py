"""Stand-ins for models in pure-logic unit tests: same attribute names, no database."""
from types import SimpleNamespace


def galaxy(**overrides):
    fields = dict(box_cols=4, box_rows=4, seed=1, box_cells=8, box_margin=1, min_gap=2, line_length=3, line_variety=0.5, line_clearance=1)
    return SimpleNamespace(**{**fields, **overrides})

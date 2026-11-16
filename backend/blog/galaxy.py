"""
The only code that changes the galaxy layout: post cells, order and category, regions, and the Galaxy row.
Every operation runs in one transaction (all or nothing) and returns a list of human-readable changes.

Invariants (always true, checked by validate()):
  - regions fit the grid and never overlap; every category with posts has exactly one region, and vice versa
  - every post has a cell inside its own region's interior, at least min_gap from the other stars in its category
Placement-only rules (no crossing lines, line clearance) apply when a star is placed; a removal may relax them.
"""
from contextlib import contextmanager

from django.db import IntegrityError, transaction
from django.db.models import F
from django.db.models.functions import Mod

from . import boxes, placement
from .geometry import chebyshev
from .models import Blog, Galaxy, Region
from .writes import layout_writes

MAX_ATTEMPTS = 100  # growth steps before giving up; far more than any real layout needs
MOVE_SPOTS = 8      # nearest free spots tried per size when moving a constellation as a unit


class LayoutError(Exception):
    def __init__(self, problems):
        self.problems = [problems] if isinstance(problems, str) else list(problems)
        super().__init__('; '.join(self.problems))


def preview(operation, *args, **kwargs):
    """
    The changes `operation(*args, **kwargs)` would make, without making them: it runs for real inside a transaction
    that is always rolled back, so the preview is exactly what running it would do. Raises the same LayoutError.
    Objects passed in may be modified in memory; pass freshly loaded ones and don't reuse them.
    """
    with transaction.atomic():
        try:
            return operation(*args, **kwargs)
        finally:
            transaction.set_rollback(True)


@contextmanager
def _operation():
    with layout_writes(), transaction.atomic():
        yield


def _galaxy():
    return Galaxy.objects.select_for_update().get()


def _chain(category, without=None):
    return [p for p in Blog.objects.filter(category=category) if p.pk != getattr(without, 'pk', None)]


def _cells(chain):
    return [(p.grid_col, p.grid_row) for p in chain]


def _other_regions(category):
    return list(Region.objects.exclude(category=category))


def _renumber(chain):
    for i, post in enumerate(chain, start=1):
        if post.order != i:
            post.order = i
            post.save(update_fields=['order'])


def _grow_galaxy(galaxy, changes):
    galaxy.box_cols, galaxy.box_rows = boxes.grown_size(galaxy)
    galaxy.save()
    changes.append(f'galaxy grows to {galaxy.box_cols}×{galaxy.box_rows} boxes')


def _new_region(category, galaxy, changes):
    for _ in range(MAX_ATTEMPTS):
        spot = boxes.farthest_free_box(Region.objects.all(), galaxy)
        if spot:
            changes.append(f'{category} gets box ({spot.box_col}, {spot.box_row})')
            return Region.objects.create(category=category, box_col=spot.box_col, box_row=spot.box_row)
        _grow_galaxy(galaxy, changes)
    raise LayoutError(f'no room for a new category {category!r}')


def _set_region(region, shape):
    region.box_col, region.box_row, region.width, region.height = shape.box_col, shape.box_row, shape.width, shape.height
    region.save()


def _move_region(region, spot, shift, chain, galaxy, changes):
    """Moves a whole constellation by `shift` = (cols, rows) whole boxes into `spot`; its shape and lines are unchanged."""
    dc, dr = shift[0] * galaxy.box_cells, shift[1] * galaxy.box_cells
    for post in chain:
        post.grid_col, post.grid_row = post.grid_col + dc, post.grid_row + dr
        post.save(update_fields=['grid_col', 'grid_row'])
    changes.append(f'{region.category} moves to box ({spot.box_col}, {spot.box_row}) and grows to {spot.width}×{spot.height}')
    _set_region(region, spot)


def _rotate(axis, shift, galaxy, chain):
    """Shifts every star, every region and the origin by `shift` boxes along `axis` ('col'/'row'), wrapping around.
    The galaxy is a torus, so nothing visibly moves: only where coordinates start."""
    count = getattr(galaxy, f'box_{axis}s')
    size, cells = galaxy.box_cells, count * galaxy.box_cells
    grid, box, origin = f'grid_{axis}', f'box_{axis}', f'origin_{axis}'
    Blog.objects.exclude(**{f'{grid}__isnull': True}).update(**{grid: Mod(F(grid) + shift * size, cells)})
    Region.objects.update(**{box: Mod(F(box) + shift, count)})
    setattr(galaxy, origin, (getattr(galaxy, origin) + shift * size) % cells)
    galaxy.save()
    for post in chain:
        if getattr(post, grid) is not None:
            setattr(post, grid, (getattr(post, grid) + shift * size) % cells)


def _reanchor(region, chain, galaxy, changes):
    """If `region` touches the seam, moves the seam away from it, or adds a line of boxes there, so it can grow every way."""
    for axis, touching in zip(('col', 'row'), boxes.touches_seam(region, galaxy)):
        if not touching:
            continue
        count = getattr(galaxy, f'box_{axis}s')
        border = boxes.best_seam(region, Region.objects.all(), count, axis)
        if border is not None:
            _rotate(axis, count - border, galaxy, chain)
            changes.append('galaxy re-anchored (no visible change)')
        else:
            # Every border is taken: add a line of boxes at the seam (new lines are appended at the end).
            setattr(galaxy, f'box_{axis}s', count + 1)
            galaxy.save()
            changes.append(f'galaxy grows to {galaxy.box_cols}×{galaxy.box_rows} boxes')
            if getattr(region, f'box_{axis}') == 0:
                _rotate(axis, 1, galaxy, chain)  # bring the new line round to just before the region
        region.refresh_from_db()


def _place_with_room(post, chain, index, region, galaxy, changes):
    """
    A cell for `post` at `index`. Strict pass first (only cells that keep an escape route): the region, then a grown
    region, then the region moved as a unit to free space. Then the same without strictness, as a last resort.
    """
    def attempt(shape, strict):
        return placement.place(_cells(chain), index, shape, galaxy, post.slug, post.category, strict=strict)

    if index < len(chain):
        cell = attempt(region, True)
        if cell:
            return cell
        # Inserting between two fixed neighbors: more space elsewhere can't help.
        raise LayoutError(f'no valid cell for {post.slug} between {chain[index - 1].slug if index else "the start"} and {chain[index].slug}')

    def bigger_spots(others):
        """(spot, shift) for every free spot one box wider or taller, with the constellation on either side of it."""
        w, h = region.width, region.height
        for width, height, sides in ((w + 1, h, [(0, 0), (1, 0)]), (w, h + 1, [(0, 0), (0, 1)])):
            for spot in boxes.free_spots(width, height, others, galaxy, near=region)[:MOVE_SPOTS]:
                for dc, dr in sides:
                    yield spot, (spot.box_col + dc - region.box_col, spot.box_row + dr - region.box_row)

    def try_moves(others, strict):
        size = galaxy.box_cells
        for spot, (sc, sr) in bigger_spots(others):
            moved = [(c + sc * size, r + sr * size) for c, r in _cells(chain)]
            cell = placement.place(moved, index, spot, galaxy, post.slug, post.category, strict=strict)
            if cell:
                return spot, (sc, sr), cell
        return None

    reanchored = False
    for strict in (True, False):
        cell = attempt(region, strict)
        if cell:
            return cell
        if not reanchored:
            _reanchor(region, chain, galaxy, changes)
            reanchored = True
        others = _other_regions(region.category)
        for option in boxes.grow_options(region, others, galaxy):
            cell = attempt(option, strict)
            if cell:
                changes.append(f'{region.category} grows to {option.width}×{option.height}')
                _set_region(region, option)
                return cell
        # Growing in place didn't help (or wasn't possible): move the constellation as a unit to a bigger free spot.
        found = try_moves(others, strict)
        for _ in range(MAX_ATTEMPTS):
            if found or next(bigger_spots(others), None):
                break
            _grow_galaxy(galaxy, changes)
            found = try_moves(others, strict)
        if found:
            spot, shift, cell = found
            _move_region(region, spot, shift, chain, galaxy, changes)
            return cell
    raise LayoutError(f'{post.category} is stuck behind its own lines; re-place {chain[-1].slug} (its last star) and try again')


def _put(post, cell, changes, verb='placed'):
    post.grid_col, post.grid_row = cell
    changes.append(f'{post.slug} {verb} at ({post.grid_col}, {post.grid_row})')


def _append(post, galaxy, changes):
    region = Region.objects.filter(category=post.category).first() or _new_region(post.category, galaxy, changes)
    chain = _chain(post.category, without=post)
    _put(post, _place_with_room(post, chain, len(chain), region, galaxy, changes), changes)
    post.order = len(chain) + 1
    post.save()
    _renumber([*chain, post])


def _drop_category_if_empty(category, changes):
    if not Blog.objects.filter(category=category).exists():
        Region.objects.filter(category=category).delete()
        changes.append(f'{category} region freed')


def add(post):
    """Adds a new post (unsaved, or saved without a cell) at the end of its category's constellation."""
    if Blog.objects.filter(pk=post.pk, grid_col__isnull=False).exists():
        raise LayoutError(f'{post.slug} is already in the galaxy; use move or change category instead')
    changes = []
    with _operation():
        _append(post, _galaxy(), changes)
    return changes


def remove(post):
    """Deletes a post. Its neighbors link up (A → B → C becomes A → C); no star moves."""
    changes = [f'{post.slug} removed']
    with _operation():
        _galaxy()
        category = post.category
        post.delete()
        _renumber(_chain(category))
        _drop_category_if_empty(category, changes)
    return changes


def _place_unplaced(galaxy, changes):
    for category in Blog.objects.filter(grid_col__isnull=True).values_list('category', flat=True).distinct().order_by('category'):
        posts = list(Blog.objects.filter(category=category))
        placed = [p for p in posts if p.grid_col is not None]
        for post in (p for p in posts if p.grid_col is None):
            region = Region.objects.filter(category=category).first() or _new_region(category, galaxy, changes)
            _put(post, _place_with_room(post, placed, len(placed), region, galaxy, changes), changes)
            post.save(update_fields=['grid_col', 'grid_row'])
            placed.append(post)
        _renumber(placed)


def place_unplaced():
    """Places every post without a cell, each joining the end of its category in its current order. A no-op if all are placed."""
    changes = []
    with _operation():
        _place_unplaced(_galaxy(), changes)
    return changes


def reset():
    """Clears every star and region, then places everything fresh in the current order. The galaxy keeps its size."""
    changes = ['every star and region cleared']
    with _operation():
        galaxy = _galaxy()
        Blog.objects.update(grid_col=None, grid_row=None)
        Region.objects.all().delete()
        galaxy.origin_col = galaxy.origin_row = 0
        galaxy.save()
        _place_unplaced(galaxy, changes)
    return changes


def move(post, after):
    """Moves a post to just after `after` (None = first) in its category. Keeps its cell if still valid."""
    changes = []
    with _operation():
        galaxy = _galaxy()
        chain = _chain(post.category, without=post)
        index = 0 if after is None else next(i for i, p in enumerate(chain) if p.pk == after.pk) + 1
        current = _chain(post.category)
        if [p.pk for p in current] == [p.pk for p in [*chain[:index], post, *chain[index:]]]:
            return changes
        region = Region.objects.get(category=post.category)
        cell = (post.grid_col, post.grid_row)
        if not placement.is_valid(_cells(chain), index, cell, region, galaxy):
            _put(post, _place_with_room(post, chain, index, region, galaxy, changes), changes, verb='re-placed')
            post.save(update_fields=['grid_col', 'grid_row'])
        changes.append(f'{post.slug} moved after {after.slug if after else "the start"}')
        _renumber([*chain[:index], post, *chain[index:]])
    return changes


def move_earlier(post):
    chain = _chain(post.category)
    i = next(i for i, p in enumerate(chain) if p.pk == post.pk)
    return move(post, chain[i - 2] if i >= 2 else None) if i > 0 else []


def move_later(post):
    chain = _chain(post.category)
    i = next(i for i, p in enumerate(chain) if p.pk == post.pk)
    return move(post, chain[i + 1]) if i < len(chain) - 1 else []


def change_category(post, category):
    """Moves a post to the end of another category's constellation."""
    if category == post.category:
        return []
    changes = []
    with _operation():
        galaxy = _galaxy()
        old = post.category
        post.category = category
        _append(post, galaxy, changes)
        _renumber(_chain(old))
        _drop_category_if_empty(old, changes)
    return changes


def replace(post):
    """Re-places one star on purpose, at a different valid cell if there is one."""
    changes = []
    with _operation():
        galaxy = _galaxy()
        chain = _chain(post.category, without=post)
        index = next(i for i, p in enumerate(_chain(post.category)) if p.pk == post.pk)
        region = Region.objects.get(category=post.category)
        cell = placement.place(_cells(chain), index, region, galaxy, post.slug, post.category, exclude={(post.grid_col, post.grid_row)})
        if cell is None:
            raise LayoutError(f'{post.slug} has no other valid cell in the {post.category} region')
        _put(post, cell, changes, verb='re-placed')
        post.save(update_fields=['grid_col', 'grid_row'])
    return changes


RULE_FIELDS = ('box_cells', 'box_margin', 'min_gap', 'line_length', 'line_variety', 'line_clearance')


def change_rules(**rules):
    """Saves new layout rules only if the existing layout stays valid under them."""
    unknown = set(rules) - set(RULE_FIELDS)
    if unknown:
        raise LayoutError(f'unknown rules: {", ".join(sorted(unknown))}')
    with _operation():
        galaxy = _galaxy()
        for name, value in rules.items():
            setattr(galaxy, name, value)
        problems = validate(galaxy)
        if problems:
            raise LayoutError(problems)
        try:
            with transaction.atomic():
                galaxy.save()
        except IntegrityError as error:
            raise LayoutError(f'rules rejected by the database: {error}') from error
    return [f'{name} is now {value}' for name, value in rules.items()]


def validate(galaxy=None):
    """Every invariant violation in the current layout; empty means valid."""
    galaxy = galaxy or Galaxy.objects.get()
    regions = {r.category: r for r in Region.objects.all()}
    problems = boxes.validate_regions(regions, galaxy)
    categories = set(Blog.objects.values_list('category', flat=True))
    problems += [f'{c}: has posts but no region' for c in sorted(categories - set(regions))]
    problems += [f'{c}: has a region but no posts' for c in sorted(set(regions) - categories)]
    for category in sorted(categories & set(regions)):
        chain = _chain(category)
        for i, post in enumerate(chain):
            cell = (post.grid_col, post.grid_row)
            if None in cell:
                problems.append(f'{post.slug}: not placed')
                continue
            if not boxes.in_interior(cell, regions[category], galaxy):
                problems.append(f'{post.slug}: outside the {category} region')
            for other in chain[i + 1:]:
                if None not in (other.grid_col, other.grid_row) and chebyshev(cell, (other.grid_col, other.grid_row)) < galaxy.min_gap:
                    problems.append(f'{post.slug} and {other.slug}: closer than min_gap {galaxy.min_gap}')
    return problems

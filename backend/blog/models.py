from django.db import models
from django.db.models import Deferrable, F, Q
from django.core.serializers.json import DjangoJSONEncoder

from .writes import require

BLOG_LAYOUT_FIELDS = ('grid_col', 'grid_row', 'order', 'category')


class LockedQuerySet(models.QuerySet):
    """Bulk writes go through blog/galaxy.py. `locked_fields = None` locks every field."""
    locked_fields = None

    def _require(self, fields, what):
        if self.locked_fields is None or set(fields) & set(self.locked_fields):
            require(f'{what} on {self.model.__name__}')

    def update(self, **kwargs):
        self._require(kwargs, 'update()')
        return super().update(**kwargs)

    def bulk_update(self, objs, fields, *args, **kwargs):
        self._require(fields, 'bulk_update()')
        return super().bulk_update(objs, fields, *args, **kwargs)

    def bulk_create(self, *args, **kwargs):
        require(f'bulk_create() on {self.model.__name__}')
        return super().bulk_create(*args, **kwargs)

    def delete(self):
        require(f'delete() on {self.model.__name__}')
        return super().delete()


class BlogQuerySet(LockedQuerySet):
    locked_fields = BLOG_LAYOUT_FIELDS


class LockedModel(models.Model):
    """Every save and delete goes through blog/galaxy.py."""
    objects = LockedQuerySet.as_manager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        require(f'saving {type(self).__name__}')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        require(f'deleting {type(self).__name__}')
        return super().delete(*args, **kwargs)


class Galaxy(LockedModel):
    """The single galaxy: size in boxes, seed, and layout rules (in star cells). Changed only by blog/galaxy.py."""
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    box_cols = models.PositiveIntegerField()
    box_rows = models.PositiveIntegerField()
    seed = models.PositiveIntegerField()
    box_cells = models.PositiveSmallIntegerField()        # each box is box_cells × box_cells cells
    box_margin = models.PositiveSmallIntegerField()       # stars keep this far inside their region's outer edge
    min_gap = models.PositiveSmallIntegerField()          # between stars
    line_length = models.PositiveSmallIntegerField()      # typical line length; each category varies around it
    line_variety = models.FloatField()                     # how much lengths vary (0 = always typical); also each category's spread
    line_clearance = models.PositiveSmallIntegerField()   # lines keep this far from other stars
    origin_col = models.PositiveIntegerField(default=0)   # where the camera starts (cell); moves with the seam
    origin_row = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'galaxy'
        constraints = [
            models.CheckConstraint(condition=Q(id=1), name='galaxy_single_row'),
            models.CheckConstraint(condition=Q(box_cols__gte=1, box_rows__gte=1), name='galaxy_at_least_one_box'),
            models.CheckConstraint(condition=Q(box_cells__gt=F('box_margin') * 2), name='galaxy_margin_leaves_an_interior'),
            models.CheckConstraint(condition=Q(min_gap__gte=1, line_length__gte=F('min_gap')), name='galaxy_line_at_least_the_gap'),
            models.CheckConstraint(condition=Q(line_variety__gte=0), name='galaxy_variety_not_negative'),
        ]

    def __str__(self):
        return f'{self.box_cols}×{self.box_rows} boxes of {self.box_cells}×{self.box_cells} cells, seed {self.seed}'


class Region(LockedModel):
    """The rectangle of boxes a category owns. Changed only by blog/galaxy.py."""
    category = models.CharField(max_length=100, unique=True)
    box_col = models.PositiveIntegerField()
    box_row = models.PositiveIntegerField()
    width = models.PositiveIntegerField(default=1)
    height = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['category']
        constraints = [models.CheckConstraint(condition=Q(width__gte=1, height__gte=1), name='region_at_least_one_box')]

    def __str__(self):
        return f'{self.category}: {self.width}×{self.height} at box ({self.box_col}, {self.box_row})'


class Blog(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # e.g., "star-1"
    category = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField()
    slug = models.SlugField(unique=True)
    position = models.JSONField(encoder=DjangoJSONEncoder, null=True, blank=True)  # {"x": 40, "y": 63}; removed once the WebGL galaxy replaces Stars.js
    content = models.TextField()
    order = models.IntegerField(default=0)  # position within its category's constellation
    grid_col = models.PositiveIntegerField(null=True, blank=True)
    grid_row = models.PositiveIntegerField(null=True, blank=True)

    objects = BlogQuerySet.as_manager()

    class Meta:
        ordering = ['category', 'order', 'slug']
        # Deferred: checked at commit, so moving a whole constellation can pass through overlapping cells mid-transaction.
        constraints = [models.UniqueConstraint(fields=['grid_col', 'grid_row'], name='blog_one_star_per_cell', deferrable=Deferrable.DEFERRED)]

    def __str__(self):
        return f"{self.title} ({self.category})"

    @classmethod
    def from_db(cls, db, field_names, values):
        blog = super().from_db(db, field_names, values)
        blog._loaded_layout = {f: getattr(blog, f) for f in BLOG_LAYOUT_FIELDS if f in field_names}
        return blog

    def _layout_changed(self):
        loaded = getattr(self, '_loaded_layout', {})
        return any(f not in loaded or getattr(self, f) != loaded[f] for f in BLOG_LAYOUT_FIELDS)

    def save(self, *args, **kwargs):
        """New posts and layout changes (cell, order, category) go through blog/galaxy.py; content edits don't."""
        if self._state.adding:
            require('creating a post', 'galaxy.add()')
        elif self._layout_changed() and set(kwargs.get('update_fields') or BLOG_LAYOUT_FIELDS) & set(BLOG_LAYOUT_FIELDS):
            require('changing a post\'s cell, order or category', 'galaxy.move() / change_category() / replace()')
        super().save(*args, **kwargs)
        self._loaded_layout = {f: getattr(self, f) for f in BLOG_LAYOUT_FIELDS}

    def delete(self, *args, **kwargs):
        require('deleting a post', 'galaxy.remove()')
        return super().delete(*args, **kwargs)

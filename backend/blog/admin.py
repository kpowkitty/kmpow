from django import forms
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse

from . import galaxy
from .models import Blog, Galaxy, Region

# Layout is shown, never edited here: it changes only through blog/galaxy.py. position is legacy until Stars.js goes.
ALWAYS_READONLY = ('order', 'grid_col', 'grid_row', 'position')

# List actions: name → (label, service operation on one freshly loaded post).
LAYOUT_ACTIONS = {
    'move_earlier': ('Move earlier', galaxy.move_earlier),
    'move_later': ('Move later', galaxy.move_later),
    'replace_star': ('Re-place star', galaxy.replace),
}


class BlogAdminForm(forms.ModelForm):
    class Meta:
        model = Blog
        fields = ['id', 'category', 'title', 'slug', 'description', 'content']
        widgets = {
            "content": forms.Textarea(attrs={"rows": 20, "cols": 100}),  # large text area for Markdown
        }

    def clean(self):
        data = super().clean()
        if self.instance._state.adding and not self.errors:
            # Try the placement now, so a layout problem is a form error instead of a failed save.
            try:
                galaxy.preview(galaxy.add, Blog(**{f: data.get(f) for f in self.Meta.fields}))
            except galaxy.LayoutError as error:
                raise forms.ValidationError(error.problems)
            except IntegrityError:
                pass  # a duplicate id or slug; Django's own uniqueness check reports it next
        return data


def _run_on_each(operation, pks):
    return [change for pk in pks for change in operation(Blog.objects.get(pk=pk))]


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    form = BlogAdminForm
    list_display = ('id', 'title', 'category', 'order', 'slug', 'grid_col', 'grid_row')
    search_fields = ('title', 'category', 'slug')
    list_filter = ('category',)

    def get_readonly_fields(self, request, obj=None):
        # On add, id and category are chosen. After that, id is the primary key (editing it would create a copy)
        # and category changes only through "Change category…".
        return ('id', 'category', *ALWAYS_READONLY) if obj else ALWAYS_READONLY

    def get_actions(self, request):
        actions = super().get_actions(request)
        for name, (label, _) in LAYOUT_ACTIONS.items():
            actions[name] = (lambda admin_, req, qs, name=name: admin_._layout_action(req, qs, name), name, label)
        return actions

    def get_urls(self):
        view = self.admin_site.admin_view(self.change_category_view)
        return [path('<path:object_id>/change-category/', view, name='blog_blog_change_category'), *super().get_urls()]

    def _report(self, request, changes):
        for change in changes or ['nothing to change']:
            self.message_user(request, change, messages.INFO)

    def _context(self, request, **extra):
        return {**self.admin_site.each_context(request), 'opts': self.model._meta, **extra}

    def save_model(self, request, obj, form, change):
        if change:
            obj.save()  # content only: the layout fields aren't in the form
        else:
            self._report(request, galaxy.add(obj))

    def delete_model(self, request, obj):
        self._report(request, galaxy.remove(obj))

    def delete_queryset(self, request, queryset):
        with transaction.atomic():
            for obj in list(queryset):
                self._report(request, galaxy.remove(obj))

    def _layout_action(self, request, queryset, name):
        """Preview page first; the same operations run for real only after Confirm."""
        label, operation = LAYOUT_ACTIONS[name]
        pks = list(queryset.values_list('pk', flat=True))
        if request.POST.get('confirm'):
            try:
                with transaction.atomic():
                    self._report(request, _run_on_each(operation, pks))
            except galaxy.LayoutError as error:
                self.message_user(request, str(error), messages.ERROR)
            return None
        try:
            changes, problems = galaxy.preview(_run_on_each, operation, pks), None
        except galaxy.LayoutError as error:
            changes, problems = [], error.problems
        return TemplateResponse(request, 'admin/blog/confirm_layout.html', self._context(
            request, title=f'{label}: confirm', changes=changes, problems=problems, action=name, selected=pks,
        ))

    def change_category_view(self, request, object_id):
        post = get_object_or_404(Blog, pk=object_id)
        if not self.has_change_permission(request, post):
            raise PermissionDenied
        category = request.POST.get('category', '').strip()
        context = self._context(
            request, title=f'Change category: {post.title}', post=post, category=category, changes=None, problems=None,
            categories=Blog.objects.values_list('category', flat=True).distinct().order_by('category'),
        )
        if request.method == 'POST' and category:
            if request.POST.get('confirm'):
                try:
                    self._report(request, galaxy.change_category(Blog.objects.get(pk=object_id), category))
                except galaxy.LayoutError as error:
                    self.message_user(request, str(error), messages.ERROR)
                return redirect(reverse('admin:blog_blog_change', args=[object_id]))
            try:
                context['changes'] = galaxy.preview(galaxy.change_category, Blog.objects.get(pk=object_id), category)
            except galaxy.LayoutError as error:
                context['problems'] = error.problems
        return TemplateResponse(request, 'admin/blog/change_category.html', context)


class ReadOnlyAdmin(admin.ModelAdmin):
    """Shown, never edited here: these rows change only through blog/galaxy.py."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Region)
class RegionAdmin(ReadOnlyAdmin):
    list_display = ('category', 'box_col', 'box_row', 'width', 'height', 'stars')

    @admin.display(description='stars')
    def stars(self, region):
        return Blog.objects.filter(category=region.category).count()


RulesForm = forms.modelform_factory(Galaxy, fields=galaxy.RULE_FIELDS)


@admin.register(Galaxy)
class GalaxyAdmin(ReadOnlyAdmin):
    list_display = ('__str__', 'line_length', 'line_variety', 'min_gap')

    def get_urls(self):
        view = self.admin_site.admin_view(self.change_rules_view)
        return [path('change-rules/', view, name='blog_galaxy_change_rules'), *super().get_urls()]

    def change_rules_view(self, request):
        """Preview → Confirm. Saved only if the existing layout stays valid under the new rules."""
        if not request.user.has_perm('blog.change_galaxy'):
            raise PermissionDenied
        current = Galaxy.objects.get()
        form = RulesForm(request.POST or None, instance=Galaxy.objects.get())
        context = {**self.admin_site.each_context(request), 'opts': self.model._meta, 'title': 'Change galaxy rules',
                   'form': form, 'changes': None, 'problems': None}
        if request.method == 'POST' and form.is_valid():
            changed = {f: form.cleaned_data[f] for f in galaxy.RULE_FIELDS if form.cleaned_data[f] != getattr(current, f)}
            if not changed:
                context['changes'] = []
            elif request.POST.get('confirm'):
                try:
                    for change in galaxy.change_rules(**changed):
                        self.message_user(request, change, messages.INFO)
                except galaxy.LayoutError as error:
                    self.message_user(request, str(error), messages.ERROR)
                return redirect(reverse('admin:blog_galaxy_changelist'))
            else:
                try:
                    context['changes'] = galaxy.preview(galaxy.change_rules, **changed)
                except galaxy.LayoutError as error:
                    context['problems'] = error.problems
        return TemplateResponse(request, 'admin/blog/change_rules.html', context)

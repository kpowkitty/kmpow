import pytest

from blog import galaxy as service
from blog.models import Blog, Galaxy, Region
from blog.writes import LayoutLocked

pytestmark = [pytest.mark.integration, pytest.mark.django_db]


@pytest.fixture
def post(seeded):
    return Blog.objects.get(slug='kyua-test')


class TestContentEditsAreAllowedAnywhere:
    def test_saving_content(self, post):
        post.title = 'New title'
        post.save()
        assert Blog.objects.get(pk=post.pk).title == 'New title'

    def test_queryset_update_of_content(self, post):
        Blog.objects.filter(pk=post.pk).update(description='changed')
        assert Blog.objects.get(pk=post.pk).description == 'changed'

    def test_update_fields_without_layout_ignores_unsaved_layout_changes(self, post):
        post.category = 'elsewhere'
        post.title = 'Only this'
        post.save(update_fields=['title'])
        fresh = Blog.objects.get(pk=post.pk)
        assert (fresh.title, fresh.category) == ('Only this', 'jails')


class TestLayoutWritesAreBlocked:
    @pytest.mark.parametrize('field, value', [
        pytest.param('category', 'gsoc', id='category'),
        pytest.param('order', 99, id='order'),
        pytest.param('grid_col', 0, id='cell'),
    ])
    def test_saving_a_layout_field(self, post, field, value):
        setattr(post, field, value)
        with pytest.raises(LayoutLocked, match="cell, order or category"):
            post.save()

    def test_creating_a_post(self, seeded):
        with pytest.raises(LayoutLocked, match='galaxy.add'):
            Blog.objects.create(id='new', slug='new', category='jails', title='t', description='d', content='c')

    def test_deleting_a_post(self, post):
        with pytest.raises(LayoutLocked, match='galaxy.remove'):
            post.delete()

    @pytest.mark.parametrize('write', [
        pytest.param(lambda qs: qs.update(category='gsoc'), id='update a layout field'),
        pytest.param(lambda qs: qs.delete(), id='delete'),
        pytest.param(lambda qs: qs.bulk_create([Blog(id='x', slug='x', category='c', title='t', description='d', content='c')]), id='bulk_create'),
        pytest.param(lambda qs: qs.bulk_update(list(qs), ['order']), id='bulk_update a layout field'),
    ])
    def test_bulk_writes(self, seeded, write):
        with pytest.raises(LayoutLocked):
            write(Blog.objects.all())

    def test_bulk_update_of_content_is_allowed(self, post):
        post.title = 'bulk'
        Blog.objects.bulk_update([post], ['title'])
        assert Blog.objects.get(pk=post.pk).title == 'bulk'

    @pytest.mark.parametrize('write', [
        pytest.param(lambda: Galaxy.objects.get().save(), id='save the galaxy'),
        pytest.param(lambda: Galaxy.objects.update(seed=2), id='update the galaxy'),
        pytest.param(lambda: Region.objects.first().save(), id='save a region'),
        pytest.param(lambda: Region.objects.create(category='x', box_col=3, box_row=3), id='create a region'),
        pytest.param(lambda: Region.objects.all().delete(), id='delete regions'),
    ])
    def test_galaxy_and_regions(self, seeded, write):
        with pytest.raises(LayoutLocked):
            write()

    def test_nothing_changed_after_a_blocked_write(self, post):
        before = (post.category, post.order, post.grid_col, post.grid_row)
        post.category = 'gsoc'
        with pytest.raises(LayoutLocked):
            post.save()
        fresh = Blog.objects.get(pk=post.pk)
        assert (fresh.category, fresh.order, fresh.grid_col, fresh.grid_row) == before


class TestTheServiceMayWrite:
    def test_service_operations_work_with_the_guards_on(self, post):
        service.change_category(post, 'gsoc')
        service.move_earlier(Blog.objects.get(slug='kyua-test'))
        service.remove(Blog.objects.get(slug='storybook'))
        assert service.validate() == []

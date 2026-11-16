import pytest

from blog import galaxy as service
from blog.models import Blog

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

CHANGELIST = '/admin/blog/blog/'


def change_url(pk):
    return f'{CHANGELIST}{pk}/change/'


def messages_of(response):
    return [str(m) for m in response.context['messages']]


def test_adding_a_post_places_it_and_reports_the_changes(admin_client, seeded):
    response = admin_client.post(f'{CHANGELIST}add/', {
        'id': 'star-new', 'category': 'jails', 'title': 'New', 'slug': 'new-post', 'description': 'd', 'content': 'c',
    }, follow=True)
    post = Blog.objects.get(pk='star-new')
    assert post.grid_col is not None and post.order == 4
    assert any('new-post placed at' in m for m in messages_of(response))
    assert service.validate() == []


def test_the_add_form_has_no_layout_inputs(admin_client, seeded):
    html = admin_client.get(f'{CHANGELIST}add/').content.decode()
    assert 'name="category"' in html
    for field in ['order', 'grid_col', 'grid_row', 'position']:
        assert f'name="{field}"' not in html


def test_the_change_form_shows_layout_read_only(admin_client, seeded):
    html = admin_client.get(change_url('star-1')).content.decode()
    for field in ['id', 'category', 'order', 'grid_col', 'grid_row']:
        assert f'name="{field}"' not in html
    assert 'name="title"' in html


def test_editing_content_keeps_the_star_in_place(admin_client, seeded):
    before = Blog.objects.get(pk='star-1')
    admin_client.post(change_url('star-1'), {
        'title': 'Renamed', 'slug': before.slug, 'description': before.description, 'content': before.content,
    })
    after = Blog.objects.get(pk='star-1')
    assert after.title == 'Renamed'
    assert (after.category, after.order, after.grid_col, after.grid_row) == (before.category, before.order, before.grid_col, before.grid_row)


def test_deleting_a_post_relinks_its_neighbors(admin_client, seeded):
    response = admin_client.post(f'{CHANGELIST}star-2/delete/', {'post': 'yes'}, follow=True)
    assert [(p.slug, p.order) for p in Blog.objects.filter(category='jails')] == [('kyua-test', 1), ('jails-part-three', 2)]
    assert any('jails-part-two removed' in m for m in messages_of(response))
    assert service.validate() == []


def test_deleting_several_posts_from_the_list(admin_client, seeded):
    admin_client.post(CHANGELIST, {'action': 'delete_selected', '_selected_action': ['star-1', 'star-6'], 'post': 'yes'})
    assert not Blog.objects.filter(pk__in=['star-1', 'star-6']).exists()
    assert service.validate() == []


def jails():
    return [p.slug for p in Blog.objects.filter(category='jails')]


def layout():
    return {p.slug: (p.category, p.order, p.grid_col, p.grid_row) for p in Blog.objects.all()}


class TestListActions:
    def test_preview_shows_the_changes_and_changes_nothing(self, admin_client, seeded):
        before = layout()
        response = admin_client.post(CHANGELIST, {'action': 'move_later', '_selected_action': ['star-1']})
        html = response.content.decode()
        assert 'These changes will happen' in html
        assert 'kyua-test moved after jails-part-two' in html
        assert layout() == before

    def test_confirm_runs_it(self, admin_client, seeded):
        response = admin_client.post(CHANGELIST, {'action': 'move_later', '_selected_action': ['star-1'], 'confirm': 'yes'}, follow=True)
        assert jails() == ['jails-part-two', 'kyua-test', 'jails-part-three']
        assert any('kyua-test moved after' in m for m in messages_of(response))

    def test_move_earlier(self, admin_client, seeded):
        admin_client.post(CHANGELIST, {'action': 'move_earlier', '_selected_action': ['star-3'], 'confirm': 'yes'})
        assert jails() == ['kyua-test', 'jails-part-three', 'jails-part-two']

    def test_replace_star_moves_only_that_star(self, admin_client, seeded):
        before = layout()
        admin_client.post(CHANGELIST, {'action': 'replace_star', '_selected_action': ['star-2'], 'confirm': 'yes'})
        after = layout()
        assert after['jails-part-two'] != before['jails-part-two']
        assert {k: v for k, v in after.items() if k != 'jails-part-two'} == {k: v for k, v in before.items() if k != 'jails-part-two'}
        assert service.validate() == []

    def test_a_no_op_says_nothing_changes(self, admin_client, seeded):
        html = admin_client.post(CHANGELIST, {'action': 'move_earlier', '_selected_action': ['star-1']}).content.decode()
        assert 'Nothing changes.' in html


class TestChangeCategory:
    URL = f'{CHANGELIST}star-1/change-category/'

    def test_the_post_page_links_to_it(self, admin_client, seeded):
        assert self.URL in admin_client.get(change_url('star-1')).content.decode()

    def test_opening_it_shows_no_preview_yet(self, admin_client, seeded):
        html = admin_client.get(self.URL).content.decode()
        assert 'Currently in <strong>jails</strong>' in html
        assert 'These changes will happen' not in html

    def test_preview_then_confirm(self, admin_client, seeded):
        before = layout()
        html = admin_client.post(self.URL, {'category': 'gsoc'}).content.decode()
        assert 'These changes will happen' in html
        assert layout() == before
        admin_client.post(self.URL, {'category': 'gsoc', 'confirm': 'yes'})
        assert [p.slug for p in Blog.objects.filter(category='gsoc')][-1] == 'kyua-test'
        assert service.validate() == []


def test_a_layout_error_on_add_is_a_form_error(admin_client, seeded, monkeypatch):
    def stuck(post):
        raise service.LayoutError('jails is stuck behind its own lines; re-place jails-part-three (its last star) and try again')
    monkeypatch.setattr(service, 'add', stuck)
    response = admin_client.post(f'{CHANGELIST}add/', {
        'id': 'star-new', 'category': 'jails', 'title': 'New', 'slug': 'new-post', 'description': 'd', 'content': 'c',
    })
    assert response.status_code == 200
    assert 'stuck behind its own lines' in response.content.decode()
    assert not Blog.objects.filter(pk='star-new').exists()

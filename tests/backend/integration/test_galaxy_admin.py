from io import StringIO

import pytest
from django.core.management import CommandError, call_command

from blog import galaxy as service
from blog.models import Blog, Galaxy, Region
from blog.writes import layout_writes

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

RULES_URL = '/admin/blog/galaxy/change-rules/'


def rules_form(**changes):
    g = Galaxy.objects.get()
    return {f: changes.get(f, getattr(g, f)) for f in service.RULE_FIELDS}


class TestRegionAdmin:
    def test_lists_regions_with_star_counts(self, admin_client, seeded):
        html = admin_client.get('/admin/blog/region/').content.decode()
        for region in Region.objects.all():
            assert region.category in html

    def test_is_read_only(self, admin_client, seeded):
        region = Region.objects.get(category='jails')
        assert admin_client.get('/admin/blog/region/add/').status_code == 403
        html = admin_client.get(f'/admin/blog/region/{region.pk}/change/').content.decode()
        assert 'name="box_col"' not in html


class TestChangeRules:
    def test_the_galaxy_list_links_to_it(self, admin_client, seeded):
        assert RULES_URL in admin_client.get('/admin/blog/galaxy/').content.decode()

    def test_preview_then_confirm(self, admin_client, seeded):
        html = admin_client.post(RULES_URL, rules_form(line_length=4)).content.decode()
        assert 'line_length is now 4' in html
        assert Galaxy.objects.get().line_length == 3
        admin_client.post(RULES_URL, {**rules_form(line_length=4), 'confirm': 'yes'})
        assert Galaxy.objects.get().line_length == 4

    def test_breaking_rules_are_refused_with_reasons(self, admin_client, seeded):
        region = Region.objects.get(category='jails')
        c0, r0 = region.box_col * 8 + 1, region.box_row * 8 + 1
        with layout_writes():  # exactly 2 apart, so min_gap 3 must fail
            for slug, cell in {'kyua-test': (c0, r0), 'jails-part-two': (c0 + 2, r0), 'jails-part-three': (c0 + 5, r0 + 5)}.items():
                Blog.objects.filter(slug=slug).update(grid_col=cell[0], grid_row=cell[1])
        html = admin_client.post(RULES_URL, rules_form(min_gap=3)).content.decode()
        assert "This can't be done" in html
        assert 'kyua-test and jails-part-two: closer than min_gap 3' in html
        assert 'Confirm' not in html
        assert Galaxy.objects.get().min_gap == 2

    def test_values_the_database_forbids_are_form_errors(self, admin_client, seeded):
        response = admin_client.post(RULES_URL, rules_form(line_length=1))
        assert response.context['form'].errors
        assert Galaxy.objects.get().line_length == 3

    def test_unchanged_rules_say_nothing_changes(self, admin_client, seeded):
        assert 'Nothing changes.' in admin_client.post(RULES_URL, rules_form()).content.decode()


class TestCheckGalaxy:
    def run(self):
        out = StringIO()
        call_command('check_galaxy', stdout=out)
        return out.getvalue()

    def test_reports_regions_and_validity(self, seeded):
        output = self.run()
        assert '4×4 boxes' in output
        assert 'jails: 1×1 at box' in output and '3 stars' in output
        assert 'galaxy is valid' in output

    def test_fails_on_an_invalid_layout(self, seeded):
        with layout_writes():
            Blog.objects.filter(slug='kyua-test').update(grid_col=31, grid_row=31)
        with pytest.raises(CommandError, match='kyua-test: outside the jails region'):
            self.run()

from django.core.management.base import BaseCommand, CommandError

from blog import galaxy
from blog.models import Blog, Galaxy, Region


class Command(BaseCommand):
    help = 'Reports the galaxy layout and fails if it breaks an invariant (read-only; catches anything that bypassed the service).'

    def handle(self, *args, **options):
        self.stdout.write(str(Galaxy.objects.get()))
        for region in Region.objects.all():
            stars = Blog.objects.filter(category=region.category).count()
            self.stdout.write(f'  {region}, {stars} stars')
        unplaced = Blog.objects.filter(grid_col__isnull=True).count()
        if unplaced:
            self.stdout.write(f'  {unplaced} unplaced (run place_stars)')
        problems = galaxy.validate()
        if problems:
            raise CommandError('layout is invalid:\n  ' + '\n  '.join(problems))
        self.stdout.write(self.style.SUCCESS('galaxy is valid'))

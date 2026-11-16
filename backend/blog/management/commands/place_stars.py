from django.core.management.base import BaseCommand, CommandError

from blog import galaxy


class Command(BaseCommand):
    help = 'Places every blog post that has no cell yet (a no-op if all are placed). --reset re-places everything.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='clear every star and region first, then place everything fresh')

    def handle(self, *args, reset=False, **options):
        try:
            changes = galaxy.reset() if reset else galaxy.place_unplaced()
        except galaxy.LayoutError as error:
            raise CommandError(str(error)) from error
        for change in changes:
            self.stdout.write(change)
        if not changes:
            self.stdout.write('nothing to place')
        problems = galaxy.validate()
        if problems:
            raise CommandError('layout is invalid:\n  ' + '\n  '.join(problems))
        self.stdout.write(self.style.SUCCESS('galaxy is valid'))

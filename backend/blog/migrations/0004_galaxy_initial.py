from django.db import migrations

# The galaxy's starting size and rules. After this, the Galaxy row is the only source (changed via blog/galaxy.py).
INITIAL = dict(
    box_cols=4, box_rows=4, seed=1,
    box_cells=8, box_margin=1, min_gap=2, line_length=3, line_variety=0.5, line_clearance=1,
    origin_col=0, origin_row=0,
)


def create_galaxy(apps, schema_editor):
    apps.get_model('blog', 'Galaxy').objects.get_or_create(id=1, defaults=INITIAL)


def remove_galaxy(apps, schema_editor):
    apps.get_model('blog', 'Galaxy').objects.filter(id=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_galaxy_regions_cells'),
    ]

    operations = [
        migrations.RunPython(create_galaxy, remove_galaxy),
    ]

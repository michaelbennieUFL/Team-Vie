from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('competitions', '0002_competition_server'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='competition',
            name='points_goal',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='competition',
            name='winner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='competitions_won',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]

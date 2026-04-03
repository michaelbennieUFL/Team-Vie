from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_task_recurrence'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='awarded_points',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='score_reason',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]

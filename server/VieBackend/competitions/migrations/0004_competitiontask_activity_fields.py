from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('competitions', '0003_competition_points_winner'),
    ]

    operations = [
        migrations.AddField(
            model_name='competitiontask',
            name='challenger_completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='competitiontask',
            name='difficulty',
            field=models.CharField(choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High')], default='MEDIUM', max_length=10),
        ),
        migrations.AddField(
            model_name='competitiontask',
            name='opponent_completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='competitiontask',
            name='score_reason',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]

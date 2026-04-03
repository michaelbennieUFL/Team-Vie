from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('users', '0002_userprofile_weekly_progress'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyTaskProgress',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.DateField()),
                ('low_full_count', models.IntegerField(default=0)),
                ('medium_full_count', models.IntegerField(default=0)),
                ('high_full_count', models.IntegerField(default=0)),
                ('low_reduced_count', models.IntegerField(default=0)),
                ('medium_reduced_count', models.IntegerField(default=0)),
                ('high_reduced_count', models.IntegerField(default=0)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='daily_task_progress_entries', to='auth.user')),
            ],
            options={
                'ordering': ['-day'],
                'unique_together': {('user', 'day')},
            },
        ),
    ]

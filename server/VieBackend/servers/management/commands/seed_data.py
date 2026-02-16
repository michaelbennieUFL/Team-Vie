from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from servers.models import Server, ServerMembership
from tasks.models import Task
from competitions.models import Competition, CompetitionTask
from users.models import UserProfile
from datetime import date, timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed the database with default users, servers, tasks, and competitions'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create default users
        demo_user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'email': 'demo@vie.app',
                'first_name': 'Demo',
                'last_name': 'User',
            }
        )
        if created:
            demo_user.set_password('demo1234')
            demo_user.save()
            profile = demo_user.profile
            profile.points = 150
            profile.current_streak = 3
            profile.longest_streak = 7
            profile.last_task_completed_date = date.today()
            profile.region = 'North America'
            profile.save()
            self.stdout.write(self.style.SUCCESS('  Created user: demo / demo1234'))
        else:
            self.stdout.write('  User "demo" already exists')

        alice, created = User.objects.get_or_create(
            username='alice',
            defaults={
                'email': 'alice@vie.app',
                'first_name': 'Alice',
                'last_name': 'Johnson',
            }
        )
        if created:
            alice.set_password('alice1234')
            alice.save()
            profile = alice.profile
            profile.points = 320
            profile.current_streak = 5
            profile.longest_streak = 12
            profile.last_task_completed_date = date.today()
            profile.region = 'North America'
            profile.save()
            self.stdout.write(self.style.SUCCESS('  Created user: alice'))

        bob, created = User.objects.get_or_create(
            username='bob',
            defaults={
                'email': 'bob@vie.app',
                'first_name': 'Bob',
                'last_name': 'Smith',
            }
        )
        if created:
            bob.set_password('bob12345')
            bob.save()
            profile = bob.profile
            profile.points = 210
            profile.current_streak = 2
            profile.longest_streak = 8
            profile.last_task_completed_date = date.today() - timedelta(days=1)
            profile.region = 'Europe'
            profile.save()
            self.stdout.write(self.style.SUCCESS('  Created user: bob'))

        charlie, created = User.objects.get_or_create(
            username='charlie',
            defaults={
                'email': 'charlie@vie.app',
                'first_name': 'Charlie',
                'last_name': 'Brown',
            }
        )
        if created:
            charlie.set_password('charlie1234')
            charlie.save()
            profile = charlie.profile
            profile.points = 95
            profile.current_streak = 1
            profile.longest_streak = 4
            profile.last_task_completed_date = date.today()
            profile.region = 'North America'
            profile.save()
            self.stdout.write(self.style.SUCCESS('  Created user: charlie'))

        diana, created = User.objects.get_or_create(
            username='diana',
            defaults={
                'email': 'diana@vie.app',
                'first_name': 'Diana',
                'last_name': 'Lee',
            }
        )
        if created:
            diana.set_password('diana1234')
            diana.save()
            profile = diana.profile
            profile.points = 275
            profile.current_streak = 10
            profile.longest_streak = 15
            profile.last_task_completed_date = date.today()
            profile.region = 'Asia'
            profile.save()
            self.stdout.write(self.style.SUCCESS('  Created user: diana'))

        # Create default servers
        cop2000, created = Server.objects.get_or_create(
            name='COP 2000',
            defaults={
                'description': 'Introduction to Programming - collaborative study group',
                'created_by': demo_user,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created server: COP 2000'))

        ant3030, created = Server.objects.get_or_create(
            name='ANT 3030',
            defaults={
                'description': 'Cultural Anthropology - study and assignments tracker',
                'created_by': demo_user,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created server: ANT 3030'))

        personal, created = Server.objects.get_or_create(
            name='Personal',
            defaults={
                'description': 'Personal task management',
                'created_by': demo_user,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created server: Personal'))

        # Add memberships
        all_users = [demo_user, alice, bob, charlie, diana]
        for server in [cop2000, ant3030, personal]:
            for user in all_users:
                ServerMembership.objects.get_or_create(
                    user=user,
                    server=server,
                    defaults={
                        'role': 'OWNER' if user == demo_user else 'MEMBER'
                    }
                )

        # Create sample tasks for the demo user
        if not Task.objects.filter(user=demo_user).exists():
            Task.objects.create(
                user=demo_user, server=cop2000,
                title='Complete Python tutorial',
                description='Finish chapters 5-8 of the Python textbook',
                priority='HIGH', points_value=25,
                due_date=date.today() + timedelta(days=3)
            )
            Task.objects.create(
                user=demo_user, server=cop2000,
                title='Submit Lab 4',
                description='Implement linked list operations',
                priority='HIGH', points_value=30,
                due_date=date.today() + timedelta(days=5)
            )
            Task.objects.create(
                user=demo_user, server=ant3030,
                title='Read Chapter 7',
                description='Cultural relativism and ethnocentrism',
                priority='MEDIUM', points_value=15,
                due_date=date.today() + timedelta(days=2)
            )
            Task.objects.create(
                user=demo_user, server=ant3030,
                title='Write discussion post',
                description='Weekly discussion board post on kinship systems',
                priority='LOW', points_value=10,
                due_date=date.today() + timedelta(days=4)
            )
            Task.objects.create(
                user=demo_user, server=personal,
                title='Grocery shopping',
                description='Buy ingredients for the week',
                priority='LOW', points_value=5,
                due_date=date.today() + timedelta(days=1)
            )
            Task.objects.create(
                user=demo_user, server=personal,
                title='Gym workout',
                description='Upper body day',
                priority='MEDIUM', points_value=10,
                due_date=date.today()
            )

            # Create some completed tasks for the demo user
            completed_task = Task.objects.create(
                user=demo_user, server=cop2000,
                title='Set up development environment',
                description='Install Python, VS Code, and Git',
                priority='HIGH', points_value=20,
                is_completed=True, completed_at=timezone.now() - timedelta(days=2)
            )

            self.stdout.write(self.style.SUCCESS('  Created sample tasks for demo user'))

        # Create sample tasks for other users
        for user in [alice, bob, charlie, diana]:
            if not Task.objects.filter(user=user).exists():
                Task.objects.create(
                    user=user, server=cop2000,
                    title=f'Study for midterm',
                    description='Review all lecture notes and practice problems',
                    priority='HIGH', points_value=30,
                    due_date=date.today() + timedelta(days=7)
                )
                Task.objects.create(
                    user=user, server=personal,
                    title='Exercise routine',
                    description='30 minute cardio session',
                    priority='MEDIUM', points_value=10,
                    due_date=date.today()
                )

        # Create a sample competition
        if not Competition.objects.exists():
            competition = Competition.objects.create(
                challenger=alice,
                opponent=bob,
                server=cop2000,
                status='ACTIVE',
                challenger_score=20,
                opponent_score=10,
                started_at=timezone.now() - timedelta(hours=2)
            )
            CompetitionTask.objects.create(
                competition=competition,
                title='Complete 5 practice problems',
                description='Solve coding challenges on arrays',
                points_value=10,
                challenger_completed=True,
                opponent_completed=True,
            )
            CompetitionTask.objects.create(
                competition=competition,
                title='Write a sorting algorithm',
                description='Implement quicksort from scratch',
                points_value=15,
                challenger_completed=True,
                opponent_completed=False,
            )
            CompetitionTask.objects.create(
                competition=competition,
                title='Debug sample code',
                description='Find and fix 3 bugs in the provided code',
                points_value=10,
                challenger_completed=False,
                opponent_completed=False,
            )

            # Create a pending competition
            Competition.objects.create(
                challenger=demo_user,
                opponent=alice,
                server=cop2000,
                status='PENDING',
            )

            self.stdout.write(self.style.SUCCESS('  Created sample competitions'))

        self.stdout.write(self.style.SUCCESS('\nDatabase seeding complete!'))
        self.stdout.write(self.style.SUCCESS('\nDefault login credentials:'))
        self.stdout.write(self.style.SUCCESS('  Username: demo'))
        self.stdout.write(self.style.SUCCESS('  Password: demo1234'))

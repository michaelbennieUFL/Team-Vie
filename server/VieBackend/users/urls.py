from django.urls import path
from . import views

urlpatterns = [
    path('csrf/', views.csrf_view, name='csrf'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.current_user_view, name='current-user'),
    path('motivation/', views.motivational_quote_view, name='motivational-quote'),
    path('search/', views.search_users_view, name='search-users'),
    path('leaderboard/', views.leaderboard_view, name='leaderboard'),
    path('activity/', views.activity_view, name='activity-self'),
    path('activity/<int:user_id>/', views.activity_view, name='activity-user'),
]

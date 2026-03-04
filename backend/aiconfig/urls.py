from django.urls import path
from .views import (
    LogStatsView,
    LogTopicsView,
    LogVolumeView,
    TopQuestionsView,
    DeleteLogView,
    AISettingsView,
)

urlpatterns = [
    path('logs/stats/',         LogStatsView.as_view()),
    path('logs/topics/',        LogTopicsView.as_view()),
    path('logs/volume/',        LogVolumeView.as_view()),
    path('logs/top_questions/', TopQuestionsView.as_view()),
    path('logs/<int:pk>/',      DeleteLogView.as_view()),
    path('settings/',           AISettingsView.as_view()),
]
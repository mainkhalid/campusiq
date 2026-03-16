from django.urls import path
from .views import (
    LogStatsView,
    LogTopicsView,
    LogVolumeView,
    TopQuestionsView,
    DeleteLogView,
    ConversationDetailView,
    AISettingsView,
    StudentLifeContentView,
    ResearchContentView,
    InvalidateContentCacheView,
)

urlpatterns = [
    # ── Analytics ────────────────────────────────────────────
    path('logs/stats/',                       LogStatsView.as_view()),
    path('logs/topics/',                      LogTopicsView.as_view()),
    path('logs/volume/',                      LogVolumeView.as_view()),
    path('logs/top_questions/',               TopQuestionsView.as_view()),
    path('logs/conversations/<uuid:pk>/',     ConversationDetailView.as_view()),
    path('logs/<uuid:pk>/',                   DeleteLogView.as_view()),

    # ── Settings ─────────────────────────────────────────────
    path('settings/',                         AISettingsView.as_view()),

    # ── Cached content (public GET, admin-only invalidate) ───
    path('content/student-life/',             StudentLifeContentView.as_view()),
    path('content/research/',                 ResearchContentView.as_view()),
    path('content/invalidate/',               InvalidateContentCacheView.as_view()),
]
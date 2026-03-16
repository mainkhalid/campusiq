# research/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import ResearchProjectViewSet, ResearchMilestoneViewSet
from .views_scrape import ScrapeResearchView

router = DefaultRouter()
router.register(r'projects', ResearchProjectViewSet, basename='research-project')

nested_router = nested_routers.NestedDefaultRouter(
    router, r'projects', lookup='project'
)
nested_router.register(
    r'milestones',
    ResearchMilestoneViewSet,
    basename='research-milestone'
)

urlpatterns = [
    path('scrape/', ScrapeResearchView.as_view(), name='research-scrape'),
] + router.urls + nested_router.urls
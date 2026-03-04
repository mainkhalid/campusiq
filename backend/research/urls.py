# research/urls.py
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import ResearchProjectViewSet, ResearchMilestoneViewSet

router = DefaultRouter()
router.register(r'projects', ResearchProjectViewSet, basename='research-project')

# Nested router creates URLs like:
# /api/research/projects/{project_pk}/milestones/
# /api/research/projects/{project_pk}/milestones/{id}/
# Install: pip install drf-nested-routers
nested_router = nested_routers.NestedDefaultRouter(
    router, r'projects', lookup='project'
)
nested_router.register(
    r'milestones',
    ResearchMilestoneViewSet,
    basename='research-milestone'
)

urlpatterns = router.urls + nested_router.urls
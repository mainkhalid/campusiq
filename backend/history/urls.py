# history/urls.py
from rest_framework.routers import DefaultRouter
from .views import MilestoneViewSet

router = DefaultRouter()
router.register(r'history', MilestoneViewSet)
urlpatterns = router.urls
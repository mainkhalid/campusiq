from rest_framework.routers import DefaultRouter
from .views import ScholarshipViewSet

router = DefaultRouter()
router.register(r'scholarships', ScholarshipViewSet, basename='scholarship')
urlpatterns = router.urls
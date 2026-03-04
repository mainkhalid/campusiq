from rest_framework.routers import DefaultRouter
from .views import NewsPostViewSet

router = DefaultRouter()
router.register(r'posts', NewsPostViewSet, basename='news-post')
urlpatterns = router.urls
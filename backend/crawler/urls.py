from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CrawlSourceViewSet

router = DefaultRouter()
router.register(r'sources', CrawlSourceViewSet, basename='crawlsource')

urlpatterns = [
    path('', include(router.urls)),
]
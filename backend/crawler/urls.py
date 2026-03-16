from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CrawlSourceViewSet
from .views_extra import RunAllCrawlsView, CrawlStatusView

router = DefaultRouter()
router.register(r'sources', CrawlSourceViewSet, basename='crawlsource')

urlpatterns = [
    path('run-all/', RunAllCrawlsView.as_view(), name='crawler-run-all'),
    path('status/',  CrawlStatusView.as_view(),  name='crawler-status'),
    path('', include(router.urls)),
]
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import NewsPostViewSet
from .views_scrape import ScrapeNewsView

router = DefaultRouter()
router.register(r'posts', NewsPostViewSet, basename='news-post')

urlpatterns = [
    path('posts/scrape/', ScrapeNewsView.as_view(), name='news-scrape'),
] + router.urls
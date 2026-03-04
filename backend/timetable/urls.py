# timetable/urls.py
from rest_framework.routers import DefaultRouter
from .views import TimetableViewSet

router = DefaultRouter()
router.register(r'timetables', TimetableViewSet, basename='timetable')
urlpatterns = router.urls
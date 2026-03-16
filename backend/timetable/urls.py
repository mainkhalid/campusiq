from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TimetableViewSet, TimetableUploadView

router = DefaultRouter()
router.register(r'timetables', TimetableViewSet, basename='timetable')

urlpatterns = [
    path('upload', TimetableUploadView.as_view(), name='timetable-upload'),
] + router.urls
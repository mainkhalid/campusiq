from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProgrammeViewSet
from .views_import import ImportFromChunksView  

router = DefaultRouter()
router.register(r'programmes', ProgrammeViewSet, basename='programme')

urlpatterns = router.urls + [
    path('import-from-chunks/', ImportFromChunksView.as_view(), name='import-from-chunks'),
]
# history/views.py
from rest_framework import viewsets
from .models import Milestone
from .serializers import MilestoneSerializer

# A ViewSet replaces ALL 5 CRUD routes in one class
class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
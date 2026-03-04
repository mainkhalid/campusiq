from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import FAQ
from .serializers import FAQSerializer

class FAQViewSet(viewsets.ModelViewSet):
    serializer_class = FAQSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']  # GET /api/faq/faqs/?status=published

    def get_queryset(self):
        # Public users only see published FAQs
        # Authenticated admins see all
        if self.request.user.is_authenticated:
            return FAQ.objects.all()
        return FAQ.objects.filter(status='published')
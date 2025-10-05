from rest_framework import viewsets
from .models import AboutContent
from .serializers import AboutSerializer

class AboutViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AboutSerializer

    def get_queryset(self):
        return AboutContent.objects.order_by('-updated_at')[:1]

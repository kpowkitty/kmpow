from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Blog, Galaxy
from .serializers import BlogListSerializer, BlogSerializer, GalaxySerializer


class BlogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Blog.objects.all()
    lookup_field = 'slug'

    def get_serializer_class(self):
        return BlogListSerializer if self.action == 'list' else BlogSerializer


class GalaxyView(APIView):
    """Everything the galaxy renderer needs in one request: size, seed, rules, origin, placed stars, regions."""

    def get(self, request):
        return Response(GalaxySerializer(Galaxy.objects.get()).data)

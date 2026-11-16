from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Prefetch
from django.db.models.functions import Collate

from .models import WorkExperience, Project, Education, TechCategory, TechTag
from .serializers import (
    WorkExperienceSerializer,
    ProjectSerializer,
    EducationSerializer,
    ConsolidatedTechSerializer
)

# Standard CRUD ViewSets
class WorkExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkExperience.objects.prefetch_related('tech_tags').all()
    serializer_class = WorkExperienceSerializer
    permission_classes = [AllowAny]

class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.prefetch_related('tech_tags').all()
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

class EducationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Education.objects.prefetch_related('tech_tags').all()
    serializer_class = EducationSerializer
    permission_classes = [AllowAny]

# Consolidated Tech Stack endpoint
class ConsolidatedTechList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        alphabetical = Prefetch('tech_tags', queryset=TechTag.objects.order_by(Collate('name', 'C')))
        categories = TechCategory.objects.filter(tech_tags__isnull=False).distinct().prefetch_related(alphabetical)
        data = [{'category': c.name, 'tags': [t.name for t in c.tech_tags.all()]} for c in categories]
        return Response(ConsolidatedTechSerializer(instance=data, many=True).data)

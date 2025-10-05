from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from collections import defaultdict

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
        category_map = defaultdict(set)
        for category in TechCategory.objects.prefetch_related('tech_tags').all():
            for tag in category.tech_tags.all():
                category_map[category.name].add(tag.name)

        data = [{"category": cat_name, "tags": sorted(list(tags))} for cat_name, tags in category_map.items()]
        serializer = ConsolidatedTechSerializer(instance=data, many=True)
        return Response(serializer.data)

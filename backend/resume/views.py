from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from collections import defaultdict

from .models import WorkExperience, Project, Education, SkillCategory, TechCategory, TechTag
from .serializers import (
    WorkExperienceSerializer,
    ProjectSerializer,
    EducationSerializer,
    SkillCategorySerializer,
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

class SkillCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer
    permission_classes = [AllowAny]

# Consolidated Tech Stack endpoint
class ConsolidatedTechList(generics.ListAPIView):
    serializer_class = ConsolidatedTechSerializer

    def get_queryset(self):
        category_map = defaultdict(set)

        # Database-driven tech tags
        for category in TechCategory.objects.prefetch_related('tech_tags').all():
            for tag in category.tech_tags.all():
                category_map[category.name].add(tag.name)

        # User-specified tags from SkillCategory
        for skill_cat in SkillCategory.objects.all():
            items = [tag.strip() for tag in skill_cat.items.split(',') if tag.strip()]
            if skill_cat.category:
                category_map[skill_cat.category].update(items)
            else:
                category_map["Uncategorized"].update(items)

        # Convert to list of dicts
        consolidated = [
            {"category": cat_name, "tags": sorted(list(tags))}
            for cat_name, tags in category_map.items()
        ]
        return consolidated

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

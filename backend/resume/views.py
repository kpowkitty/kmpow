from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import WorkExperience, Project, Education, SkillCategory
from .serializers import (
    WorkExperienceSerializer, 
    ProjectSerializer, 
    EducationSerializer, 
    SkillCategorySerializer
)


class WorkExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkExperience.objects.all()
    serializer_class = WorkExperienceSerializer
    permission_classes = [AllowAny]


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]


class EducationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer
    permission_classes = [AllowAny]


class SkillCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer
    permission_classes = [AllowAny]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkExperienceViewSet,
    ProjectViewSet,
    EducationViewSet,
    SkillCategoryViewSet
)

router = DefaultRouter()
router.register(r'work-experience', WorkExperienceViewSet, basename='work-experience')
router.register(r'projects', ProjectViewSet, basename='projects')
router.register(r'education', EducationViewSet, basename='education')
router.register(r'skills', SkillCategoryViewSet, basename='skills')

urlpatterns = [
    path('', include(router.urls)),
]

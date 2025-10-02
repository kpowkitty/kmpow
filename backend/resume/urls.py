from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkExperienceViewSet,
    ProjectViewSet,
    EducationViewSet,
    SkillCategoryViewSet,
    ConsolidatedTechList
)

router = DefaultRouter()
router.register(r'work', WorkExperienceViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'education', EducationViewSet)
router.register(r'skills', SkillCategoryViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/tech-stack/', ConsolidatedTechList.as_view(), name='consolidated-tech-stack'),
]

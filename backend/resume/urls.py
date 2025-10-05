from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkExperienceViewSet,
    ProjectViewSet,
    EducationViewSet,
    ConsolidatedTechList
)

router = DefaultRouter()
router.register(r'work-experience', WorkExperienceViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'education', EducationViewSet)

urlpatterns = router.urls

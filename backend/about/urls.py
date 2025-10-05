from rest_framework.routers import DefaultRouter
from .views import AboutViewSet

router = DefaultRouter()
router.register(r'', AboutViewSet, basename='about')

urlpatterns = router.urls

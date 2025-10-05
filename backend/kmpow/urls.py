from django.contrib import admin
from django.urls import path, include
from resume.views import ConsolidatedTechList

urlpatterns = [
    path('admin/', admin.site.urls),
    path('contact/', include('contact.urls')),
    path('api/resume/', include('resume.urls')),
    path('api/about/', include('about.urls')),
    path('api/blogs/', include('blog.urls')),
    path('api/tech-stack/', ConsolidatedTechList.as_view(), name='consolidated-tech-stack'),
]

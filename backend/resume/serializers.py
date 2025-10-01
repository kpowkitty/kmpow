from rest_framework import serializers
from .models import WorkExperience, Project, Education, SkillCategory


class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = ['id', 'company', 'title', 'subtitle', 'start_date', 'end_date', 
                  'links', 'description', 'order']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'url', 'tech_stack', 'description', 'order']


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'school', 'degree', 'gpa', 'graduation_date', 
                  'additional_info', 'order']


class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = ['id', 'category', 'items', 'order']

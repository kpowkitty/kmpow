from rest_framework import serializers
from .models import WorkExperience, Project, Education, SkillCategory, TechTag, TechCategory

class TechTagSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', default=None)

    class Meta:
        model = TechTag
        fields = ['id', 'name', 'category']


class WorkExperienceSerializer(serializers.ModelSerializer):
    tech_tags = TechTagSerializer(many=True, read_only=True)

    class Meta:
        model = WorkExperience
        fields = ['id', 'company', 'title', 'subtitle', 'start_date', 'end_date',
                  'links', 'description', 'order', 'tech_tags']


class ProjectSerializer(serializers.ModelSerializer):
    tech_tags = TechTagSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'url', 'description', 'order', 'tech_tags']


class EducationSerializer(serializers.ModelSerializer):
    tech_tags = TechTagSerializer(many=True, read_only=True)

    class Meta:
        model = Education
        fields = ['id', 'school', 'degree', 'gpa', 'graduation_date',
                  'additional_info', 'order', 'tech_tags']


class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = ['id', 'category', 'items', 'order']


class ConsolidatedTechSerializer(serializers.Serializer):
    category = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())

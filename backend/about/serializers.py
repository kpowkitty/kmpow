from rest_framework import serializers
from .models import AboutContent

class AboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutContent
        fields = ['title', 'section_1', 'section_2', 'section_3']


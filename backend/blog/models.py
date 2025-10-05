from django.db import models
from django.core.serializers.json import DjangoJSONEncoder

class Blog(models.Model):
    id = models.CharField(max_length=50, primary_key=True)  # e.g., "star-1"
    category = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField()
    slug = models.SlugField(unique=True)
    position = models.JSONField(encoder=DjangoJSONEncoder, null=True, blank=True)  # {"x": 40, "y": 63}
    content = models.TextField()

    def __str__(self):
        return f"{self.title} ({self.category})"

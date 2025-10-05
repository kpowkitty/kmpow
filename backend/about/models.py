from django.db import models

class AboutContent(models.Model):
    title = models.CharField(max_length=200, default="About Me")
    section_1 = models.TextField()
    section_2 = models.TextField(blank=True, null=True)
    section_3 = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


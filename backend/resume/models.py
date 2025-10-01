from django.db import models
from django.db import models

class WorkExperience(models.Model):
    company = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    start_date = models.CharField(max_length=50)
    end_date = models.CharField(max_length=50)
    links = models.TextField(blank=True, null=True)
    description = models.TextField()  # Markdown content
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        verbose_name_plural = "Work Experiences"
    
    def __str__(self):
        return f"{self.title} at {self.company}"


class Project(models.Model):
    name = models.CharField(max_length=200)
    url = models.URLField()
    tech_stack = models.TextField()
    description = models.TextField()  # Markdown content
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name


class Education(models.Model):
    school = models.CharField(max_length=200)
    degree = models.CharField(max_length=300)
    gpa = models.CharField(max_length=100, blank=True, null=True)
    graduation_date = models.CharField(max_length=100)
    additional_info = models.TextField(blank=True, null=True)  # Markdown content
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        verbose_name_plural = "Education"
    
    def __str__(self):
        return f"{self.degree} - {self.school}"


class SkillCategory(models.Model):
    category = models.CharField(max_length=100)
    items = models.TextField()  # Comma-separated list
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        verbose_name_plural = "Skill Categories"
    
    def __str__(self):
        return self.category

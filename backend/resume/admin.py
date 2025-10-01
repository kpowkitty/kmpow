from django.contrib import admin
from .models import WorkExperience, Project, Education, SkillCategory


@admin.register(WorkExperience)
class WorkExperienceAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'start_date', 'end_date', 'order')
    list_editable = ('order',)
    search_fields = ('title', 'company', 'description')
    list_filter = ('company',)
    ordering = ('order',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'title', 'subtitle')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Content', {
            'fields': ('description', 'links')
        }),
        ('Display Order', {
            'fields': ('order',)
        }),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'order')
    list_editable = ('order',)
    search_fields = ('name', 'description', 'tech_stack')
    ordering = ('order',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'url', 'tech_stack')
        }),
        ('Content', {
            'fields': ('description',)
        }),
        ('Display Order', {
            'fields': ('order',)
        }),
    )


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('degree', 'school', 'graduation_date', 'order')
    list_editable = ('order',)
    search_fields = ('degree', 'school')
    ordering = ('order',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school', 'degree', 'graduation_date')
        }),
        ('Additional Details', {
            'fields': ('gpa', 'additional_info')
        }),
        ('Display Order', {
            'fields': ('order',)
        }),
    )


@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ('category', 'items', 'order')
    list_editable = ('order',)
    search_fields = ('category', 'items')
    ordering = ('order',)
    
    fieldsets = (
        ('Category Information', {
            'fields': ('category', 'items')
        }),
        ('Display Order', {
            'fields': ('order',)
        }),
    )
    
    help_texts = {
        'items': 'Enter items as comma-separated values (e.g., Python, JavaScript, Django)'
    }

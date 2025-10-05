from django.contrib import admin
from .models import WorkExperience, Project, Education, TechTag, TechCategory


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
            'fields': ('description', 'links', 'tech_tags')
        }),
        ('Display Order', {
            'fields': ('order',)
        }),
    )
    filter_horizontal = ('tech_tags',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'order')
    list_editable = ('order',)
    search_fields = ('name', 'description')
    ordering = ('order',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'url')
        }),
        ('Content', {
            'fields': ('description', 'tech_tags')
        }),
        ('Display Order', {
            'fields': ('order',)
        }),
    )
    filter_horizontal = ('tech_tags',)


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


@admin.register(TechCategory)
class TechCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')
    list_editable = ('order',)
    search_fields = ('name',)


@admin.register(TechTag)
class TechTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)

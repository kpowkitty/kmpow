from django.contrib import admin
from django import forms
from .models import Blog

class BlogAdminForm(forms.ModelForm):
    class Meta:
        model = Blog
        fields = "__all__"
        widgets = {
            "content": forms.Textarea(attrs={"rows": 20, "cols": 100}),  # large text area for Markdown
        }

@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    form = BlogAdminForm
    list_display = ('id', 'title', 'category', 'slug', 'position')
    search_fields = ('title', 'category', 'slug')
    list_filter = ('category',)


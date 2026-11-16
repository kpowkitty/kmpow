from rest_framework import serializers
from .models import Blog, Galaxy, Region

# position stays until the WebGL galaxy replaces Stars.js.
LIST_FIELDS = ["id", "category", "title", "description", "slug", "position"]


class BlogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = [*LIST_FIELDS, "content"]


class BlogListSerializer(serializers.ModelSerializer):
    """No content: the list never needs every post's full body."""
    class Meta:
        model = Blog
        fields = LIST_FIELDS


class StarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = ["id", "slug", "title", "description", "category", "order", "grid_col", "grid_row"]


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["category", "box_col", "box_row", "width", "height"]


class GalaxySerializer(serializers.ModelSerializer):
    """The Galaxy row under its model field names, plus every placed star and every region."""
    stars = serializers.SerializerMethodField()
    regions = serializers.SerializerMethodField()

    class Meta:
        model = Galaxy
        exclude = ["id"]

    def get_stars(self, galaxy):
        return StarSerializer(Blog.objects.filter(grid_col__isnull=False, grid_row__isnull=False), many=True).data

    def get_regions(self, galaxy):
        return RegionSerializer(Region.objects.all(), many=True).data

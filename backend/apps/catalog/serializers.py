from rest_framework import serializers

from .models import Category, Modifier, Product


class PublicCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("slug", "name", "sort_order")


class PublicProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)
    category = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "category",
            "description",
            "ingredients",
            "price",
            "original_price",
            "image_url",
            "badge",
            "is_available",
            "updated_at",
        )


class PosCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name", "sort_order")


class PosProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "category_id",
            "category_name",
            "name",
            "price",
            "updated_at",
            "image_url",
        )


class PosModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modifier
        fields = ("id", "name", "price", "modifier_type", "updated_at")

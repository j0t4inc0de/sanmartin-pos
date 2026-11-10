from rest_framework import serializers
from django.utils.text import slugify

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
        fields = ("id", "slug", "name", "sort_order", "updated_at")


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


def _unique_slug(model, name: str, max_length: int) -> str:
    base = slugify(name)[:max_length].strip("-") or "item"
    candidate = base
    suffix_number = 2
    while model.objects.filter(slug=candidate).exists():
        suffix = f"-{suffix_number}"
        candidate = f"{base[:max_length - len(suffix)].rstrip('-')}{suffix}"
        suffix_number += 1
    return candidate


class ManageCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name", "sort_order", "is_active", "updated_at")
        read_only_fields = ("id", "slug", "updated_at")

    def create(self, validated_data):
        validated_data["slug"] = _unique_slug(Category, validated_data["name"], 50)
        return super().create(validated_data)


class ManageProductSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    ingredients = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
    )

    class Meta:
        model = Product
        fields = (
            "id", "slug", "category_id", "category_name", "name", "description",
            "ingredients", "price", "original_price", "image_url", "badge",
            "is_available", "is_active", "updated_at",
        )
        read_only_fields = ("id", "slug", "category_name", "updated_at")

    def create(self, validated_data):
        validated_data["slug"] = _unique_slug(Product, validated_data["name"], 100)
        return super().create(validated_data)


class ManageModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modifier
        fields = ("id", "name", "price", "modifier_type", "is_available", "is_active", "updated_at")
        read_only_fields = ("id", "updated_at")

from django.contrib import admin

from .models import Category, Modifier, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "category", "price", "is_available", "is_active")
    list_filter = ("category", "is_available", "is_active")
    search_fields = ("name", "slug", "description")
    list_editable = ("price", "is_available", "is_active")


@admin.register(Modifier)
class ModifierAdmin(admin.ModelAdmin):
    list_display = ("name", "modifier_type", "price", "is_available", "is_active")
    list_filter = ("modifier_type", "is_available", "is_active")
    search_fields = ("name",)

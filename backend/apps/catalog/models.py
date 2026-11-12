from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50, unique=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        ordering = ["sort_order", "id"]
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ingredients = models.JSONField(default=list, blank=True)
    price = models.PositiveIntegerField()
    original_price = models.PositiveIntegerField(null=True, blank=True)
    image_url = models.CharField(max_length=500, blank=True)
    badge = models.CharField(max_length=50, blank=True)
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["category__sort_order", "category_id", "name", "id"]
        indexes = [
            models.Index(fields=["is_active", "is_available"], name="product_active_available_idx"),
            models.Index(fields=["updated_at"], name="product_updated_at_idx"),
        ]
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self) -> str:
        return self.name


class Modifier(models.Model):
    class ModifierType(models.TextChoices):
        EXTRA_PAGO = "EXTRA_PAGO", "Extra con costo"
        EXCLUSION_COCINA = "EXCLUSION_COCINA", "Exclusión para cocina"

    name = models.CharField(max_length=50)
    price = models.PositiveIntegerField(default=0)
    modifier_type = models.CharField(
        max_length=20,
        choices=ModifierType.choices,
        default=ModifierType.EXTRA_PAGO,
    )
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "modifiers"
        indexes = [
            models.Index(fields=["is_active", "is_available"], name="modifier_active_available_idx"),
            models.Index(fields=["updated_at"], name="modifier_updated_at_idx"),
        ]
        verbose_name = "Modificador"
        verbose_name_plural = "Modificadores"

    def __str__(self) -> str:
        return self.name

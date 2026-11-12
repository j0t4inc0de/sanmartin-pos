from pathlib import Path
from uuid import uuid4

from django.core.files.storage import default_storage
from django.db.models import QuerySet
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView

from apps.sales.permissions import CanOperatePOS

from .models import Category, Modifier, Product
from .serializers import (
    PosCategorySerializer,
    PosModifierSerializer,
    PosProductSerializer,
    ManageCategorySerializer,
    ManageModifierSerializer,
    ManageProductSerializer,
    PublicCategorySerializer,
    PublicProductSerializer,
)


class PublicMenuView(APIView):
    """Devuelve la carta vigente sin exponer el catálogo administrativo."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        products: QuerySet[Product] = (
            Product.objects.filter(
                category__is_active=True,
                is_active=True,
                is_available=True,
            )
            .select_related("category")
            .order_by("category__sort_order", "category_id", "name", "id")
        )
        categories: QuerySet[Category] = (
            Category.objects.filter(
                is_active=True,
                id__in=products.values("category_id"),
            )
            .order_by("sort_order", "id")
        )

        return Response(
            {
                "generated_at": timezone.now(),
                "categories": PublicCategorySerializer(categories, many=True).data,
                "products": PublicProductSerializer(products, many=True).data,
            },
            headers={"Cache-Control": "no-store"},
        )


def _deduplicate_modifiers(modifiers_iterable):
    """Elimina modificadores duplicados normalizando por nombre."""
    seen = {}
    for mod in modifiers_iterable:
        key = mod.name.strip().lower()
        if key not in seen or mod.id > seen[key].id:
            seen[key] = mod
    return sorted(seen.values(), key=lambda m: (m.modifier_type, m.name, m.id))


class PosCatalogView(APIView):
    """Entrega el catálogo completo o sus cambios desde un cursor ISO-8601."""

    permission_classes = [IsAuthenticated, CanOperatePOS]

    def get(self, request):
        updated_after_value = request.query_params.get("updated_after")
        updated_after = None
        if updated_after_value is not None:
            updated_after = parse_datetime(updated_after_value)
            if updated_after is None or timezone.is_naive(updated_after):
                return Response(
                    {"detail": "updated_after debe ser una fecha ISO-8601 con zona horaria."},
                    status=400,
                )

        generated_at = timezone.now()
        if updated_after is not None:
            changed_products = list(
                Product.objects.filter(updated_at__gte=updated_after)
                .select_related("category")
                .order_by("id")
            )
            changed_modifiers = list(
                Modifier.objects.filter(updated_at__gte=updated_after).order_by("id")
            )
            changed_categories = list(
                Category.objects.filter(updated_at__gte=updated_after).order_by("id")
            )

            affected_category_ids = {
                product.category_id for product in changed_products
            } | {category.id for category in changed_categories}
            categories = Category.objects.filter(
                id__in=affected_category_ids,
                is_active=True,
                products__is_active=True,
                products__is_available=True,
            ).distinct().order_by("sort_order", "id")
            available_category_ids = set(
                Category.objects.filter(
                    is_active=True,
                    products__is_active=True,
                    products__is_available=True,
                ).values_list("id", flat=True).distinct()
            )
            all_category_ids = set(Category.objects.values_list("id", flat=True))
            # Also prune a formerly non-empty category when its last product
            # was moved or deleted, even if the category itself did not change.
            removed_category_ids = all_category_ids - available_category_ids

            products = [
                product for product in changed_products
                if product.is_active
                and product.is_available
                and product.category.is_active
            ]
            removed_product_ids = {
                product.id for product in changed_products if product not in products
            }
            # Deactivating a category also removes its unchanged products from
            # the local POS catalog.
            inactive_category_ids = {
                category.id for category in changed_categories if not category.is_active
            }
            if inactive_category_ids:
                removed_product_ids.update(
                    Product.objects.filter(category_id__in=inactive_category_ids)
                    .values_list("id", flat=True)
                )

            modifiers = _deduplicate_modifiers([
                modifier for modifier in changed_modifiers
                if modifier.is_active and modifier.is_available
            ])
            removed_modifier_ids = {
                modifier.id for modifier in changed_modifiers if modifier not in modifiers
            }

            return Response(
                {
                    "generated_at": generated_at,
                    "categories": PosCategorySerializer(categories, many=True).data,
                    "products": PosProductSerializer(products, many=True).data,
                    "modifiers": PosModifierSerializer(modifiers, many=True).data,
                    "removed": {
                        "categories": sorted(removed_category_ids),
                        "products": sorted(removed_product_ids),
                        "modifiers": sorted(removed_modifier_ids),
                    },
                },
                headers={"Cache-Control": "no-store"},
            )

        products: QuerySet[Product] = (
            Product.objects.filter(
                category__is_active=True,
                is_active=True,
                is_available=True,
            )
            .select_related("category")
            .order_by("category__sort_order", "category_id", "name", "id")
        )
        categories: QuerySet[Category] = Category.objects.filter(
            is_active=True,
            id__in=products.values("category_id"),
        ).order_by("sort_order", "id")
        modifiers_qs: QuerySet[Modifier] = Modifier.objects.filter(
            is_active=True,
            is_available=True,
        ).order_by("modifier_type", "name", "id")
        modifiers = _deduplicate_modifiers(modifiers_qs)

        return Response(
            {
                "generated_at": generated_at,
                "categories": PosCategorySerializer(categories, many=True).data,
                "products": PosProductSerializer(products, many=True).data,
                "modifiers": PosModifierSerializer(modifiers, many=True).data,
            },
            headers={"Cache-Control": "no-store"},
        )


class ManageCatalogPermissionMixin:
    permission_classes = [IsAuthenticated, CanOperatePOS]


class ManageProductImageUploadView(ManageCatalogPermissionMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get("image")
        if image is None:
            return Response({"image": "Selecciona una imagen para subir."}, status=400)
        if image.size <= 0 or image.size > 5 * 1024 * 1024:
            return Response({"image": "La imagen debe pesar entre 1 byte y 5 MB."}, status=400)

        extension = Path(image.name).suffix.lower()
        signatures = {
            ".jpg": lambda data: data.startswith(b"\xff\xd8\xff"),
            ".jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
            ".png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
            ".webp": lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP",
        }
        validator = signatures.get(extension)
        header = image.read(12)
        image.seek(0)
        if validator is None or not validator(header):
            return Response({"image": "Usa una imagen JPEG, PNG o WEBP válida."}, status=400)

        stored_path = default_storage.save(
            f"catalog-products/{uuid4().hex}{extension}", image
        )
        return Response({"image_url": default_storage.url(stored_path)}, status=201)


class ManageCategoryListView(ManageCatalogPermissionMixin, ListCreateAPIView):
    serializer_class = ManageCategorySerializer
    queryset = Category.objects.all().order_by("sort_order", "name", "id")


class ManageCategoryDetailView(ManageCatalogPermissionMixin, RetrieveUpdateAPIView):
    serializer_class = ManageCategorySerializer
    queryset = Category.objects.all()


class ManageProductListView(ManageCatalogPermissionMixin, ListCreateAPIView):
    serializer_class = ManageProductSerializer
    queryset = Product.objects.select_related("category").all().order_by("category__sort_order", "category_id", "name", "id")


class ManageProductDetailView(ManageCatalogPermissionMixin, RetrieveUpdateAPIView):
    serializer_class = ManageProductSerializer
    queryset = Product.objects.select_related("category").all()


class ManageModifierListView(ManageCatalogPermissionMixin, ListCreateAPIView):
    serializer_class = ManageModifierSerializer
    queryset = Modifier.objects.all().order_by("modifier_type", "name", "id")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        deduped = _deduplicate_modifiers(queryset)
        serializer = self.get_serializer(deduped, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        name = request.data.get("name", "").strip()
        if name:
            existing = Modifier.objects.filter(name__iexact=name).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class ManageModifierDetailView(ManageCatalogPermissionMixin, RetrieveUpdateAPIView):
    serializer_class = ManageModifierSerializer
    queryset = Modifier.objects.all()

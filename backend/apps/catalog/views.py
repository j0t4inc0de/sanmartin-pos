from django.db.models import QuerySet
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sales.permissions import CanOperatePOS

from .models import Category, Modifier, Product
from .serializers import (
    PosCategorySerializer,
    PosModifierSerializer,
    PosProductSerializer,
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

            modifiers = [
                modifier for modifier in changed_modifiers
                if modifier.is_active and modifier.is_available
            ]
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
        modifiers: QuerySet[Modifier] = Modifier.objects.filter(
            is_active=True,
            is_available=True,
        ).order_by("modifier_type", "name", "id")

        return Response(
            {
                "generated_at": generated_at,
                "categories": PosCategorySerializer(categories, many=True).data,
                "products": PosProductSerializer(products, many=True).data,
                "modifiers": PosModifierSerializer(modifiers, many=True).data,
            },
            headers={"Cache-Control": "no-store"},
        )

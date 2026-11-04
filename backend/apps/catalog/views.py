from django.db.models import QuerySet
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
    """Entrega al POS los identificadores internos y modificadores autorizados."""

    permission_classes = [IsAuthenticated, CanOperatePOS]

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
                "generated_at": timezone.now(),
                "categories": PosCategorySerializer(categories, many=True).data,
                "products": PosProductSerializer(products, many=True).data,
                "modifiers": PosModifierSerializer(modifiers, many=True).data,
            },
            headers={"Cache-Control": "no-store"},
        )

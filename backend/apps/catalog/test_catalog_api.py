from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Category, Modifier, Product


User = get_user_model()


class PosCatalogDeltaApiTests(APITestCase):
    def setUp(self):
        operator = User.objects.create_user(
            username="operador_catalogo_delta",
            password="clave-segura-de-catalogo-2026",
        )
        permission = Permission.objects.get(
            content_type__app_label="sales",
            codename="can_operate_pos",
        )
        operator.user_permissions.add(permission)
        self.client.force_authenticate(user=operator)
        self.category = Category.objects.create(name="Sandwiches", slug="sandwiches")
        self.product = Product.objects.create(
            category=self.category,
            name="Sándwich de prueba",
            slug="sandwich-prueba-delta",
            price=5000,
        )
        self.modifier = Modifier.objects.create(name="Queso extra", price=500)

    def get_delta(self, cursor):
        return self.client.get(
            "/api/pos/catalog/",
            {"updated_after": cursor.isoformat()},
        )

    def test_full_catalog_remains_available_without_cursor(self):
        response = self.client.get("/api/pos/catalog/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["products"]], [self.product.id])
        self.assertIn("updated_at", response.data["categories"][0])
        self.assertNotIn("removed", response.data)

    def test_delta_returns_changed_records_and_explicit_removals(self):
        cursor = timezone.now() - timedelta(seconds=1)
        self.product.name = "Sándwich actualizado"
        self.product.price = 6000
        self.product.save()
        self.modifier.is_available = False
        self.modifier.save()

        response = self.get_delta(cursor)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["products"]], [self.product.id])
        self.assertEqual(response.data["products"][0]["name"], "Sándwich actualizado")
        self.assertEqual([item["id"] for item in response.data["categories"]], [self.category.id])
        self.assertEqual(response.data["modifiers"], [])
        self.assertEqual(response.data["removed"]["modifiers"], [self.modifier.id])
        self.assertEqual(response.data["removed"]["products"], [])

    def test_inactive_category_removes_it_and_its_cached_products(self):
        cursor = timezone.now() - timedelta(seconds=1)
        self.category.is_active = False
        self.category.save()

        response = self.get_delta(cursor)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["categories"], [])
        self.assertEqual(response.data["products"], [])
        self.assertEqual(response.data["removed"]["categories"], [self.category.id])
        self.assertEqual(response.data["removed"]["products"], [self.product.id])

    def test_unavailable_last_product_also_removes_empty_category(self):
        cursor = timezone.now() - timedelta(seconds=1)
        self.product.is_available = False
        self.product.save()

        response = self.get_delta(cursor)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["categories"], [])
        self.assertEqual(response.data["removed"]["categories"], [self.category.id])
        self.assertEqual(response.data["removed"]["products"], [self.product.id])

    def test_delta_cursor_requires_timezone(self):
        response = self.client.get(
            "/api/pos/catalog/",
            {"updated_after": "2026-11-10T12:00:00"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("ISO-8601", response.data["detail"])

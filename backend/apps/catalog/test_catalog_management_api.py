from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Category, Modifier, Product


User = get_user_model()


class PosCatalogManagementApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.operator = User.objects.create_user(
            username="operador_gestion_catalogo",
            password="clave-segura-gestion-catalogo-2026",
        )
        permission = Permission.objects.get(
            content_type__app_label="sales",
            codename="can_operate_pos",
        )
        self.operator.user_permissions.add(permission)
        self.client.force_authenticate(user=self.operator)
        self.category = Category.objects.create(name="Sándwiches", slug="sandwiches")

    def test_operator_can_create_product_and_public_menu_reflects_it(self):
        response = self.client.post(
            "/api/pos/catalog/manage/products/",
            {
                "category_id": self.category.id,
                "name": "Sándwich de prueba",
                "description": "Descripción del producto",
                "ingredients": ["Pan", "Tomate"],
                "price": 6500,
                "original_price": None,
                "image_url": "/productos/prueba.jpg",
                "badge": "Nuevo",
                "is_available": True,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["slug"], "sandwich-de-prueba")
        self.assertEqual(response.data["ingredients"], ["Pan", "Tomate"])
        menu = self.client.get("/api/menu/")
        self.assertEqual(menu.status_code, 200)
        self.assertEqual(menu.data["products"][0]["price"], 6500)
        self.assertEqual(menu.data["products"][0]["image_url"], "/productos/prueba.jpg")

    def test_product_updates_are_restricted_to_patch_and_can_be_deactivated(self):
        product = Product.objects.create(
            category=self.category,
            name="Producto existente",
            slug="producto-existente",
            price=5000,
        )
        response = self.client.patch(
            f"/api/pos/catalog/manage/products/{product.id}/",
            {"price": 7000, "is_available": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.price, 7000)
        self.assertFalse(product.is_available)
        self.assertEqual(self.client.get("/api/menu/").data["products"], [])

    def test_operator_can_manage_categories_and_modifiers_without_hard_delete(self):
        category_response = self.client.post(
            "/api/pos/catalog/manage/categories/",
            {"name": "Sándwiches", "sort_order": 2, "is_active": True},
            format="json",
        )
        self.assertEqual(category_response.status_code, 201)
        self.assertEqual(category_response.data["slug"], "sandwiches-2")

        modifier_response = self.client.post(
            "/api/pos/catalog/manage/modifiers/",
            {"name": "Queso extra", "price": 800, "modifier_type": "EXTRA_PAGO", "is_available": True, "is_active": True},
            format="json",
        )
        self.assertEqual(modifier_response.status_code, 201)
        modifier_id = modifier_response.data["id"]
        update = self.client.patch(
            f"/api/pos/catalog/manage/modifiers/{modifier_id}/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(update.status_code, 200)
        self.assertFalse(update.data["is_active"])
        self.assertEqual(self.client.delete(f"/api/pos/catalog/manage/modifiers/{modifier_id}/").status_code, 405)

    def test_catalog_management_requires_pos_permission(self):
        unauthorized = User.objects.create_user(
            username="sin_permiso_catalogo",
            password="otra-clave-segura-2026",
        )
        self.client.force_authenticate(user=unauthorized)
        response = self.client.get("/api/pos/catalog/manage/products/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Product.objects.count(), 0)

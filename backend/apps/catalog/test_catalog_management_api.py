from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.sales.models import CashShift, Order, OrderItem
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

    def test_operator_can_upload_a_product_image(self):
        image = SimpleUploadedFile(
            "producto.png",
            b"\x89PNG\r\n\x1a\n" + b"test-image-data",
            content_type="image/png",
        )
        response = self.client.post(
            "/api/pos/catalog/manage/product-images/",
            {"image": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["image_url"].startswith("/media/catalog-products/"))

    def test_product_image_upload_rejects_unsupported_content(self):
        image = SimpleUploadedFile(
            "producto.svg", b"<svg></svg>", content_type="image/svg+xml"
        )
        response = self.client.post(
            "/api/pos/catalog/manage/product-images/",
            {"image": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)

    def test_operator_can_delete_product_without_orders_hard_deletes(self):
        product = Product.objects.create(
            category=self.category,
            name="Producto sin ventas",
            slug="producto-sin-ventas",
            price=3500,
        )
        response = self.client.delete(f"/api/pos/catalog/manage/products/{product.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Product.objects.filter(id=product.id).exists())

        list_response = self.client.get("/api/pos/catalog/manage/products/")
        self.assertEqual(list_response.status_code, 200)
        self.assertNotIn(product.id, [p["id"] for p in list_response.data])

    def test_operator_can_delete_product_with_orders_soft_deletes_and_preserves_history(self):
        product = Product.objects.create(
            category=self.category,
            name="Producto histórico",
            slug="producto-historico",
            price=4500,
            is_active=True,
            is_available=True,
        )
        shift = CashShift.objects.create(
            user=self.operator,
            opened_at=timezone.now() - timedelta(hours=1),
            initial_cash=20000,
        )
        order = Order.objects.create(
            cash_shift=shift,
            shift_order_number=1,
            created_at=timezone.now() - timedelta(minutes=30),
            consumption_type=Order.ConsumptionType.PARA_SERVIR,
            payment_method=Order.PaymentMethod.TRANSBANK,
            subtotal=4500,
            delivery_fee=0,
            total_amount=4500,
        )
        item = OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            quantity=1,
            unit_price=product.price,
        )

        cursor = timezone.now() - timedelta(seconds=1)
        response = self.client.delete(f"/api/pos/catalog/manage/products/{product.id}/")
        self.assertEqual(response.status_code, 204)

        product.refresh_from_db()
        self.assertTrue(product.is_deleted)
        self.assertIsNotNone(product.deleted_at)
        self.assertFalse(product.is_active)
        self.assertFalse(product.is_available)
        self.assertTrue(product.slug.startswith(f"deleted-{product.id}-"))

        # Verify historical integrity: Order and OrderItem still exist and are linked
        item.refresh_from_db()
        self.assertEqual(item.product_id, product.id)
        self.assertEqual(item.order_id, order.id)

        # Excluded from management list
        list_response = self.client.get("/api/pos/catalog/manage/products/")
        self.assertEqual(list_response.status_code, 200)
        self.assertNotIn(product.id, [p["id"] for p in list_response.data])

        # Excluded from public menu
        menu = self.client.get("/api/menu/")
        self.assertEqual(menu.status_code, 200)
        self.assertNotIn(product.slug, [p["id"] for p in menu.data["products"]])

        # Reported in POS delta synchronization as removed
        delta = self.client.get("/api/pos/catalog/", {"updated_after": cursor.isoformat()})
        self.assertEqual(delta.status_code, 200)
        self.assertIn(product.id, delta.data["removed"]["products"])

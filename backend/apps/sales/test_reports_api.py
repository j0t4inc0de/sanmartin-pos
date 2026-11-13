from datetime import datetime
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from rest_framework.test import APIClient, APITestCase

from apps.catalog.models import Category, Product
from .models import CashShift, Order, OrderItem


User = get_user_model()
CHILE = ZoneInfo("America/Santiago")


class SalesReportApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reportes", password="clave-pruebas-2026")
        permission = Permission.objects.get(content_type__app_label="sales", codename="can_operate_pos")
        self.user.user_permissions.add(permission)
        self.client.force_authenticate(user=self.user)
        self.shift = CashShift.objects.create(
            user=self.user,
            opened_at=datetime(2026, 1, 15, 9, 0, tzinfo=CHILE),
            closed_at=datetime(2026, 1, 15, 18, 0, tzinfo=CHILE),
            initial_cash=20000,
            final_cash=25000,
            counted_cash=25000,
        )
        category = Category.objects.create(name="Sandwiches", slug="sandwiches-report")
        self.product = Product.objects.create(category=category, name="Italiano", slug="italiano-report", price=5000)

    def create_order(self, number, at, amount, *, status=Order.Status.COMPLETADA, method=Order.PaymentMethod.EFECTIVO):
        return Order.objects.create(
            cash_shift=self.shift,
            shift_order_number=number,
            created_at=at,
            payment_method=method,
            subtotal=amount,
            total_amount=amount,
            amount_paid=amount if method == Order.PaymentMethod.EFECTIVO else None,
            change_given=0 if method == Order.PaymentMethod.EFECTIVO else None,
            status=status,
        )

    def test_reporte_diario_resume_ventas_pagos_anulaciones_productos_y_horas(self):
        morning = self.create_order(1, datetime(2026, 1, 15, 10, 15, tzinfo=CHILE), 5001)
        afternoon = self.create_order(2, datetime(2026, 1, 15, 17, 45, tzinfo=CHILE), 7000, method=Order.PaymentMethod.TRANSBANK)
        cancelled = self.create_order(3, datetime(2026, 1, 15, 12, 0, tzinfo=CHILE), 3000, status=Order.Status.ANULADA)
        OrderItem.objects.create(order=morning, product=self.product, product_name="Italiano", quantity=2, unit_price=5000)
        OrderItem.objects.create(order=afternoon, product=self.product, product_name="Italiano", quantity=1, unit_price=5000)
        OrderItem.objects.create(order=cancelled, product=self.product, product_name="Italiano", quantity=8, unit_price=5000)

        response = self.client.get("/api/reports/sales/?period=day&date=2026-01-15")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sales"], {"total_amount": 12001, "order_count": 2, "average_ticket": 6001})
        self.assertEqual(response.data["cancellations"], {"order_count": 1, "total_amount": 3000})
        self.assertEqual(response.data["top_products"], [{"product_id": self.product.id, "product_name": "Italiano", "quantity": 3}])
        self.assertEqual([item["hour"] for item in response.data["rush_hours"]], [10, 17])
        self.assertEqual([item["key"] for item in response.data["time_series"]], ["10", "17"])
        self.assertEqual(len(response.data["payments"]), 2)
        self.assertEqual(len(response.data["shifts"]), 1)

    def test_reporte_mensual_limita_ventas_al_mes_seleccionado(self):
        self.create_order(1, datetime(2026, 1, 31, 23, 59, tzinfo=CHILE), 4000)
        self.create_order(2, datetime(2026, 2, 1, 0, 0, tzinfo=CHILE), 9000)

        response = self.client.get("/api/reports/sales/?period=month&month=2026-01")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sales"]["total_amount"], 4000)
        self.assertEqual(response.data["selected"], "2026-01")
        self.assertEqual([item["key"] for item in response.data["time_series"]], ["31"])

    def test_reporte_semanal_usa_semana_comercial_de_martes_a_domingo(self):
        self.create_order(1, datetime(2026, 1, 12, 23, 59, tzinfo=CHILE), 1000)
        self.create_order(2, datetime(2026, 1, 13, 0, 0, tzinfo=CHILE), 3000)
        self.create_order(3, datetime(2026, 1, 18, 23, 59, tzinfo=CHILE), 4000)
        self.create_order(4, datetime(2026, 1, 19, 0, 0, tzinfo=CHILE), 7000)

        response = self.client.get("/api/reports/sales/?period=week&date=2026-01-15")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["selected"], "2026-01-13..2026-01-18")
        self.assertEqual(response.data["sales"]["total_amount"], 7000)
        self.assertEqual([item["key"] for item in response.data["time_series"]], ["2026-01-13", "2026-01-18"])

    def test_ranking_top_bottom_y_sin_ventas_omite_salsas(self):
        order = self.create_order(1, datetime(2026, 1, 15, 12, 0, tzinfo=CHILE), 20000)
        category = self.product.category
        products = [
            self.product,
            Product.objects.create(category=category, name="Papas", slug="papas-report", price=1000),
            Product.objects.create(category=category, name="Chacarero", slug="chacarero-report", price=1000),
            Product.objects.create(category=category, name="Campesino", slug="campesino-report", price=1000),
            Product.objects.create(category=category, name="Sin ventas", slug="sin-ventas-report", price=1000),
        ]
        for product, quantity in zip(products[:4], [5, 3, 2, 1]):
            OrderItem.objects.create(
                order=order, product=product, product_name=product.name,
                quantity=quantity, unit_price=product.price,
            )
        salsa_category = Category.objects.create(name="Salsas", slug="salsas")
        salsa = Product.objects.create(
            category=salsa_category, name="Salsa", slug="salsa-report", price=500
        )
        OrderItem.objects.create(
            order=order, product=salsa, product_name=salsa.name,
            quantity=20, unit_price=salsa.price,
        )

        response = self.client.get("/api/reports/sales/?period=day&date=2026-01-15")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["top_products"],
            [
                {"product_id": products[0].id, "product_name": "Italiano", "quantity": 5},
                {"product_id": products[1].id, "product_name": "Papas", "quantity": 3},
                {"product_id": products[2].id, "product_name": "Chacarero", "quantity": 2},
            ],
        )
        self.assertEqual(
            response.data["least_products"],
            [
                {"product_id": products[3].id, "product_name": "Campesino", "quantity": 1},
                {"product_id": products[2].id, "product_name": "Chacarero", "quantity": 2},
                {"product_id": products[1].id, "product_name": "Papas", "quantity": 3},
            ],
        )
        self.assertEqual(
            response.data["unsold_products"],
            {"count": 1, "product_names": ["Sin ventas"]},
        )

    def test_rechaza_periodo_o_fecha_invalidos_y_exige_permiso(self):
        self.assertEqual(self.client.get("/api/reports/sales/?period=year").status_code, 400)
        self.assertEqual(self.client.get("/api/reports/sales/?period=day&date=ayer").status_code, 400)
        self.assertEqual(self.client.get("/api/reports/sales/?period=month&month=9999-12").status_code, 400)
        self.assertEqual(APIClient().get("/api/reports/sales/?period=day&date=2026-01-15").status_code, 403)

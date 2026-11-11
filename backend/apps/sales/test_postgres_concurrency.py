from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db import connection, connections
from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.catalog.models import Category, Product
from .models import CashShift, Order


User = get_user_model()


@skipUnless(connection.vendor == "postgresql", "Estas pruebas requieren bloqueos reales de PostgreSQL.")
class PostgresConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.operator = User.objects.create_user(
            username="operador_concurrencia",
            password="clave-de-prueba-concurrencia",
        )
        permission = Permission.objects.get(
            content_type__app_label="sales",
            codename="can_operate_pos",
        )
        self.operator.user_permissions.add(permission)
        category = Category.objects.create(name="Pruebas", slug="concurrencia")
        self.product = Product.objects.create(
            category=category,
            name="Producto de concurrencia",
            slug="producto-concurrencia",
            price=5000,
        )

    def _post_concurrently(self, path, payloads):
        barrier = Barrier(len(payloads))
        user_id = self.operator.pk

        def post(payload):
            connections.close_all()
            try:
                client = APIClient()
                client.force_authenticate(user=User.objects.get(pk=user_id))
                barrier.wait(timeout=15)
                response = client.post(path, payload, format="json")
                return response.status_code
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=len(payloads)) as executor:
            return list(executor.map(post, payloads))

    def _offline_payload(self, shift, *, order_uuid=None, number=1):
        return {
            "uuid": str(order_uuid or uuid4()),
            "shift_order_number": number,
            "shift_uuid": str(shift.uuid),
            "created_at": timezone.now().isoformat(),
            "offline_created": True,
            "consumption_type": "PARA_LLEVAR",
            "payment_method": "EFECTIVO",
            "amount_received": 5000,
            "items": [
                {
                    "product_id": self.product.pk,
                    "product_name": self.product.name,
                    "quantity": 1,
                    "unit_price": self.product.price,
                    "modifiers": [],
                }
            ],
        }

    def test_solo_un_turno_se_abre_con_solicitudes_simultaneas(self):
        payloads = [
            {
                "uuid": str(uuid4()),
                "opened_at": timezone.now().isoformat(),
                "initial_cash": 20000,
            }
            for _ in range(2)
        ]

        statuses = self._post_concurrently("/api/shifts/open/", payloads)

        self.assertCountEqual(statuses, [201, 409])
        self.assertEqual(CashShift.objects.filter(closed_at__isnull=True).count(), 1)

    def test_reintento_offline_simultaneo_con_mismo_uuid_no_duplica_venta(self):
        shift = CashShift.objects.create(user=self.operator, opened_at=timezone.now(), initial_cash=20000)
        payload = self._offline_payload(shift)

        statuses = self._post_concurrently("/api/orders/sync/", [payload, payload.copy()])

        self.assertCountEqual(statuses, [201, 200])
        self.assertEqual(Order.objects.filter(uuid=payload["uuid"]).count(), 1)
        self.assertEqual(Order.objects.get(uuid=payload["uuid"]).total_amount, 5000)

    def test_folio_reutilizado_simultaneamente_con_otro_uuid_se_rechaza(self):
        shift = CashShift.objects.create(user=self.operator, opened_at=timezone.now(), initial_cash=20000)
        payloads = [self._offline_payload(shift), self._offline_payload(shift)]

        statuses = self._post_concurrently("/api/orders/sync/", payloads)

        self.assertCountEqual(statuses, [201, 409])
        self.assertEqual(Order.objects.filter(cash_shift=shift, shift_order_number=1).count(), 1)

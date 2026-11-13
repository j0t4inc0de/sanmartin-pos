from datetime import timedelta
import json
from unittest.mock import patch
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from apps.catalog.models import Category, Modifier, Product
from .api_serializers import CashShiftSerializer
from .models import CashShift, Order, OrderItem


User = get_user_model()


class OrderApiTests(APITestCase):
    def setUp(self):
        self.operator = User.objects.create_user(
            username="cajero_pruebas",
            password="clave-de-pruebas-segura-2026",
        )
        permission = Permission.objects.get(
            content_type__app_label="sales",
            codename="can_operate_pos",
        )
        self.operator.user_permissions.add(permission)
        self.client.force_authenticate(user=self.operator)

        self.shift = CashShift.objects.create(
            user=self.operator,
            opened_at=timezone.now() - timedelta(minutes=10),
            initial_cash=30000,
        )
        category = Category.objects.create(name="Pruebas", slug="pruebas")
        self.product = Product.objects.create(
            category=category,
            name="Sándwich de prueba",
            slug="sandwich-de-prueba",
            price=5000,
            is_active=True,
            is_available=True,
        )
        self.extra = Modifier.objects.create(
            name="Queso extra de prueba",
            price=1000,
            modifier_type=Modifier.ModifierType.EXTRA_PAGO,
            is_active=True,
            is_available=True,
        )
        self.exclusion = Modifier.objects.create(
            name="Sin mayo de prueba",
            price=0,
            modifier_type=Modifier.ModifierType.EXCLUSION_COCINA,
            is_active=True,
            is_available=True,
        )

    def payload_cotizacion(self, *, numero=1, precio=None, extra_qty=0):
        modificadores = []
        if extra_qty:
            modificadores.append(
                {
                    "modifier_id": self.extra.pk,
                    "expected_name": self.extra.name,
                    "expected_price": self.extra.price,
                    "expected_updated_at": self.extra.updated_at.isoformat(),
                    "quantity_per_unit": extra_qty,
                }
            )
        return {
            "uuid": str(uuid4()),
            "shift_order_number": numero,
            "created_at": timezone.now().isoformat(),
            "customer_name": "Cliente de prueba",
            "consumption_type": "PARA_LLEVAR",
            "items": [
                {
                    "product_id": self.product.pk,
                    "expected_name": self.product.name,
                    "expected_unit_price": self.product.price if precio is None else precio,
                    "expected_updated_at": self.product.updated_at.isoformat(),
                    "quantity": 2 if extra_qty else 1,
                    "notes": "Sin cebolla",
                    "modifiers": modificadores,
                }
            ],
        }

    def cotizar(self, payload=None, *, numero=1, precio=None, extra_qty=0):
        payload = payload or self.payload_cotizacion(
            numero=numero,
            precio=precio,
            extra_qty=extra_qty,
        )
        return payload, self.client.post("/api/orders/quote/", payload, format="json")

    def cobrar(self, quote_response, quote_payload, *, method="EFECTIVO", amount=10000, confirmed=False):
        body = {
            "uuid": quote_payload["uuid"],
            "shift_order_number": quote_payload["shift_order_number"],
            "quote_token": quote_response.data["quote_token"],
            "payment_method": method,
            "confirm_repriced": confirmed,
        }
        if amount is not None:
            body["amount_received"] = amount
        return self.client.post("/api/orders/", body, format="json")

    def payload_sync_offline(self):
        return {
            "uuid": str(uuid4()),
            "shift_order_number": 1,
            "shift_uuid": str(self.shift.uuid),
            "created_at": timezone.now().isoformat(),
            "offline_created": True,
            "customer_name": "Cliente offline",
            "consumption_type": "PARA_LLEVAR",
            "payment_method": "EFECTIVO",
            "amount_received": 15000,
            "items": [{
                "product_id": self.product.pk,
                "product_name": "Sándwich guardado localmente",
                "quantity": 2,
                "unit_price": 5000,
                "notes": "Sin cebolla",
                "modifiers": [{
                    "modifier_id": self.extra.pk,
                    "modifier_name": "Queso guardado localmente",
                    "quantity_per_unit": 2,
                    "price_at_sale": 900,
                }],
            }],
        }

    def sync_offline(self, payload):
        return self.client.post("/api/orders/sync/", payload, format="json")

    def test_sync_offline_preserva_snapshots_calcula_total_y_marca_revision(self):
        self.product.price = 5500
        self.product.save(update_fields=["price", "updated_at"])
        self.extra.price = 1200
        self.extra.save(update_fields=["price", "updated_at"])
        payload = self.payload_sync_offline()

        response = self.sync_offline(payload)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total_amount"], 13600)
        self.assertEqual(response.data["change_given"], 1400)
        self.assertTrue(response.data["offline_created"])
        self.assertEqual(response.data["customer_name"], "Cliente offline")
        self.assertTrue(response.data["requires_review"])
        self.assertEqual(Order.objects.get().items.get().product_name, "Sándwich guardado localmente")
        self.assertEqual(Order.objects.get().items.get().unit_price, 5000)
        self.assertEqual(Order.objects.get().items.get().modifiers.count(), 2)

    def test_sync_offline_reintento_idempotente_y_uuid_con_datos_distintos_conflicto(self):
        payload = self.payload_sync_offline()

        first = self.sync_offline(payload)
        retry = self.sync_offline(payload)
        payload["amount_received"] = 16000
        conflict = self.sync_offline(payload)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(Order.objects.count(), 1)

    def test_sync_offline_rechaza_efectivo_insuficiente_y_venta_no_offline(self):
        payload = self.payload_sync_offline()
        payload["amount_received"] = 9999
        insufficient = self.sync_offline(payload)
        payload["amount_received"] = 15000
        payload["offline_created"] = False
        not_offline = self.sync_offline(payload)

        self.assertEqual(insufficient.status_code, 400)
        self.assertEqual(not_offline.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_sync_offline_rechaza_folio_duplicado_con_uuid_distinto(self):
        first_payload = self.payload_sync_offline()
        second_payload = self.payload_sync_offline()
        second_payload["uuid"] = str(uuid4())

        first = self.sync_offline(first_payload)
        second = self.sync_offline(second_payload)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 409)
        self.assertEqual(Order.objects.count(), 1)

    def test_sync_offline_a_turno_cerrado_concilia_efectivo_y_reintento(self):
        close = self.client.post(
            f"/api/shifts/{self.shift.uuid}/close/",
            {"closed_at": timezone.now().isoformat(), "counted_cash": 31500},
            format="json",
        )
        payload = self.payload_sync_offline()

        response = self.sync_offline(payload)
        retry = self.sync_offline(payload)

        self.assertEqual(close.status_code, 200)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["requires_review"])
        self.assertIn("después del cierre del turno", response.data["review_reason"])
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(Order.objects.count(), 1)
        self.shift.refresh_from_db()
        self.assertEqual(self.shift.final_cash, 43600)
        self.assertEqual(self.shift.counted_cash, 31500)
        self.assertEqual(CashShiftSerializer(self.shift).data["cash_difference"], -12100)

    def test_anulacion_offline_conciliada_en_turno_cerrado_recalcula_efectivo(self):
        close = self.client.post(
            f"/api/shifts/{self.shift.uuid}/close/",
            {"closed_at": timezone.now().isoformat(), "counted_cash": 31500},
            format="json",
        )
        payload = self.payload_sync_offline()
        created = self.sync_offline(payload)

        cancellation_payload = {"reason": "Cliente desistió mientras no había conexión"}
        canceled = self.client.post(
            f"/api/orders/{payload['uuid']}/cancel/",
            cancellation_payload,
            format="json",
        )
        retry = self.client.post(
            f"/api/orders/{payload['uuid']}/cancel/",
            cancellation_payload,
            format="json",
        )

        self.assertEqual(close.status_code, 200)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(canceled.status_code, 200)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(canceled.data["status"], "ANULADA")
        self.assertIn("anulada después del cierre", canceled.data["review_reason"])
        self.shift.refresh_from_db()
        self.assertEqual(self.shift.final_cash, 30000)
        self.assertEqual(self.shift.counted_cash, 31500)
        self.assertEqual(CashShiftSerializer(self.shift).data["cash_difference"], 1500)

    def test_apertura_reintentada_devuelve_turno_ya_cerrado_si_contenido_coincide(self):
        payload = {
            "uuid": str(self.shift.uuid),
            "opened_at": self.shift.opened_at.isoformat(),
            "initial_cash": self.shift.initial_cash,
            "notes": self.shift.notes,
        }
        self.shift.closed_at = timezone.now()
        self.shift.save(update_fields=("closed_at", "updated_at"))

        retry = self.client.post("/api/shifts/open/", payload, format="json")
        payload["initial_cash"] = self.shift.initial_cash + 1
        conflict = self.client.post("/api/shifts/open/", payload, format="json")

        self.assertEqual(retry.status_code, 200)
        self.assertFalse(retry.data["is_open"])
        self.assertEqual(conflict.status_code, 409)

    def test_sync_offline_requiere_permiso_para_operar_pos(self):
        unauthorized = User.objects.create_user(
            username="sin_permiso_sync",
            password="otra-clave-segura-2026",
        )
        self.client.force_authenticate(user=unauthorized)

        response = self.sync_offline(self.payload_sync_offline())

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Order.objects.count(), 0)

    def test_cierre_manual_requiere_conteo_y_calcula_diferencia(self):
        response = self.client.post(
            f"/api/shifts/{self.shift.uuid}/close/",
            {"closed_at": timezone.now().isoformat(), "counted_cash": 31500},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["final_cash"], 30000)
        self.assertEqual(response.data["counted_cash"], 31500)
        self.assertEqual(response.data["cash_difference"], 1500)
        self.assertFalse(response.data["closed_automatically"])

    def test_consulta_detalle_de_turno_cerrado_requiere_propietario(self):
        response = self.client.get(f"/api/shifts/{self.shift.uuid}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uuid"], str(self.shift.uuid))

        other = User.objects.create_user(username="otro_operador", password="clave-segura-para-pruebas")
        permission = Permission.objects.get(content_type__app_label="sales", codename="can_operate_pos")
        other.user_permissions.add(permission)
        self.client.force_authenticate(user=other)
        forbidden = self.client.get(f"/api/shifts/{self.shift.uuid}/")
        self.assertEqual(forbidden.status_code, 404)

    def test_cierre_automatico_no_registra_conteo_fisico(self):
        response = self.client.post(
            f"/api/shifts/{self.shift.uuid}/close/",
            {"closed_at": timezone.now().isoformat(), "closed_automatically": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["final_cash"], 30000)
        self.assertIsNone(response.data["counted_cash"])
        self.assertTrue(response.data["closed_automatically"])

    def test_cierre_automatico_rechaza_arqueo_fisico(self):
        response = self.client.post(
            f"/api/shifts/{self.shift.uuid}/close/",
            {"closed_at": timezone.now().isoformat(), "closed_automatically": True, "counted_cash": 30000},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertTrue(self.shift.is_open)

    def test_cotizacion_calcula_precio_de_modificadores_por_unidad(self):
        _, response = self.cotizar(extra_qty=2)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["subtotal"], 14000)
        self.assertEqual(response.data["items"][0]["line_total"], 14000)
        self.assertFalse(response.data["requires_confirmation"])

    def test_exclusion_de_cocina_no_se_puede_repetir(self):
        payload = self.payload_cotizacion()
        payload["items"][0]["modifiers"] = [
            {
                "modifier_id": self.exclusion.pk,
                "expected_name": self.exclusion.name,
                "expected_price": self.exclusion.price,
                "expected_updated_at": self.exclusion.updated_at.isoformat(),
                "quantity_per_unit": 2,
            }
        ]

        response = self.client.post("/api/orders/quote/", payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_cambio_de_precio_exige_confirmacion_y_no_guarda_antes_del_pago(self):
        quote_payload = self.payload_cotizacion(precio=4000)
        _, quote = self.cotizar(quote_payload)

        self.assertEqual(quote.status_code, 200)
        self.assertTrue(quote.data["requires_confirmation"])
        self.assertEqual(quote.data["total_amount"], self.product.price)
        self.assertEqual(Order.objects.count(), 0)

        rejected = self.cobrar(quote, quote_payload, confirmed=False)
        self.assertEqual(rejected.status_code, 409)
        self.assertEqual(Order.objects.count(), 0)

        accepted = self.cobrar(quote, quote_payload, confirmed=True)
        self.assertEqual(accepted.status_code, 201)
        self.assertEqual(accepted.data["total_amount"], self.product.price)

    def test_cotizacion_vencida_no_registra_venta(self):
        payload, quote = self.cotizar()

        with patch("apps.sales.api_views.QUOTE_MAX_AGE_SECONDS", -1):
            response = self.cobrar(quote, payload)

        self.assertEqual(response.status_code, 409)
        self.assertTrue(response.data["quote_expired"])
        self.assertEqual(Order.objects.count(), 0)

    def test_efectivo_calcula_vuelto_y_guarda_snapshots(self):
        payload, quote = self.cotizar()
        response = self.cobrar(quote, payload, amount=7000)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["amount_paid"], 7000)
        self.assertEqual(response.data["change_given"], 2000)
        self.assertEqual(response.data["items"][0]["product_name"], self.product.name)
        self.assertEqual(OrderItem.objects.get().unit_price, 5000)

    def test_efectivo_insuficiente_se_rechaza_sin_crear_venta(self):
        payload, quote = self.cotizar()
        response = self.cobrar(quote, payload, amount=4999)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_pagos_no_efectivo_no_guardan_monto_recibido_ni_vuelto(self):
        for numero, method in enumerate(("TRANSBANK", "TRANSFERENCIA"), start=1):
            with self.subTest(medio=method):
                payload, quote = self.cotizar(numero=numero)
                response = self.cobrar(quote, payload, method=method, amount=None)

                self.assertEqual(response.status_code, 201)
                self.assertIsNone(response.data["amount_paid"])
                self.assertIsNone(response.data["change_given"])

    def test_historial_incluye_detalle_de_comprobante_para_ventas_recientes(self):
        payload, quote = self.cotizar(extra_qty=2)
        sale = self.cobrar(quote, payload, amount=15000)

        self.assertEqual(sale.status_code, 201)
        history = self.client.get("/api/orders/")

        self.assertEqual(history.status_code, 200)
        order = history.data["orders"][0]
        self.assertEqual(order["uuid"], sale.data["uuid"])
        self.assertEqual(order["consumption_type"], "PARA_LLEVAR")
        self.assertEqual(order["customer_name"], "Cliente de prueba")
        self.assertEqual(order["subtotal"], 14000)
        self.assertEqual(order["total_amount"], 14000)
        self.assertEqual(order["amount_paid"], 15000)
        self.assertEqual(order["change_given"], 1000)
        self.assertEqual(order["items"][0]["product_name"], self.product.name)
        self.assertEqual(order["items"][0]["notes"], "Sin cebolla")
        self.assertEqual(order["items"][0]["line_total"], 14000)
        self.assertEqual(len(order["items"][0]["modifiers"]), 2)

    def test_reintento_idempotente_no_duplica_y_datos_distintos_conflicto(self):
        payload, quote = self.cotizar()
        body = {
            "uuid": payload["uuid"],
            "shift_order_number": payload["shift_order_number"],
            "quote_token": quote.data["quote_token"],
            "payment_method": "EFECTIVO",
            "amount_received": 7000,
            "confirm_repriced": False,
        }
        first = self.client.post("/api/orders/", body, format="json")
        retry = self.client.post("/api/orders/", body, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(Order.objects.count(), 1)

        body["amount_received"] = 8000
        conflict = self.client.post("/api/orders/", body, format="json")
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(Order.objects.count(), 1)

    def test_folio_duplicado_con_otro_uuid_se_rechaza(self):
        payload_uno, quote_uno = self.cotizar(numero=1)
        response_uno = self.cobrar(quote_uno, payload_uno)
        payload_dos, quote_dos = self.cotizar(numero=1)
        response_dos = self.cobrar(quote_dos, payload_dos)

        self.assertEqual(response_uno.status_code, 201)
        self.assertEqual(response_dos.status_code, 409)
        self.assertEqual(Order.objects.count(), 1)

    def test_usuario_sin_permiso_no_puede_cotizar(self):
        sin_permiso = User.objects.create_user(
            username="sin_permiso",
            password="otra-clave-segura-2026",
        )
        self.client.force_authenticate(user=sin_permiso)

        response = self.client.post(
            "/api/orders/quote/",
            self.payload_cotizacion(),
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Order.objects.count(), 0)

    def test_catalogo_pos_requiere_permiso_y_entrega_modificadores(self):
        response = self.client.get("/api/pos/catalog/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["products"][0]["id"], self.product.pk)
        modifier_names = [modifier["name"].strip().casefold() for modifier in response.data["modifiers"]]
        modifier_ids = {modifier["id"] for modifier in response.data["modifiers"]}
        self.assertIn(self.extra.pk, modifier_ids)
        self.assertIn(self.exclusion.pk, modifier_ids)
        self.assertEqual(len(modifier_names), len(set(modifier_names)))

        sin_permiso = User.objects.create_user(
            username="catalogo_sin_permiso",
            password="clave-segura-para-pruebas-2026",
        )
        self.client.force_authenticate(user=sin_permiso)
        forbidden = self.client.get("/api/pos/catalog/")
        self.assertEqual(forbidden.status_code, 403)

    def test_api_de_ventas_exige_csrf_para_sesion_de_navegador(self):
        cliente = APIClient(enforce_csrf_checks=True)
        cliente.force_login(self.operator)
        payload = self.payload_cotizacion()

        sin_token = cliente.post("/api/orders/quote/", payload, format="json")
        self.assertEqual(sin_token.status_code, 403)

        csrf_response = cliente.get("/api/auth/csrf/")
        token = json.loads(csrf_response.content)["csrfToken"]
        con_token = cliente.post(
            "/api/orders/quote/",
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(con_token.status_code, 200)

    def test_anulacion_exige_motivo_y_registra_usuario(self):
        payload, quote = self.cotizar()
        order = self.cobrar(quote, payload).data

        history = self.client.get("/api/orders/")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.data["orders"][0]["uuid"], order["uuid"])
        self.assertEqual(history.data["open_shift_uuid"], str(self.shift.uuid))

        missing_reason = self.client.post(
            f"/api/orders/{order['uuid']}/cancel/",
            {},
            format="json",
        )
        self.assertEqual(missing_reason.status_code, 400)

        cancellation_payload = {"reason": "Error de digitación"}
        canceled = self.client.post(
            f"/api/orders/{order['uuid']}/cancel/",
            cancellation_payload,
            format="json",
        )
        retry = self.client.post(
            f"/api/orders/{order['uuid']}/cancel/",
            cancellation_payload,
            format="json",
        )

        self.assertEqual(canceled.status_code, 200)
        self.assertEqual(canceled.data["status"], "ANULADA")
        self.assertEqual(canceled.data["cancellation_reason"], cancellation_payload["reason"])
        self.assertEqual(canceled.data["cancelled_by"], self.operator.pk)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(Order.objects.get().status, Order.Status.ANULADA)
        self.assertEqual(Order.objects.get().cancellation_reason, cancellation_payload["reason"])

    def test_no_permite_anular_tras_cerrar_turno(self):
        payload, quote = self.cotizar()
        order = self.cobrar(quote, payload).data
        self.shift.closed_at = timezone.now()
        self.shift.save(update_fields=("closed_at", "updated_at"))

        response = self.client.post(
            f"/api/orders/{order['uuid']}/cancel/",
            {"reason": "Error detectado después del cierre"},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(Order.objects.get().status, Order.Status.COMPLETADA)

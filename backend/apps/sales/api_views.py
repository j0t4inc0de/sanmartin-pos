from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import IntegrityError, transaction
from django.db.models import Count, F, Max, Sum
from django.db.models.functions import ExtractHour, TruncDay, TruncHour
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from apps.catalog.models import Modifier, Product
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .api_serializers import (
    CancelOrderInputSerializer,
    CashShiftSerializer,
    CloseCashShiftSerializer,
    OfflineOrderSyncInputSerializer,
    OrderPaymentInputSerializer,
    OrderQuoteInputSerializer,
    OrderReadSerializer,
    OpenCashShiftSerializer,
)
from .models import CashShift, Order, OrderItem, OrderItemModifier
from .permissions import CanOperatePOS


QUOTE_SIGNER = TimestampSigner(salt="sales.order.quote.v1")
QUOTE_MAX_AGE_SECONDS = 5 * 60
REPORT_TIMEZONE = ZoneInfo("America/Santiago")


def _report_period(request):
    period = request.query_params.get("period", "day")
    if period == "day":
        raw_day = request.query_params.get("date", "")
        selected_day = parse_date(raw_day) if raw_day else timezone.now().astimezone(REPORT_TIMEZONE).date()
        if selected_day is None:
            return None
        start = datetime.combine(selected_day, time.min, tzinfo=REPORT_TIMEZONE)
        return period, start, start + timedelta(days=1), selected_day.isoformat()
    if period == "week":
        raw_day = request.query_params.get("date", "")
        selected_day = parse_date(raw_day) if raw_day else timezone.now().astimezone(REPORT_TIMEZONE).date()
        if selected_day is None:
            return None
        days_since_tuesday = (selected_day.weekday() - 1) % 7
        week_start = selected_day - timedelta(days=days_since_tuesday)
        week_end = week_start + timedelta(days=6)
        start = datetime.combine(week_start, time.min, tzinfo=REPORT_TIMEZONE)
        end = datetime.combine(week_end, time.min, tzinfo=REPORT_TIMEZONE)
        selected = f"{week_start.isoformat()}..{(week_end - timedelta(days=1)).isoformat()}"
        return period, start, end, selected
    if period == "month":
        raw_month = request.query_params.get("month", "")
        try:
            year_text, month_text = raw_month.split("-", maxsplit=1)
            year, month = int(year_text), int(month_text)
            selected_month = date(year, month, 1)
            next_month = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
        except (ValueError, TypeError):
            return None
        start = datetime.combine(selected_month, time.min, tzinfo=REPORT_TIMEZONE)
        end = datetime.combine(next_month, time.min, tzinfo=REPORT_TIMEZONE)
        return period, start, end, selected_month.strftime("%Y-%m")
    return None


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def get(self, request):
        period_data = _report_period(request)
        if period_data is None:
            return Response(
                {"detail": "Indica un período válido: day o week con date YYYY-MM-DD, o month con month YYYY-MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period, start, end, selected = period_data
        orders = Order.objects.filter(
            cash_shift__user=request.user,
            created_at__gte=start,
            created_at__lt=end,
        )
        completed = orders.filter(status=Order.Status.COMPLETADA)
        completed_totals = completed.aggregate(total=Sum("total_amount"), count=Count("id"))
        total = completed_totals["total"] or 0
        count = completed_totals["count"] or 0
        payment_labels = dict(Order.PaymentMethod.choices)
        payments = [
            {
                "payment_method": item["payment_method"],
                "label": payment_labels.get(item["payment_method"], item["payment_method"]),
                "total_amount": item["total"] or 0,
                "order_count": item["count"],
            }
            for item in completed.values("payment_method").annotate(
                total=Sum("total_amount"), count=Count("id")
            ).order_by("payment_method")
        ]
        cancelled = orders.filter(status=Order.Status.ANULADA).aggregate(
            total=Sum("total_amount"), count=Count("id")
        )
        completed_items = OrderItem.objects.filter(
            order__cash_shift__user=request.user,
            order__created_at__gte=start,
            order__created_at__lt=end,
            order__status=Order.Status.COMPLETADA,
        ).exclude(product__category__slug="salsas")
        product_sales = completed_items.values("product_id").annotate(
            reported_name=Max("product__name"), quantity=Sum("quantity")
        )
        top_products = [
            {"product_id": item["product_id"], "product_name": item["reported_name"], "quantity": item["quantity"]}
            for item in product_sales.order_by("-quantity", "reported_name")[:3]
        ]
        least_products = [
            {"product_id": item["product_id"], "product_name": item["reported_name"], "quantity": item["quantity"]}
            for item in product_sales.order_by("quantity", "reported_name")[:3]
        ]
        unsold_products = Product.objects.filter(
            is_active=True,
            is_available=True,
            category__is_active=True,
        ).exclude(category__slug="salsas").exclude(
            id__in=completed_items.values("product_id")
        ).order_by("name")
        unsold_product_names = list(unsold_products.values_list("name", flat=True))
        rush_hours = list(
            completed.annotate(hour=ExtractHour("created_at", tzinfo=REPORT_TIMEZONE))
            .values("hour").annotate(
                order_count=Count("id"), total_amount=Sum("total_amount")
            ).order_by("hour")
        )
        if period == "day":
            timeline_rows = completed.annotate(
                bucket=TruncHour("created_at", tzinfo=REPORT_TIMEZONE)
            ).values("bucket").annotate(
                total_amount=Sum("total_amount"), order_count=Count("id")
            ).order_by("bucket")
            time_series = [
                {
                    "key": row["bucket"].strftime("%H"),
                    "total_amount": row["total_amount"],
                    "order_count": row["order_count"],
                }
                for row in timeline_rows
            ]
        else:
            timeline_rows = completed.annotate(
                bucket=TruncDay("created_at", tzinfo=REPORT_TIMEZONE)
            ).values("bucket").annotate(
                total_amount=Sum("total_amount"), order_count=Count("id")
            ).order_by("bucket")
            time_series = [
                {
                    "key": row["bucket"].strftime("%Y-%m-%d") if period == "week" else row["bucket"].strftime("%d"),
                    "total_amount": row["total_amount"],
                    "order_count": row["order_count"],
                }
                for row in timeline_rows
            ]
        shifts = [
            {
                "uuid": str(shift.uuid),
                "opened_at": shift.opened_at,
                "closed_at": shift.closed_at,
                "initial_cash": shift.initial_cash,
                "final_cash": shift.final_cash,
                "counted_cash": shift.counted_cash,
                "cash_difference": (
                    shift.counted_cash - shift.final_cash
                    if shift.counted_cash is not None and shift.final_cash is not None
                    else None
                ),
                "closed_automatically": shift.closed_automatically,
            }
            for shift in CashShift.objects.filter(
                user=request.user, opened_at__gte=start, opened_at__lt=end
            ).order_by("opened_at")
        ]
        return Response({
            "period": period,
            "selected": selected,
            "start": start,
            "end_exclusive": end,
            "timezone": "America/Santiago",
            "sales": {
                "total_amount": total,
                "order_count": count,
                "average_ticket": (total + count // 2) // count if count else 0,
            },
            "payments": payments,
            "cancellations": {
                "order_count": cancelled["count"] or 0,
                "total_amount": cancelled["total"] or 0,
            },
            "top_products": top_products,
            "least_products": least_products,
            "unsold_products": {
                "count": len(unsold_product_names),
                "product_names": unsold_product_names,
            },
            "rush_hours": rush_hours,
            "time_series": time_series,
            "shifts": shifts,
        })


def _turno_abierto_del_usuario(user):
    return (
        CashShift.objects.filter(user=user, closed_at__isnull=True)
        .order_by("-opened_at")
        .first()
    )


def _lineas_coinciden(order, quote_items):
    lineas_guardadas = list(order.items.prefetch_related("modifiers").order_by("id"))
    if len(lineas_guardadas) != len(quote_items):
        return False

    for saved, expected in zip(lineas_guardadas, quote_items, strict=True):
        if (
            saved.product_id != expected["product_id"]
            or saved.product_name != expected["product_name"]
            or saved.quantity != expected["quantity"]
            or saved.unit_price != expected["unit_price"]
            or saved.notes != expected["notes"]
        ):
            return False
        saved_modifiers = list(saved.modifiers.order_by("id").values_list(
            "modifier_id", "modifier_name", "price_at_sale"
        ))
        expected_modifiers = [
            (item["modifier_id"], item["modifier_name"], item["price_at_sale"])
            for item in expected["modifiers"]
        ]
        if sorted(saved_modifiers) != sorted(expected_modifiers):
            return False
    return True


def _venta_idempotente_coincide(order, quote, payment_method, amount_received):
    paid_amount = amount_received if payment_method == Order.PaymentMethod.EFECTIVO else None
    change = paid_amount - quote["total_amount"] if paid_amount is not None else None
    created_at = parse_datetime(quote["created_at"])
    return bool(
        str(order.cash_shift.uuid) == quote["shift_uuid"]
        and order.shift_order_number == quote["shift_order_number"]
        and order.created_at == created_at
        and order.consumption_type == quote["consumption_type"]
        and order.payment_method == payment_method
        and order.subtotal == quote["subtotal"]
        and order.delivery_fee == 0
        and order.total_amount == quote["total_amount"]
        and order.amount_paid == paid_amount
        and order.change_given == change
        and order.status == Order.Status.COMPLETADA
        and _lineas_coinciden(order, quote["items"])
    )


def _venta_offline_idempotente_coincide(order, shift, values, subtotal, amount_paid, change_given):
    payload_items = [
        {
            "product_id": item["product_id"],
            "product_name": item["product_name"],
            "quantity": item["quantity"],
            "unit_price": item["unit_price"],
            "notes": item.get("notes", ""),
            "modifiers": [
                {
                    "modifier_id": modifier["modifier_id"],
                    "modifier_name": modifier["modifier_name"],
                    "price_at_sale": modifier["price_at_sale"],
                }
                for modifier in item["modifiers"]
                for _ in range(modifier["quantity_per_unit"])
            ],
        }
        for item in values["items"]
    ]
    return bool(
        str(shift.uuid) == str(values["shift_uuid"])
        and order.cash_shift_id == shift.pk
        and order.shift_order_number == values["shift_order_number"]
        and order.created_at == values["created_at"]
        and order.offline_created
        and order.status == Order.Status.COMPLETADA
        and order.consumption_type == values["consumption_type"]
        and order.payment_method == values["payment_method"]
        and order.subtotal == subtotal
        and order.delivery_fee == 0
        and order.total_amount == subtotal
        and order.amount_paid == amount_paid
        and order.change_given == change_given
        and _lineas_coinciden(order, payload_items)
    )


class CurrentCashShiftView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def get(self, request):
        shift = (
            CashShift.objects.filter(user=request.user, closed_at__isnull=True)
            .order_by("-opened_at")
            .first()
        )
        another_shift_open = CashShift.objects.filter(
            closed_at__isnull=True
        ).exclude(user=request.user).exists()
        next_order_number = 1
        if shift is not None:
            last_order_number = Order.objects.filter(cash_shift=shift).aggregate(
                last_number=Max("shift_order_number")
            )["last_number"]
            next_order_number = (last_order_number or 0) + 1
        return Response(
            {
                "shift": CashShiftSerializer(shift).data if shift else None,
                "another_shift_open": another_shift_open,
                "next_order_number": next_order_number,
            }
        )


class CashShiftDetailView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def get(self, request, shift_uuid):
        shift = get_object_or_404(CashShift, uuid=shift_uuid, user=request.user)
        return Response(CashShiftSerializer(shift).data)


class OpenCashShiftView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def post(self, request):
        serializer = OpenCashShiftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data

        existing = CashShift.objects.filter(uuid=values["uuid"]).first()
        if existing:
            if (
                existing.user_id == request.user.pk
                and existing.opened_at == values["opened_at"]
                and existing.initial_cash == values["initial_cash"]
                and existing.notes == values.get("notes", "")
            ):
                return Response(CashShiftSerializer(existing).data)
            return Response(
                {"detail": "El identificador de turno ya fue utilizado."},
                status=status.HTTP_409_CONFLICT,
            )

        if CashShift.objects.filter(closed_at__isnull=True).exists():
            return Response(
                {"detail": "Ya existe un turno abierto."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            with transaction.atomic():
                shift = CashShift.objects.create(user=request.user, **values)
        except IntegrityError:
            existing = CashShift.objects.filter(
                uuid=values["uuid"],
                user=request.user,
                closed_at__isnull=True,
            ).first()
            if existing:
                return Response(CashShiftSerializer(existing).data)
            return Response(
                {"detail": "Ya existe un turno abierto o el turno fue registrado."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            CashShiftSerializer(shift).data,
            status=status.HTTP_201_CREATED,
        )


class CloseCashShiftView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def post(self, request, shift_uuid):
        shift = get_object_or_404(CashShift, uuid=shift_uuid, user=request.user)
        serializer = CloseCashShiftSerializer(
            data=request.data,
            context={"shift": shift},
        )
        serializer.is_valid(raise_exception=True)

        if not shift.is_open:
            return Response(CashShiftSerializer(shift).data)

        with transaction.atomic():
            shift = CashShift.objects.select_for_update().get(pk=shift.pk)
            if shift.is_open:
                cash_sales = Order.objects.filter(
                    cash_shift=shift,
                    status=Order.Status.COMPLETADA,
                    payment_method=Order.PaymentMethod.EFECTIVO,
                ).aggregate(total=Sum("total_amount"))["total"] or 0
                shift.closed_at = serializer.validated_data["closed_at"]
                shift.final_cash = shift.initial_cash + cash_sales
                shift.counted_cash = serializer.validated_data.get("counted_cash")
                shift.closed_automatically = serializer.validated_data["closed_automatically"]
                shift.notes = serializer.validated_data.get("notes", shift.notes)
                shift.save(
                    update_fields=[
                        "closed_at",
                        "final_cash",
                        "counted_cash",
                        "closed_automatically",
                        "notes",
                        "updated_at",
                    ]
                )

        return Response(CashShiftSerializer(shift).data)


class OrderQuoteView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def post(self, request):
        serializer = OrderQuoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        shift = _turno_abierto_del_usuario(request.user)
        if shift is None:
            return Response(
                {"detail": "Debes tener un turno abierto para cotizar una venta."},
                status=status.HTTP_409_CONFLICT,
            )

        product_ids = {item["product_id"] for item in values["items"]}
        modifier_ids = {
            modifier["modifier_id"]
            for item in values["items"]
            for modifier in item["modifiers"]
        }

        with transaction.atomic():
            products = {
                product.pk: product
                for product in Product.objects.select_for_update().filter(
                    pk__in=product_ids,
                    is_active=True,
                    is_available=True,
                )
            }
            modifiers = {
                modifier.pk: modifier
                for modifier in Modifier.objects.select_for_update().filter(
                    pk__in=modifier_ids,
                    is_active=True,
                    is_available=True,
                )
            }

            quote_items = []
            display_items = []
            requires_confirmation = False
            subtotal = 0

            for index, item in enumerate(values["items"]):
                product = products.get(item["product_id"])
                if product is None:
                    return Response(
                        {"detail": f"El producto de la línea {index + 1} ya no está disponible."},
                        status=status.HTTP_409_CONFLICT,
                    )

                if (
                    item["expected_name"] != product.name
                    or item["expected_unit_price"] != product.price
                    or (
                        item.get("expected_updated_at") is not None
                        and item["expected_updated_at"] != product.updated_at
                    )
                ):
                    requires_confirmation = True

                modifier_snapshots = []
                display_modifiers = []
                modifiers_total_per_unit = 0
                for modifier_input in item["modifiers"]:
                    modifier = modifiers.get(modifier_input["modifier_id"])
                    if modifier is None:
                        nombre_mod = modifier_input.get("expected_name") or f"ID #{modifier_input['modifier_id']}"
                        return Response(
                            {"detail": f"El modificador '{nombre_mod}' de la línea {index + 1} ya no está disponible."},
                            status=status.HTTP_409_CONFLICT,
                        )
                    if (
                        modifier_input["expected_name"] != modifier.name
                        or modifier_input["expected_price"] != modifier.price
                        or (
                            modifier_input.get("expected_updated_at") is not None
                            and modifier_input["expected_updated_at"] != modifier.updated_at
                        )
                    ):
                        requires_confirmation = True
                    if (
                        modifier.modifier_type == Modifier.ModifierType.EXCLUSION_COCINA
                        and modifier.price != 0
                    ):
                        return Response(
                            {"detail": f"La exclusión «{modifier.name}» debe tener precio cero en el catálogo."},
                            status=status.HTTP_409_CONFLICT,
                        )

                    count = modifier_input["quantity_per_unit"]
                    modifiers_total_per_unit += modifier.price * count
                    display_modifiers.append(
                        {
                            "modifier_id": modifier.pk,
                            "modifier_name": modifier.name,
                            "price_at_sale": modifier.price,
                            "quantity_per_unit": count,
                            "updated_at": modifier.updated_at,
                        }
                    )
                    modifier_snapshots.extend(
                        {
                            "modifier_id": modifier.pk,
                            "modifier_name": modifier.name,
                            "price_at_sale": modifier.price,
                        }
                        for _ in range(count)
                    )

                line_total = item["quantity"] * (product.price + modifiers_total_per_unit)
                subtotal += line_total
                quote_items.append(
                    {
                        "product_id": product.pk,
                        "product_name": product.name,
                        "quantity": item["quantity"],
                        "unit_price": product.price,
                        "updated_at": product.updated_at.isoformat(),
                        "notes": item.get("notes", ""),
                        "modifiers": modifier_snapshots,
                    }
                )
                display_items.append(
                    {
                        "product_id": product.pk,
                        "product_name": product.name,
                        "quantity": item["quantity"],
                        "unit_price": product.price,
                        "modifiers": display_modifiers,
                        "modifiers_total_per_unit": modifiers_total_per_unit,
                        "line_total": line_total,
                    }
                )

        quote = {
            "uuid": str(values["uuid"]),
            "shift_order_number": values["shift_order_number"],
            "created_at": values["created_at"].isoformat(),
            "shift_uuid": str(shift.uuid),
            "user_id": request.user.pk,
            "consumption_type": values["consumption_type"],
            "items": quote_items,
            "subtotal": subtotal,
            "total_amount": subtotal,
            "requires_confirmation": requires_confirmation,
        }
        return Response(
            {
                "quote_token": QUOTE_SIGNER.sign_object(quote, compress=True),
                "valid_until": timezone.now()
                + timedelta(seconds=QUOTE_MAX_AGE_SECONDS),
                "requires_confirmation": requires_confirmation,
                "items": display_items,
                "subtotal": subtotal,
                "total_amount": subtotal,
            }
        )


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def get(self, request):
        orders = (
            Order.objects.filter(cash_shift__user=request.user)
            .select_related("cash_shift")
            .prefetch_related("items__modifiers")
            .order_by("-created_at", "-id")[:50]
        )
        open_shift = _turno_abierto_del_usuario(request.user)
        return Response(
            {
                "orders": OrderReadSerializer(orders, many=True).data,
                "open_shift_uuid": str(open_shift.uuid) if open_shift else None,
            }
        )

    def post(self, request):
        serializer = OrderPaymentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data

        try:
            quote = QUOTE_SIGNER.unsign_object(values["quote_token"])
        except BadSignature:
            return Response(
                {"detail": "La cotización no es válida. Vuelve a calcular la venta."},
                status=status.HTTP_409_CONFLICT,
            )

        if (
            quote.get("uuid") != str(values["uuid"])
            or quote.get("shift_order_number") != values["shift_order_number"]
            or quote.get("user_id") != request.user.pk
        ):
            return Response(
                {"detail": "La cotización no corresponde a esta venta o usuario."},
                status=status.HTTP_409_CONFLICT,
            )

        existing = Order.objects.filter(uuid=values["uuid"]).first()
        if existing:
            if _venta_idempotente_coincide(
                existing,
                quote,
                values["payment_method"],
                values.get("amount_received"),
            ):
                return Response(OrderReadSerializer(existing).data)
            return Response(
                {"detail": "El UUID de venta ya existe con otros datos."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            quote = QUOTE_SIGNER.unsign_object(
                values["quote_token"], max_age=QUOTE_MAX_AGE_SECONDS
            )
        except SignatureExpired:
            return Response(
                {
                    "detail": "La cotización venció. Actualiza el precio y confirma antes de cobrar.",
                    "quote_expired": True,
                },
                status=status.HTTP_409_CONFLICT,
            )
        except BadSignature:
            return Response(
                {"detail": "La cotización no es válida. Vuelve a calcular la venta."},
                status=status.HTTP_409_CONFLICT,
            )

        if quote.get("requires_confirmation") and not values["confirm_repriced"]:
            return Response(
                {"detail": "Confirma los precios actualizados antes de registrar la venta."},
                status=status.HTTP_409_CONFLICT,
            )

        shift = _turno_abierto_del_usuario(request.user)
        if shift is None or str(shift.uuid) != quote.get("shift_uuid"):
            return Response(
                {"detail": "El turno de la cotización ya no está abierto."},
                status=status.HTTP_409_CONFLICT,
            )

        if values["payment_method"] == Order.PaymentMethod.EFECTIVO:
            amount_paid = values["amount_received"]
            if amount_paid < quote["total_amount"]:
                return Response(
                    {"detail": "El efectivo recibido no alcanza para cubrir el total."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            change_given = amount_paid - quote["total_amount"]
        else:
            amount_paid = None
            change_given = None

        created_at = parse_datetime(quote["created_at"])
        if created_at is None:
            return Response(
                {"detail": "La fecha de venta de la cotización no es válida."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            with transaction.atomic():
                locked_shift = CashShift.objects.select_for_update().get(pk=shift.pk)
                if not locked_shift.is_open:
                    return Response(
                        {"detail": "El turno se cerró antes de registrar la venta."},
                        status=status.HTTP_409_CONFLICT,
                    )
                order = Order.objects.create(
                    uuid=values["uuid"],
                    cash_shift=locked_shift,
                    shift_order_number=values["shift_order_number"],
                    created_at=created_at,
                    offline_created=False,
                    consumption_type=quote["consumption_type"],
                    payment_method=values["payment_method"],
                    subtotal=quote["subtotal"],
                    delivery_fee=0,
                    total_amount=quote["total_amount"],
                    amount_paid=amount_paid,
                    change_given=change_given,
                )
                for item in quote["items"]:
                    order_item = OrderItem.objects.create(
                        order=order,
                        product_id=item["product_id"],
                        product_name=item["product_name"],
                        quantity=item["quantity"],
                        unit_price=item["unit_price"],
                        notes=item["notes"],
                    )
                    OrderItemModifier.objects.bulk_create(
                        [
                            OrderItemModifier(
                                order_item=order_item,
                                modifier_id=modifier["modifier_id"],
                                modifier_name=modifier["modifier_name"],
                                price_at_sale=modifier["price_at_sale"],
                            )
                            for modifier in item["modifiers"]
                        ]
                    )
        except (CashShift.DoesNotExist, IntegrityError):
            existing = Order.objects.filter(uuid=values["uuid"]).first()
            if existing and _venta_idempotente_coincide(
                existing,
                quote,
                values["payment_method"],
                values.get("amount_received"),
            ):
                return Response(OrderReadSerializer(existing).data)
            return Response(
                {"detail": "El turno o folio ya fue utilizado por otra operación."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            OrderReadSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class SyncOfflineOrderView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def post(self, request):
        serializer = OfflineOrderSyncInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        items = values["items"]
        subtotal = sum(
            item["quantity"] * (
                item["unit_price"]
                + sum(
                    modifier["price_at_sale"] * modifier["quantity_per_unit"]
                    for modifier in item["modifiers"]
                )
            )
            for item in items
        )
        amount_paid = values.get("amount_received") if values["payment_method"] == Order.PaymentMethod.EFECTIVO else None
        if amount_paid is not None and amount_paid < subtotal:
            return Response(
                {"detail": "El efectivo recibido no alcanza para cubrir el total offline."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        change_given = amount_paid - subtotal if amount_paid is not None else None

        try:
            with transaction.atomic():
                shift = CashShift.objects.select_for_update().filter(
                    uuid=values["shift_uuid"], user=request.user
                ).first()
                if shift is None:
                    return Response({"detail": "No se encontró un turno de esta cuenta."}, status=status.HTTP_404_NOT_FOUND)
                products = {
                    product.pk: product
                    for product in Product.objects.select_for_update().filter(
                        pk__in={item["product_id"] for item in items}
                    )
                }
                modifier_ids = {modifier["modifier_id"] for item in items for modifier in item["modifiers"]}
                modifiers = {
                    modifier.pk: modifier
                    for modifier in Modifier.objects.select_for_update().filter(pk__in=modifier_ids)
                }
                review_reasons = []
                late_for_closed_shift = not shift.is_open
                if late_for_closed_shift:
                    review_reasons.append("Venta offline sincronizada después del cierre del turno; requiere conciliación.")
                for item in items:
                    current = products[item["product_id"]]
                    if not current.is_active or not current.is_available:
                        review_reasons.append(f"Producto no disponible: {item['product_name']}")
                    if current.name != item["product_name"] or current.price != item["unit_price"]:
                        review_reasons.append(f"Precio o nombre cambió: {item['product_name']}")
                    for modifier_data in item["modifiers"]:
                        current_modifier = modifiers[modifier_data["modifier_id"]]
                        if not current_modifier.is_active or not current_modifier.is_available:
                            review_reasons.append(f"Modificador no disponible: {modifier_data['modifier_name']}")
                        if current_modifier.name != modifier_data["modifier_name"] or current_modifier.price != modifier_data["price_at_sale"]:
                            review_reasons.append(f"Precio o nombre de modificador cambió: {modifier_data['modifier_name']}")
                review_reason = "; ".join(dict.fromkeys(review_reasons))[:255]
                order = Order.objects.filter(uuid=values["uuid"]).first()
                if order is not None:
                    if _venta_offline_idempotente_coincide(order, shift, values, subtotal, amount_paid, change_given):
                        return Response(OrderReadSerializer(order).data)
                    return Response({"detail": "El UUID de venta ya existe con otros datos."}, status=status.HTTP_409_CONFLICT)

                order = Order.objects.create(
                    uuid=values["uuid"],
                    cash_shift=shift,
                    shift_order_number=values["shift_order_number"],
                    created_at=values["created_at"],
                    offline_created=True,
                    consumption_type=values["consumption_type"],
                    payment_method=values["payment_method"],
                    subtotal=subtotal,
                    delivery_fee=0,
                    total_amount=subtotal,
                    amount_paid=amount_paid,
                    change_given=change_given,
                    requires_review=bool(review_reason),
                    review_reason=review_reason,
                )
                for item in items:
                    order_item = OrderItem.objects.create(
                        order=order,
                        product_id=item["product_id"],
                        product_name=item["product_name"],
                        quantity=item["quantity"],
                        unit_price=item["unit_price"],
                        notes=item.get("notes", ""),
                    )
                    OrderItemModifier.objects.bulk_create([
                        OrderItemModifier(
                            order_item=order_item,
                            modifier_id=modifier["modifier_id"],
                            modifier_name=modifier["modifier_name"],
                            price_at_sale=modifier["price_at_sale"],
                        )
                        for modifier in item["modifiers"]
                        for _ in range(modifier["quantity_per_unit"])
                    ])
                if late_for_closed_shift:
                    cash_sales = Order.objects.filter(
                        cash_shift=shift,
                        status=Order.Status.COMPLETADA,
                        payment_method=Order.PaymentMethod.EFECTIVO,
                    ).aggregate(total=Sum("total_amount"))["total"] or 0
                    shift.final_cash = shift.initial_cash + cash_sales
                    shift.save(update_fields=("final_cash", "updated_at"))
        except IntegrityError:
            existing = Order.objects.filter(uuid=values["uuid"]).first()
            if existing and existing.cash_shift.user_id == request.user.pk and _venta_offline_idempotente_coincide(existing, existing.cash_shift, values, subtotal, amount_paid, change_given):
                return Response(OrderReadSerializer(existing).data)
            return Response({"detail": "El turno o folio ya fue utilizado por otra venta."}, status=status.HTTP_409_CONFLICT)

        return Response(OrderReadSerializer(order).data, status=status.HTTP_201_CREATED)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated, CanOperatePOS]

    def post(self, request, order_uuid):
        serializer = CancelOrderInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["reason"]

        with transaction.atomic():
            order = (
                Order.objects.select_for_update()
                .select_related("cash_shift")
                .filter(uuid=order_uuid, cash_shift__user=request.user)
                .first()
            )
            if order is None:
                return Response(
                    {"detail": "No se encontró una venta de tu turno."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if order.status == Order.Status.ANULADA:
                if order.cancellation_reason == reason and order.cancelled_by_id == request.user.pk:
                    return Response(OrderReadSerializer(order).data)
                return Response(
                    {"detail": "La venta ya fue anulada con otros datos."},
                    status=status.HTTP_409_CONFLICT,
                )

            shift = CashShift.objects.select_for_update().get(pk=order.cash_shift_id)
            late_offline_reconciliation = (
                not shift.is_open
                and order.offline_created
                and order.requires_review
                and "después del cierre del turno" in order.review_reason
            )
            if not shift.is_open and not late_offline_reconciliation:
                return Response(
                    {"detail": "Solo se puede anular una venta mientras el turno está abierto."},
                    status=status.HTTP_409_CONFLICT,
                )

            order.status = Order.Status.ANULADA
            order.cancelled_at = timezone.now()
            order.cancellation_reason = reason
            order.cancelled_by = request.user
            fields = ["status", "cancelled_at", "cancellation_reason", "cancelled_by", "updated_at"]
            if late_offline_reconciliation:
                order.review_reason = "; ".join(filter(None, [order.review_reason, "Venta offline anulada después del cierre; validar conciliación."]))[:255]
                fields.append("review_reason")
            order.save(update_fields=fields)
            if late_offline_reconciliation:
                cash_sales = Order.objects.filter(
                    cash_shift=shift,
                    status=Order.Status.COMPLETADA,
                    payment_method=Order.PaymentMethod.EFECTIVO,
                ).aggregate(total=Sum("total_amount"))["total"] or 0
                shift.final_cash = shift.initial_cash + cash_sales
                shift.save(update_fields=("final_cash", "updated_at"))

        order.refresh_from_db()
        return Response(OrderReadSerializer(order).data)

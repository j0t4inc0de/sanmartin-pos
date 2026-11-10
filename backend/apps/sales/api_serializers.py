from django.db.models import Count, Sum
from rest_framework import serializers

from apps.catalog.models import Modifier, Product

from .models import CashShift, Order, OrderItem, OrderItemModifier


class OpenCashShiftSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    opened_at = serializers.DateTimeField()
    initial_cash = serializers.IntegerField(min_value=0, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)


class CloseCashShiftSerializer(serializers.Serializer):
    closed_at = serializers.DateTimeField()
    counted_cash = serializers.IntegerField(min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)

    def validate_closed_at(self, value):
        shift = self.context["shift"]
        if value < shift.opened_at:
            raise serializers.ValidationError(
                "La fecha de cierre no puede ser anterior a la apertura."
            )
        return value


class CashShiftSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    cash_difference = serializers.SerializerMethodField()
    sales_summary = serializers.SerializerMethodField()

    def get_cash_difference(self, shift):
        if shift.final_cash is None or shift.counted_cash is None:
            return None
        return shift.counted_cash - shift.final_cash

    def get_sales_summary(self, shift):
        totals = {
            row["payment_method"]: row
            for row in Order.objects.filter(
                cash_shift=shift,
                status=Order.Status.COMPLETADA,
                payment_method__in=[
                    Order.PaymentMethod.EFECTIVO,
                    Order.PaymentMethod.TRANSBANK,
                    Order.PaymentMethod.TRANSFERENCIA,
                ],
            )
            .values("payment_method")
            .annotate(total=Sum("total_amount"), count=Count("id"))
        }
        methods = (
            (Order.PaymentMethod.EFECTIVO, "Efectivo"),
            (Order.PaymentMethod.TRANSBANK, "Transbank"),
            (Order.PaymentMethod.TRANSFERENCIA, "Transferencia"),
        )
        return [
            {
                "payment_method": method,
                "label": label,
                "total_amount": totals.get(method, {}).get("total") or 0,
                "order_count": totals.get(method, {}).get("count") or 0,
            }
            for method, label in methods
        ]

    class Meta:
        model = CashShift
        fields = (
            "uuid",
            "username",
            "opened_at",
            "closed_at",
            "initial_cash",
            "final_cash",
            "counted_cash",
            "cash_difference",
            "sales_summary",
            "closed_automatically",
            "notes",
            "is_open",
            "updated_at",
        )


class QuoteModifierInputSerializer(serializers.Serializer):
    modifier_id = serializers.IntegerField(min_value=1)
    expected_name = serializers.CharField(max_length=50)
    expected_price = serializers.IntegerField(min_value=0)
    expected_updated_at = serializers.DateTimeField(required=False)
    quantity_per_unit = serializers.IntegerField(min_value=1)


class QuoteItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    expected_name = serializers.CharField(max_length=100)
    expected_unit_price = serializers.IntegerField(min_value=0)
    expected_updated_at = serializers.DateTimeField(required=False)
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(max_length=150, required=False, allow_blank=True)
    modifiers = QuoteModifierInputSerializer(many=True, required=False, default=list)


class OrderQuoteInputSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    shift_order_number = serializers.IntegerField(min_value=1)
    created_at = serializers.DateTimeField()
    consumption_type = serializers.ChoiceField(
        choices=["PARA_SERVIR", "PARA_LLEVAR"]
    )
    items = QuoteItemInputSerializer(many=True, allow_empty=False)

    def validate(self, attrs):
        for indice, linea in enumerate(attrs["items"]):
            product = Product.objects.filter(
                pk=linea["product_id"], is_active=True, is_available=True
            ).first()
            if product is None:
                raise serializers.ValidationError(
                    {"items": {indice: {"product_id": "El producto no existe o no está disponible."}}}
                )
            vistos: set[int] = set()
            for modifier_data in linea["modifiers"]:
                modifier = Modifier.objects.filter(
                    pk=modifier_data["modifier_id"],
                    is_active=True,
                    is_available=True,
                ).first()
                if modifier is None:
                    raise serializers.ValidationError(
                        {"items": {indice: {"modifiers": "Hay un modificador no disponible."}}}
                    )
                if modifier.pk in vistos:
                    raise serializers.ValidationError(
                        {"items": {indice: {"modifiers": "Envía cada modificador una vez e indica su cantidad por unidad."}}}
                    )
                vistos.add(modifier.pk)
                if (
                    modifier.modifier_type == Modifier.ModifierType.EXCLUSION_COCINA
                    and modifier_data["quantity_per_unit"] != 1
                ):
                    raise serializers.ValidationError(
                        {"items": {indice: {"modifiers": "Una exclusión de cocina no se puede repetir."}}}
                    )
        return attrs


class OrderPaymentInputSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    shift_order_number = serializers.IntegerField(min_value=1)
    quote_token = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=["EFECTIVO", "TRANSBANK", "TRANSFERENCIA"])
    amount_received = serializers.IntegerField(min_value=0, required=False)
    confirm_repriced = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        if attrs["payment_method"] == "EFECTIVO" and "amount_received" not in attrs:
            raise serializers.ValidationError(
                {"amount_received": "Indica cuánto efectivo entregó el cliente."}
            )
        if attrs["payment_method"] != "EFECTIVO" and "amount_received" in attrs:
            raise serializers.ValidationError(
                {"amount_received": "Este dato solo se registra para pagos en efectivo."}
            )
        return attrs


class OfflineOrderModifierInputSerializer(serializers.Serializer):
    modifier_id = serializers.IntegerField(min_value=1)
    modifier_name = serializers.CharField(max_length=50)
    quantity_per_unit = serializers.IntegerField(min_value=1)
    price_at_sale = serializers.IntegerField(min_value=0)


class OfflineOrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    product_name = serializers.CharField(max_length=100)
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.IntegerField(min_value=0)
    notes = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    modifiers = OfflineOrderModifierInputSerializer(many=True, required=False, default=list)


class OfflineOrderSyncInputSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    shift_order_number = serializers.IntegerField(min_value=1)
    shift_uuid = serializers.UUIDField()
    created_at = serializers.DateTimeField()
    offline_created = serializers.BooleanField()
    consumption_type = serializers.ChoiceField(choices=["PARA_SERVIR", "PARA_LLEVAR"])
    payment_method = serializers.ChoiceField(choices=["EFECTIVO", "TRANSBANK", "TRANSFERENCIA"])
    amount_received = serializers.IntegerField(min_value=0, required=False)
    items = OfflineOrderItemInputSerializer(many=True, allow_empty=False)

    def validate(self, attrs):
        if not attrs["offline_created"]:
            raise serializers.ValidationError({"offline_created": "La ruta de sincronización acepta solo ventas creadas offline."})
        if attrs["payment_method"] == "EFECTIVO" and "amount_received" not in attrs:
            raise serializers.ValidationError({"amount_received": "Indica el efectivo recibido."})
        if attrs["payment_method"] != "EFECTIVO" and "amount_received" in attrs:
            raise serializers.ValidationError({"amount_received": "Este dato solo se registra para pagos en efectivo."})

        for index, item in enumerate(attrs["items"]):
            if not Product.objects.filter(pk=item["product_id"]).exists():
                raise serializers.ValidationError({"items": {index: {"product_id": "El producto ya no existe en el catálogo."}}})
            seen = set()
            for modifier_data in item["modifiers"]:
                modifier = Modifier.objects.filter(pk=modifier_data["modifier_id"]).first()
                if modifier is None:
                    raise serializers.ValidationError({"items": {index: {"modifiers": "Un modificador ya no existe en el catálogo."}}})
                if modifier.pk in seen:
                    raise serializers.ValidationError({"items": {index: {"modifiers": "Envía cada modificador una sola vez."}}})
                seen.add(modifier.pk)
                if modifier.modifier_type == Modifier.ModifierType.EXCLUSION_COCINA and modifier_data["quantity_per_unit"] != 1:
                    raise serializers.ValidationError({"items": {index: {"modifiers": "Una exclusión de cocina no se puede repetir."}}})
        return attrs


class CancelOrderInputSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, min_length=1, trim_whitespace=True)


class OrderItemModifierReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItemModifier
        fields = ("modifier_name", "price_at_sale")


class OrderItemReadSerializer(serializers.ModelSerializer):
    modifiers = OrderItemModifierReadSerializer(many=True, read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ("product_name", "quantity", "unit_price", "notes", "modifiers", "line_total")

    def get_line_total(self, item):
        extras_per_unit = sum(modifier.price_at_sale for modifier in item.modifiers.all())
        return item.quantity * (item.unit_price + extras_per_unit)


class OrderReadSerializer(serializers.ModelSerializer):
    shift_uuid = serializers.UUIDField(source="cash_shift.uuid", read_only=True)
    items = OrderItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "uuid",
            "shift_uuid",
            "shift_order_number",
            "created_at",
            "received_at",
            "offline_created",
            "consumption_type",
            "payment_method",
            "subtotal",
            "delivery_fee",
            "total_amount",
            "amount_paid",
            "change_given",
            "status",
            "cancelled_at",
            "cancellation_reason",
            "cancelled_by",
            "requires_review",
            "review_reason",
            "items",
        )

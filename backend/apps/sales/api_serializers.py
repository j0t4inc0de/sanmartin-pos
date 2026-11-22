import unicodedata

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
    counted_cash = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    closed_automatically = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs["closed_automatically"] and attrs.get("counted_cash") is not None:
            raise serializers.ValidationError({"counted_cash": "El cierre automático no puede incluir arqueo físico."})
        if not attrs["closed_automatically"] and attrs.get("counted_cash") is None:
            raise serializers.ValidationError({"counted_cash": "El cierre manual requiere el efectivo contado."})
        return attrs

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
    protein_choice = serializers.ChoiceField(choices=["CHURRASCO", "LOMO", "MECHADA", "POLLO", "HAMBURGUESA"], required=False, allow_blank=True, default="")
    modifiers = QuoteModifierInputSerializer(many=True, required=False, default=list)


class OrderQuoteInputSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    shift_order_number = serializers.IntegerField(min_value=1)
    created_at = serializers.DateTimeField()
    customer_name = serializers.CharField(max_length=100, trim_whitespace=True)
    consumption_type = serializers.ChoiceField(
        choices=["PARA_SERVIR", "PARA_LLEVAR"]
    )
    is_delivery = serializers.BooleanField(required=False, default=None, allow_null=True)
    delivery_address = serializers.CharField(max_length=250, required=False, allow_blank=True, trim_whitespace=True, default="")
    delivery_fee = serializers.IntegerField(min_value=0, required=False, default=0)
    items = QuoteItemInputSerializer(many=True, allow_empty=False)

    def validate(self, attrs):
        delivery_fee = attrs.get("delivery_fee", 0)
        legacy_payload = "is_delivery" not in self.initial_data
        is_delivery = attrs.get("is_delivery")
        if is_delivery is None:
            # Older POS builds used a positive fee as the delivery marker.
            is_delivery = bool(delivery_fee)
            attrs["is_delivery"] = is_delivery
        delivery_address = attrs["delivery_address"]
        if (delivery_fee or is_delivery or delivery_address) and attrs["consumption_type"] != "PARA_LLEVAR":
            field = "delivery_fee" if delivery_fee else "consumption_type"
            raise serializers.ValidationError({field: "El delivery solo aplica a pedidos para llevar."})
        if delivery_fee and not is_delivery:
            raise serializers.ValidationError({"is_delivery": "Activa delivery para agregar un costo de despacho."})
        if is_delivery and not delivery_address and not legacy_payload:
            raise serializers.ValidationError({"delivery_address": "Ingresa la dirección del pedido delivery."})
        if not is_delivery and delivery_address:
            raise serializers.ValidationError({"delivery_address": "La dirección solo se usa en pedidos delivery."})
        for indice, linea in enumerate(attrs["items"]):
            product = Product.objects.filter(
                pk=linea["product_id"], is_active=True, is_available=True
            ).first()
            if product is None:
                nombre_prod = linea.get("expected_name") or f"ID #{linea['product_id']}"
                raise serializers.ValidationError(
                    {"items": {indice: {"product_id": f"El producto '{nombre_prod}' no existe o no está disponible."}}}
                )
            protein_choice = linea.get("protein_choice", "")
            if product_accepts_protein_choice(product) and not protein_choice:
                raise serializers.ValidationError({"items": {indice: {"protein_choice": "Selecciona la proteína de este sándwich."}}})
            if protein_choice and not product_accepts_protein_choice(product):
                raise serializers.ValidationError({"items": {indice: {"protein_choice": "Este producto no permite elegir proteína."}}})
            vistos: set[int] = set()
            for modifier_data in linea["modifiers"]:
                modifier = Modifier.objects.filter(
                    pk=modifier_data["modifier_id"],
                ).first()
                nombre_mod = modifier_data.get("expected_name") or (modifier.name if modifier else f"ID #{modifier_data['modifier_id']}")
                if modifier is None or not modifier.is_active or not modifier.is_available:
                    raise serializers.ValidationError(
                        {"items": {indice: {"modifiers": f"El modificador '{nombre_mod}' no está disponible o no existe en el catálogo."}}}
                    )
                if modifier.pk in vistos:
                    raise serializers.ValidationError(
                        {"items": {indice: {"modifiers": f"Envía cada modificador una vez e indica su cantidad por unidad ({nombre_mod})."}}}
                    )
                vistos.add(modifier.pk)
                if (
                    modifier.modifier_type == Modifier.ModifierType.EXCLUSION_COCINA
                    and modifier_data["quantity_per_unit"] != 1
                ):
                    raise serializers.ValidationError(
                        {"items": {indice: {"modifiers": f"Una exclusión de cocina no se puede repetir ({nombre_mod})."}}}
                    )
        return attrs


def product_accepts_protein_choice(product):
    if product.category.slug != "sandwiches":
        return False
    normalize = lambda value: "".join(
        character for character in unicodedata.normalize("NFD", value.lower())
        if unicodedata.category(character) != "Mn"
    )
    searchable = " ".join([product.description, *product.ingredients])
    normalized = normalize(searchable)
    return "proteina a eleccion" in normalized and "vegetariano" not in normalize(product.name)


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
    protein_choice = serializers.ChoiceField(choices=["CHURRASCO", "LOMO", "MECHADA", "POLLO", "HAMBURGUESA"], required=False, allow_blank=True, default="")
    modifiers = OfflineOrderModifierInputSerializer(many=True, required=False, default=list)


class OfflineOrderSyncInputSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    shift_order_number = serializers.IntegerField(min_value=1)
    shift_uuid = serializers.UUIDField()
    created_at = serializers.DateTimeField()
    offline_created = serializers.BooleanField()
    consumption_type = serializers.ChoiceField(choices=["PARA_SERVIR", "PARA_LLEVAR"])
    is_delivery = serializers.BooleanField(required=False, default=None, allow_null=True)
    delivery_address = serializers.CharField(max_length=250, required=False, allow_blank=True, trim_whitespace=True, default="")
    delivery_fee = serializers.IntegerField(min_value=0, required=False, default=0)
    # Los clientes POS anteriores pueden conservar ventas pendientes en IndexedDB.
    # La interfaz actual siempre exige el nombre; este valor permite sincronizar esas ventas antiguas.
    customer_name = serializers.CharField(
        max_length=100,
        trim_whitespace=True,
        required=False,
        default="Sin nombre",
    )
    payment_method = serializers.ChoiceField(choices=["EFECTIVO", "TRANSBANK", "TRANSFERENCIA"])
    amount_received = serializers.IntegerField(min_value=0, required=False)
    items = OfflineOrderItemInputSerializer(many=True, allow_empty=False)

    def validate(self, attrs):
        if not attrs["offline_created"]:
            raise serializers.ValidationError({"offline_created": "La ruta de sincronización acepta solo ventas creadas offline."})
        legacy_payload = "is_delivery" not in self.initial_data
        is_delivery = attrs.get("is_delivery")
        if is_delivery is None:
            # Older offline drafts used a positive fee as the only delivery marker.
            is_delivery = bool(attrs["delivery_fee"])
            attrs["is_delivery"] = is_delivery
        if (attrs["delivery_fee"] or is_delivery or attrs["delivery_address"]) and attrs["consumption_type"] != "PARA_LLEVAR":
            raise serializers.ValidationError({"consumption_type": "El delivery solo aplica a pedidos para llevar."})
        if attrs["delivery_fee"] and not is_delivery:
            raise serializers.ValidationError({"is_delivery": "Activa delivery para agregar un costo de despacho."})
        if is_delivery and not attrs["delivery_address"] and not legacy_payload:
            raise serializers.ValidationError({"delivery_address": "Ingresa la dirección del pedido delivery."})
        if not is_delivery and attrs["delivery_address"]:
            raise serializers.ValidationError({"delivery_address": "La dirección solo se usa en pedidos delivery."})
        if attrs["payment_method"] == "EFECTIVO" and "amount_received" not in attrs:
            raise serializers.ValidationError({"amount_received": "Indica el efectivo recibido."})
        if attrs["payment_method"] != "EFECTIVO" and "amount_received" in attrs:
            raise serializers.ValidationError({"amount_received": "Este dato solo se registra para pagos en efectivo."})

        for index, item in enumerate(attrs["items"]):
            product = Product.objects.filter(pk=item["product_id"]).first()
            if product is None:
                nombre_prod = item.get("expected_name") or f"ID #{item['product_id']}"
                raise serializers.ValidationError({"items": {index: {"product_id": f"El producto '{nombre_prod}' ya no existe en el catálogo."}}})
            seen = set()
            for modifier_data in item["modifiers"]:
                modifier = Modifier.objects.filter(pk=modifier_data["modifier_id"]).first()
                nombre_mod = modifier_data.get("expected_name") or (modifier.name if modifier else f"ID #{modifier_data['modifier_id']}")
                if modifier is None:
                    raise serializers.ValidationError({"items": {index: {"modifiers": f"El modificador '{nombre_mod}' ya no existe en el catálogo."}}})
                if modifier.pk in seen:
                    raise serializers.ValidationError({"items": {index: {"modifiers": f"Envía cada modificador una sola vez ({nombre_mod})."}}})
                seen.add(modifier.pk)
                if modifier.modifier_type == Modifier.ModifierType.EXCLUSION_COCINA and modifier_data["quantity_per_unit"] != 1:
                    raise serializers.ValidationError({"items": {index: {"modifiers": f"Una exclusión de cocina no se puede repetir ({nombre_mod})."}}})
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
        fields = ("product_name", "quantity", "unit_price", "notes", "protein_choice", "modifiers", "line_total")

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
            "customer_name",
            "is_delivery",
            "delivery_address",
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

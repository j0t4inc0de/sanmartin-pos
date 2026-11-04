import uuid

from django.conf import settings
from django.db import models
from django.db.models import F, Q, Value

from apps.catalog.models import Modifier, Product


class CashShift(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="cash_shifts",
    )
    opened_at = models.DateTimeField()
    closed_at = models.DateTimeField(null=True, blank=True)
    initial_cash = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cash_shifts"
        permissions = [("can_operate_pos", "Puede operar la caja del POS")]
        constraints = [
            models.UniqueConstraint(
                Value(1),
                condition=Q(closed_at__isnull=True),
                name="one_open_shift_per_local",
            ),
        ]
        indexes = [models.Index(fields=["user", "opened_at"], name="shift_user_opened_idx")]
        ordering = ["-opened_at", "-id"]
        verbose_name = "Turno de caja"
        verbose_name_plural = "Turnos de caja"

    @property
    def is_open(self) -> bool:
        return self.closed_at is None

    def __str__(self) -> str:
        return f"Turno {self.uuid} ({'abierto' if self.is_open else 'cerrado'})"


class Order(models.Model):
    class ConsumptionType(models.TextChoices):
        PARA_SERVIR = "PARA_SERVIR", "Para servir"
        PARA_LLEVAR = "PARA_LLEVAR", "Para llevar"
        CONSUMO_PROPIO = "CONSUMO_PROPIO", "Consumo propio"
        DELIVERY = "DELIVERY", "Delivery"
        RETIRO = "RETIRO", "Retiro"

    class PaymentMethod(models.TextChoices):
        EFECTIVO = "EFECTIVO", "Efectivo"
        TRANSBANK = "TRANSBANK", "Transbank (débito o crédito)"
        TRANSFERENCIA = "TRANSFERENCIA", "Transferencia"
        SIN_COSTO_CONSUMO_PROPIO = "SIN_COSTO_CONSUMO_PROPIO", "Sin costo / consumo propio"

    class Status(models.TextChoices):
        COMPLETADA = "COMPLETADA", "Completada"
        ANULADA = "ANULADA", "Anulada"

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    cash_shift = models.ForeignKey(CashShift, on_delete=models.PROTECT, related_name="orders")
    shift_order_number = models.PositiveIntegerField()
    created_at = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)
    offline_created = models.BooleanField(default=False)
    consumption_type = models.CharField(
        max_length=30,
        choices=ConsumptionType.choices,
        default=ConsumptionType.PARA_LLEVAR,
    )
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices)
    subtotal = models.PositiveIntegerField()
    delivery_fee = models.PositiveIntegerField(default=0)
    total_amount = models.PositiveIntegerField()
    amount_paid = models.PositiveIntegerField(null=True, blank=True)
    change_given = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETADA)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=255, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="cancelled_orders",
        null=True,
        blank=True,
    )
    requires_review = models.BooleanField(default=False)
    review_reason = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        constraints = [
            models.UniqueConstraint(
                fields=["cash_shift", "shift_order_number"],
                name="unique_shift_order_number",
            ),
            models.CheckConstraint(
                condition=Q(total_amount=F("subtotal") + F("delivery_fee")),
                name="order_total_matches_components",
            ),
            models.CheckConstraint(
                condition=Q(consumption_type="DELIVERY") | Q(delivery_fee=0),
                name="delivery_fee_only_for_delivery",
            ),
            models.CheckConstraint(
                condition=Q(shift_order_number__gte=1),
                name="shift_order_number_positive",
            ),
            models.CheckConstraint(
                condition=(
                    Q(
                        payment_method="EFECTIVO",
                        amount_paid__isnull=False,
                        change_given__isnull=False,
                        amount_paid=F("total_amount") + F("change_given"),
                    )
                    | Q(
                        payment_method__in=["TRANSBANK", "TRANSFERENCIA"],
                        amount_paid__isnull=True,
                        change_given__isnull=True,
                    )
                    | Q(
                        payment_method="SIN_COSTO_CONSUMO_PROPIO",
                        total_amount=0,
                        amount_paid__isnull=True,
                        change_given__isnull=True,
                    )
                ),
                name="order_payment_amounts_consistent",
            ),
        ]
        indexes = [
            models.Index(fields=["cash_shift", "status"], name="order_shift_status_idx"),
            models.Index(fields=["created_at", "status"], name="order_created_status_idx"),
        ]
        ordering = ["cash_shift_id", "shift_order_number"]
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"

    def __str__(self) -> str:
        return f"Comanda #{self.shift_order_number:03d} — ${self.total_amount:,} CLP"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    product_name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.PositiveIntegerField()
    notes = models.CharField(max_length=150, blank=True)

    class Meta:
        db_table = "order_items"
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gte=1),
                name="order_item_quantity_positive",
            ),
        ]
        indexes = [models.Index(fields=["product"], name="item_product_idx")]
        verbose_name = "Producto vendido"
        verbose_name_plural = "Productos vendidos"

    def __str__(self) -> str:
        return f"{self.quantity} × {self.product_name}"


class OrderItemModifier(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name="modifiers")
    modifier = models.ForeignKey(Modifier, on_delete=models.PROTECT, related_name="order_item_modifiers")
    modifier_name = models.CharField(max_length=50)
    price_at_sale = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "order_item_modifiers"
        indexes = [models.Index(fields=["modifier"], name="item_modifier_modifier_idx")]
        verbose_name = "Modificador vendido"
        verbose_name_plural = "Modificadores vendidos"

    def __str__(self) -> str:
        return self.modifier_name

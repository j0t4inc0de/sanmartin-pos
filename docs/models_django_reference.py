"""
==============================================================================
MODELOS DJANGO 5.x DE REFERENCIA: POS FOOD TRUCK SAN MARTIN
Stack: Django 5.x + Django REST Framework + PostgreSQL 16
Arquitectura: Cero Sobreingeniería + Soporte Offline-First (Idempotencia y Delta Sync)
Diseñado para implementación en jota-server.
==============================================================================
"""

import uuid
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


# ==============================================================================
# 1. ACCESO Y SEGURIDAD
# ==============================================================================
class User(AbstractUser):
    """
    Usuario del mesón POS. Extiende AbstractUser nativo de Django.
    """
    pass

    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario POS'
        verbose_name_plural = 'Usuarios POS'


# ==============================================================================
# 2. CATALOGO MAESTRO (POS + CARTA DIGITAL QR + LANDING)
# ==============================================================================
class Category(models.Model):
    """
    Categorías de sándwiches y agregados (Churrascos, Mechadas, Lomitos, etc.)
    """
    name = models.CharField(max_length=50, verbose_name="Nombre")
    slug = models.SlugField(max_length=50, unique=True, verbose_name="Slug URL")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="Orden de visualización")
    is_active = models.BooleanField(default=True, verbose_name="Activo (Soft Delete)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última modificación (Delta Sync)")

    class Meta:
        db_table = 'categories'
        ordering = ['sort_order', 'id']
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Catálogo de productos vendibles en el mesón y visibles en la carta online.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name="Categoría"
    )
    name = models.CharField(max_length=100, verbose_name="Nombre del producto")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción comercial")
    ingredients = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Lista de ingredientes (array string[] para filtros frontend)"
    )
    price = models.PositiveIntegerField(verbose_name="Precio CLP")
    original_price = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Precio original/referencia (para promociones online)"
    )
    image_url = models.CharField(max_length=500, blank=True, null=True, verbose_name="URL Imagen")
    badge = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Insignia (ej. Más Vendido ⭐)"
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name="Disponible hoy (switch operativo rápido mesonero)"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Vigente en carta (soft delete para descontinuar)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de alta")
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última modificación (permite al POS descargar solo deltas)"
    )

    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['category'], name='idx_products_category'),
            models.Index(fields=['is_active', 'is_available'], name='idx_products_active_avail'),
            models.Index(fields=['updated_at'], name='idx_products_updated_at'),
        ]
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return f"{self.name} - ${self.price:,} CLP"


class Modifier(models.Model):
    """
    Agregados pagados (ej. extra queso mantecoso) o exclusiones sin costo (sin mayo).
    """
    class ModifierType(models.TextChoices):
        EXTRA_PAGO = 'EXTRA_PAGO', 'Extra con Pago'
        EXCLUSION_COCINA = 'EXCLUSION_COCINA', 'Exclusión de Cocina (Sin Costo)'

    name = models.CharField(max_length=50, verbose_name="Nombre del extra/modificador")
    price = models.PositiveIntegerField(default=0, verbose_name="Precio adicional en CLP")
    modifier_type = models.CharField(
        max_length=20,
        choices=ModifierType.choices,
        default=ModifierType.EXTRA_PAGO,
        verbose_name="Tipo de modificador"
    )
    is_available = models.BooleanField(default=True, verbose_name="Disponible hoy")
    is_active = models.BooleanField(default=True, verbose_name="Vigente (Soft Delete)")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última modificación")

    class Meta:
        db_table = 'modifiers'
        indexes = [
            models.Index(fields=['is_active', 'is_available'], name='idx_modifiers_active_avail'),
        ]
        verbose_name = 'Modificador / Agregado'
        verbose_name_plural = 'Modificadores / Agregados'

    def __str__(self):
        return f"{self.name} (+${self.price})" if self.price > 0 else f"{self.name} ($0)"


# ==============================================================================
# 3. OPERACION TRANSACCIONAL Y ARQUEO DE CAJA (OFFLINE-FIRST)
# ==============================================================================
class CashShift(models.Model):
    """
    Turno de caja diario. Al abrirlo, el daily_order_number de orders se reinicia a 1.
    Soporta apertura offline mediante UUID universal generado por el POS.
    """
    uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name="UUID Universal Offline"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='cash_shifts',
        verbose_name="Cajero / Usuario responsable"
    )
    opened_at = models.DateTimeField(auto_now_add=True, verbose_name="Apertura de turno")
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name="Cierre de turno")
    initial_cash = models.PositiveIntegerField(
        default=0,
        verbose_name="Fondo inicial de cambio / sencillo"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Observaciones de cuadratura")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última modificación")

    class Meta:
        db_table = 'cash_shifts'
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=Q(closed_at__isnull=True),
                name='uidx_cash_shifts_single_open'
            )
        ]
        verbose_name = 'Turno de Caja'
        verbose_name_plural = 'Turnos de Caja'

    @property
    def is_open(self):
        return self.closed_at is None

    def __str__(self):
        estado = "ABIERTO" if self.is_open else "CERRADO"
        return f"Turno #{self.id} ({estado}) - Apertura: {self.opened_at.strftime('%d/%m/%Y %H:%M')}"


class Order(models.Model):
    """
    Cabecera de comanda / venta en mesón, delivery o retiro.
    El campo uuid actúa como Idempotency Key para sincronización offline segura sin duplicados.
    """
    class ConsumptionType(models.TextChoices):
        PARA_SERVIR = 'PARA_SERVIR', 'Para Servir en Mesa'
        PARA_LLEVAR = 'PARA_LLEVAR', 'Para Llevar / Retiro Inmediato'
        CONSUMO_PROPIO = 'CONSUMO_PROPIO', 'Consumo Propio / Colación Personal ($0)'
        DELIVERY = 'DELIVERY', 'Delivery a Domicilio'
        RETIRO = 'RETIRO', 'Retiro Pedido Anticipado (WhatsApp)'

    class PaymentMethod(models.TextChoices):
        EFECTIVO = 'EFECTIVO', 'Efectivo'
        DEBITO_TRANSBANK = 'DEBITO_TRANSBANK', 'Débito / Transbank POS'
        TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia Bancaria'
        SIN_COSTO_CONSUMO_PROPIO = 'SIN_COSTO_CONSUMO_PROPIO', 'Sin Costo (Colación Personal)'

    class OrderStatus(models.TextChoices):
        COMPLETADA = 'COMPLETADA', 'Completada / Cobrada'
        ANULADA = 'ANULADA', 'Anulada / Cancelada'

    uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name="UUID Idempotente Offline"
    )
    cash_shift = models.ForeignKey(
        CashShift,
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name="Turno de caja"
    )
    daily_order_number = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Número de comanda diario (#001, #002...)"
    )
    created_at = models.DateTimeField(
        verbose_name="Fecha y hora de cobro en POS (Base para Horas Punta)"
    )
    consumption_type = models.CharField(
        max_length=30,
        choices=ConsumptionType.choices,
        default=ConsumptionType.PARA_LLEVAR,
        verbose_name="Tipo de consumo"
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        verbose_name="Método de pago"
    )
    subtotal = models.PositiveIntegerField(verbose_name="Subtotal productos y agregados")
    delivery_fee = models.PositiveIntegerField(default=0, verbose_name="Recargo por delivery")
    total_amount = models.PositiveIntegerField(verbose_name="Total cobrado (subtotal + delivery)")
    amount_paid = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Efectivo recibido del cliente"
    )
    change_given = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Vuelto entregado al cliente"
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.COMPLETADA,
        verbose_name="Estado de la orden"
    )
    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Momento de anulación"
    )
    cancellation_reason = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Motivo de anulación (auditoría de caja)"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última modificación")

    class Meta:
        db_table = 'orders'
        constraints = [
            models.UniqueConstraint(
                fields=['cash_shift', 'daily_order_number'],
                name='uidx_orders_shift_daily_number'
            )
        ]
        indexes = [
            models.Index(fields=['cash_shift', 'status'], name='idx_orders_shift_status'),
            models.Index(fields=['created_at', 'status'], name='idx_orders_created_status'),
        ]
        verbose_name = 'Orden / Venta'
        verbose_name_plural = 'Órdenes / Ventas'

    def __str__(self):
        return f"Comanda #{self.daily_order_number:03d} - ${self.total_amount:,} CLP ({self.status})"


class OrderItem(models.Model):
    """
    Línea de sándwich o producto dentro de la comanda.
    Inmutabilidad: almacena product_name y unit_price congelados para proteger ventas pasadas.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Orden"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items',
        verbose_name="Producto del catálogo"
    )
    product_name = models.CharField(
        max_length=100,
        verbose_name="Nombre histórico congelado al momento del cobro"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="Cantidad"
    )
    unit_price = models.PositiveIntegerField(
        verbose_name="Precio unitario congelado a la venta"
    )
    notes = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Instrucción de plancha (ej. Pan bien dorado)"
    )

    class Meta:
        db_table = 'order_items'
        indexes = [
            models.Index(fields=['order'], name='idx_order_items_order'),
            models.Index(fields=['product'], name='idx_order_items_product'),
        ]
        verbose_name = 'Línea de Comanda'
        verbose_name_plural = 'Líneas de Comanda'

    def __str__(self):
        return f"{self.quantity}x {self.product_name} (${self.unit_price:,} c/u)"


class OrderItemModifier(models.Model):
    """
    Agregado o exclusión asociado a un sándwich específico en la comanda.
    Permite a la impresora térmica tabular los agregados directamente debajo del pan.
    """
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name='modifiers',
        verbose_name="Ítem del sándwich"
    )
    modifier = models.ForeignKey(
        Modifier,
        on_delete=models.PROTECT,
        related_name='order_item_modifiers',
        verbose_name="Modificador del catálogo"
    )
    modifier_name = models.CharField(
        max_length=50,
        verbose_name="Nombre congelado del extra o exclusión"
    )
    price_at_sale = models.PositiveIntegerField(
        default=0,
        verbose_name="Precio congelado a la fecha de venta"
    )

    class Meta:
        db_table = 'order_item_modifiers'
        indexes = [
            models.Index(fields=['order_item'], name='idx_item_mod_item'),
            models.Index(fields=['modifier'], name='idx_item_mod_mod'),
        ]
        verbose_name = 'Modificador de Línea'
        verbose_name_plural = 'Modificadores de Línea'

    def __str__(self):
        return f"{self.modifier_name} (+${self.price_at_sale})"

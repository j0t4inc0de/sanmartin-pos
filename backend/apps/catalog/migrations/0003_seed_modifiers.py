from django.db import migrations

INITIAL_MODIFIERS = [
    {"name": "Tomate (3 rodajas)", "price": 500, "modifier_type": "EXTRA_PAGO"},
    {"name": "Palta", "price": 1000, "modifier_type": "EXTRA_PAGO"},
    {"name": "Americana", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Chucrut", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Lechuga", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Pepinillo", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Queso mantecoso (1.5 láminas)", "price": 1000, "modifier_type": "EXTRA_PAGO"},
    {"name": "Queso mozzarella (3 láminas)", "price": 1000, "modifier_type": "EXTRA_PAGO"},
    {"name": "Queso cheddar (3 láminas)", "price": 1000, "modifier_type": "EXTRA_PAGO"},
    {"name": "Cebolla caramelizada", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Tocino", "price": 1000, "modifier_type": "EXTRA_PAGO"},
    {"name": "Papa hilo", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Poroto verde", "price": 700, "modifier_type": "EXTRA_PAGO"},
    {"name": "Ají verde", "price": 0, "modifier_type": "EXTRA_PAGO"},
    {"name": "Sin cebolla", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
    {"name": "Sin mayo", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
    {"name": "Sin tomate", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
    {"name": "Sin chucrut", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
    {"name": "Sin ají", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
    {"name": "Sin mostaza", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
    {"name": "Sin ketchup", "price": 0, "modifier_type": "EXCLUSION_COCINA"},
]


def seed_modifiers(apps, schema_editor):
    Modifier = apps.get_model("catalog", "Modifier")
    database = schema_editor.connection.alias

    for item in INITIAL_MODIFIERS:
        Modifier.objects.using(database).get_or_create(
            name=item["name"],
            defaults={
                "price": item["price"],
                "modifier_type": item["modifier_type"],
                "is_available": True,
                "is_active": True,
            },
        )


def unseed_modifiers(apps, schema_editor):
    # Backward migration is noop to avoid deleting user-customized modifiers
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_product_slug"),
    ]

    operations = [
        migrations.RunPython(seed_modifiers, reverse_code=unseed_modifiers),
    ]

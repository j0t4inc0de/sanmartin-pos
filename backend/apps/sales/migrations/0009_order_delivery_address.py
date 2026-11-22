from django.db import migrations, models


def mark_existing_delivery_orders(apps, schema_editor):
    Order = apps.get_model("sales", "Order")
    Order.objects.filter(delivery_fee__gt=0).update(is_delivery=True)


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0008_alter_order_consumption_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="is_delivery",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_address",
            field=models.CharField(blank=True, default="", max_length=250),
        ),
        migrations.RunPython(mark_existing_delivery_orders, migrations.RunPython.noop),
    ]

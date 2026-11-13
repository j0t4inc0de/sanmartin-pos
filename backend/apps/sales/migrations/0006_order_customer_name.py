from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0005_cashshift_closed_automatically_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="customer_name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]

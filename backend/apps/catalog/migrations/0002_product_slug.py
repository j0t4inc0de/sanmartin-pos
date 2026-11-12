from django.db import migrations, models
from django.utils.text import slugify


def asignar_slugs_a_productos_existentes(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    database = schema_editor.connection.alias
    usados = set()

    for product in Product.objects.using(database).order_by("pk").iterator():
        base = slugify(product.name) or f"producto-{product.pk}"
        slug = base[:90]
        if slug in usados:
            slug = f"{base[:90]}-{product.pk}"
        usados.add(slug)
        Product.objects.using(database).filter(pk=product.pk).update(slug=slug)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="slug",
            field=models.SlugField(
                blank=True,
                db_index=False,
                default="",
                max_length=100,
            ),
        ),
        migrations.RunPython(
            asignar_slugs_a_productos_existentes,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="product",
            name="slug",
            field=models.SlugField(max_length=100, unique=True),
        ),
    ]

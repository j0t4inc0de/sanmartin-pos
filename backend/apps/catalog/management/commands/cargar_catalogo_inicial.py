import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import Category, Product


class Command(BaseCommand):
    help = "Carga el catálogo inicial sin sobrescribir datos existentes."

    def handle(self, *args, **options):
        fixture_path = Path(__file__).resolve().parents[2] / "fixtures" / "catalogo_inicial.json"
        try:
            with fixture_path.open(encoding="utf-8") as fixture_file:
                catalog = json.load(fixture_file)
        except (OSError, json.JSONDecodeError) as error:
            raise CommandError(f"No se pudo leer el catálogo inicial: {error}") from error

        category_rows = catalog.get("categories", [])
        product_rows = catalog.get("products", [])
        category_slugs = {row.get("slug") for row in category_rows}
        if None in category_slugs or len(category_slugs) != len(category_rows):
            raise CommandError("El archivo contiene categorías sin slug o slugs repetidos.")

        product_slugs = [row.get("slug") for row in product_rows]
        if None in product_slugs or len(set(product_slugs)) != len(product_slugs):
            raise CommandError("El archivo contiene productos sin slug o slugs repetidos.")

        missing_categories = sorted(
            {row.get("category") for row in product_rows} - category_slugs
        )
        if missing_categories:
            raise CommandError(
                "Hay productos asociados a categorías inexistentes: "
                + ", ".join(missing_categories)
            )

        categories_by_slug = {}
        created_categories = 0
        created_products = 0

        with transaction.atomic():
            for row in category_rows:
                category, created = Category.objects.get_or_create(
                    slug=row["slug"],
                    defaults={
                        "name": row["name"],
                        "sort_order": row.get("sort_order", 0),
                        "is_active": True,
                    },
                )
                categories_by_slug[row["slug"]] = category
                created_categories += int(created)

            for row in product_rows:
                if not isinstance(row.get("price"), int) or row["price"] < 0:
                    raise CommandError(f"El precio de {row.get('slug', 'un producto')} no es válido.")

                _, created = Product.objects.get_or_create(
                    slug=row["slug"],
                    defaults={
                        "category": categories_by_slug[row["category"]],
                        "name": row["name"],
                        "description": row.get("description", ""),
                        "ingredients": row.get("ingredients", []),
                        "price": row["price"],
                        "original_price": row.get("original_price"),
                        "image_url": row.get("image_url", ""),
                        "badge": row.get("badge", ""),
                        "is_available": row.get("is_available", True),
                        "is_active": row.get("is_active", True),
                    },
                )
                created_products += int(created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Catálogo inicial cargado: {created_categories} categorías y "
                f"{created_products} productos nuevos. Los registros existentes se conservaron."
            )
        )

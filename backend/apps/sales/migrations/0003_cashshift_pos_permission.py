from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("sales", "0002_initial")]

    operations = [
        migrations.AlterModelOptions(
            name="cashshift",
            options={
                "ordering": ["-opened_at", "-id"],
                "permissions": [("can_operate_pos", "Puede operar la caja del POS")],
                "verbose_name": "Turno de caja",
                "verbose_name_plural": "Turnos de caja",
            },
        ),
    ]

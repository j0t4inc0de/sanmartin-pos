from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Usuario del sistema; contraseñas y permisos los administra Django."""

    class Meta:
        db_table = "users"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

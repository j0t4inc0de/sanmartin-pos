from rest_framework.permissions import BasePermission


class CanOperatePOS(BasePermission):
    message = "La cuenta no tiene permiso para operar el POS."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.has_perm("sales.can_operate_pos"))
        )

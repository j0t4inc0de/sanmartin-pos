from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .api_serializers import LoginSerializer, SessionUserSerializer


def _puede_operar_pos(user):
    return user.is_superuser or user.has_perm("sales.can_operate_pos")


def _datos_usuario(user):
    return {
        "id": user.pk,
        "username": user.get_username(),
        "can_operate_pos": _puede_operar_pos(user),
    }


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @method_decorator(csrf_protect)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request=request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Usuario o contraseña no válidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not _puede_operar_pos(user):
            return Response(
                {"detail": "La cuenta no tiene permiso para operar el POS."},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)
        return Response({"user": SessionUserSerializer(_datos_usuario(user)).data})


class CurrentSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _puede_operar_pos(request.user):
            return Response(
                {"detail": "La cuenta no tiene permiso para operar el POS."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({"user": SessionUserSerializer(_datos_usuario(request.user)).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)

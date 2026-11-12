from django.urls import path

from .api_views import CurrentSessionView, LoginView, LogoutView, csrf_token


app_name = "users_api"

urlpatterns = [
    path("csrf/", csrf_token, name="csrf"),
    path("login/", LoginView.as_view(), name="login"),
    path("session/", CurrentSessionView.as_view(), name="session"),
    path("logout/", LogoutView.as_view(), name="logout"),
]

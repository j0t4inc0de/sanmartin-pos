from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.api_urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/shifts/", include("apps.sales.api_urls")),
    path("api/orders/", include("apps.sales.orders_api_urls")),
]

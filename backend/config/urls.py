from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.static import serve


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.api_urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/shifts/", include("apps.sales.api_urls")),
    path("api/orders/", include("apps.sales.orders_api_urls")),
    path("api/reports/", include("apps.sales.reports_api_urls")),
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

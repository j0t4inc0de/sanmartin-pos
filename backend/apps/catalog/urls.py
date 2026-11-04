from django.urls import path

from .views import PosCatalogView, PublicMenuView


app_name = "catalog"

urlpatterns = [
    path("menu/", PublicMenuView.as_view(), name="menu"),
    path("pos/catalog/", PosCatalogView.as_view(), name="pos-catalog"),
]

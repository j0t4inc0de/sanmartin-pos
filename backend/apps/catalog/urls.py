from django.urls import path

from .views import (
    ManageCategoryDetailView,
    ManageCategoryListView,
    ManageModifierDetailView,
    ManageModifierListView,
    ManageProductDetailView,
    ManageProductListView,
    ManageProductImageUploadView,
    PosCatalogView,
    PublicMenuView,
)


app_name = "catalog"

urlpatterns = [
    path("menu/", PublicMenuView.as_view(), name="menu"),
    path("pos/catalog/", PosCatalogView.as_view(), name="pos-catalog"),
    path("pos/catalog/manage/categories/", ManageCategoryListView.as_view(), name="pos-manage-categories"),
    path("pos/catalog/manage/categories/<int:pk>/", ManageCategoryDetailView.as_view(), name="pos-manage-category"),
    path("pos/catalog/manage/products/", ManageProductListView.as_view(), name="pos-manage-products"),
    path("pos/catalog/manage/product-images/", ManageProductImageUploadView.as_view(), name="pos-manage-product-images"),
    path("pos/catalog/manage/products/<int:pk>/", ManageProductDetailView.as_view(), name="pos-manage-product"),
    path("pos/catalog/manage/modifiers/", ManageModifierListView.as_view(), name="pos-manage-modifiers"),
    path("pos/catalog/manage/modifiers/<int:pk>/", ManageModifierDetailView.as_view(), name="pos-manage-modifier"),
]

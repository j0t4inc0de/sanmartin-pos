from django.urls import path

from .api_views import CancelOrderView, CreateOrderView, OrderQuoteView, SyncOfflineOrderView


app_name = "orders_api"

urlpatterns = [
    path("quote/", OrderQuoteView.as_view(), name="quote"),
    path("sync/", SyncOfflineOrderView.as_view(), name="sync"),
    path("", CreateOrderView.as_view(), name="create"),
    path("<uuid:order_uuid>/cancel/", CancelOrderView.as_view(), name="cancel"),
]

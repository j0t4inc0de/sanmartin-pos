from django.urls import path

from .api_views import CloseCashShiftView, CurrentCashShiftView, OpenCashShiftView


app_name = "sales_api"

urlpatterns = [
    path("current/", CurrentCashShiftView.as_view(), name="current"),
    path("open/", OpenCashShiftView.as_view(), name="open"),
    path("<uuid:shift_uuid>/close/", CloseCashShiftView.as_view(), name="close"),
]

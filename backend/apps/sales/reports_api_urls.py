from django.urls import path

from .api_views import SalesReportView


app_name = "sales_reports_api"

urlpatterns = [
    path("sales/", SalesReportView.as_view(), name="sales"),
]

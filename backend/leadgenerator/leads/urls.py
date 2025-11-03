from django.urls import path
from . import views

urlpatterns = [
    path('generate-leads/', views.generate_leads, name='generate_leads'),
    path('export-leads-csv/', views.export_leads_csv, name='export_leads_csv'),
]
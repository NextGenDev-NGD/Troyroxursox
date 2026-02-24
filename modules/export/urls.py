from django.urls import path
from . import views

app_name = 'export'

urlpatterns = [
    path('csv/', views.export_csv, name='csv'),
]

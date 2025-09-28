# backend/air_quality_project/urls.py
from django.contrib import admin
from django.urls import path, include # Добавили include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')), # Добавляем все URL-ы из приложения 'api' по префиксу /api/
]
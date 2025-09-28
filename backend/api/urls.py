# backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('predict-aqi/', views.predict_aqi, name='predict_aqi'),
    path('current-aqi/', views.get_current_aqi, name='get_current_aqi'),
    # Дополнительные URL-ы будут добавляться здесь
]
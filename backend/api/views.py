# backend/api/views.py
import requests
import os
from datetime import datetime, timedelta
import json
import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Импортируем наш класс предсказателя
# Предполагаем, что ml_model/ находится в PYTHONPATH или модель скопирована в backend/api/
# Для надежности добавляем путь к ml_model в sys.path
import sys
from django.conf import settings # Используем settings для доступа к BASE_DIR
# sys.path.append(os.path.join(settings.BASE_DIR, '../../ml_model')) # Если в корне проекта
# Более надежный путь к ml_model, если она находится рядом с backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'ml_model')))

try:
    from model_inference import AQIPredictor # Импортируем класс
except ImportError as e:
    logging.error(f"Failed to import AQIPredictor: {e}")
    logging.error("Make sure 'ml_model' directory is in PYTHONPATH or model_inference.py exists.")
    # Заглушка, если модель не может быть импортирована, чтобы приложение не падало
    class AQIPredictor:
        def __init__(self, model_path=None):
            self.model = None
            logging.warning("AQIPredictor not available. ML predictions will return errors.")
        def predict(self, *args, **kwargs):
            return {"error": "ML model not loaded or unavailable."}

# Инициализация логгера
logger = logging.getLogger(__name__)

# --- Конфигурация API ключей ---
# РЕКОМЕНДУЕТСЯ ИСПОЛЬЗОВАТЬ .env ФАЙЛЫ и django-environ/decouple
# Для примера:
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'YOUR_OPENWEATHER_API_KEY')
OPENAQ_API_KEY = os.environ.get('OPENAQ_API_KEY', '') # OpenAQ обычно не требует ключа для базовых запросов, но может быть токен для Enterprise
TEMPO_API_KEY = os.environ.get('TEMPO_API_KEY', 'YOUR_TEMPO_API_KEY') # Если TEMPO требует API ключ

# --- Инициализация ML-модели ---
# Путь к обученной модели. Предполагаем, что она лежит в 'ml_model/trained_aqi_model.pkl'
# Относительный путь от файла views.py
ML_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'ml_model', 'trained_aqi_model.pkl'))
aqi_predictor = AQIPredictor(model_path=ML_MODEL_PATH)


# --- Вспомогательные функции для внешних API ---

def fetch_openaq_data(latitude, longitude):
    """
    Получает последние данные о качестве воздуха (PM2.5) из OpenAQ API.
    Возвращает словарь с данными или None в случае ошибки.
    """
    try:
        # Запрашиваем PM2.5 напрямую
        openaq_url = f"https://api.openaq.org/v2/latest?coordinates={latitude},{longitude}&limit=1&parameter=pm25"
        headers = {'accept': 'application/json'} # Базовый заголовок

        response = requests.get(openaq_url, headers=headers, timeout=10)
        response.raise_for_status() # Вызовет исключение для ошибок HTTP

        data = response.json()
        if data and data['results']:
            # Находим данные PM2.5
            measurements = data['results'][0].get('measurements', [])
            pm25_value = None
            for m in measurements:
                if m['parameter'] == 'pm25':
                    pm25_value = m['value']
                    break

            if pm25_value is not None:
                # В реальном проекте здесь будет конвертация PM2.5 в AQI по EPA/WHO стандарту.
                # Для простоты пока вернем PM2.5
                return {
                    "location": data['results'][0]['location'],
                    "city": data['results'][0].get('city'),
                    "country": data['results'][0].get('country'),
                    "current_pm25": pm25_value, # Возвращаем PM2.5, а не "AQI"
                    "unit": "µg/m³",
                    "source": "OpenAQ"
                }
        return None # Данные не найдены или нет PM2.5
    except requests.exceptions.Timeout:
        logger.error(f"OpenAQ API request timed out for {latitude},{longitude}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching data from OpenAQ for {latitude},{longitude}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in fetch_openaq_data: {e}")
        return None

def fetch_openweather_data(latitude, longitude):
    """
    Получает текущие погодные данные из OpenWeatherMap API.
    Возвращает словарь с данными или None в случае ошибки.
    """
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == 'YOUR_OPENWEATHER_API_KEY':
        logger.warning("OpenWeather API key is not set. Cannot fetch weather data.")
        return None

    try:
        # Запрос текущей погоды
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(weather_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data:
            return {
                "temperature": data['main']['temp'],
                "humidity": data['main']['humidity'],
                "wind_speed": data['wind']['speed'],
                "description": data['weather'][0]['description'],
                "source": "OpenWeatherMap"
            }
        return None
    except requests.exceptions.Timeout:
        logger.error(f"OpenWeather API request timed out for {latitude},{longitude}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching data from OpenWeather for {latitude},{longitude}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in fetch_openweather_data: {e}")
        return None

# --- Представления API ---

@api_view(['GET'])
def get_current_aqi(request):
    """
    Получает текущий AQI (PM2.5) и погодные данные для заданной локации.
    Дополнительно показывает различия между спутниковыми (заглушка) и наземными данными.
    """
    latitude = request.query_params.get('lat')
    longitude = request.query_params.get('lon')

    if not latitude or not longitude:
        return Response({"error": "Latitude and longitude are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except ValueError:
        return Response({"error": "Invalid latitude or longitude format."}, status=status.HTTP_400_BAD_REQUEST)

    response_data = {}
    data_sources_status = []

    # 1. Получение данных OpenAQ (наземные датчики)
    openaq_data = fetch_openaq_data(latitude, longitude)
    if openaq_data:
        response_data['ground_station_data'] = openaq_data
        data_sources_status.append({"source": "OpenAQ (Ground Station)", "status": "Success", "data": openaq_data})
    else:
        response_data['ground_station_data'] = {"message": "No real-time PM2.5 data from OpenAQ for this location."}
        data_sources_status.append({"source": "OpenAQ (Ground Station)", "status": "Failed/No data", "message": "Could not retrieve real-time PM2.5 data."})


    # 2. Получение данных OpenWeather (погода)
    weather_data = fetch_openweather_data(latitude, longitude)
    if weather_data:
        response_data['weather_data'] = weather_data
        data_sources_status.append({"source": "OpenWeatherMap", "status": "Success", "data": weather_data})
    else:
        response_data['weather_data'] = {"message": "Could not retrieve weather data."}
        data_sources_status.append({"source": "OpenWeatherMap", "status": "Failed", "message": "Could not retrieve weather data."})


    # 3. Данные TEMPO (спутниковые) - заглушка, так как API пока нет или сложен в интеграции
    # В реальном проекте здесь будет сложный запрос к API NASA TEMPO или другому спутниковому источнику.
    # TEMPO предоставляет данные о NO2, формальдегиде, SO2, озоне - не напрямую PM2.5,
    # поэтому их интеграция для прямого сравнения AQI требует конвертации или дополнительных моделей.
    # Для целей этого примера, давайте представим, что у нас есть спутниковые данные PM2.5.
    tempo_pm25 = None
    if openaq_data and openaq_data.get('current_pm25') is not None:
        # Имитируем спутниковые данные, которые немного отличаются от наземных
        tempo_pm25 = openaq_data['current_pm25'] * (1 + (0.1 * (2 * (0.5 - datetime.now().second % 2)))) # +/- 10%
        response_data['satellite_data'] = {
            "current_pm25": round(tempo_pm25, 2),
            "unit": "µg/m³",
            "source": "TEMPO (Satellite - Mock)"
        }
        data_sources_status.append({"source": "TEMPO (Satellite)", "status": "Success (Mock)", "data": response_data['satellite_data']})
    else:
        response_data['satellite_data'] = {"message": "TEMPO satellite data is not available (mock data)."}
        data_sources_status.append({"source": "TEMPO (Satellite)", "status": "Failed (Mock)", "message": "TEMPO satellite data is not available (mock data)."})


    # 4. Сравнение и прозрачность
    comparison = {}
    if openaq_data and openaq_data.get('current_pm25') is not None and tempo_pm25 is not None:
        diff_abs = abs(openaq_data['current_pm25'] - tempo_pm25)
        diff_percent = (diff_abs / openaq_data['current_pm25']) * 100 if openaq_data['current_pm25'] != 0 else 0
        comparison = {
            "ground_pm25": openaq_data['current_pm25'],
            "satellite_pm25": tempo_pm25,
            "difference_abs": round(diff_abs, 2),
            "difference_percent": round(diff_percent, 2),
            "note": "Satellite and ground data may differ due to sensing methods, spatial resolution, and atmospheric conditions."
        }
        response_data['data_comparison'] = comparison

    # Общий статус для API
    overall_status = "Success"
    if not openaq_data and not weather_data: # Прогноз будет опираться на это
        overall_status = "Partial Success: Limited data available."
    elif not openaq_data:
        overall_status = "Partial Success: Ground station data not available."
    elif not weather_data:
        overall_status = "Partial Success: Weather data not available."


    final_response = {
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": datetime.now().isoformat(),
        "status": overall_status,
        "data": response_data,
        "data_sources_status": data_sources_status, # Для прозрачности
    }

    return Response(final_response)


@api_view(['POST'])
def predict_aqi(request):
    """
    Предсказывает AQI на 24-48 часов вперед, используя ML-модель.
    Запрос должен содержать latitude и longitude.
    """
    data = request.data
    latitude_str = data.get('latitude')
    longitude_str = data.get('longitude')
    prediction_hours = data.get('prediction_hours', [24, 48]) # Список часов для прогноза

    if not all([latitude_str, longitude_str]):
        return Response({"error": "Latitude and longitude are required for prediction."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        latitude = float(latitude_str)
        longitude = float(longitude_str)
        if not isinstance(prediction_hours, list) or not all(isinstance(h, int) and h > 0 for h in prediction_hours):
             return Response({"error": "prediction_hours must be a list of positive integers."}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({"error": "Invalid latitude, longitude, or prediction_hours format."}, status=status.HTTP_400_BAD_REQUEST)


    if aqi_predictor.model is None:
        return Response(
            {"error": "ML model not loaded. Cannot make predictions. Please check server logs."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    forecasts = {}
    now = datetime.now()

    for hours in prediction_hours:
        prediction_time = now + timedelta(hours=hours)
        prediction_result = aqi_predictor.predict(latitude, longitude, prediction_time)

        if "error" in prediction_result:
            logger.error(f"Prediction failed for {hours} hours: {prediction_result['error']}")
            forecasts[f"{hours}_hour_forecast"] = {"status": "failed", "error": prediction_result['error']}
        else:
            forecasts[f"{hours}_hour_forecast"] = {
                "aqi": prediction_result['aqi'],
                "category": prediction_result['category'],
                "recommendations": prediction_result['recommendations'],
                "timestamp": prediction_result['timestamp'],
                "unit": "AQI" # Теперь это уже AQI
            }

    final_response = {
        "latitude": latitude,
        "longitude": longitude,
        "requested_prediction_times": prediction_hours,
        "forecasts": forecasts,
        "model_source": "Custom AI/ML Model"
    }

    return Response(final_response)
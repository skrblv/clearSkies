import React, { useEffect, useState } from 'react';
// Импортируем утилиту для конвертации PM2.5 в категорию AQI
import { getAQICategoryFromPM25 } from '../utils/aqiUtils';

interface CurrentAQIDisplayProps {
  lat: number;
  lon: number;
}

// --- Интерфейсы для данных, получаемых с бэкенда ---
interface GroundStationData {
  location: string;
  city?: string;
  country?: string;
  current_pm25: number; // PM2.5 в микрограммах на кубический метр
  unit: string;
  source: string;
}

interface WeatherData {
  temperature: number; // Температура в °C
  humidity: number;    // Влажность в %
  wind_speed: number;  // Скорость ветра в м/с
  description: string; // Описание погоды
  source: string;
}

interface SatelliteData {
  current_pm25: number;
  unit: string;
  source: string;
}

interface DataComparison {
  ground_pm25: number;
  satellite_pm25: number;
  difference_abs: number;
  difference_percent: number;
  note: string;
}

// Главный интерфейс для ответа от API endpoint /api/current-aqi/
interface CurrentAQIResponse {
  latitude: number;
  longitude: number;
  timestamp: string;
  status: string; // Общий статус запроса к API
  data: {
    ground_station_data?: GroundStationData | { message: string }; // Может быть объект данных или сообщение об ошибке/отсутствии
    weather_data?: WeatherData | { message: string };
    satellite_data?: SatelliteData | { message: string }; // Спутниковые данные (сейчас заглушка)
    data_comparison?: DataComparison; // Сравнение данных
  };
  data_sources_status: Array<{ source: string; status: string; message?: string; data?: any }>;
}

// Базовый URL для бэкенда. Используем переменную окружения Vite.
// Если переменная не установлена, по умолчанию 'http://localhost:8000'.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const CurrentAQIDisplay: React.FC<CurrentAQIDisplayProps> = ({ lat, lon }) => {
  const [data, setData] = useState<CurrentAQIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentAQI = async () => {
      setLoading(true);
      setError(null); // Сбрасываем ошибку перед новым запросом
      setData(null); // Сбрасываем данные перед новым запросом

      try {
        const response = await fetch(`${API_BASE_URL}/api/current-aqi/?lat=${lat}&lon=${lon}`);
        
        // Проверяем, успешен ли HTTP-запрос (статус 2xx)
        if (!response.ok) {
          const errorText = await response.text(); // Попытаемся получить текст ошибки с сервера
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result: CurrentAQIResponse = await response.json();
        setData(result); // Устанавливаем полученные данные
      } catch (e: any) {
        // Ловим любые ошибки, связанные с fetch (сеть, парсинг JSON и т.д.)
        setError(`Failed to fetch current air quality data: ${e.message}`);
        console.error("Error fetching current AQI:", e);
      } finally {
        setLoading(false); // Завершаем состояние загрузки
      }
    };

    // Вызываем функцию получения данных при монтировании компонента или изменении lat/lon
    fetchCurrentAQI();
  }, [lat, lon]); // Зависимости: перезапрашивать данные при изменении широты или долготы

  // --- Условия отображения ---
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-gray-600">Loading current air quality data...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">Error: {error}</div>;
  }

  // Если данные еще не загружены или не получены (хотя error должен поймать большинство случаев)
  if (!data) {
    return <div className="p-4 text-gray-600 bg-gray-50 rounded-lg">No data available. Please select a location.</div>;
  }

  // Извлекаем данные из объекта ответа
  const groundData = data.data.ground_station_data as GroundStationData | { message: string };
  const weatherData = data.data.weather_data as WeatherData | { message: string };

  // Функция для определения цвета фона карточки AQI на основе PM2.5
  const getAQIColorClass = (pm25Value: number | undefined) => {
    if (pm25Value === undefined || typeof pm25Value !== 'number') {
      return 'bg-gray-200 text-gray-800'; // Дефолтный цвет, если данных нет
    }
    const categoryInfo = getAQICategoryFromPM25(pm25Value);
    switch (categoryInfo.category) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Unhealthy for Sensitive Groups': return 'bg-orange-100 text-orange-800';
      case 'Unhealthy': return 'bg-red-100 text-red-800';
      case 'Very Unhealthy': return 'bg-purple-100 text-purple-800';
      case 'Hazardous': return 'bg-rose-100 text-rose-800'; // Используем rose для Hazardous
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Отображение данных с наземных станций (PM2.5) */}
      {groundData && 'current_pm25' in groundData && groundData.current_pm25 !== undefined ? (
        <div className={`p-5 rounded-lg shadow-md ${getAQIColorClass(groundData.current_pm25)}`}>
          <h3 className="text-xl font-bold mb-2">Current PM2.5 (Ground Station)</h3>
          <p className="text-3xl font-extrabold mb-2">
            {groundData.current_pm25} {groundData.unit}
          </p>
          <p className="text-lg">
            Category: <span className="font-semibold">{getAQICategoryFromPM25(groundData.current_pm25).category}</span>
          </p>
          <p className="text-sm text-gray-700 mt-2">Source: {groundData.source}</p>
          {groundData.city && <p className="text-sm text-gray-700">Location: {groundData.city}, {groundData.country}</p>}
        </div>
      ) : (
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-gray-600">
          <p>No real-time PM2.5 data from OpenAQ for this location.</p>
          {'message' in groundData && <p className="text-sm mt-1">{groundData.message}</p>}
        </div>
      )}

      {/* Отображение текущих погодных данных */}
      {weatherData && 'temperature' in weatherData && weatherData.temperature !== undefined ? (
        <div className="bg-blue-50 p-5 rounded-lg shadow-md border border-blue-100">
          <h3 className="text-xl font-bold text-blue-800 mb-2">Current Weather</h3>
          <p className="text-lg">Temperature: <span className="font-semibold">{weatherData.temperature}°C</span></p>
          <p className="text-lg">Humidity: <span className="font-semibold">{weatherData.humidity}%</span></p>
          <p className="text-lg">Wind Speed: <span className="font-semibold">{weatherData.wind_speed} m/s</span></p>
          <p className="text-lg">Description: <span className="font-semibold capitalize">{weatherData.description}</span></p>
          <p className="text-sm text-blue-700 mt-2">Source: {weatherData.source}</p>
        </div>
      ) : (
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-gray-600">
          <p>No current weather data available for this location.</p>
          {'message' in weatherData && <p className="text-sm mt-1">{weatherData.message}</p>}
        </div>
      )}
    </div>
  );
};

export default CurrentAQIDisplay;
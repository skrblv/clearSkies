import React, { useEffect, useState } from 'react';
import { getAQICategory } from '../utils/aqiUtils'; // Будет создан позже

interface AQIForecastDisplayProps {
  lat: number;
  lon: number;
}

interface ForecastDetail {
  aqi: number;
  category: string;
  recommendations: string[];
  timestamp: string;
  unit: string;
  status?: string; // Для обработки ошибок прогноза
  error?: string;
}

interface ForecastResponse {
  latitude: number;
  longitude: number;
  requested_prediction_times: number[];
  forecasts: {
    "24_hour_forecast"?: ForecastDetail;
    "48_hour_forecast"?: ForecastDetail;
    [key: string]: ForecastDetail | undefined; // Для других интервалов
  };
  model_source: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AQIForecastDisplay: React.FC<AQIForecastDisplayProps> = ({ lat, lon }) => {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/predict-aqi/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latitude: lat, longitude: lon, prediction_hours: [24, 48] }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: ForecastResponse = await response.json();
        setForecastData(result);
      } catch (e: any) {
        setError(`Failed to fetch forecast: ${e.message}`);
        console.error("Error fetching forecast:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [lat, lon]);

  if (loading) {
    return <div className="text-gray-600">Loading AQI forecast...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!forecastData || !forecastData.forecasts) {
    return <div className="text-gray-600">No forecast data available.</div>;
  }

  const getAQIColorClass = (aqiValue: number | undefined) => {
    if (aqiValue === undefined) return 'bg-gray-200 text-gray-800';
    const category = getAQICategory(aqiValue).category;
    switch (category) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Unhealthy for Sensitive Groups': return 'bg-orange-100 text-orange-800';
      case 'Unhealthy': return 'bg-red-100 text-red-800';
      case 'Very Unhealthy': return 'bg-purple-100 text-purple-800';
      case 'Hazardous': return 'bg-fuchsia-100 text-fuchsia-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const renderForecastCard = (title: string, forecast: ForecastDetail | undefined) => {
    if (!forecast || forecast.status === "failed") {
      return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <p className="text-red-600 text-sm mt-2">Prediction failed: {forecast?.error || "Unknown error."}</p>
        </div>
      );
    }

    return (
      <div className={`p-4 rounded-lg shadow-sm ${getAQIColorClass(forecast.aqi)}`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-xl font-bold">AQI: {forecast.aqi} {forecast.unit}</p>
        <p className="text-md">Category: <span className="font-semibold">{forecast.category}</span></p>
        <p className="text-sm mt-2 font-medium">Recommendations:</p>
        <ul className="list-disc list-inside text-sm">
          {forecast.recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
        <p className="text-xs mt-2 text-gray-700">Time: {new Date(forecast.timestamp).toLocaleString()}</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderForecastCard("24-Hour Forecast", forecastData.forecasts["24_hour_forecast"])}
      {renderForecastCard("48-Hour Forecast", forecastData.forecasts["48_hour_forecast"])}
    </div>
  );
};

export default AQIForecastDisplay;
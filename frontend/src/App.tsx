import React, { useState } from 'react';
import LocationInput from './components/LocationInput';
import CurrentAQIDisplay from './components/CurrentAQIDisplay';
import AQIForecastDisplay from './components/AQIForecastDisplay';
import DataTransparencyDisplay from './components/DataTransparencyDisplay';
import './index.css'; // Убедитесь, что Tailwind CSS импортирован
// import './App.css'; // Этот файл, скорее всего, больше не нужен, можно удалить или очистить его

function App() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const handleLocationChange = (lat: number, lon: number) => {
    setLocation({ lat, lon });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <header className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
          Air Quality Predictor
        </h1>
        <p className="text-lg text-gray-600">
          Real-time air quality & 24/48-hour forecasts powered by AI/ML.
        </p>
      </header>

      <main className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Select Location
            </h2>
            {/* Здесь будет компонент для выбора локации, например, через ввод координат или карту */}
            <LocationInput onLocationSubmit={handleLocationChange} />
          </div>

          {location && (
            <>
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Current Air Quality
                </h2>
                <CurrentAQIDisplay lat={location.lat} lon={location.lon} />
              </div>

              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  24/48-Hour Forecast
                </h2>
                <AQIForecastDisplay lat={location.lat} lon={location.lon} />
              </div>

              <div className="md:col-span-2 bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  Data Transparency
                </h2>
                {/* Здесь будет компонент для отображения прозрачности данных */}
                <DataTransparencyDisplay lat={location.lat} lon={location.lon} />
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="w-full max-w-4xl text-center text-gray-500 mt-8">
        © {new Date().getFullYear()} Air Quality Predictor. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
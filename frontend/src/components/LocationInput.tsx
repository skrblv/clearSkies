import React, { useState } from 'react';

interface LocationInputProps {
  onLocationSubmit: (lat: number, lon: number) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ onLocationSubmit }) => {
  const [latitude, setLatitude] = useState<string>('55.75'); // Дефолт Москва
  const [longitude, setLongitude] = useState<string>('37.61'); // Дефолт Москва
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      setError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    onLocationSubmit(latNum, lonNum);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="flex-1 w-full">
        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 sr-only">Latitude</label>
        <input
          type="text"
          id="latitude"
          placeholder="Latitude (e.g., 55.75)"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>
      <div className="flex-1 w-full">
        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 sr-only">Longitude</label>
        <input
          type="text"
          id="longitude"
          placeholder="Longitude (e.g., 37.61)"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Get Data
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-2 sm:mt-0 sm:ml-4 col-span-full">{error}</p>
      )}
    </form>
  );
};

export default LocationInput;
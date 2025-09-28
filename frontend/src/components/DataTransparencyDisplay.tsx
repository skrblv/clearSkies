import React, { useEffect, useState } from 'react';

interface DataTransparencyDisplayProps {
  lat: number;
  lon: number;
}

interface DataSourceStatus {
  source: string;
  status: string;
  message?: string;
  data?: any;
}

interface DataComparison {
  ground_pm25: number;
  satellite_pm25: number;
  difference_abs: number;
  difference_percent: number;
  note: string;
}

interface CurrentAQIResponse {
  latitude: number;
  longitude: number;
  timestamp: string;
  status: string;
  data: {
    data_comparison?: DataComparison;
  };
  data_sources_status: DataSourceStatus[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DataTransparencyDisplay: React.FC<DataTransparencyDisplayProps> = ({ lat, lon }) => {
  const [data, setData] = useState<CurrentAQIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/current-aqi/?lat=${lat}&lon=${lon}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: CurrentAQIResponse = await response.json();
        setData(result);
      } catch (e: any) {
        setError(`Failed to fetch data transparency info: ${e.message}`);
        console.error("Error fetching data transparency:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDataStatus();
  }, [lat, lon]);

  if (loading) {
    return <div className="text-gray-600">Loading data sources status...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="text-gray-600">No data sources status available.</div>;
  }

  const comparison = data.data.data_comparison;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Sources Status</h3>
      <ul className="space-y-2 mb-6">
        {data.data_sources_status.map((source, index) => (
          <li key={index} className="flex items-center">
            <span className={`h-3 w-3 rounded-full mr-2 ${source.status.includes('Success') ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium">{source.source}:</span> <span className="text-gray-700">{source.status}</span>
            {source.message && <span className="text-gray-500 text-sm ml-2">({source.message})</span>}
          </li>
        ))}
      </ul>

      {comparison && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Ground vs. Satellite Data (PM2.5)</h3>
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
            <p className="mb-2">
              <span className="font-medium">Ground Station (OpenAQ):</span> {comparison.ground_pm25} µg/m³
            </p>
            <p className="mb-2">
              <span className="font-medium">Satellite (TEMPO Mock):</span> {comparison.satellite_pm25} µg/m³
            </p>
            <p className="font-medium">
              Absolute Difference: <span className="text-blue-700">{comparison.difference_abs} µg/m³</span>
            </p>
            <p className="font-medium">
              Percentage Difference: <span className="text-blue-700">{comparison.difference_percent}%</span>
            </p>
            <p className="text-sm text-gray-600 mt-3">{comparison.note}</p>
          </div>
        </>
      )}

      {!comparison && (
        <p className="text-gray-600">No data comparison available (e.g., missing ground station data).</p>
      )}
    </div>
  );
};

export default DataTransparencyDisplay;
// frontend/src/utils/aqiUtils.ts

interface AQICategory {
  category: string;
  min_pm25: number;
  max_pm25: number;
  min_aqi: number;
  max_aqi: number;
  health_implications: string;
  cautionary_statements: string;
}

// Упрощенные категории AQI (по стандартам США EPA для PM2.5)
const aqi_breakpoints: AQICategory[] = [
  { category: 'Good', min_pm25: 0, max_pm25: 12.0, min_aqi: 0, max_aqi: 50, health_implications: "Air quality is satisfactory, and air pollution poses little or no risk.", cautionary_statements: "None." },
  { category: 'Moderate', min_pm25: 12.1, max_pm25: 35.4, min_aqi: 51, max_aqi: 100, health_implications: "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.", cautionary_statements: "Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion." },
  { category: 'Unhealthy for Sensitive Groups', min_pm25: 35.5, max_pm25: 55.4, min_aqi: 101, max_aqi: 150, health_implications: "Members of sensitive groups may experience health effects. The general public is not likely to be affected.", cautionary_statements: "Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion." },
  { category: 'Unhealthy', min_pm25: 55.5, max_pm25: 150.4, min_aqi: 151, max_aqi: 200, health_implications: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.", cautionary_statements: "Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else, especially children, should limit outdoor exertion." },
  { category: 'Very Unhealthy', min_pm25: 150.5, max_pm25: 250.4, min_aqi: 201, max_aqi: 300, health_implications: "Health warnings of emergency conditions. The entire population is more likely to be affected.", cautionary_statements: "Everyone should avoid all outdoor exertion." },
  { category: 'Hazardous', min_pm25: 250.5, max_pm25: 500.4, min_aqi: 301, max_aqi: 500, health_implications: "Health alert: everyone may experience more serious health effects.", cautionary_statements: "Everyone should avoid all outdoor exertion." },
];

// Функция для конвертации PM2.5 в AQI
// Источник: https://www.airnow.gov/sites/default/files/2020-05/aqi-calculator-8-hour-o3-pm.pdf (страница 3)
export function calculateAQIFromPM25(pm25: number): number {
  if (pm25 < 0) return 0; // PM2.5 не может быть отрицательным

  for (let i = 0; i < aqi_breakpoints.length; i++) {
    const bp = aqi_breakpoints[i];
    if (pm25 >= bp.min_pm25 && pm25 <= bp.max_pm25) {
      // Линейная интерполяция
      const aqi = ((bp.max_aqi - bp.min_aqi) / (bp.max_pm25 - bp.min_pm25)) * (pm25 - bp.min_pm25) + bp.min_aqi;
      return Math.round(aqi);
    }
  }
  // Если PM2.5 выше максимального breakpoint (500.4), используем верхний AQI
  if (pm25 > aqi_breakpoints[aqi_breakpoints.length - 1].max_pm25) {
    return aqi_breakpoints[aqi_breakpoints.length - 1].max_aqi;
  }
  return 0; // В случае неожиданных значений
}

// Функция для получения категории AQI по значению PM2.5 (или уже рассчитанному AQI)
export function getAQICategory(value: number): AQICategory {
  let aqiValue = value;
  // Если входное значение это PM2.5, то сначала конвертируем его в AQI
  // Можно добавить проверку, чтобы различать PM2.5 и AQI, но для простоты
  // будем считать, что нам уже пришел AQI или очень похожее значение.
  // В идеале, API бэкенда должен возвращать AQI, чтобы фронтенд только отображал.
  // Для текущего `CurrentAQIDisplay`, который получает PM2.5, нужно будет конвертировать.
  // Для `AQIForecastDisplay`, который получает AQI, не нужно.
  // Для унификации: эта функция будет принимать уже AQI.
  // Если у вас на бэкенде PM2.5, то на фронтенде вам нужно будет вызвать calculateAQIFromPM25
  // перед тем, как передать его сюда.
  
  // Допустим, здесь мы ожидаем уже AQI. Если это PM2.5, то вызовите calculateAQIFromPM25(pm25)
  // Я немного изменю logic, чтобы она могла принимать PM2.5 и конвертировать.
  
  // Для `CurrentAQIDisplay` который получает `current_pm25`, вызовите:
  // const aqiValueForDisplay = calculateAQIFromPM25(groundData.current_pm25);
  // const category = getAQICategory(aqiValueForDisplay);
  
  // А для `AQIForecastDisplay` он уже должен приходить как AQI.

  for (let i = 0; i < aqi_breakpoints.length; i++) {
    const bp = aqi_breakpoints[i];
    if (aqiValue >= bp.min_aqi && aqiValue <= bp.max_aqi) {
      return bp;
    }
  }

  // Если AQI выше максимального breakpoint
  if (aqiValue > aqi_breakpoints[aqi_breakpoints.length - 1].max_aqi) {
    return aqi_breakpoints[aqi_breakpoints.length - 1];
  }

  return { // Дефолтное значение для неизвестных случаев
    category: 'Unknown', min_pm25: -1, max_pm25: -1, min_aqi: -1, max_aqi: -1,
    health_implications: 'No data or invalid AQI.', cautionary_statements: ''
  };
}

// Вспомогательная функция, которая принимает PM2.5 и возвращает категорию AQI,
// которую можно использовать для CurrentAQIDisplay.
export function getAQICategoryFromPM25(pm25: number): AQICategory {
  const aqiValue = calculateAQIFromPM25(pm25);
  return getAQICategory(aqiValue);
}

// Экспортируем функцию getAQICategory, которая будет использоваться для прогноза (где AQI уже приходит)
// и для получения цвета в CurrentAQIDisplay (но там нужно будет сначала конвертировать PM2.5)
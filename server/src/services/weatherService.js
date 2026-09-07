const { getDb } = require('../db/db');

const OPENWEATHER_BASE_URL =
  'https://api.openweathermap.org/data/2.5/weather';
const OPENWEATHER_FORECAST_URL =
  'https://api.openweathermap.org/data/2.5/forecast';

function getCacheMinutes() {
  const configuredMinutes = Number(process.env.WEATHER_CACHE_MINUTES || 15);

  return Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : 15;
}

function getWeatherUnits() {
  return process.env.WEATHER_UNITS || 'imperial';
}

function buildCacheKey(locationId) {
  return `weather:current:location:${locationId}`;
}

function getCachedResponse(cacheKey) {
  const db = getDb();

  return db.prepare(`
    SELECT
      payload_json AS payloadJson,
      fetched_at AS fetchedAt,
      expires_at AS expiresAt
    FROM cached_responses
    WHERE cache_key = ?
  `).get(cacheKey);
}

function saveCachedResponse(cacheKey, payload, expiresAt) {
  const db = getDb();

  db.prepare(`
    INSERT INTO cached_responses (
      cache_key,
      payload_json,
      source_name,
      fetched_at,
      expires_at
    )
    VALUES (?, ?, 'openweather', ?, ?)

    ON CONFLICT(cache_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      source_name = excluded.source_name,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at
  `).run(
    cacheKey,
    JSON.stringify(payload),
    new Date().toISOString(),
    expiresAt
  );
}

function isCacheFresh(cachedResponse) {
  if (!cachedResponse?.expiresAt) {
    return false;
  }

  return new Date(cachedResponse.expiresAt) > new Date();
}

function getLocalDateKey(date, timezone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone.trim() })
      .format(date);
  } catch (error) {
    return new Intl.DateTimeFormat('en-CA').format(date);
  }
}

// OpenWeather's current-weather endpoint reports temp_min/temp_max as the
// spread *currently observed* across nearby stations, not the day's actual
// forecast high/low — it drifts with every poll. Derive a stable high/low
// from today's slice of the 3-hourly forecast instead. The current reading
// is folded in too, since forecast data only covers hours still to come —
// late in the day it would otherwise miss a peak that already happened.
function getTodayHighLow(location, forecastData, currentTemp) {
  const entries = forecastData?.list || [];
  const todayKey = getLocalDateKey(new Date(), location.timezone);

  const todayEntries = entries.filter((entry) => {
    if (!entry.dt) {
      return false;
    }

    return getLocalDateKey(new Date(entry.dt * 1000), location.timezone)
      === todayKey;
  });

  if (todayEntries.length === 0) {
    return null;
  }

  const highs = todayEntries.map((entry) => entry.main.temp_max);
  const lows = todayEntries.map((entry) => entry.main.temp_min);

  if (Number.isFinite(currentTemp)) {
    highs.push(currentTemp);
    lows.push(currentTemp);
  }

  return {
    high: Math.round(Math.max(...highs)),
    low: Math.round(Math.min(...lows))
  };
}

function normalizeWeatherResponse(location, responseData, forecastData) {
  const weather = responseData.weather?.[0] || {};
  const units = getWeatherUnits();
  const todayHighLow = getTodayHighLow(
    location,
    forecastData,
    responseData.main.temp
  );

  return {
    id: location.id,
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    temperature: Math.round(responseData.main.temp),
    feelsLike: Math.round(responseData.main.feels_like),
    high: todayHighLow ? todayHighLow.high : Math.round(responseData.main.temp_max),
    low: todayHighLow ? todayHighLow.low : Math.round(responseData.main.temp_min),
    humidity: responseData.main.humidity,
    windSpeed: Math.round(responseData.wind?.speed || 0),
    condition: weather.description || 'Unknown conditions',
    iconCode: weather.icon || '01d',
    units,
    observedAt: responseData.dt
      ? new Date(responseData.dt * 1000).toISOString()
      : new Date().toISOString()
  };
}

async function fetchOpenWeather(baseUrl, location, apiKey) {
  const url = new URL(baseUrl);

  url.searchParams.set('lat', location.latitude);
  url.searchParams.set('lon', location.longitude);
  url.searchParams.set('units', getWeatherUnits());
  url.searchParams.set('appid', apiKey);

  const response = await fetch(url);

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `OpenWeather request failed: ${response.status} ${responseText}`
    );
  }

  return response.json();
}

async function fetchLiveWeather(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is missing from .env');
  }

  const [responseData, forecastData] = await Promise.all([
    fetchOpenWeather(OPENWEATHER_BASE_URL, location, apiKey),
    fetchOpenWeather(OPENWEATHER_FORECAST_URL, location, apiKey).catch(
      (error) => {
        console.error(
          `Weather forecast fetch failed for ${location.name}:`,
          error.message
        );

        return null;
      }
    )
  ]);

  return normalizeWeatherResponse(location, responseData, forecastData);
}

async function getWeatherForLocation(location, forceRefresh = false) {
  const cacheKey = buildCacheKey(location.id);
  const cachedResponse = getCachedResponse(cacheKey);

  if (cachedResponse && isCacheFresh(cachedResponse) && !forceRefresh) {
    return {
      ...JSON.parse(cachedResponse.payloadJson),
      source: 'cache',
      fetchedAt: cachedResponse.fetchedAt,
      expiresAt: cachedResponse.expiresAt
    };
  }

  try {
    const weatherData = await fetchLiveWeather(location);

    const fetchedAt = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + getCacheMinutes() * 60 * 1000
    ).toISOString();

    saveCachedResponse(cacheKey, weatherData, expiresAt);

    return {
      ...weatherData,
      source: 'live',
      fetchedAt,
      expiresAt
    };
  } catch (error) {
    console.error(
      `Weather fetch failed for ${location.name}:`,
      error.message
    );

    if (cachedResponse) {
      return {
        ...JSON.parse(cachedResponse.payloadJson),
        source: 'stale-cache',
        fetchedAt: cachedResponse.fetchedAt,
        expiresAt: cachedResponse.expiresAt,
        fallbackMessage: 'Live weather is unavailable. Showing last saved data.'
      };
    }

    return {
      id: location.id,
      name: location.name,
      unavailable: true,
      source: 'unavailable',
      error: 'Weather is currently unavailable.'
    };
  }
}

async function getWeatherDashboard(forceRefresh = false) {
  const db = getDb();

  const locations = db.prepare(`
    SELECT
      id,
      name,
      latitude,
      longitude,
      timezone
    FROM locations
    WHERE is_active = 1
    ORDER BY sort_order ASC, name ASC
  `).all();

  const weatherLocations = await Promise.all(
    locations.map((location) =>
      getWeatherForLocation(location, forceRefresh)
    )
  );

  const usableLocations = weatherLocations.filter(
    (location) => !location.unavailable
  );

  const updatedAt = usableLocations
    .map((location) => location.fetchedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    updatedAt,
    cacheMinutes: getCacheMinutes(),
    usedStaleCache: weatherLocations.some(
      (location) => location.source === 'stale-cache'
    ),
    hasUnavailableLocations: weatherLocations.some(
      (location) => location.unavailable
    ),
    locations: weatherLocations
  };
}

module.exports = {
  getWeatherDashboard
};
const { getDb } = require('../db/db');

const OPENWEATHER_BASE_URL =
  'https://api.openweathermap.org/data/2.5/weather';

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

function normalizeWeatherResponse(location, responseData) {
  const weather = responseData.weather?.[0] || {};
  const units = getWeatherUnits();

  return {
    id: location.id,
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    temperature: Math.round(responseData.main.temp),
    feelsLike: Math.round(responseData.main.feels_like),
    high: Math.round(responseData.main.temp_max),
    low: Math.round(responseData.main.temp_min),
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

async function fetchLiveWeather(location) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is missing from .env');
  }

  const url = new URL(OPENWEATHER_BASE_URL);

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

  const responseData = await response.json();

  return normalizeWeatherResponse(location, responseData);
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
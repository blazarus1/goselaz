import { useEffect, useState } from 'preact/hooks';

function getWeatherSymbol(iconCode = '') {
  if (iconCode.startsWith('01')) return '☀';
  if (iconCode.startsWith('02')) return '⛅';
  if (iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁';
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return '☂';
  if (iconCode.startsWith('11')) return 'ϟ';
  if (iconCode.startsWith('13')) return '❄';
  if (iconCode.startsWith('50')) return '≋';

  return '○';
}

function findPrimaryLocation(locations) {
  return (
    locations.find((location) =>
      location.name?.toLowerCase().includes('knoxville')
    ) || locations[0] || null
  );
}

function TimeWeatherBar({ weatherStatus = 'ready', weatherData, weatherError }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const locations = weatherData?.locations || [];
  const location = findPrimaryLocation(locations);

  return (
    <section class="status-bar" aria-label="Current time and weather">
      <div class="status-bar__time">
        <time class="status-bar__clock" dateTime={now.toISOString()}>
          {now.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          })}
        </time>

        <p class="status-bar__date">
          {now.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div class="status-bar__weather">
        {weatherStatus === 'loading' && (
          <p class="status-bar__message">Loading weather…</p>
        )}

        {weatherStatus === 'error' && (
          <p class="status-bar__message">
            {weatherError || 'Weather is unavailable.'}
          </p>
        )}

        {weatherStatus === 'ready' && (!location || location.unavailable) && (
          <p class="status-bar__message">
            Weather is temporarily unavailable.
          </p>
        )}

        {weatherStatus === 'ready' && location && !location.unavailable && (
          <>
            <span class="status-bar__symbol" title={location.condition}>
              {getWeatherSymbol(location.iconCode)}
            </span>

            <div class="status-bar__condition">
              <p class="status-bar__location">{location.name}</p>
              <p>{location.condition} · Feels like {location.feelsLike}°</p>
            </div>

            <div class="status-bar__temperature">
              <strong>{location.temperature}°</strong>
              <span>H {location.high}° · L {location.low}°</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default TimeWeatherBar;

import DashboardCard from './DashboardCard';

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

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return null;
  }

  return new Date(updatedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function WeatherCard({ data, status = 'ready', error }) {
  const locations = data?.locations || [];
  const updatedTime = formatUpdatedAt(data?.updatedAt);

  return (
    <DashboardCard
      title="Weather"
      subtitle="Selected locations"
      status={status}
      isEmpty={status === 'ready' && locations.length === 0}
      error={error || 'Weather data is temporarily unavailable.'}
      footer={
        data?.usedStaleCache
          ? 'Live weather unavailable — showing last saved data.'
          : updatedTime
            ? `Updated ${updatedTime}`
            : null
      }
      className="dashboard-card--wide"
    >
      <div class="weather-list">
        {locations.map((location) => {
          if (location.unavailable) {
            return (
              <div class="weather-row weather-row--unavailable" key={location.id}>
                <div>
                  <h3>{location.name}</h3>
                  <p>Weather is temporarily unavailable.</p>
                </div>

                <span class="weather-symbol weather-symbol--muted">
                  —
                </span>
              </div>
            );
          }

          return (
            <div class="weather-row" key={location.id}>
              <span
                class="weather-symbol"
                title={location.condition}
                aria-label={location.condition}
              >
                {getWeatherSymbol(location.iconCode)}
              </span>

              <div class="weather-location">
                <h3>{location.name}</h3>
                <p>
                  {location.condition} · Feels like {location.feelsLike}°
                </p>
              </div>

              <div class="weather-temperature">
                <strong>{location.temperature}°</strong>
                <span>H {location.high}° · L {location.low}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

export default WeatherCard;
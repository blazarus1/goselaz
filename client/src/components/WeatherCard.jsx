import DashboardCard from './DashboardCard';

function WeatherCard({ data, status = 'ready' }) {
  const locations = data?.locations || [];

  return (
    <DashboardCard
      title="Weather"
      subtitle="Selected locations"
      status={status}
      isEmpty={status === 'ready' && locations.length === 0}
      error="Weather data is temporarily unavailable."
      footer={data?.updatedAt ? `Updated ${data.updatedAt}` : null}
    >
      <div class="weather-list">
        {locations.map((location) => (
          <div class="weather-row" key={location.id}>
            <div>
              <h3>{location.name}</h3>
              <p>{location.condition}</p>
            </div>

            <div class="weather-temperature">
              <strong>{location.temperature}°</strong>
              <span>H {location.high}° · L {location.low}°</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default WeatherCard;
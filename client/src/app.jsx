import { useEffect, useState } from 'preact/hooks';
import './app.css';

function App() {
  const [weather, setWeather] = useState(null);
  const [apiStatus, setApiStatus] = useState('Checking API...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const healthResponse = await fetch('/health');

        if (!healthResponse.ok) {
          throw new Error('API health check failed');
        }

        const health = await healthResponse.json();
        setApiStatus(`API: ${health.status}`);

        const weatherResponse = await fetch('/api/weather');

        if (!weatherResponse.ok) {
          throw new Error('Weather request failed');
        }

        const weatherData = await weatherResponse.json();
        setWeather(weatherData);
      } catch (err) {
        setError(err.message);
        setApiStatus('API unavailable');
      }
    }

    loadDashboard();
  }, []);

  return (
    <main class="dashboard">
      <header class="dashboard__header">
        <div>
          <p class="eyebrow">Pi Household Dashboard</p>
          <h1>Good afternoon</h1>
        </div>

        <p class={`api-status ${error ? 'api-status--error' : ''}`}>
          {apiStatus}
        </p>
      </header>

      <section class="dashboard__grid">
        <article class="card card--clock">
          <p class="card__label">Local time</p>
          <p class="clock">{new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          })}</p>
          <p class="date">
            {new Date().toLocaleDateString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </article>

        <article class="card">
          <p class="card__label">Weather</p>

          {!weather && !error && <p>Loading weather…</p>}

          {error && (
            <p class="error-message">
              Could not load mock weather data: {error}
            </p>
          )}

          {weather?.locations.map((location) => (
            <div class="weather-row" key={location.id}>
              <div>
                <h2>{location.name}</h2>
                <p>{location.condition}</p>
              </div>

              <p class="temperature">{location.temperature}°</p>
            </div>
          ))}
        </article>

        <article class="card">
          <p class="card__label">Sports</p>
          <h2>Mock endpoint ready</h2>
          <p>Next: connect this card to `/api/sports`.</p>
        </article>

        <article class="card">
          <p class="card__label">Calendar</p>
          <h2>Mock endpoint ready</h2>
          <p>Next: connect this card to `/api/calendar?view=day`.</p>
        </article>
      </section>
    </main>
  );
}

export default App;
import { useEffect, useState } from 'preact/hooks';

import ClockCard from './components/ClockCard';
import WeatherCard from './components/WeatherCard';
import SportsCard from './components/SportsCard';
import CalendarCard from './components/CalendarCard';
import CountdownCard from './components/CountdownCard';
import BirthdaysCard from './components/BirthdaysCard';
import AnnouncementsCard from './components/AnnouncementsCard';

import './app.css';

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function App() {
  const [localData, setLocalData] = useState({
    countdowns: null,
    birthdays: null,
    announcements: null
  });

  const [localStatus, setLocalStatus] = useState('loading');
  const [localError, setLocalError] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('loading');
  const [weatherError, setWeatherError] = useState(null);

  const [sportsData, setSportsData] = useState(null);
  const [sportsStatus, setSportsStatus] = useState('loading');
  const [sportsError, setSportsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocalData() {
      try {
        const [countdowns, birthdays, announcements] = await Promise.all([
          fetchJson('/api/countdowns'),
          fetchJson('/api/birthdays'),
          fetchJson('/api/announcements')
        ]);

        if (!isMounted) {
          return;
        }

        setLocalData({
          countdowns,
          birthdays,
          announcements
        });

        setLocalStatus('ready');
      } catch (error) {
        console.error('Local dashboard data failed to load:', error);

        if (isMounted) {
          setLocalError(error.message);
          setLocalStatus('error');
        }
      }
    }


    loadLocalData();

    return () => {
      isMounted = false;
    };
  }, []);

useEffect(() => {
  let isMounted = true;

  async function loadWeather() {
    try {
      const response = await fetch('/api/weather');

      if (!response.ok) {
        throw new Error(`Weather request failed: ${response.status}`);
      }

      const weather = await response.json();

      if (isMounted) {
        setWeatherData(weather);
        setWeatherStatus('ready');
        setWeatherError(null);
      }
    } catch (error) {
      console.error('Weather failed to load:', error);

      if (isMounted) {
        setWeatherStatus('error');
        setWeatherError(error.message);
      }
    }
  }

  loadWeather();

  const refreshTimer = window.setInterval(
    loadWeather,
    5 * 60 * 1000
  );

  return () => {
    isMounted = false;
    window.clearInterval(refreshTimer);
  };
}, []);

useEffect(() => {
  let isMounted = true;

  async function loadSports() {
    try {
      const response = await fetch('/api/sports');

      if (!response.ok) {
        throw new Error(`Sports request failed: ${response.status}`);
      }

      const sports = await response.json();

      if (isMounted) {
        setSportsData(sports);
        setSportsStatus('ready');
        setSportsError(null);
      }
    } catch (error) {
      console.error('Sports failed to load:', error);

      if (isMounted) {
        setSportsStatus('error');
        setSportsError(error.message);
      }
    }
  }

  loadSports();

  const refreshTimer = window.setInterval(
    loadSports,
    5 * 60 * 1000
  );

  return () => {
    isMounted = false;
    window.clearInterval(refreshTimer);
  };
}, []);
  
  return (
    <main class="dashboard-page">
      <header class="dashboard-topbar">
        <div>
          <p class="dashboard-eyebrow">Goselaz home</p>
          <h1>Dashboard</h1>
        </div>

        <div class="dashboard-topbar__right">
          <span class={`demo-badge demo-badge--${localStatus}`}>
            Local data: {localStatus}
          </span>
          <p>Countdowns, birthdays, and announcements use SQLite.</p>
        </div>
      </header>

      <section class="dashboard-grid" aria-label="Household dashboard">
        <ClockCard />

        <WeatherCard
          status={weatherStatus}
          data={weatherData}
          error={weatherError}
        />

        <CalendarCard status="loading" data={null} />

        <SportsCard
          status={sportsStatus}
          data={sportsData}
          error={sportsError}
        />

        <CountdownCard
          status={localStatus}
          data={localData.countdowns}
          error={localError}
        />

        <BirthdaysCard
          status={localStatus}
          data={localData.birthdays}
          error={localError}
        />

        <AnnouncementsCard
          status={localStatus}
          data={localData.announcements}
          error={localError}
        />
      </section>
    </main>
  );
}

export default App;
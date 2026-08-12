import { useEffect, useState } from 'preact/hooks';

import WeekOutlookBar from './components/WeekOutlookBar';
import TimeWeatherBar from './components/TimeWeatherBar';
import SportsCard from './components/SportsCard';
import CalendarCard from './components/CalendarCard';
import CountdownCard from './components/CountdownCard';
import AnnouncementsCard from './components/AnnouncementsCard';
import AdminPage from './pages/AdminPage';

import './app.css';

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function Dashboard() {
  const [localData, setLocalData] = useState({
    countdowns: null,
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

  const [calendarData, setCalendarData] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState('loading');
  const [calendarError, setCalendarError] = useState(null);

  const [weekCalendarData, setWeekCalendarData] = useState(null);
  const [weekCalendarStatus, setWeekCalendarStatus] = useState('loading');
  const [weekCalendarError, setWeekCalendarError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocalData() {
      try {
        const [countdowns, announcements] = await Promise.all([
          fetchJson('/api/countdowns'),
          fetchJson('/api/announcements')
        ]);

        if (!isMounted) {
          return;
        }

        setLocalData({
          countdowns,
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

useEffect(() => {
  let isMounted = true;

  async function loadCalendar() {
    try {
      const response = await fetch('/api/calendar?view=day');

      if (!response.ok) {
        const responseData = await response.json();

        throw new Error(
          responseData.error
          || `Calendar request failed: ${response.status}`
        );
      }

      const calendar = await response.json();

      if (isMounted) {
        setCalendarData(calendar);
        setCalendarStatus('ready');
        setCalendarError(null);
      }
    } catch (error) {
      console.error('Calendar failed to load:', error);

      if (isMounted) {
        setCalendarStatus('error');
        setCalendarError(error.message);
      }
    }
  }

  loadCalendar();

  const refreshTimer = window.setInterval(
    loadCalendar,
    5 * 60 * 1000
  );

  return () => {
    isMounted = false;
    window.clearInterval(refreshTimer);
  };
}, []);

useEffect(() => {
  let isMounted = true;

  async function loadWeekCalendar() {
    try {
      const response = await fetch('/api/calendar?view=week');

      if (!response.ok) {
        const responseData = await response.json();

        throw new Error(
          responseData.error
          || `Calendar request failed: ${response.status}`
        );
      }

      const calendar = await response.json();

      if (isMounted) {
        setWeekCalendarData(calendar);
        setWeekCalendarStatus('ready');
        setWeekCalendarError(null);
      }
    } catch (error) {
      console.error('Week calendar failed to load:', error);

      if (isMounted) {
        setWeekCalendarStatus('error');
        setWeekCalendarError(error.message);
      }
    }
  }

  loadWeekCalendar();

  const refreshTimer = window.setInterval(
    loadWeekCalendar,
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
          <p>Countdowns and announcements use SQLite.</p>
        </div>

        <a class="admin-button" href="/admin">
          Manage dashboard
        </a>
      </header>

      <WeekOutlookBar
        status={weekCalendarStatus}
        data={weekCalendarData}
        error={weekCalendarError}
      />

      <TimeWeatherBar
        weatherStatus={weatherStatus}
        weatherData={weatherData}
        weatherError={weatherError}
      />

      <section class="dashboard-grid" aria-label="Household dashboard">
        <CalendarCard
          status={calendarStatus}
          data={calendarData}
          error={calendarError}
          />

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

        <AnnouncementsCard
          status={localStatus}
          data={localData.announcements}
          error={localError}
        />
      </section>
    </main>
  );
}

function App() {
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  return <Dashboard />;
}

export default App;
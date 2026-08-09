import ClockCard from './components/ClockCard';
import WeatherCard from './components/WeatherCard';
import SportsCard from './components/SportsCard';
import CalendarCard from './components/CalendarCard';
import CountdownCard from './components/CountdownCard';
import BirthdaysCard from './components/BirthdaysCard';
import AnnouncementsCard from './components/AnnouncementsCard';
import './app.css';

const searchParams = new URLSearchParams(window.location.search);
const requestedState = searchParams.get('state');

const validStates = ['ready', 'loading', 'empty', 'error'];
const demoState = validStates.includes(requestedState)
  ? requestedState
  : 'ready';

const mockWeather = {
  updatedAt: 'a few moments ago',
  locations: [
    {
      id: 1,
      name: 'Knoxville, TN',
      temperature: 82,
      high: 87,
      low: 68,
      condition: 'Partly cloudy'
    },
    {
      id: 2,
      name: 'Destin, FL',
      temperature: 86,
      high: 89,
      low: 76,
      condition: 'Sunny'
    }
  ]
};

const mockSports = {
  updatedAt: 'a few moments ago',
  teams: [
    {
      id: 1,
      team: 'Tennessee Volunteers',
      league: 'NCAA Football',
      lastGame: {
        opponent: 'Example Opponent',
        score: '31–17',
        result: 'W'
      },
      nextGame: {
        opponent: 'Example University',
        date: 'Sat · 7:30 PM'
      }
    }
  ]
};

const mockCalendar = {
  updatedAt: 'a few moments ago',
  events: [
    {
      id: 1,
      time: '7:00 AM',
      title: 'Morning workout',
      location: 'Home'
    },
    {
      id: 2,
      time: '12:00 PM',
      title: 'Lunch meeting',
      location: 'Downtown'
    },
    {
      id: 3,
      time: '6:30 PM',
      title: 'Dinner with friends',
      location: 'Downtown'
    }
  ]
};

const mockCountdowns = {
  countdowns: [
    {
      id: 1,
      title: 'Beach trip',
      date: 'September 1',
      daysUntil: 23
    },
    {
      id: 2,
      title: 'Thanksgiving',
      date: 'November 26',
      daysUntil: 109
    }
  ]
};

const mockBirthdays = {
  birthdays: [
    {
      id: 1,
      name: 'Maddie',
      date: 'August 18',
      daysUntil: 8
    },
    {
      id: 2,
      name: 'Mom',
      date: 'September 4',
      daysUntil: 25
    }
  ]
};

const mockAnnouncements = {
  announcements: [
    {
      id: 1,
      title: 'Trash night',
      body: 'Put bins out Sunday evening.',
      priority: 'normal'
    },
    {
      id: 2,
      title: 'Grocery reminder',
      body: 'Add meal-prep ingredients before the next store run.',
      priority: 'high'
    }
  ]
};

function App() {
  const emptyData = {
    locations: [],
    teams: [],
    events: [],
    countdowns: [],
    birthdays: [],
    announcements: []
  };

  const isEmpty = demoState === 'empty';

  return (
    <main class="dashboard-page">
      <header class="dashboard-topbar">
        <div>
          <p class="dashboard-eyebrow">Goselaz home</p>
          <h1>Dashboard</h1>
        </div>

        <div class="dashboard-topbar__right">
          <span class={`demo-badge demo-badge--${demoState}`}>
            Demo: {demoState}
          </span>
          <p>Data refreshes automatically once APIs are connected.</p>
        </div>
      </header>

      <section class="dashboard-grid" aria-label="Household dashboard">
        <ClockCard status={demoState} />

        <WeatherCard
          status={demoState}
          data={isEmpty ? emptyData : mockWeather}
        />

        <CalendarCard
          status={demoState}
          data={isEmpty ? emptyData : mockCalendar}
        />

        <SportsCard
          status={demoState}
          data={isEmpty ? emptyData : mockSports}
        />

        <CountdownCard
          status={demoState}
          data={isEmpty ? emptyData : mockCountdowns}
        />

        <BirthdaysCard
          status={demoState}
          data={isEmpty ? emptyData : mockBirthdays}
        />

        <AnnouncementsCard
          status={demoState}
          data={isEmpty ? emptyData : mockAnnouncements}
        />
      </section>
    </main>
  );
}

export default App;
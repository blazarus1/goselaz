const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pi-dashboard-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/weather', (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    locations: [
      {
        id: 1,
        name: 'Knoxville, TN',
        temperature: 82,
        feelsLike: 85,
        condition: 'Partly Cloudy',
        icon: 'partly-cloudy',
        high: 87,
        low: 68
      },
      {
        id: 2,
        name: 'Destin, FL',
        temperature: 86,
        feelsLike: 94,
        condition: 'Sunny',
        icon: 'sunny',
        high: 89,
        low: 76
      }
    ]
  });
});

app.get('/api/sports', (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    teams: [
      {
        id: 1,
        team: 'Tennessee Volunteers',
        league: 'NCAA Football',
        lastGame: {
          date: '2026-08-06',
          opponent: 'Example Opponent',
          score: '31–17',
          result: 'W'
        },
        nextGame: {
          date: '2026-08-15T19:30:00-04:00',
          opponent: 'Example University',
          location: 'Home'
        }
      }
    ]
  });
});

app.get('/api/calendar', (req, res) => {
  const view = req.query.view || 'day';

  res.json({
    view,
    updatedAt: new Date().toISOString(),
    events: [
      {
        id: 'event-1',
        title: 'Morning workout',
        start: '2026-08-10T07:00:00-04:00',
        end: '2026-08-10T08:00:00-04:00',
        location: 'Home'
      },
      {
        id: 'event-2',
        title: 'Dinner with friends',
        start: '2026-08-10T18:30:00-04:00',
        end: '2026-08-10T20:30:00-04:00',
        location: 'Downtown'
      }
    ]
  });
});

app.get('/api/countdowns', (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    countdowns: [
      {
        id: 1,
        title: 'Beach trip',
        targetDate: '2026-09-01'
      },
      {
        id: 2,
        title: 'Thanksgiving',
        targetDate: '2026-11-26'
      }
    ]
  });
});

app.get('/api/birthdays', (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    birthdays: [
      {
        id: 1,
        name: 'Example Person',
        date: '2026-08-18',
        daysUntil: 8
      }
    ]
  });
});

app.get('/api/announcements', (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    announcements: [
      {
        id: 1,
        title: 'Trash Night',
        body: 'Put bins out Sunday evening.',
        priority: 'normal'
      }
    ]
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Pi Dashboard API running at http://localhost:${PORT}`);
});
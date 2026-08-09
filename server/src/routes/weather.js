const express = require('express');
const { getWeatherDashboard } = require('../services/weatherService');

const router = express.Router();

router.get('/weather', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1';

    const weatherDashboard = await getWeatherDashboard(forceRefresh);

    const allUnavailable = weatherDashboard.locations.every(
      (location) => location.unavailable
    );

    if (allUnavailable) {
      return res.status(503).json({
        error: 'Weather is currently unavailable.',
        ...weatherDashboard
      });
    }

    return res.json(weatherDashboard);
  } catch (error) {
    console.error('GET /api/weather failed:', error);

    return res.status(500).json({
      error: 'Unable to load weather data.'
    });
  }
});

module.exports = router;
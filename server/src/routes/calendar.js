const express = require('express');
const { getCalendarData } = require('../services/googleCalendarService');

const router = express.Router();

router.get('/calendar', async (req, res) => {
  try {
    const view = req.query.view || 'day';
    const calendarData = await getCalendarData(view);

    return res.json(calendarData);
  } catch (error) {
    console.error('GET /api/calendar failed:', error);

    if (error.code === 'CALENDAR_NOT_AUTHORIZED') {
      return res.status(401).json({
        error: error.message,
        authorizationUrl: '/auth/google'
      });
    }

    return res.status(500).json({
      error: 'Unable to load calendar events.'
    });
  }
});

module.exports = router;
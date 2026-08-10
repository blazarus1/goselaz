const express = require('express');
const { getSportsDashboard } = require('../services/sportsService');

const router = express.Router();

router.get('/sports', async (req, res) => {
  try {
    const sportsDashboard = await getSportsDashboard();

    const allUnavailable = sportsDashboard.teams.length > 0
      && sportsDashboard.teams.every(
        (team) => team.source === 'unavailable'
      );

    if (allUnavailable) {
      return res.status(503).json({
        error: 'Sports data is currently unavailable.',
        ...sportsDashboard
      });
    }

    return res.json(sportsDashboard);
  } catch (error) {
    console.error('GET /api/sports failed:', error);

    return res.status(500).json({
      error: 'Unable to load sports data.'
    });
  }
});

module.exports = router;
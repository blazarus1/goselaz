const express = require('express');

const {
  getAuthorizationUrl,
  completeAuthorization
} = require('../services/googleCalendarService');

const router = express.Router();

router.get('/auth/google', (req, res) => {
  try {
    const authorizationUrl = getAuthorizationUrl();

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Google authorization start failed:', error);

    return res.status(500).send(`
      <h1>Google Calendar authorization failed</h1>
      <p>${error.message}</p>
    `);
  }
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    if (req.query.error) {
      return res.status(400).send(`
        <h1>Google Calendar authorization was cancelled</h1>
        <p>${req.query.error}</p>
      `);
    }

    if (!req.query.code) {
      return res.status(400).send(`
        <h1>Google Calendar authorization failed</h1>
        <p>No authorization code was returned.</p>
      `);
    }

    await completeAuthorization(req.query.code);

    return res.send(`
      <main style="font-family: system-ui; padding: 2rem;">
        <h1>Google Calendar connected</h1>
        <p>You can return to the dashboard now.</p>
      </main>
    `);
  } catch (error) {
    console.error('Google authorization callback failed:', error);

    return res.status(500).send(`
      <h1>Google Calendar authorization failed</h1>
      <p>${error.message}</p>
    `);
  }
});

module.exports = router;
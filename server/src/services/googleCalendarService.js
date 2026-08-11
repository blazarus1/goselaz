const crypto = require('node:crypto');
const { google } = require('googleapis');
const { getDb } = require('../db/db');

const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly';

function getEncryptionKey() {
  const base64Key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!base64Key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is missing from .env');
  }

  const key = Buffer.from(base64Key, 'base64');

  if (key.length !== 32) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.'
    );
  }

  return key;
}

function encryptTokens(tokens) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(tokens), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join('.');
}

function decryptTokens(encryptedPayload) {
  const [ivBase64, authTagBase64, encryptedBase64] =
    encryptedPayload.split('.');

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

function saveTokens(tokens) {
  const db = getDb();
  const encryptedTokens = encryptTokens(tokens);

  db.prepare(`
    INSERT INTO google_oauth_tokens (
      id,
      encrypted_tokens,
      updated_at
    )
    VALUES (1, ?, CURRENT_TIMESTAMP)

    ON CONFLICT(id) DO UPDATE SET
      encrypted_tokens = excluded.encrypted_tokens,
      updated_at = CURRENT_TIMESTAMP
  `).run(encryptedTokens);
}

function loadTokens() {
  const db = getDb();

  const row = db.prepare(`
    SELECT encrypted_tokens AS encryptedTokens
    FROM google_oauth_tokens
    WHERE id = 1
  `).get();

  if (!row) {
    return null;
  }

  return decryptTokens(row.encryptedTokens);
}

function getOAuthClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  } = process.env;

  if (
    !GOOGLE_CLIENT_ID
    || !GOOGLE_CLIENT_SECRET
    || !GOOGLE_REDIRECT_URI
  ) {
    throw new Error(
      'Google OAuth configuration is missing from .env'
    );
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

function getAuthorizationUrl() {
  const oauthClient = getOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [CALENDAR_SCOPE]
  });
}

async function completeAuthorization(code) {
  const oauthClient = getOAuthClient();
  const existingTokens = loadTokens() || {};

  const { tokens } = await oauthClient.getToken(code);

  const mergedTokens = {
    ...existingTokens,
    ...tokens
  };

  if (!mergedTokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Revoke dashboard access in your Google Account, then authorize again.'
    );
  }

  saveTokens(mergedTokens);

  return mergedTokens;
}

function getAuthorizedCalendar() {
  const storedTokens = loadTokens();

  if (!storedTokens?.refresh_token) {
    const error = new Error(
      'Google Calendar has not been authorized. Visit /auth/google.'
    );

    error.code = 'CALENDAR_NOT_AUTHORIZED';

    throw error;
  }

  const oauthClient = getOAuthClient();
  oauthClient.setCredentials(storedTokens);

  oauthClient.on('tokens', (newTokens) => {
    saveTokens({
      ...storedTokens,
      ...newTokens
    });
  });

  return google.calendar({
    version: 'v3',
    auth: oauthClient
  });
}

function getCalendarIds() {
  return (process.env.GOOGLE_CALENDAR_IDS || 'primary')
    .split(',')
    .map((calendarId) => calendarId.trim())
    .filter(Boolean);
}

function startOfLocalDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function getDateWindow(view) {
  const now = new Date();

  if (view === 'day') {
    const start = startOfLocalDay(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  const start = startOfLocalDay(now);
  const dayOfWeek = start.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeEvent(event, calendarId, calendarIndex) {
  const isAllDay = Boolean(event.start?.date);

  const start = isAllDay
    ? `${event.start.date}T00:00:00`
    : event.start.dateTime;

  const end = isAllDay
    ? `${event.end.date}T00:00:00`
    : event.end.dateTime;

  const eventDate = isAllDay
    ? event.start.date
    : getLocalDateKey(new Date(event.start.dateTime));

  return {
    id: `${calendarId}:${event.id}`,
    calendarId,
    calendarIndex,
    title: event.summary || 'Untitled event',
    location: event.location || null,
    start,
    end,
    eventDate,
    isAllDay
  };
}

function buildWeekDays(startDate) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);

    return {
      date: getLocalDateKey(date),
      label: date.toLocaleDateString([], {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric'
      }),
      events: []
    };
  });
}

async function getCalendarData(view) {
  if (!['day', 'week'].includes(view)) {
    throw new Error('Calendar view must be "day" or "week".');
  }

  const calendar = getAuthorizedCalendar();
  const calendarIds = getCalendarIds();
  const { start, end } = getDateWindow(view);

  const calendarResponses = await Promise.all(
    calendarIds.map(async (calendarId, calendarIndex) => {
      const response = await calendar.events.list({
        calendarId,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });

      return (response.data.items || []).map((event) =>
        normalizeEvent(event, calendarId, calendarIndex)
      );
    })
  );

  const events = calendarResponses
    .flat()
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  if (view === 'day') {
    return {
      view,
      updatedAt: new Date().toISOString(),
      events
    };
  }

  const days = buildWeekDays(start);

  for (const event of events) {
    const matchingDay = days.find(
      (day) => day.date === event.eventDate
    );

    if (matchingDay) {
      matchingDay.events.push(event);
    }
  }

  return {
    view,
    updatedAt: new Date().toISOString(),
    days
  };
}

module.exports = {
  getAuthorizationUrl,
  completeAuthorization,
  getCalendarData
};
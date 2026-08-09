const express = require('express');
const { getDb } = require('../db/db');

const router = express.Router();

function getNextBirthday(month, day) {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let birthday = new Date(
    now.getFullYear(),
    month - 1,
    day
  );

  if (birthday < today) {
    birthday = new Date(
      now.getFullYear() + 1,
      month - 1,
      day
    );
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.round(
    (birthday.getTime() - today.getTime()) / millisecondsPerDay
  );

  return {
    date: birthday.toLocaleDateString([], {
      month: 'long',
      day: 'numeric'
    }),
    daysUntil
  };
}

function getLastUpdated(tableName) {
  const db = getDb();

  const row = db
    .prepare(`SELECT MAX(updated_at) AS updatedAt FROM ${tableName}`)
    .get();

  return row?.updatedAt || null;
}

router.get('/countdowns', (req, res) => {
  try {
    const db = getDb();

    const countdowns = db.prepare(`
      SELECT
        id,
        title,
        target_date AS targetDate,
        category
      FROM countdowns
      WHERE is_active = 1
        AND target_date >= date('now')
      ORDER BY target_date ASC
      LIMIT 6
    `).all();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedCountdowns = countdowns.map((countdown) => {
      const targetDate = new Date(`${countdown.targetDate}T00:00:00`);
      const millisecondsPerDay = 1000 * 60 * 60 * 24;

      return {
        ...countdown,
        date: targetDate.toLocaleDateString([], {
          month: 'long',
          day: 'numeric'
        }),
        daysUntil: Math.round(
          (targetDate.getTime() - today.getTime()) / millisecondsPerDay
        )
      };
    });

    res.json({
      updatedAt: getLastUpdated('countdowns'),
      countdowns: formattedCountdowns
    });
  } catch (error) {
    console.error('GET /api/countdowns failed:', error);

    res.status(500).json({
      error: 'Unable to load countdowns.'
    });
  }
});

router.get('/birthdays', (req, res) => {
  try {
    const db = getDb();

    const birthdays = db.prepare(`
      SELECT
        id,
        name,
        birth_month AS birthMonth,
        birth_day AS birthDay,
        birth_year AS birthYear,
        notes
      FROM birthdays
      WHERE is_active = 1
    `).all();

    const formattedBirthdays = birthdays
      .map((birthday) => {
        const nextBirthday = getNextBirthday(
          birthday.birthMonth,
          birthday.birthDay
        );

        return {
          id: birthday.id,
          name: birthday.name,
          date: nextBirthday.date,
          daysUntil: nextBirthday.daysUntil,
          age: birthday.birthYear
            ? new Date().getFullYear() - birthday.birthYear
            : null,
          notes: birthday.notes
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 6);

    res.json({
      updatedAt: getLastUpdated('birthdays'),
      birthdays: formattedBirthdays
    });
  } catch (error) {
    console.error('GET /api/birthdays failed:', error);

    res.status(500).json({
      error: 'Unable to load birthdays.'
    });
  }
});

router.get('/announcements', (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const announcements = db.prepare(`
      SELECT
        id,
        title,
        body,
        priority,
        starts_at AS startsAt,
        ends_at AS endsAt
      FROM announcements
      WHERE is_active = 1
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (ends_at IS NULL OR ends_at >= ?)
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT 6
    `).all(now, now);

    res.json({
      updatedAt: getLastUpdated('announcements'),
      announcements
    });
  } catch (error) {
    console.error('GET /api/announcements failed:', error);

    res.status(500).json({
      error: 'Unable to load announcements.'
    });
  }
});

module.exports = router;
const express = require('express');
const { getDb } = require('../db/db');
const { localNetworkOnly } = require('../lib/adminAuth');

const router = express.Router();

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

router.get('/groceries', (req, res) => {
  try {
    const db = getDb();

    const items = db.prepare(`
      SELECT
        id,
        item,
        quantity,
        is_checked AS isChecked
      FROM grocery_items
      ORDER BY is_checked ASC, item ASC
    `).all();

    res.json({
      updatedAt: getLastUpdated('grocery_items'),
      items
    });
  } catch (error) {
    console.error('GET /api/groceries failed:', error);

    res.status(500).json({
      error: 'Unable to load the grocery list.'
    });
  }
});

router.patch('/groceries/:id/toggle', localNetworkOnly, (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: 'Invalid item ID.'
      });
    }

    const db = getDb();

    const result = db.prepare(`
      UPDATE grocery_items
      SET
        is_checked = CASE is_checked WHEN 1 THEN 0 ELSE 1 END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Item not found.'
      });
    }

    const item = db.prepare(`
      SELECT
        id,
        item,
        quantity,
        is_checked AS isChecked
      FROM grocery_items
      WHERE id = ?
    `).get(id);

    return res.json(item);
  } catch (error) {
    console.error('PATCH /api/groceries/:id/toggle failed:', error);

    return res.status(500).json({
      error: 'Unable to update the item.'
    });
  }
});

module.exports = router;
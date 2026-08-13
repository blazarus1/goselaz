const express = require('express');
const bcrypt = require('bcryptjs');

const { getDb } = require('../db/db');

const {
  localNetworkOnly,
  createSession,
  clearSession,
  getSession,
  requireAdmin
} = require('../lib/adminAuth');

const router = express.Router();

const resources = {
  countdowns: {
    table: 'countdowns',
    columns: ['title', 'target_date', 'category', 'is_active'],
    listSql: `
      SELECT
        id,
        title,
        target_date AS targetDate,
        category,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM countdowns
      ORDER BY target_date ASC
    `
  },

  announcements: {
    table: 'announcements',
    columns: [
      'title',
      'body',
      'priority',
      'starts_at',
      'ends_at',
      'is_active'
    ],
    listSql: `
      SELECT
        id,
        title,
        body,
        priority,
        starts_at AS startsAt,
        ends_at AS endsAt,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM announcements
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        created_at DESC
    `
  },

  groceries: {
    table: 'grocery_items',
    columns: ['item', 'quantity', 'is_checked'],
    listSql: `
      SELECT
        id,
        item,
        quantity,
        is_checked AS isChecked,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM grocery_items
      ORDER BY is_checked ASC, item ASC
    `
  },

  locations: {
    table: 'locations',
    columns: [
      'name',
      'latitude',
      'longitude',
      'timezone',
      'is_active',
      'sort_order'
    ],
    listSql: `
      SELECT
        id,
        name,
        latitude,
        longitude,
        timezone,
        is_active AS isActive,
        sort_order AS sortOrder,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM locations
      ORDER BY sort_order ASC, name ASC
    `
  },

  'favorite-teams': {
    table: 'favorite_teams',
    columns: [
      'team_name',
      'sport',
      'league',
      'data_source',
      'external_team_id',
      'is_active',
      'sort_order'
    ],
    listSql: `
      SELECT
        id,
        team_name AS teamName,
        sport,
        league,
        data_source AS dataSource,
        external_team_id AS externalTeamId,
        is_active AS isActive,
        sort_order AS sortOrder,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM favorite_teams
      ORDER BY sort_order ASC, team_name ASC
    `
  }
};

function createValidationError(fields) {
  const error = new Error('Please correct the highlighted fields.');

  error.validationFields = fields;

  return error;
}

function getRequiredText(value, fieldName, fields, maxLength = 200) {
  const text = String(value || '').trim();

  if (!text) {
    fields[fieldName] = 'This field is required.';
  } else if (text.length > maxLength) {
    fields[fieldName] = `Use ${maxLength} characters or fewer.`;
  }

  return text;
}

function getOptionalText(value, maxLength = 500) {
  const text = String(value || '').trim();

  return text ? text.slice(0, maxLength) : null;
}

function getInteger(value, fieldName, fields, min, max, fallback = null) {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue)
    || parsedValue < min
    || parsedValue > max
  ) {
    fields[fieldName] = `Enter a whole number from ${min} to ${max}.`;

    return fallback;
  }

  return parsedValue;
}

function getDecimal(value, fieldName, fields, min, max) {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue)
    || parsedValue < min
    || parsedValue > max
  ) {
    fields[fieldName] = `Enter a number from ${min} to ${max}.`;

    return null;
  }

  return parsedValue;
}

function getBoolean(value) {
  return value === true
    || value === 1
    || value === '1'
    || value === 'true'
    ? 1
    : 0;
}

function getOptionalDateTime(value, fieldName, fields) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    fields[fieldName] = 'Enter a valid date and time.';

    return null;
  }

  return parsedDate.toISOString();
}

function normalizePayload(resourceName, payload) {
  const fields = {};

  switch (resourceName) {
    case 'countdowns': {
      const targetDate = String(payload.targetDate || '').trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        fields.targetDate = 'Choose a valid target date.';
      }

      const normalized = {
        title: getRequiredText(payload.title, 'title', fields),
        target_date: targetDate,
        category: getOptionalText(payload.category, 80),
        is_active: getBoolean(payload.isActive)
      };

      if (Object.keys(fields).length > 0) {
        throw createValidationError(fields);
      }

      return normalized;
    }

    case 'announcements': {
      const priority = payload.priority || 'normal';

      if (!['low', 'normal', 'high'].includes(priority)) {
        fields.priority = 'Choose low, normal, or high priority.';
      }

      const startsAt = getOptionalDateTime(
        payload.startsAt,
        'startsAt',
        fields
      );

      const endsAt = getOptionalDateTime(
        payload.endsAt,
        'endsAt',
        fields
      );

      if (
        startsAt
        && endsAt
        && new Date(endsAt) < new Date(startsAt)
      ) {
        fields.endsAt = 'End time must occur after start time.';
      }

      const normalized = {
        title: getRequiredText(payload.title, 'title', fields),
        body: getOptionalText(payload.body),
        priority,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: getBoolean(payload.isActive)
      };

      if (Object.keys(fields).length > 0) {
        throw createValidationError(fields);
      }

      return normalized;
    }

    case 'groceries': {
      const normalized = {
        item: getRequiredText(payload.item, 'item', fields, 120),
        quantity: getOptionalText(payload.quantity, 60),
        is_checked: getBoolean(payload.isChecked)
      };

      if (Object.keys(fields).length > 0) {
        throw createValidationError(fields);
      }

      return normalized;
    }

    case 'locations': {
      const normalized = {
        name: getRequiredText(payload.name, 'name', fields),
        latitude: getDecimal(
          payload.latitude,
          'latitude',
          fields,
          -90,
          90
        ),
        longitude: getDecimal(
          payload.longitude,
          'longitude',
          fields,
          -180,
          180
        ),
        timezone: getRequiredText(
          payload.timezone,
          'timezone',
          fields,
          80
        ),
        is_active: getBoolean(payload.isActive),
        sort_order: getInteger(
          payload.sortOrder,
          'sortOrder',
          fields,
          0,
          999,
          0
        )
      };

      if (Object.keys(fields).length > 0) {
        throw createValidationError(fields);
      }

      return normalized;
    }

    case 'favorite-teams': {
      const normalized = {
        team_name: getRequiredText(payload.teamName, 'teamName', fields),
        sport: getRequiredText(payload.sport, 'sport', fields, 80),
        league: getOptionalText(payload.league, 80),
        data_source: getRequiredText(
          payload.dataSource || 'thesportsdb',
          'dataSource',
          fields,
          80
        ),
        external_team_id: getOptionalText(
          payload.externalTeamId,
          100
        ),
        is_active: getBoolean(payload.isActive),
        sort_order: getInteger(
          payload.sortOrder,
          'sortOrder',
          fields,
          0,
          999,
          0
        )
      };

      if (Object.keys(fields).length > 0) {
        throw createValidationError(fields);
      }

      return normalized;
    }

    default:
      throw new Error('Unknown admin resource.');
  }
}

function getResource(resourceName) {
  return resources[resourceName] || null;
}

function validateRecordId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    const error = new Error('Invalid record ID.');

    error.statusCode = 400;

    throw error;
  }

  return parsedId;
}

function sendRouteError(res, error) {
  if (error.validationFields) {
    return res.status(400).json({
      error: error.message,
      fields: error.validationFields
    });
  }

  if (error.code?.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({
      error: 'A record with that name already exists.'
    });
  }

  console.error('Admin route failed:', error);

  return res.status(error.statusCode || 500).json({
    error: error.message || 'The requested action could not be completed.'
  });
}

router.use(localNetworkOnly);

router.get('/session', (req, res) => {
  const session = getSession(req);

  return res.json({
    authenticated: Boolean(session)
  });
});

router.post('/login', async (req, res) => {
  try {
    const password = String(req.body?.password || '');
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!password) {
      return res.status(400).json({
        error: 'Enter the admin password.'
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        error: 'Password must be 72 characters or fewer.'
      });
    }

    if (!passwordHash) {
      return res.status(500).json({
        error: 'ADMIN_PASSWORD_HASH is missing from .env.'
      });
    }

    const matches = await bcrypt.compare(password, passwordHash);

    if (!matches) {
      return res.status(401).json({
        error: 'Incorrect password.'
      });
    }

    createSession(res);

    return res.json({
      authenticated: true
    });
  } catch (error) {
    return sendRouteError(res, error);
  }
});

router.post('/logout', requireAdmin, (req, res) => {
  clearSession(req, res);

  return res.json({
    authenticated: false
  });
});

router.use(requireAdmin);

router.get('/:resource', (req, res) => {
  try {
    const resource = getResource(req.params.resource);

    if (!resource) {
      return res.status(404).json({
        error: 'Unknown admin resource.'
      });
    }

    const db = getDb();
    const records = db.prepare(resource.listSql).all();

    return res.json({
      records
    });
  } catch (error) {
    return sendRouteError(res, error);
  }
});

router.post('/:resource', (req, res) => {
  try {
    const resource = getResource(req.params.resource);

    if (!resource) {
      return res.status(404).json({
        error: 'Unknown admin resource.'
      });
    }

    const payload = normalizePayload(
      req.params.resource,
      req.body || {}
    );

    const values = resource.columns.map(
      (column) => payload[column]
    );

    const placeholders = resource.columns.map(() => '?').join(', ');

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO ${resource.table} (
        ${resource.columns.join(', ')}
      )
      VALUES (${placeholders})
    `).run(...values);

    return res.status(201).json({
      id: result.lastInsertRowid
    });
  } catch (error) {
    return sendRouteError(res, error);
  }
});

router.put('/:resource/:id', (req, res) => {
  try {
    const resource = getResource(req.params.resource);

    if (!resource) {
      return res.status(404).json({
        error: 'Unknown admin resource.'
      });
    }

    const id = validateRecordId(req.params.id);

    const payload = normalizePayload(
      req.params.resource,
      req.body || {}
    );

    const values = resource.columns.map(
      (column) => payload[column]
    );

    const assignments = [
      ...resource.columns.map((column) => `${column} = ?`),
      'updated_at = CURRENT_TIMESTAMP'
    ];

    const db = getDb();

    const result = db.prepare(`
      UPDATE ${resource.table}
      SET ${assignments.join(', ')}
      WHERE id = ?
    `).run(...values, id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Record not found.'
      });
    }

    return res.json({
      id,
      updated: true
    });
  } catch (error) {
    return sendRouteError(res, error);
  }
});

router.delete('/:resource/:id', (req, res) => {
  try {
    const resource = getResource(req.params.resource);

    if (!resource) {
      return res.status(404).json({
        error: 'Unknown admin resource.'
      });
    }

    const id = validateRecordId(req.params.id);
    const db = getDb();

    const result = db.prepare(`
      DELETE FROM ${resource.table}
      WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Record not found.'
      });
    }

    return res.json({
      id,
      deleted: true
    });
  } catch (error) {
    return sendRouteError(res, error);
  }
});

module.exports = router;
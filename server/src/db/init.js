const fs = require('node:fs');
const path = require('node:path');
const { getDb, databasePath } = require('./db');

function initializeDatabase() {
  const db = getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema);

  const seedLocations = db.prepare(`
    INSERT OR IGNORE INTO locations (
      name,
      latitude,
      longitude,
      timezone,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const seedTeams = db.prepare(`
    INSERT OR IGNORE INTO favorite_teams (
      team_name,
      sport,
      league,
      data_source,
      external_team_id,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedCountdowns = db.prepare(`
    INSERT OR IGNORE INTO countdowns (
      title,
      target_date,
      category
    )
    VALUES (?, ?, ?)
  `);

  const seedDatabase = db.transaction(() => {
    seedLocations.run(
      'Knoxville, TN',
      35.9606,
      -83.9207,
      'America/New_York',
      1
    );

    seedLocations.run(
      'Carmel-By-The-Sea, CA',
      36.5552,
      -121.9233,
      ' America/Los_Angeles',
      2
    );

    seedTeams.run(
      'Tennessee Volunteers',
      'Football',
      'NCAA',
      'thesportsdb',
      null,
      1
    );

    seedCountdowns.run(
      'Beach trip',
      '2026-09-01',
      'Travel'
    );

    seedCountdowns.run(
      'Thanksgiving',
      '2026-11-26',
      'Holiday'
    );
  });

  seedDatabase();

  console.log(`Database initialized: ${databasePath}`);

  return db;
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase
};
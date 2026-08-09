const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dataDirectory = path.resolve(__dirname, '../../../data');
const databasePath = path.join(dataDirectory, 'dashboard.db');

let database;

function getDb() {
  if (database) {
    return database;
  }

  fs.mkdirSync(dataDirectory, { recursive: true });

  database = new Database(databasePath);

  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  return database;
}

module.exports = {
  getDb,
  databasePath
};
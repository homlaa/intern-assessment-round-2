const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

/**
 * Two related tables, linked by city_id:
 *   city_information      — place name + coordinates
 *   personal_information  — attendee details, foreign key to a city
 *
 * sql.js is used so SQLite runs without a native C++ build on Windows.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS city_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS personal_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birthdate TEXT NOT NULL,
    city_id INTEGER NOT NULL,
    FOREIGN KEY (city_id) REFERENCES city_information(id)
  );
`;

// JOIN used whenever we return an attendee with their city.
const ATTENDEE_CITY_JOIN_SQL = `
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.birthdate,
    c.name AS city_name,
    c.latitude,
    c.longitude
  FROM personal_information AS p
  INNER JOIN city_information AS c ON c.id = p.city_id
  WHERE p.id = ?
`.trim();

function persist(db) {
  if (!db.filePath) {
    return;
  }

  const data = Buffer.from(db.raw.export());
  fs.writeFileSync(db.filePath, data);
}

function getRow(db, sql, params = []) {
  const stmt = db.raw.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function run(db, sql, params = []) {
  db.raw.run(sql, params);
  const lastInsertRowid = Number(getRow(db, "SELECT last_insert_rowid() AS id").id);
  const changes = db.raw.getRowsModified();
  persist(db);
  return { lastInsertRowid, changes };
}

async function createDb(filePath = path.join(__dirname, "..", "data", "attendees.db")) {
  const SQL = await initSqlJs();
  let raw;
  let persistPath = null;

  if (filePath === ":memory:") {
    raw = new SQL.Database();
  } else {
    persistPath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (fs.existsSync(filePath)) {
      raw = new SQL.Database(fs.readFileSync(filePath));
    } else {
      raw = new SQL.Database();
    }
  }

  raw.run("PRAGMA foreign_keys = ON;");
  raw.exec(SCHEMA);

  const db = { raw, filePath: persistPath };
  persist(db);
  return db;
}

function getOrCreateCity(db, { name, latitude, longitude }) {
  const existing = getRow(
    db,
    `SELECT id FROM city_information
     WHERE name = ? AND latitude = ? AND longitude = ?`,
    [name, latitude, longitude]
  );

  if (existing) {
    return Number(existing.id);
  }

  const result = run(
    db,
    `INSERT INTO city_information (name, latitude, longitude)
     VALUES (?, ?, ?)`,
    [name, latitude, longitude]
  );

  return result.lastInsertRowid;
}

function insertAttendee(db, { firstName, lastName, birthdate, cityId }) {
  const result = run(
    db,
    `INSERT INTO personal_information (first_name, last_name, birthdate, city_id)
     VALUES (?, ?, ?, ?)`,
    [firstName, lastName, birthdate, cityId]
  );

  return result.lastInsertRowid;
}

function getAttendeeWithCity(db, id) {
  return getRow(db, ATTENDEE_CITY_JOIN_SQL, [id]);
}

function updateAttendeeBirthdate(db, id, birthdate) {
  const result = run(
    db,
    `UPDATE personal_information SET birthdate = ? WHERE id = ?`,
    [birthdate, id]
  );

  return result.changes > 0;
}

module.exports = {
  ATTENDEE_CITY_JOIN_SQL,
  createDb,
  getOrCreateCity,
  insertAttendee,
  getAttendeeWithCity,
  updateAttendeeBirthdate,
};

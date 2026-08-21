const express = require('express');
const Database = require('better-sqlite3');
const app = express();

app.use(express.json());
app.use(express.static('.'));

const db = new Database('attendees.db');

db.exec(`
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
`);

app.post('/api/attendees', (req, res) => {
  const { first_name, last_name, birthdate, city, latitude, longitude } = req.body;

  let city_row = db.prepare('SELECT id FROM city_information WHERE name = ?').get(city);
  if (!city_row) {
    const result = db.prepare(
      'INSERT INTO city_information (name, latitude, longitude) VALUES (?, ?, ?)'
    ).run(city, latitude, longitude);
    city_row = { id: result.lastInsertRowid };
  }

  const attendee = db.prepare(
    'INSERT INTO personal_information (first_name, last_name, birthdate, city_id) VALUES (?, ?, ?, ?)'
  ).run(first_name, last_name, birthdate, city_row.id);

  const joined = db.prepare(`
    SELECT p.id, p.first_name, p.last_name, p.birthdate,
           c.name AS city, c.latitude, c.longitude
    FROM personal_information p
    JOIN city_information c ON p.city_id = c.id
    WHERE p.id = ?
  `).get(attendee.lastInsertRowid);

  res.json(joined);
});

app.patch('/api/attendees/:id', (req, res) => {
  const { birthdate } = req.body;
  const { id } = req.params;

  const result = db.prepare(
    'UPDATE personal_information SET birthdate = ? WHERE id = ?'
  ).run(birthdate, id);

  if (result.changes === 0) return res.status(404).json({ error: 'attendee is not found' });

  res.json({ id: Number(id), birthdate });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

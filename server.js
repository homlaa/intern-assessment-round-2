const express = require("express");
const initSqlJs = require("sql.js");

const app = express();
app.use(express.json());

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/form.htm");
});

let db;

async function start() {
  if (db) return;
  const SQL = await initSqlJs();
  db = new SQL.Database();

  db.run(`CREATE TABLE city_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    latitude REAL,
    longitude REAL
  )`);

  db.run(`CREATE TABLE personal_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT,
    last_name TEXT,
    birthdate TEXT,
    city_id INTEGER
  )`);
}

app.post("/api/attendees", async function (req, res) {
  await start();

  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let birthdate = req.body.birthdate;
  let city = req.body.city;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;

  if (!firstName || !lastName || !birthdate || !city || latitude == null || longitude == null) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  db.run("INSERT INTO city_information (name, latitude, longitude) VALUES (?, ?, ?)", [
    city,
    latitude,
    longitude,
  ]);
  let cityId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];

  db.run(
    "INSERT INTO personal_information (first_name, last_name, birthdate, city_id) VALUES (?, ?, ?, ?)",
    [firstName, lastName, birthdate, cityId]
  );
  let id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];

  let joinQuery =
    "SELECT p.first_name, p.last_name, c.name, c.latitude, c.longitude FROM personal_information p JOIN city_information c ON p.city_id = c.id WHERE p.id = " +
    id;

  let joinResult = db.exec(joinQuery);

  res.json({
    id: id,
    joinQuery: joinQuery,
    joinResult: joinResult,
  });
});

app.patch("/api/attendees/:id", async function (req, res) {
  await start();

  let id = req.params.id;
  let birthdate = req.body.birthdate;

  let rows = db.exec("SELECT * FROM personal_information WHERE id = " + id);
  if (rows.length == 0) {
    res.status(404).json({ error: "Attendee not found" });
    return;
  }

  db.run("UPDATE personal_information SET birthdate = ? WHERE id = ?", [birthdate, id]);
  res.json({ message: "updated" });
});

if (require.main === module) {
  start().then(function () {
    app.listen(3000, function () {
      console.log("running on port 3000");
    });
  });
}

module.exports = { app, start };

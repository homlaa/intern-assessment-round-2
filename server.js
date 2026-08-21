const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

const db = new sqlite3.Database("./database.db");

db.run(`CREATE TABLE IF NOT EXISTS city_information (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  latitude REAL,
  longitude REAL
)`);

db.run(`CREATE TABLE IF NOT EXISTS personal_information (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  birthdate TEXT,
  city_id INTEGER
)`);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/form.htm");
});

app.post("/api/attendees", function (req, res) {
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let birthdate = req.body.birthdate;
  let city = req.body.city;
  let latitude = req.body.latitude;
  let longitude = req.body.longitude;

  if (!firstName || !lastName || !birthdate || !city || !latitude || !longitude) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  db.run(
    "INSERT INTO city_information (name, latitude, longitude) VALUES (?, ?, ?)",
    [city, latitude, longitude],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      let cityId = this.lastID;

      db.run(
        "INSERT INTO personal_information (first_name, last_name, birthdate, city_id) VALUES (?, ?, ?, ?)",
        [firstName, lastName, birthdate, cityId],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          let id = this.lastID;
          let joinQuery =
            "SELECT p.first_name, p.last_name, c.name, c.latitude, c.longitude FROM personal_information p JOIN city_information c ON p.city_id = c.id WHERE p.id = ?";

          db.get(joinQuery, [id], function (err, row) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            res.json({
              id: id,
              joinQuery: joinQuery,
              joinResult: row,
            });
          });
        }
      );
    }
  );
});

app.patch("/api/attendees/:id", function (req, res) {
  let id = req.params.id;
  let birthdate = req.body.birthdate;

  db.get("SELECT * FROM personal_information WHERE id = ?", [id], function (err, row) {
    if (!row) {
      res.status(404).json({ error: "Attendee not found" });
      return;
    }

    db.run("UPDATE personal_information SET birthdate = ? WHERE id = ?", [birthdate, id], function (err) {
      res.json({ message: "updated" });
    });
  });
});

if (require.main === module) {
  app.listen(3000, function () {
    console.log("server running on port 3000");
  });
}

module.exports = app;

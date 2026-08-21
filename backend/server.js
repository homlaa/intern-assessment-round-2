const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------------
// POST /api/attendees
// ----------------------------------------------------------

app.post("/api/attendees", async (req, res) => {
  const {
    firstName,
    lastName,
    birthdate,
    city,
    latitude,
    longitude
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !birthdate ||
    !city ||
    latitude == null ||
    longitude == null
  ) {
    return res.status(400).json({
      error: "All fields are required"
    });
  }

  try {
    // Insert city first.
    const cityResult = await pool.query(
      `INSERT INTO city_information
       (city_name, latitude, longitude)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [city, latitude, longitude]
    );

    const cityId = cityResult.rows[0].id;

    // Insert attendee using city_id.
    const attendeeResult = await pool.query(
      `INSERT INTO personal_information
       (first_name, last_name, birthdate, city_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [firstName, lastName, birthdate, cityId]
    );

    return res.status(201).json({
      message: "Attendee registered",
      attendeeId: attendeeResult.rows[0].id
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Database error"
    });
  }
});

// ----------------------------------------------------------
// GET /api/attendees — JOIN
// ----------------------------------------------------------

app.get("/api/attendees", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.birthdate,
        c.city_name,
        c.latitude,
        c.longitude
      FROM personal_information p
      JOIN city_information c
        ON p.city_id = c.id
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Database error"
    });
  }
});

// ----------------------------------------------------------
// PATCH /api/attendees/:id
// ----------------------------------------------------------

app.patch("/api/attendees/:id", async (req, res) => {
  const { id } = req.params;
  const { birthdate } = req.body;

  if (!birthdate) {
    return res.status(400).json({
      error: "Birthdate is required"
    });
  }

  try {
    const result = await pool.query(
      `UPDATE personal_information
       SET birthdate = $1
       WHERE id = $2
       RETURNING id, first_name, last_name, birthdate`,
      [birthdate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Attendee not found"
      });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Database error"
    });
  }
});

// Export app for testing.
module.exports = app;

// Only start server when this file is run directly.
if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

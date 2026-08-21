const path = require("path");
const express = require("express");
const {
  ATTENDEE_CITY_JOIN_SQL,
  getOrCreateCity,
  insertAttendee,
  getAttendeeWithCity,
  updateAttendeeBirthdate,
} = require("./db");

function createApp(db) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  /**
   * POST /api/attendees
   * Saves personal data and city data into the two SQL tables,
   * then returns the JOIN result (name + city name/lat/lng).
   */
  app.post("/api/attendees", (req, res) => {
    const { firstName, lastName, birthdate, city, latitude, longitude } = req.body || {};

    if (!firstName || !lastName || !birthdate || !city) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ error: "City coordinates are required." });
    }

    try {
      const cityId = getOrCreateCity(db, {
        name: city,
        latitude,
        longitude,
      });

      const attendeeId = insertAttendee(db, {
        firstName,
        lastName,
        birthdate,
        cityId,
      });

      const attendee = getAttendeeWithCity(db, attendeeId);

      return res.status(201).json({
        attendee,
        joinQuery: ATTENDEE_CITY_JOIN_SQL,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save attendee." });
    }
  });

  /**
   * PATCH /api/attendees/:id
   * Updates only the attendee's birthdate. Missing IDs return 404.
   */
  app.patch("/api/attendees/:id", (req, res) => {
    const id = Number(req.params.id);
    const { birthdate } = req.body || {};

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid attendee id." });
    }

    if (!birthdate) {
      return res.status(400).json({ error: "Birthdate is required." });
    }

    try {
      const updated = updateAttendeeBirthdate(db, id, birthdate);

      if (!updated) {
        return res.status(404).json({ error: "Attendee not found." });
      }

      return res.status(200).json({
        attendee: getAttendeeWithCity(db, id),
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update attendee." });
    }
  });

  return app;
}

module.exports = { createApp };

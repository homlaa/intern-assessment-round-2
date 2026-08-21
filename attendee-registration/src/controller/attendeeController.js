const pool = require("../db/pool");

async function createAttendee(req, res) {
  const {
    firstName,
    lastName,
    birthdate,
    city,
    latitude,
    longitude
  } = req.body;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !birthdate ||
    !city?.trim() ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return res.status(400).json({
      error: "All registration fields are required"
    });
  }

  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  if (
    !Number.isFinite(numericLatitude) ||
    !Number.isFinite(numericLongitude)
  ) {
    return res.status(400).json({
      error: "Latitude and longitude must be valid numbers"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cityResult = await client.query(
      `INSERT INTO city_information (name, latitude, longitude)
       VALUES ($1, $2, $3)
       ON CONFLICT (name, latitude, longitude)
       DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [city.trim(), numericLatitude, numericLongitude]
    );

    const cityId = cityResult.rows[0].id;

    const attendeeResult = await client.query(
      `INSERT INTO personal_information
         (first_name, last_name, birthdate, city_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        firstName.trim(),
        lastName.trim(),
        birthdate,
        cityId
      ]
    );

    const attendeeId = attendeeResult.rows[0].id;

    const joinedResult = await client.query(
      `SELECT
         p.id,
         p.first_name,
         p.last_name,
         p.birthdate,
         c.name AS city_name,
         c.latitude,
         c.longitude
       FROM personal_information AS p
       JOIN city_information AS c
         ON p.city_id = c.id
       WHERE p.id = $1`,
      [attendeeId]
    );

    await client.query("COMMIT");

    return res.status(201).json(joinedResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create attendee error:", error);

    return res.status(500).json({
      error: "Could not save attendee"
    });
  } finally {
    client.release();
  }
}

async function updateAttendeeBirthdate(req, res) {
  const attendeeId = Number(req.params.id);
  const { birthdate } = req.body;

  if (!Number.isInteger(attendeeId) || attendeeId <= 0) {
    return res.status(400).json({
      error: "Invalid attendee ID"
    });
  }

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
       RETURNING
         id,
         first_name,
         last_name,
         birthdate,
         city_id`,
      [birthdate, attendeeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Attendee not found"
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update attendee error:", error);

    return res.status(500).json({
      error: "Could not update attendee"
    });
  }
}

module.exports = {
  createAttendee,
  updateAttendeeBirthdate
};
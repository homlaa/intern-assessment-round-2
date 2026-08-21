const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "intern_assessment",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDatabaseConnection() {
    try {
        const connection = await db.getConnection();
        console.log("MySQL database connected successfully.");
        connection.release();
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
    }
}

testDatabaseConnection();

app.get("/", (req, res) => {
    res.json({
        message: "Attendee Registration API is running"
    });
});

app.post("/api/attendees", async (req, res) => {
    try {
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
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const [cityResult] = await db.execute(
            `INSERT INTO city_information
            (city_name, latitude, longitude)
            VALUES (?, ?, ?)`,
            [city, latitude, longitude]
        );

        const cityId = cityResult.insertId;

        const [attendeeResult] = await db.execute(
            `INSERT INTO personal_information
            (first_name, last_name, birthdate, city_id)
            VALUES (?, ?, ?, ?)`,
            [firstName, lastName, birthdate, cityId]
        );

        res.status(201).json({
            message: "Attendee registered successfully.",
            attendeeId: attendeeResult.insertId,
            cityId: cityId
        });
    } catch (error) {
        console.error("Error creating attendee:", error);

        res.status(500).json({
            message: "Failed to register attendee.",
            error: error.message
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');

// rebuild a fresh in-memory app for testing
function buildApp() {
    const app = express();
    app.use(express.json());

    const db = new Database(':memory:');
    db.exec(`
        CREATE TABLE city_information (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL
        );
        CREATE TABLE personal_information (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            birthdate TEXT NOT NULL,
            city_id INTEGER NOT NULL,
            FOREIGN KEY (city_id) REFERENCES city_information(id)
        );
    `);

    app.patch('/api/attendees/:id', (req, res) => {
        const { birthdate } = req.body;
        const { id } = req.params;
        const result = db.prepare(
            'UPDATE personal_information SET birthdate = ? WHERE id = ?'
        ).run(birthdate, id);
        if (result.changes === 0) return res.status(404).json({ error: 'Attendee not found' });
        res.json({ id: Number(id), birthdate });
    });

    return app;
}

test('PATCH /api/attendees/:id returns 404 when attendee does not exist', async () => {
    const app = buildApp();
    const response = await request(app)
        .patch('/api/attendees/999')
        .send({ birthdate: '2000-01-01' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Attendee not found');
});

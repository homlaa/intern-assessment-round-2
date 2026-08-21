const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createDb } = require("../server/db");
const { createApp } = require("../server/app");

async function makeApp() {
  return createApp(await createDb(":memory:"));
}

test("POST /api/attendees saves both tables and returns the JOIN result", async () => {
  const app = await makeApp();

  const response = await request(app).post("/api/attendees").send({
    firstName: "Mugisha",
    lastName: "Pacifique",
    birthdate: "2000-01-15",
    city: "Kigali",
    latitude: -1.9536,
    longitude: 30.0606,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.attendee.first_name, "Mugisha");
  assert.equal(response.body.attendee.city_name, "Kigali");
  assert.match(response.body.joinQuery, /INNER JOIN city_information/i);
});

test("PATCH /api/attendees/:id returns 404 when the attendee does not exist", async () => {
  const app = await makeApp();

  const response = await request(app)
    .patch("/api/attendees/999")
    .send({ birthdate: "1995-04-12" });

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Attendee not found.");
});

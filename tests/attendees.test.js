const test = require("node:test");
const assert = require("assert");
const request = require("supertest");
const app = require("../server");

test("PATCH endpont returns 404 when attendee does not exist", async () => {
  const res = await request(app)
    .patch("/api/attendees/999")
    .send({ birthdate: "2000-01-01" });

  assert.equal(res.status, 404);
});

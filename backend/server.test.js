const request = require("supertest");
const app = require("./server");

describe("PATCH /api/attendees/:id", () => {
  test("returns 404 when attendee does not exist", async () => {
    const response = await request(app)
      .patch("/api/attendees/999999")
      .send({
        birthdate: "2008-01-01"
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Attendee not found");
  });
});

const request = require("supertest");

jest.mock("../src/db/pool", () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const pool = require("../src/db/pool");
const app = require("../src/app");

describe("PATCH /api/attendees/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 404 when the attendee does not exist", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 0,
      rows: []
    });

    const response = await request(app)
      .patch("/api/attendees/999999")
      .send({
        birthdate: "2000-05-10"
      });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: "Attendee not found"
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when birthdate is missing", async () => {
    const response = await request(app)
      .patch("/api/attendees/1")
      .send({});

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "Birthdate is required"
    });

    expect(pool.query).not.toHaveBeenCalled();
  });

  test("returns 400 when attendee ID is invalid", async () => {
    const response = await request(app)
      .patch("/api/attendees/not-a-number")
      .send({
        birthdate: "2000-05-10"
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "Invalid attendee ID"
    });

    expect(pool.query).not.toHaveBeenCalled();
  });
});
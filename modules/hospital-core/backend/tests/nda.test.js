const request = require("supertest");
const { app } = require("../src/app");

describe("POST /api/nda/submit", () => {
  it("accepts a valid payload", async () => {
    const res = await request(app)
      .post("/api/nda/submit")
      .send({
        organizationName: "Test Org",
        contactName: "Test User",
        email: "test@example.com",
        country: "Egypt",
        useCase: "Testing NDA flow",
        notes: "Automated test"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.ndaId).toBeDefined();
  });

  it("rejects an invalid payload", async () => {
    const res = await request(app)
      .post("/api/nda/submit")
      .send({
        email: "bad"
      });

    expect(res.statusCode).toBe(400);
  });
});

const request = require("supertest");
const { app } = require("../src/app");

describe("GET /api/admin/nda", () => {
  it("rejects unauthenticated access", async () => {
    const res = await request(app).get("/api/admin/nda");

    expect(res.statusCode).toBe(401);
  });
});

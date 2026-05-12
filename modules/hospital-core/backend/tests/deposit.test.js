const request = require("supertest");
const { app } = require("../src/app");

describe("Deposit flow", () => {
  it("creates a deposit from a valid request", async () => {
    const res = await request(app)
      .post("/api/deposit/create")
      .send({
        organizationName: "Deposit Org",
        email: "deposit@example.com",
        paymentMethod: "manual_invoice"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.depositId).toBeDefined();
    expect(res.body.status).toBe("pending");
    expect(res.body.email).toBe("deposit@example.com");
  });

  it("rejects an invalid deposit payload", async () => {
    const res = await request(app)
      .post("/api/deposit/create")
      .send({
        email: "deposit@example.com"
      });

    expect(res.statusCode).toBe(400);
  });
});

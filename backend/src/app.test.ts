import request from "supertest";
import app from "./app.js";

describe("Health Check", () => {
  it("GET /api/v1/health should return 200 with status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
  });
});

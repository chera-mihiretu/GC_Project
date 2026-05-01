import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockGetSessionFromHeaders = jest.fn<(...args: any[]) => any>();
const mockCreateBooking = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../../auth/infrastructure/session-repository.js", () => ({
  getSessionFromHeaders: mockGetSessionFromHeaders,
}));

jest.unstable_mockModule("../use-cases/create-booking.js", () => ({
  createBooking: mockCreateBooking,
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../../../app.js");

describe("POST /api/v1/bookings", () => {
  const coupleSession = {
    user: { id: "couple-123", role: "couple", banned: false },
    session: { id: "session-1" },
  };

  const validBody = {
    vendorProfileId: "vp-456",
    serviceCategory: "photography",
    eventDate: "2027-06-15",
    message: "Looking forward to working with you",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 201 with the created booking", async () => {
    mockGetSessionFromHeaders.mockResolvedValue(coupleSession);
    mockCreateBooking.mockResolvedValue({
      id: "booking-001",
      coupleId: "couple-123",
      vendorId: "vendor-789",
      vendorProfileId: "vp-456",
      serviceCategory: "photography",
      eventDate: "2027-06-15",
      message: "Looking forward to working with you",
      status: "pending",
      declineReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Cookie", "session=fake")
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.id).toBe("booking-001");
  });

  it("should return 401 when not authenticated", async () => {
    mockGetSessionFromHeaders.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/bookings")
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it("should return 403 when user role is not couple", async () => {
    mockGetSessionFromHeaders.mockResolvedValue({
      user: { id: "vendor-1", role: "vendor", banned: false },
      session: { id: "session-2" },
    });

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Cookie", "session=fake")
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it("should return 409 when duplicate booking exists", async () => {
    mockGetSessionFromHeaders.mockResolvedValue(coupleSession);
    mockCreateBooking.mockRejectedValue(
      Object.assign(new Error("Duplicate booking"), { statusCode: 409 }),
    );

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Cookie", "session=fake")
      .send(validBody);

    expect(res.status).toBe(409);
  });
});

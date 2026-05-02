import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockReviewCreate = jest.fn<(...args: any[]) => any>();
const mockFindByBookingId = jest.fn<(...args: any[]) => any>();
const mockGetAverageRating = jest.fn<(...args: any[]) => any>();
const mockBookingFindById = jest.fn<(...args: any[]) => any>();
const mockSendNotification = jest.fn<(...args: any[]) => any>();
const mockPoolQuery = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../infrastructure/review.repository.js", () => ({
  create: mockReviewCreate,
  findByBookingId: mockFindByBookingId,
  getAverageRating: mockGetAverageRating,
}));

jest.unstable_mockModule("../../booking/infrastructure/booking.repository.js", () => ({
  findById: mockBookingFindById,
}));

jest.unstable_mockModule("../../realtime/use-cases/send-notification.js", () => ({
  sendNotification: mockSendNotification,
}));

jest.unstable_mockModule("../../../config/db.js", () => ({
  pool: { query: mockPoolQuery },
}));

const { createReview } = await import("./create-review.js");

describe("createReview use case", () => {
  const validInput = {
    bookingId: "booking-001",
    coupleId: "couple-123",
    rating: 5,
    comment: "Amazing service!",
  };

  const mockBooking = {
    id: "booking-001",
    coupleId: "couple-123",
    vendorId: "vendor-456",
    vendorProfileId: "vp-789",
    serviceCategory: "photography",
    eventDate: "2027-06-15",
    message: null,
    status: "completed",
    declineReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReview = {
    id: "review-001",
    bookingId: "booking-001",
    coupleId: "couple-123",
    vendorId: "vendor-456",
    vendorProfileId: "vp-789",
    rating: 5,
    comment: "Amazing service!",
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingFindById.mockResolvedValue(mockBooking);
    mockFindByBookingId.mockResolvedValue(null);
    mockReviewCreate.mockResolvedValue(mockReview);
    mockGetAverageRating.mockResolvedValue({ avg: 4.5, count: 10 });
    mockPoolQuery.mockResolvedValue({ rows: [] });
    mockSendNotification.mockResolvedValue({});
  });

  it("should create review for a completed booking", async () => {
    const result = await createReview(validInput);

    expect(result).toEqual(mockReview);
    expect(mockReviewCreate).toHaveBeenCalledWith({
      bookingId: "booking-001",
      coupleId: "couple-123",
      vendorId: "vendor-456",
      vendorProfileId: "vp-789",
      rating: 5,
      comment: "Amazing service!",
    });
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE vendor_profiles"),
      [4.5, 10, "vp-789"],
    );
  });

  it("should return 400 for rating below 1", async () => {
    await expect(createReview({ ...validInput, rating: 0 }))
      .rejects.toMatchObject({ statusCode: 400, message: "Rating must be an integer between 1 and 5" });
  });

  it("should return 400 for rating above 5", async () => {
    await expect(createReview({ ...validInput, rating: 6 }))
      .rejects.toMatchObject({ statusCode: 400, message: "Rating must be an integer between 1 and 5" });
  });

  it("should return 400 for non-integer rating", async () => {
    await expect(createReview({ ...validInput, rating: 3.5 }))
      .rejects.toMatchObject({ statusCode: 400, message: "Rating must be an integer between 1 and 5" });
  });

  it("should return 404 if booking not found", async () => {
    mockBookingFindById.mockResolvedValue(null);

    await expect(createReview(validInput))
      .rejects.toMatchObject({ statusCode: 404, message: "Booking not found" });
  });

  it("should return 403 if couple does not own the booking", async () => {
    mockBookingFindById.mockResolvedValue({ ...mockBooking, coupleId: "other-couple" });

    await expect(createReview(validInput))
      .rejects.toMatchObject({ statusCode: 403, message: "You do not own this booking" });
  });

  it("should return 400 if booking is not completed (pending)", async () => {
    mockBookingFindById.mockResolvedValue({ ...mockBooking, status: "pending" });

    await expect(createReview(validInput))
      .rejects.toMatchObject({ statusCode: 400, message: "You can only review completed bookings" });
  });

  it("should return 400 if booking is not completed (accepted)", async () => {
    mockBookingFindById.mockResolvedValue({ ...mockBooking, status: "accepted" });

    await expect(createReview(validInput))
      .rejects.toMatchObject({ statusCode: 400, message: "You can only review completed bookings" });
  });

  it("should return 409 if review already exists for this booking", async () => {
    mockFindByBookingId.mockResolvedValue(mockReview);

    await expect(createReview(validInput))
      .rejects.toMatchObject({ statusCode: 409, message: "You have already reviewed this booking" });
  });

  it("should send notification to vendor on success", async () => {
    await createReview(validInput);

    expect(mockSendNotification).toHaveBeenCalledWith({
      userId: "vendor-456",
      type: "new_review",
      title: "New Review",
      body: "You received a 5-star review for your service.",
      metadata: { reviewId: "review-001", bookingId: "booking-001" },
    });
  });
});

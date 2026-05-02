import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockFindById = jest.fn<(...args: any[]) => any>();
const mockUpdateApproval = jest.fn<(...args: any[]) => any>();
const mockGetAverageRating = jest.fn<(...args: any[]) => any>();
const mockPoolQuery = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../infrastructure/review.repository.js", () => ({
  findById: mockFindById,
  updateApproval: mockUpdateApproval,
  getAverageRating: mockGetAverageRating,
}));

jest.unstable_mockModule("../../../config/db.js", () => ({
  pool: { query: mockPoolQuery },
}));

const { moderateReview } = await import("./moderate-review.js");

describe("moderateReview use case", () => {
  const mockReview = {
    id: "review-001",
    bookingId: "booking-001",
    coupleId: "couple-123",
    vendorId: "vendor-456",
    vendorProfileId: "vp-789",
    rating: 5,
    comment: "Great!",
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindById.mockResolvedValue(mockReview);
    mockUpdateApproval.mockResolvedValue({ ...mockReview, isApproved: false });
    mockGetAverageRating.mockResolvedValue({ avg: 4.5, count: 9 });
    mockPoolQuery.mockResolvedValue({ rows: [] });
  });

  it("should approve a review and recalculate vendor rating", async () => {
    mockUpdateApproval.mockResolvedValue({ ...mockReview, isApproved: true });

    const result = await moderateReview("review-001", "approve");

    expect(mockUpdateApproval).toHaveBeenCalledWith("review-001", true);
    expect(mockGetAverageRating).toHaveBeenCalledWith("vp-789");
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE vendor_profiles"),
      [4.5, 9, "vp-789"],
    );
    expect(result.isApproved).toBe(true);
  });

  it("should reject a review and recalculate vendor rating", async () => {
    const result = await moderateReview("review-001", "reject");

    expect(mockUpdateApproval).toHaveBeenCalledWith("review-001", false);
    expect(mockGetAverageRating).toHaveBeenCalledWith("vp-789");
    expect(result.isApproved).toBe(false);
  });

  it("should return 404 if review not found", async () => {
    mockFindById.mockResolvedValue(null);

    await expect(moderateReview("nonexistent", "approve"))
      .rejects.toMatchObject({ statusCode: 404, message: "Review not found" });
  });
});

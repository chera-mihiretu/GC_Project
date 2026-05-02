import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockFindByCoupleId = jest.fn<(...args: any[]) => any>();
const mockFindByVendorId = jest.fn<(...args: any[]) => any>();
const mockFindByIdWithDetails = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../infrastructure/booking.repository.js", () => ({
  findByCoupleId: mockFindByCoupleId,
  findByVendorId: mockFindByVendorId,
  findByIdWithDetails: mockFindByIdWithDetails,
}));

const { listBookingsForCouple, listBookingsForVendor, getBookingById } =
  await import("./list-bookings.js");

describe("listBookingsForCouple", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return paginated bookings for a couple", async () => {
    const mockResult = {
      data: [{ id: "bk-1", coupleId: "couple-1", status: "pending" }],
      total: 1,
      page: 1,
      limit: 20,
    };
    mockFindByCoupleId.mockResolvedValue(mockResult);

    const result = await listBookingsForCouple("couple-1", { page: 1, limit: 20 });

    expect(result).toEqual(mockResult);
    expect(mockFindByCoupleId).toHaveBeenCalledWith("couple-1", { page: 1, limit: 20 });
  });

  it("should pass status filter to repository", async () => {
    mockFindByCoupleId.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    await listBookingsForCouple("couple-1", { status: "accepted" as any, page: 1, limit: 20 });

    expect(mockFindByCoupleId).toHaveBeenCalledWith("couple-1", {
      status: "accepted",
      page: 1,
      limit: 20,
    });
  });
});

describe("listBookingsForVendor", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return paginated bookings for a vendor", async () => {
    const mockResult = {
      data: [{ id: "bk-2", vendorId: "vendor-1", status: "pending" }],
      total: 1,
      page: 1,
      limit: 20,
    };
    mockFindByVendorId.mockResolvedValue(mockResult);

    const result = await listBookingsForVendor("vendor-1", { page: 1, limit: 20 });

    expect(result).toEqual(mockResult);
    expect(mockFindByVendorId).toHaveBeenCalledWith("vendor-1", { page: 1, limit: 20 });
  });
});

describe("getBookingById", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const mockBooking = {
    id: "bk-1",
    coupleId: "couple-1",
    vendorId: "vendor-1",
    vendorProfileId: "vp-1",
    serviceCategory: "photography",
    eventDate: "2027-06-15",
    message: null,
    status: "pending",
    declineReason: null,
    businessName: "Great Photography",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should return booking when user is the couple", async () => {
    mockFindByIdWithDetails.mockResolvedValue(mockBooking);

    const result = await getBookingById("bk-1", "couple-1");

    expect(result.id).toBe("bk-1");
  });

  it("should return booking when user is the vendor", async () => {
    mockFindByIdWithDetails.mockResolvedValue(mockBooking);

    const result = await getBookingById("bk-1", "vendor-1");

    expect(result.id).toBe("bk-1");
  });

  it("should throw 404 when booking is not found", async () => {
    mockFindByIdWithDetails.mockResolvedValue(null);

    await expect(getBookingById("bk-999", "couple-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should throw 403 when user is not a participant", async () => {
    mockFindByIdWithDetails.mockResolvedValue(mockBooking);

    await expect(getBookingById("bk-1", "stranger-id")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

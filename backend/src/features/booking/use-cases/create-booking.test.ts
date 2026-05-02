import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockCreate = jest.fn<(...args: any[]) => any>();
const mockExistsForCoupleAndVendor = jest.fn<(...args: any[]) => any>();
const mockIsDateBookedForVendor = jest.fn<(...args: any[]) => any>();
const mockFindVendorProfile = jest.fn<(...args: any[]) => any>();
const mockSendNotification = jest.fn<(...args: any[]) => any>();
const mockIsDateAvailable = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../infrastructure/booking.repository.js", () => ({
  create: mockCreate,
  existsForCoupleAndVendor: mockExistsForCoupleAndVendor,
  isDateBookedForVendor: mockIsDateBookedForVendor,
}));

jest.unstable_mockModule("../../vendor/infrastructure/vendor-profile.repository.js", () => ({
  findById: mockFindVendorProfile,
}));

jest.unstable_mockModule("../../vendor/infrastructure/availability.repository.js", () => ({
  isDateAvailable: mockIsDateAvailable,
}));

jest.unstable_mockModule("../../realtime/use-cases/send-notification.js", () => ({
  sendNotification: mockSendNotification,
}));

const { createBooking } = await import("./create-booking.js");

describe("createBooking use case", () => {
  const validInput = {
    coupleId: "couple-123",
    vendorProfileId: "vp-456",
    serviceCategory: "photography",
    eventDate: "2027-06-15",
    message: "We love your work!",
  };

  const mockVendorProfile = {
    id: "vp-456",
    userId: "vendor-user-789",
    businessName: "Great Photography",
    category: "photography",
    description: null,
    phoneNumber: null,
    location: "Addis Ababa",
    status: "verified",
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendNotification.mockResolvedValue({});
    mockIsDateAvailable.mockResolvedValue(true);
    mockIsDateBookedForVendor.mockResolvedValue(false);
    mockExistsForCoupleAndVendor.mockResolvedValue(false);
  });

  it("should create a booking when all inputs are valid", async () => {
    mockFindVendorProfile.mockResolvedValue(mockVendorProfile);
    mockCreate.mockResolvedValue({
      id: "booking-001",
      coupleId: "couple-123",
      vendorId: "vendor-user-789",
      vendorProfileId: "vp-456",
      serviceCategory: "photography",
      eventDate: "2027-06-15",
      message: "We love your work!",
      status: "pending",
      declineReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createBooking(validInput);

    expect(result.id).toBe("booking-001");
    expect(result.status).toBe("pending");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        coupleId: "couple-123",
        vendorId: "vendor-user-789",
        vendorProfileId: "vp-456",
      }),
    );
  });

  it("should reject when required fields are missing", async () => {
    await expect(
      createBooking({ ...validInput, vendorProfileId: "" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should reject when event date is in the past", async () => {
    await expect(
      createBooking({ ...validInput, eventDate: "2020-01-01" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should reject when vendor profile is not found", async () => {
    mockFindVendorProfile.mockResolvedValue(null);

    await expect(createBooking(validInput)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should reject when vendor is not verified", async () => {
    mockFindVendorProfile.mockResolvedValue({
      ...mockVendorProfile,
      status: "pending_verification",
    });

    await expect(createBooking(validInput)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("should reject when vendor is not available on the selected date", async () => {
    mockFindVendorProfile.mockResolvedValue(mockVendorProfile);
    mockIsDateAvailable.mockResolvedValue(false);

    await expect(createBooking(validInput)).rejects.toMatchObject({
      statusCode: 400,
      message: "Vendor is not available on the selected date",
    });
  });

  it("should reject duplicate booking for same vendor and date", async () => {
    mockFindVendorProfile.mockResolvedValue(mockVendorProfile);
    mockExistsForCoupleAndVendor.mockResolvedValue(true);

    await expect(createBooking(validInput)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

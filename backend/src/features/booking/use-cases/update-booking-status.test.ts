import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { BookingStatus } from "../domain/types.js";

const mockFindById = jest.fn<(...args: any[]) => any>();
const mockUpdateStatus = jest.fn<(...args: any[]) => any>();
const mockIsDateBookedForVendor = jest.fn<(...args: any[]) => any>();
const mockSendNotification = jest.fn<(...args: any[]) => any>();
const mockGetUserEmailById = jest.fn<(...args: any[]) => any>();
const mockGetSendEmailUseCase = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../infrastructure/booking.repository.js", () => ({
  findById: mockFindById,
  updateStatus: mockUpdateStatus,
  isDateBookedForVendor: mockIsDateBookedForVendor,
}));

jest.unstable_mockModule("../../realtime/use-cases/send-notification.js", () => ({
  sendNotification: mockSendNotification,
}));

jest.unstable_mockModule("../infrastructure/user-lookup.js", () => ({
  getUserEmailById: mockGetUserEmailById,
}));

jest.unstable_mockModule("../../email/index.js", () => ({
  getSendEmailUseCase: mockGetSendEmailUseCase,
}));

const { updateBookingStatus } = await import("./update-booking-status.js");

describe("updateBookingStatus use case", () => {
  const pendingBooking = {
    id: "bk-1",
    coupleId: "couple-1",
    vendorId: "vendor-1",
    vendorProfileId: "vp-1",
    serviceCategory: "photography",
    eventDate: "2027-06-15",
    message: null,
    status: BookingStatus.PENDING,
    declineReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const acceptedBooking = { ...pendingBooking, status: BookingStatus.ACCEPTED };
  const depositPaidBooking = { ...pendingBooking, status: BookingStatus.DEPOSIT_PAID };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendNotification.mockResolvedValue({});
    mockGetUserEmailById.mockResolvedValue(null);
    mockIsDateBookedForVendor.mockResolvedValue(false);
  });

  it("should allow vendor to accept a pending booking", async () => {
    mockFindById.mockResolvedValue(pendingBooking);
    mockUpdateStatus.mockResolvedValue({ ...pendingBooking, status: BookingStatus.ACCEPTED });

    const result = await updateBookingStatus({
      bookingId: "bk-1",
      userId: "vendor-1",
      userRole: "vendor",
      newStatus: BookingStatus.ACCEPTED,
    });

    expect(result.status).toBe(BookingStatus.ACCEPTED);
    expect(mockUpdateStatus).toHaveBeenCalledWith("bk-1", BookingStatus.ACCEPTED, undefined);
  });

  it("should allow vendor to decline a pending booking with reason", async () => {
    mockFindById.mockResolvedValue(pendingBooking);
    mockUpdateStatus.mockResolvedValue({ ...pendingBooking, status: BookingStatus.DECLINED });

    const result = await updateBookingStatus({
      bookingId: "bk-1",
      userId: "vendor-1",
      userRole: "vendor",
      newStatus: BookingStatus.DECLINED,
      declineReason: "Fully booked",
    });

    expect(result.status).toBe(BookingStatus.DECLINED);
  });

  it("should allow vendor to complete an accepted booking", async () => {
    mockFindById.mockResolvedValue(acceptedBooking);
    mockUpdateStatus.mockResolvedValue({ ...acceptedBooking, status: BookingStatus.COMPLETED });

    const result = await updateBookingStatus({
      bookingId: "bk-1",
      userId: "vendor-1",
      userRole: "vendor",
      newStatus: BookingStatus.COMPLETED,
    });

    expect(result.status).toBe(BookingStatus.COMPLETED);
  });

  it("should allow couple to cancel a pending booking", async () => {
    mockFindById.mockResolvedValue(pendingBooking);
    mockUpdateStatus.mockResolvedValue({ ...pendingBooking, status: BookingStatus.CANCELLED });

    const result = await updateBookingStatus({
      bookingId: "bk-1",
      userId: "couple-1",
      userRole: "couple",
      newStatus: BookingStatus.CANCELLED,
    });

    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it("should allow couple to cancel an accepted booking", async () => {
    mockFindById.mockResolvedValue(acceptedBooking);
    mockUpdateStatus.mockResolvedValue({ ...acceptedBooking, status: BookingStatus.CANCELLED });

    const result = await updateBookingStatus({
      bookingId: "bk-1",
      userId: "couple-1",
      userRole: "couple",
      newStatus: BookingStatus.CANCELLED,
    });

    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it("should allow couple to cancel a deposit_paid booking", async () => {
    mockFindById.mockResolvedValue(depositPaidBooking);
    mockUpdateStatus.mockResolvedValue({ ...depositPaidBooking, status: BookingStatus.CANCELLED });

    const result = await updateBookingStatus({
      bookingId: "bk-1",
      userId: "couple-1",
      userRole: "couple",
      newStatus: BookingStatus.CANCELLED,
    });

    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it("should reject vendor from cancelling a booking (403)", async () => {
    mockFindById.mockResolvedValue(pendingBooking);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "vendor-1",
        userRole: "vendor",
        newStatus: BookingStatus.CANCELLED,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should reject couple from accepting a booking (403)", async () => {
    mockFindById.mockResolvedValue(pendingBooking);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "couple-1",
        userRole: "couple",
        newStatus: BookingStatus.ACCEPTED,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should reject non-couple from setting DEPOSIT_PAID (403)", async () => {
    mockFindById.mockResolvedValue(acceptedBooking);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "vendor-1",
        userRole: "vendor",
        newStatus: BookingStatus.DEPOSIT_PAID,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should reject non-owner vendor (403)", async () => {
    mockFindById.mockResolvedValue(pendingBooking);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "other-vendor",
        userRole: "vendor",
        newStatus: BookingStatus.ACCEPTED,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should reject non-owner couple (403)", async () => {
    mockFindById.mockResolvedValue(pendingBooking);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "other-couple",
        userRole: "couple",
        newStatus: BookingStatus.CANCELLED,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should return 404 when booking not found", async () => {
    mockFindById.mockResolvedValue(null);

    await expect(
      updateBookingStatus({
        bookingId: "bk-999",
        userId: "vendor-1",
        userRole: "vendor",
        newStatus: BookingStatus.ACCEPTED,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should return 409 when accepting conflicts with existing booking on same date", async () => {
    mockFindById.mockResolvedValue(pendingBooking);
    mockIsDateBookedForVendor.mockResolvedValue(true);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "vendor-1",
        userRole: "vendor",
        newStatus: BookingStatus.ACCEPTED,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("should require decline reason when declining (400)", async () => {
    mockFindById.mockResolvedValue(pendingBooking);

    await expect(
      updateBookingStatus({
        bookingId: "bk-1",
        userId: "vendor-1",
        userRole: "vendor",
        newStatus: BookingStatus.DECLINED,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

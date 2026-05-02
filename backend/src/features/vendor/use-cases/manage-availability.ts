import type { AvailabilityRange } from "../domain/availability-types.js";
import * as availabilityRepo from "../infrastructure/availability.repository.js";

export interface AddAvailabilityInput {
  vendorProfileId: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export async function addAvailabilityRange(input: AddAvailabilityInput): Promise<AvailabilityRange> {
  const { vendorProfileId, startDate, endDate, note } = input;

  if (!startDate || !endDate) {
    throw Object.assign(
      new Error("startDate and endDate are required"),
      { statusCode: 400 },
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw Object.assign(
      new Error("startDate and endDate must be valid dates"),
      { statusCode: 400 },
    );
  }

  if (end < start) {
    throw Object.assign(
      new Error("endDate must be on or after startDate"),
      { statusCode: 400 },
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw Object.assign(
      new Error("Cannot set availability for past dates"),
      { statusCode: 400 },
    );
  }

  return availabilityRepo.create({ vendorProfileId, startDate, endDate, note });
}

export async function removeAvailabilityRange(
  id: string,
  vendorProfileId: string,
): Promise<void> {
  const deleted = await availabilityRepo.deleteById(id, vendorProfileId);
  if (!deleted) {
    throw Object.assign(
      new Error("Availability range not found"),
      { statusCode: 404 },
    );
  }
}

export async function getVendorAvailability(
  vendorProfileId: string,
): Promise<AvailabilityRange[]> {
  return availabilityRepo.findByVendorProfileId(vendorProfileId);
}

export async function getVendorAvailabilityForMonth(
  vendorProfileId: string,
  year: number,
  month: number,
): Promise<AvailabilityRange[]> {
  return availabilityRepo.findByVendorForMonth(vendorProfileId, year, month);
}

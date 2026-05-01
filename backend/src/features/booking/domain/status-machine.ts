import { BookingStatus } from "./types.js";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.ACCEPTED]: [
    BookingStatus.DEPOSIT_PAID,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.DEPOSIT_PAID]: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.DECLINED]: [],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transition(
  from: BookingStatus,
  to: BookingStatus,
): BookingStatus {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid booking status transition: "${from}" → "${to}"`,
    );
  }
  return to;
}

import { VendorStatus } from "./types.js";

const VALID_TRANSITIONS: Record<VendorStatus, VendorStatus[]> = {
  [VendorStatus.REGISTERED]: [VendorStatus.PENDING_VERIFICATION],
  [VendorStatus.PENDING_VERIFICATION]: [
    VendorStatus.VERIFIED,
    VendorStatus.REJECTED,
  ],
  [VendorStatus.VERIFIED]: [
    VendorStatus.SUSPENDED,
    VendorStatus.DEACTIVATED,
  ],
  [VendorStatus.REJECTED]: [VendorStatus.PENDING_VERIFICATION],
  [VendorStatus.SUSPENDED]: [
    VendorStatus.VERIFIED,
    VendorStatus.DEACTIVATED,
  ],
  [VendorStatus.DEACTIVATED]: [],
};

export function canTransition(
  from: VendorStatus,
  to: VendorStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transition(
  from: VendorStatus,
  to: VendorStatus,
): VendorStatus {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid vendor status transition: "${from}" → "${to}"`,
    );
  }
  return to;
}

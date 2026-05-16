export const PaymentStatus = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface Payment {
  id: string;
  bookingId: string;
  coupleId: string;
  vendorId: string;
  txRef: string;
  chapaRef: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────── Earnings ────────────────────

export interface EarningsSummary {
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  currency: string;
  paymentCount: number;
}

export interface VendorPaymentRecord {
  id: string;
  bookingId: string;
  grossAmount: number;
  chargeAmount: number;
  netAmount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  serviceCategory: string | null;
  coupleName: string | null;
}

export const WithdrawalStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

export interface Withdrawal {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  status: WithdrawalStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChapaBank {
  id: string;
  name: string;
  country_id: number;
  created_at: string;
  updated_at: string;
}

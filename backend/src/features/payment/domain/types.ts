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
  chargeAmount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  checkoutUrl: string | null;
  webhookPayload: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitializePaymentDTO {
  bookingId: string;
  coupleId: string;
  amount: number;
  currency?: string;
}

export interface ChapaInitParams {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url?: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
  meta?: Record<string, unknown>;
}

export interface ChapaInitResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: string;
    charge: string;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    created_at: string;
    updated_at: string;
    customization: {
      title: string | null;
      description: string | null;
      logo: string | null;
    };
    meta: unknown;
  };
}

// ──────────────────── Withdrawals ────────────────────

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
  createdAt: Date;
  updatedAt: Date;
}

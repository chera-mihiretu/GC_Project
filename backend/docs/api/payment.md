# Payment API (Chapa Integration)

Base path: `/api/v1/payments`

## Overview

The payment module integrates with [Chapa](https://chapa.co) to handle deposit payments for accepted bookings. It uses Chapa's hosted checkout flow: the backend initializes a transaction, the frontend redirects the user to Chapa's payment page, and the backend verifies the result via polling and webhooks.

---

## POST /initialize

Initialize a Chapa payment transaction for a booking deposit. Returns a checkout URL to redirect the user to.

**Auth:** Required (couple role only)

**Request Body:**

| Field      | Type   | Required | Default | Description                       |
|------------|--------|----------|---------|-----------------------------------|
| bookingId  | string | Yes      | —       | UUID of the accepted booking      |
| amount     | number | Yes      | —       | Deposit amount (must be > 0)      |
| currency   | string | No       | "ETB"   | ISO 4217 currency code            |

**Request Example:**

```json
{
  "bookingId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "amount": 5000,
  "currency": "ETB"
}
```

**Response (201):**

```json
{
  "payment": {
    "id": "f1e2d3c4-5678-90ab-cdef-1234567890ab",
    "bookingId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "coupleId": "user-id",
    "vendorId": "vendor-user-id",
    "txRef": "twedar-a1b2c3d4-1714733000000",
    "chapaRef": null,
    "amount": 5000,
    "currency": "ETB",
    "status": "pending",
    "paymentMethod": null,
    "checkoutUrl": "https://checkout.chapa.co/checkout/payment/...",
    "createdAt": "2026-05-03T08:00:00.000Z",
    "updatedAt": "2026-05-03T08:00:00.000Z"
  },
  "checkoutUrl": "https://checkout.chapa.co/checkout/payment/..."
}
```

**Error Responses:**

| Status | Code                  | Condition                                      |
|--------|-----------------------|------------------------------------------------|
| 400    | BAD_REQUEST           | Missing bookingId or amount, or amount <= 0    |
| 403    | FORBIDDEN             | Booking does not belong to the authenticated user |
| 404    | NOT_FOUND             | Booking not found                              |
| 409    | CONFLICT              | Booking already has a successful payment       |
| 422    | UNPROCESSABLE_ENTITY  | Booking is not in `accepted` status            |
| 502    | BAD_GATEWAY           | Chapa API returned an error                    |

---

## GET /verify/:txRef

Verify a payment transaction with Chapa. If successful, the booking is transitioned to `deposit_paid` and the vendor is notified.

**Auth:** Required (couple role only)

**Path Parameters:**

| Parameter | Type   | Description                        |
|-----------|--------|------------------------------------|
| txRef     | string | The transaction reference from initialization |

**Response (200) — Success:**

```json
{
  "payment": {
    "id": "f1e2d3c4-5678-90ab-cdef-1234567890ab",
    "bookingId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "coupleId": "user-id",
    "vendorId": "vendor-user-id",
    "txRef": "twedar-a1b2c3d4-1714733000000",
    "chapaRef": "APqDvYw1okk2",
    "amount": 5000,
    "currency": "ETB",
    "status": "success",
    "paymentMethod": "telebirr",
    "createdAt": "2026-05-03T08:00:00.000Z",
    "updatedAt": "2026-05-03T08:01:00.000Z"
  },
  "booking": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "coupleId": "user-id",
    "vendorId": "vendor-user-id",
    "vendorProfileId": "profile-id",
    "serviceCategory": "Photography",
    "eventDate": "2026-06-15",
    "message": "Looking forward to working with you!",
    "status": "deposit_paid",
    "declineReason": null,
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-03T08:01:00.000Z"
  }
}
```

**Response (200) — Payment Failed:**

Same structure but `payment.status` is `"failed"` and `booking.status` remains `"accepted"`.

**Error Responses:**

| Status | Code       | Condition                                      |
|--------|------------|------------------------------------------------|
| 403    | FORBIDDEN  | Payment does not belong to the authenticated user |
| 404    | NOT_FOUND  | Payment with the given txRef not found         |
| 502    | BAD_GATEWAY| Chapa API returned an error                    |

---

## POST /webhook

Receives webhook events from Chapa. This endpoint is called server-to-server by Chapa when a payment event occurs. No session auth is required; instead, the `x-chapa-signature` header is verified.

**Auth:** None (signature-verified)

**Headers:**

| Header              | Description                                         |
|---------------------|-----------------------------------------------------|
| x-chapa-signature   | HMAC SHA256 of the request body signed with the secret key |
| chapa-signature     | Alternative signature header (either is accepted)   |

**Request Body (from Chapa):**

```json
{
  "event": "charge.success",
  "first_name": "Bilen",
  "last_name": "Gizachew",
  "email": "couple@example.com",
  "mobile": "0912345678",
  "currency": "ETB",
  "amount": "5000.00",
  "charge": "150.00",
  "status": "success",
  "reference": "APqDvYw1okk2",
  "tx_ref": "twedar-a1b2c3d4-1714733000000",
  "payment_method": "telebirr",
  "created_at": "2026-05-03T08:00:00.000000Z",
  "updated_at": "2026-05-03T08:01:00.000000Z",
  "type": "API"
}
```

**Response (200):**

```json
{ "received": true }
```

**Behavior:**

- Validates `x-chapa-signature` or `chapa-signature` against HMAC SHA256
- Only processes `charge.success` events
- Idempotent: skips if payment is already in `success` status
- Updates payment record and transitions booking to `deposit_paid`
- Sends real-time notification to the vendor
- Always returns 200 to prevent Chapa retries

---

## GET /booking/:bookingId

Retrieve the most recent payment record for a booking.

**Auth:** Required (couple or vendor who owns the booking)

**Path Parameters:**

| Parameter  | Type   | Description       |
|------------|--------|-------------------|
| bookingId  | string | UUID of the booking |

**Response (200):**

```json
{
  "payment": {
    "id": "f1e2d3c4-5678-90ab-cdef-1234567890ab",
    "bookingId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "coupleId": "user-id",
    "vendorId": "vendor-user-id",
    "txRef": "twedar-a1b2c3d4-1714733000000",
    "chapaRef": "APqDvYw1okk2",
    "amount": 5000,
    "currency": "ETB",
    "status": "success",
    "paymentMethod": "telebirr",
    "createdAt": "2026-05-03T08:00:00.000Z",
    "updatedAt": "2026-05-03T08:01:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code       | Condition                                    |
|--------|------------|----------------------------------------------|
| 403    | FORBIDDEN  | User is neither the couple nor the vendor    |
| 404    | NOT_FOUND  | No payment found for this booking            |

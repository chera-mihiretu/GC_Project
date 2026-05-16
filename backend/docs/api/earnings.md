# Earnings & Withdrawals API

Base path: `/api/v1/earnings`

All endpoints require authentication and vendor context (`resolveVendorContext` middleware).

---

## GET /summary

Returns the vendor's earnings summary including total earned, withdrawn, and available balance.

**Auth:** Required (vendor)

**Response (200):**

```json
{
  "totalEarned": 75000,
  "totalWithdrawn": 25000,
  "availableBalance": 50000,
  "currency": "ETB",
  "paymentCount": 5
}
```

---

## GET /payments

Returns the vendor's successful payment history (paginated).

**Auth:** Required (vendor)

**Query Params:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page  | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |

**Response (200):**

```json
{
  "payments": [
    {
      "id": "uuid",
      "bookingId": "uuid",
      "amount": 15000,
      "currency": "ETB",
      "status": "success",
      "paymentMethod": "telebirr",
      "createdAt": "2026-05-15T10:00:00Z",
      "serviceCategory": "photography",
      "coupleName": "John Doe"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

## GET /withdrawals

Returns the vendor's withdrawal history (paginated).

**Auth:** Required (vendor)

**Query Params:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page  | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |

**Response (200):**

```json
{
  "withdrawals": [
    {
      "id": "uuid",
      "vendorId": "user-id",
      "amount": 25000,
      "currency": "ETB",
      "bankCode": "656",
      "bankName": "CBE",
      "accountNumber": "1000123456789",
      "accountName": "Abebe Kebede",
      "reference": "tw-wd-abc12345-1715770000000",
      "status": "completed",
      "failureReason": null,
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:05Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## POST /withdraw

Request a withdrawal to a bank account via Chapa Transfer API.

**Auth:** Required (vendor owner only)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | Yes | Amount to withdraw (must be > 0 and <= available balance) |
| bankCode | string | Yes | Bank code from `/banks` endpoint |
| bankName | string | No | Human-readable bank name |
| accountNumber | string | Yes | Recipient bank account number |
| accountName | string | Yes | Recipient account holder name |

**Example Request:**

```json
{
  "amount": 25000,
  "bankCode": "656",
  "bankName": "Commercial Bank of Ethiopia",
  "accountNumber": "1000123456789",
  "accountName": "Abebe Kebede"
}
```

**Response (201):**

```json
{
  "withdrawal": {
    "id": "uuid",
    "vendorId": "user-id",
    "amount": 25000,
    "currency": "ETB",
    "bankCode": "656",
    "bankName": "Commercial Bank of Ethiopia",
    "accountNumber": "1000123456789",
    "accountName": "Abebe Kebede",
    "reference": "tw-wd-abc12345-1715770000000",
    "status": "completed",
    "failureReason": null,
    "createdAt": "2026-05-15T10:00:00Z",
    "updatedAt": "2026-05-15T10:00:05Z"
  }
}
```

**Errors:**

- **400** — Amount invalid, missing fields, or insufficient balance
- **409** — Already have a pending withdrawal

---

## GET /banks

Returns the list of supported banks from Chapa.

**Auth:** Required (vendor)

**Response (200):**

```json
{
  "banks": [
    {
      "id": "656",
      "name": "Commercial Bank of Ethiopia",
      "country_id": 1,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

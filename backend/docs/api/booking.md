# Booking API

## POST /api/v1/bookings

### Description

Creates a new booking request from a couple to a verified vendor. The couple selects a vendor profile, specifies the event date and service category, and optionally includes a message. A real-time notification is sent to the vendor upon successful creation.

### Authentication

Requires an authenticated session with role `couple` or `user`.

### Request

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |
| Cookie | Session cookie (automatic) | Yes |

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| vendorProfileId | string | Yes | UUID of the vendor profile to book |
| serviceCategory | string | Yes | Service category (e.g., "photography", "catering") |
| eventDate | string (YYYY-MM-DD) | Yes | Date of the event (must be a future date) |
| message | string | No | Optional message to the vendor |

### Response

**201 Created** — Booking successfully created.

```json
{
  "booking": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "coupleId": "user-couple-id",
    "vendorId": "user-vendor-id",
    "vendorProfileId": "vp-profile-id",
    "serviceCategory": "photography",
    "eventDate": "2027-06-15",
    "message": "We love your portfolio!",
    "status": "pending",
    "declineReason": null,
    "createdAt": "2026-05-01T19:30:00.000Z",
    "updatedAt": "2026-05-01T19:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request** — Missing required fields or invalid event date.

```json
{
  "error": {
    "message": "vendorProfileId, serviceCategory, and eventDate are required"
  }
}
```

```json
{
  "error": {
    "message": "eventDate must be a valid future date"
  }
}
```

```json
{
  "error": {
    "message": "Vendor is not currently accepting bookings"
  }
}
```

**401 Unauthorized** — No active session.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

**403 Forbidden** — User role is not `couple` or `user`.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**404 Not Found** — Vendor profile does not exist.

```json
{
  "error": {
    "message": "Vendor profile not found"
  }
}
```

**409 Conflict** — Duplicate pending/accepted booking for the same couple, vendor, and date.

```json
{
  "error": {
    "message": "You already have a pending or accepted booking with this vendor for the same date"
  }
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -b "session=<session-cookie>" \
  -d '{
    "vendorProfileId": "vp-456-uuid",
    "serviceCategory": "photography",
    "eventDate": "2027-06-15",
    "message": "We would love to book you for our wedding!"
  }'
```

### Example Response

```json
{
  "booking": {
    "id": "bk-789-uuid",
    "coupleId": "couple-123",
    "vendorId": "vendor-user-456",
    "vendorProfileId": "vp-456-uuid",
    "serviceCategory": "photography",
    "eventDate": "2027-06-15",
    "message": "We would love to book you for our wedding!",
    "status": "pending",
    "declineReason": null,
    "createdAt": "2026-05-01T19:34:00.000Z",
    "updatedAt": "2026-05-01T19:34:00.000Z"
  }
}
```

### Booking Status Flow

```
pending → accepted → deposit_paid → completed
   ↓         ↓            ↓
cancelled  cancelled   cancelled
   
pending → declined (terminal)
```

### Notes

- The `vendorId` field is auto-populated from the vendor profile's `userId`.
- A notification of type `booking_request` is sent to the vendor in real-time via Socket.IO.
- Duplicate detection: a couple cannot have two active bookings (pending or accepted) with the same vendor for the same event date.

# Booking API

## POST /api/v1/bookings

### Description

Creates a new booking request from a couple to a verified vendor. The couple selects a vendor profile, specifies the event date and service category, and optionally includes a message. A real-time notification is sent to the vendor upon successful creation.

### Authentication

Requires an authenticated session with role `couple`.

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
    "code": "BAD_REQUEST",
    "message": "Missing required fields: serviceCategory"
  }
}
```

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "eventDate must be a valid future date"
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

**403 Forbidden** — User role is not `couple`.

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
    "code": "BAD_REQUEST",
    "message": "Vendor profile not found"
  }
}
```

**400 Bad Request** — Vendor has not marked this date as available (BK-06).

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Vendor is not available on the selected date"
  }
}
```

**409 Conflict** — The vendor already has a confirmed (accepted/deposit_paid) booking on this date (BK-07).

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "This vendor is already booked on the selected date"
  }
}
```

**409 Conflict** — Duplicate pending/accepted booking for the same couple, vendor, and date.

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "You already have a pending or accepted booking with this vendor for the same date"
  }
}
```

---

## GET /api/v1/bookings

### Description

Lists bookings for the authenticated user. Couples see their own bookings; vendors see bookings made to them.

### Authentication

Requires an authenticated session (any role with bookings).

### Request

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | Filter by status: `pending`, `accepted`, `declined`, `deposit_paid`, `completed`, `cancelled` |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |

### Response

**200 OK**

```json
{
  "data": [
    {
      "id": "bk-789-uuid",
      "coupleId": "couple-123",
      "vendorId": "vendor-user-456",
      "vendorProfileId": "vp-456-uuid",
      "serviceCategory": "photography",
      "eventDate": "2027-06-15",
      "message": "We would love to book you!",
      "status": "pending",
      "declineReason": null,
      "createdAt": "2026-05-01T19:34:00.000Z",
      "updatedAt": "2026-05-01T19:34:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### Example Request

```bash
curl http://localhost:5000/api/v1/bookings?status=pending&page=1&limit=10 \
  -b "session=<session-cookie>"
```

---

## GET /api/v1/bookings/:id

### Description

Gets a single booking by ID. The authenticated user must be either the couple or vendor involved.

### Authentication

Requires an authenticated session. User must be a participant of the booking.

### Request

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Booking ID |

### Response

**200 OK**

```json
{
  "booking": {
    "id": "bk-789-uuid",
    "coupleId": "couple-123",
    "vendorId": "vendor-user-456",
    "vendorProfileId": "vp-456-uuid",
    "serviceCategory": "photography",
    "eventDate": "2027-06-15",
    "message": "We would love to book you!",
    "status": "pending",
    "declineReason": null,
    "createdAt": "2026-05-01T19:34:00.000Z",
    "updatedAt": "2026-05-01T19:34:00.000Z"
  }
}
```

### Error Responses

**403 Forbidden** — User is not a participant.

**404 Not Found** — Booking does not exist.

---

## PATCH /api/v1/bookings/:id/status

### Description

Updates the status of a booking. Vendors can accept, decline, or complete. Couples can cancel.

### Authentication

Requires an authenticated session. Access is scoped to the booking's participants.

### Request

**Path Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Booking ID |

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status value |
| declineReason | string | Conditional | Required when status is `declined` |

**Allowed transitions by role:**

| Current Status | Vendor can set | Couple can set |
|----------------|----------------|----------------|
| pending | accepted, declined | cancelled |
| accepted | completed | cancelled |
| deposit_paid | completed | cancelled |

### Response

**200 OK**

```json
{
  "booking": {
    "id": "bk-789-uuid",
    "coupleId": "couple-123",
    "vendorId": "vendor-user-456",
    "vendorProfileId": "vp-456-uuid",
    "serviceCategory": "photography",
    "eventDate": "2027-06-15",
    "message": "We would love to book you!",
    "status": "accepted",
    "declineReason": null,
    "createdAt": "2026-05-01T19:34:00.000Z",
    "updatedAt": "2026-05-02T10:00:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request** — Missing status or decline reason.

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "A reason is required when declining a booking"
  }
}
```

**403 Forbidden** — User not authorized for this transition.

**404 Not Found** — Booking does not exist.

**409 Conflict** — Vendor already has a confirmed booking on this date (BK-07). Only applies when accepting.

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "You already have a confirmed booking on this date"
  }
}
```

### Example Request (Vendor accepts)

```bash
curl -X PATCH http://localhost:5000/api/v1/bookings/bk-789-uuid/status \
  -H "Content-Type: application/json" \
  -b "session=<session-cookie>" \
  -d '{"status": "accepted"}'
```

### Example Request (Vendor declines)

```bash
curl -X PATCH http://localhost:5000/api/v1/bookings/bk-789-uuid/status \
  -H "Content-Type: application/json" \
  -b "session=<session-cookie>" \
  -d '{"status": "declined", "declineReason": "Fully booked on that date"}'
```

---

## Booking Status Flow

```
pending → accepted → deposit_paid → completed
   ↓         ↓            ↓
cancelled  cancelled   cancelled
   
pending → declined (terminal)
```

### Notes

- The `vendorId` field is auto-populated from the vendor profile's `userId`.
- A notification of type `booking_request` is sent to the vendor on creation.
- A notification of type `booking_status_update` is sent to the other party on status change.
- Duplicate detection: a couple cannot have two active bookings (pending or accepted) with the same vendor for the same event date.
- Date conflict detection (BK-07): a vendor cannot have two confirmed bookings (accepted or deposit_paid) on the same date. Checked at both creation time (blocks new requests for confirmed dates) and acceptance time (prevents race conditions).

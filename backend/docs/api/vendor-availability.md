# Vendor Availability API

Vendors explicitly mark date ranges when they are available for bookings. Dates without an availability range are treated as unavailable. Couples can only book on dates the vendor has opened.

---

## Authenticated Vendor Endpoints

All endpoints below require an authenticated session with the `vendor` role.

### GET `/api/v1/vendor/availability`

**Purpose:** List all availability ranges for the logged-in vendor.

**Headers:**

| Header   | Value               |
|----------|---------------------|
| `Cookie` | Session cookie      |

**Response — 200 OK:**

```json
{
  "availability": [
    {
      "id": "uuid-1",
      "vendorProfileId": "vp_123",
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "note": "Wedding season",
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Code         | Description                  |
|--------|--------------|------------------------------|
| 404    | NOT_FOUND    | Vendor profile not found     |
| 500    | SERVER_ERROR | Internal server error        |

---

### POST `/api/v1/vendor/availability`

**Purpose:** Add a new availability range for the logged-in vendor.

**Headers:**

| Header         | Value               |
|----------------|---------------------|
| `Cookie`       | Session cookie      |
| `Content-Type` | `application/json`  |

**Request Body:**

| Field       | Type   | Required | Description                                  |
|-------------|--------|----------|----------------------------------------------|
| `startDate` | string | Yes      | Start date in `YYYY-MM-DD` format            |
| `endDate`   | string | Yes      | End date in `YYYY-MM-DD` format (>= start)   |
| `note`      | string | No       | Optional label/note for this range            |

**Example Request:**

```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-15",
  "note": "Open for events"
}
```

**Response — 201 Created:**

```json
{
  "availability": {
    "id": "uuid-2",
    "vendorProfileId": "vp_123",
    "startDate": "2026-07-01",
    "endDate": "2026-07-15",
    "note": "Open for events",
    "createdAt": "2026-05-02T08:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code        | Description                        |
|--------|-------------|------------------------------------|
| 400    | BAD_REQUEST | Missing or invalid dates           |
| 400    | BAD_REQUEST | endDate is before startDate        |
| 400    | BAD_REQUEST | Cannot set availability for past   |
| 404    | NOT_FOUND   | Vendor profile not found           |

---

### DELETE `/api/v1/vendor/availability/:id`

**Purpose:** Remove an availability range by ID. Only the owning vendor can delete their own ranges.

**Headers:**

| Header   | Value          |
|----------|----------------|
| `Cookie` | Session cookie |

**Path Parameters:**

| Param | Type   | Description                     |
|-------|--------|---------------------------------|
| `id`  | string | UUID of the availability range  |

**Response — 204 No Content:**

Empty body on success.

**Error Responses:**

| Status | Code      | Description                          |
|--------|-----------|--------------------------------------|
| 404    | NOT_FOUND | Range not found or not owned by user |

---

## Public Endpoint

No authentication required. Used by couples when selecting a booking date.

### GET `/api/v1/vendors/:vendorId/availability`

**Purpose:** Get a vendor's available date ranges for a specific month.

**Path Parameters:**

| Param      | Type   | Description              |
|------------|--------|--------------------------|
| `vendorId` | string | Vendor profile ID        |

**Query Parameters:**

| Param   | Type   | Required | Description                           |
|---------|--------|----------|---------------------------------------|
| `month` | string | No       | Month in `YYYY-MM` format. Defaults to current month if omitted. |

**Example Request:**

```
GET /api/v1/vendors/vp_123/availability?month=2026-06
```

**Response — 200 OK:**

```json
{
  "availability": [
    {
      "id": "uuid-1",
      "vendorProfileId": "vp_123",
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "note": "Wedding season",
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

Only ranges that overlap with the requested month are returned.

**Error Responses:**

| Status | Code         | Description            |
|--------|--------------|------------------------|
| 404    | NOT_FOUND    | Vendor not found       |
| 500    | SERVER_ERROR | Internal server error  |

---

## Booking Validation

When a couple submits a booking request (`POST /api/v1/bookings`), the backend checks:

1. Whether the requested `eventDate` falls within any of the vendor's availability ranges.
2. If not, the request is rejected with:

| Status | Code        | Message                                        |
|--------|-------------|------------------------------------------------|
| 400    | BAD_REQUEST | Vendor is not available on the selected date   |

This check runs before the duplicate-booking check.

---

## Data Model

**Table: `vendor_availability`**

| Column              | Type        | Constraints                          |
|---------------------|-------------|--------------------------------------|
| `id`                | UUID        | Primary key, auto-generated          |
| `vendor_profile_id` | TEXT        | Foreign key → `vendor_profiles(id)`  |
| `start_date`        | DATE        | NOT NULL                             |
| `end_date`          | DATE        | NOT NULL, CHECK (>= start_date)     |
| `note`              | TEXT        | Nullable                             |
| `created_at`        | TIMESTAMPTZ | Default: NOW()                       |

**Index:** `idx_vendor_availability_profile` on `(vendor_profile_id, start_date, end_date)`

Overlapping ranges are permitted. The `isDateAvailable` check uses `ANY` overlap: a date is available if it falls within at least one range.

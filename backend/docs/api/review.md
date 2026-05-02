# Review API

## POST /api/v1/reviews

**Description:** Submit a rating and review for a completed booking. Only the couple who owns the booking can leave a review. One review per booking is allowed.

**Auth:** Required (session cookie). Role: `couple`.

### Request

**Headers:**
| Header | Value |
|--------|-------|
| Content-Type | application/json |
| Cookie | (session cookie) |

**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bookingId | string (UUID) | Yes | ID of the completed booking |
| rating | integer | Yes | Rating from 1 to 5 |
| comment | string | No | Optional text review (max 1000 chars) |

### Response

**201 Created:**
```json
{
  "review": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "bookingId": "b1c2d3e4-f5a6-7890-bcde-fa1234567890",
    "coupleId": "user_abc123",
    "vendorId": "user_def456",
    "vendorProfileId": "vp_ghi789",
    "rating": 5,
    "comment": "Amazing service! Highly recommend.",
    "isApproved": true,
    "createdAt": "2027-06-20T14:30:00.000Z",
    "updatedAt": "2027-06-20T14:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request** — Invalid rating or booking not completed:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Rating must be an integer between 1 and 5"
  }
}
```

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "You can only review completed bookings"
  }
}
```

**401 Unauthorized** — No active session:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

**403 Forbidden** — User does not own the booking or wrong role:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not own this booking"
  }
}
```

**404 Not Found** — Booking does not exist:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Booking not found"
  }
}
```

**409 Conflict** — Review already submitted for this booking:
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "You have already reviewed this booking"
  }
}
```

---

## GET /api/v1/reviews/booking/:bookingId

**Description:** Retrieve the review for a specific booking. Returns 404 if no review exists yet.

**Auth:** Required (session cookie). Any authenticated role.

### Request

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| bookingId | string (UUID) | ID of the booking |

### Response

**200 OK:**
```json
{
  "review": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "bookingId": "b1c2d3e4-f5a6-7890-bcde-fa1234567890",
    "coupleId": "user_abc123",
    "vendorId": "user_def456",
    "vendorProfileId": "vp_ghi789",
    "rating": 5,
    "comment": "Amazing service! Highly recommend.",
    "isApproved": true,
    "createdAt": "2027-06-20T14:30:00.000Z",
    "updatedAt": "2027-06-20T14:30:00.000Z"
  }
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

**404 Not Found:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No review found for this booking"
  }
}
```

---

## Side Effects

When a review is successfully created:
1. The vendor's aggregate `rating` and `review_count` on `vendor_profiles` are recalculated.
2. A real-time notification of type `new_review` is sent to the vendor.

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

## POST /api/v1/reviews/:reviewId/photos

**Description:** Upload photos for an existing review. Max 5 photos per review, max 5MB each, images only.

**Auth:** Required (session cookie). Role: `couple` (must own the review).

### Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| photos | File[] | Yes | Image files (jpeg, png, webp). Max 5 total per review. |

### Response

**201 Created:**
```json
{
  "photos": [
    { "id": "uuid", "reviewId": "uuid", "url": "https://...", "createdAt": "..." }
  ]
}
```

---

## GET /api/v1/reviews/:reviewId/photos

**Description:** Get all photos for a review.

**Auth:** None required (public).

### Response

**200 OK:**
```json
{
  "photos": [
    { "id": "uuid", "reviewId": "uuid", "url": "https://...", "createdAt": "..." }
  ]
}
```

---

## GET /api/v1/vendors/:vendorId/reviews

**Description:** List approved reviews for a vendor profile (public endpoint).

**Auth:** None required.

### Request

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Results per page (max 100) |

### Response

**200 OK:**
```json
{
  "data": [
    {
      "id": "uuid",
      "bookingId": "uuid",
      "coupleId": "user_id",
      "vendorId": "user_id",
      "vendorProfileId": "vp_id",
      "rating": 5,
      "comment": "Great service!",
      "isApproved": true,
      "authorName": "Jane Doe",
      "createdAt": "2027-06-20T14:30:00.000Z",
      "updatedAt": "2027-06-20T14:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

## GET /api/v1/admin/reviews

**Description:** List all reviews for admin moderation. Filterable by approval status.

**Auth:** Required (session cookie). Role: `admin`.

### Request

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| isApproved | boolean | (all) | Filter by approval status |
| page | integer | 1 | Page number |
| limit | integer | 20 | Results per page |

### Response

**200 OK:** Same paginated format as vendor reviews, with additional `vendorName` field.

---

## PATCH /api/v1/admin/reviews/:id

**Description:** Approve or reject a review. Recalculates vendor aggregate rating.

**Auth:** Required (session cookie). Role: `admin`.

### Request

**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | `"approve"` or `"reject"` |

### Response

**200 OK:**
```json
{
  "review": { ... }
}
```

---

## Side Effects

When a review is successfully created:
1. The vendor's aggregate `rating` and `review_count` on `vendor_profiles` are recalculated.
2. A real-time notification of type `new_review` is sent to the vendor.

When a review is moderated (approved/rejected):
1. The vendor's aggregate `rating` and `review_count` are recalculated based on approved reviews only.

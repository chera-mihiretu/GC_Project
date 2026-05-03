# Vendor Portfolio API

Base path: `/api/v1/vendor/portfolio`

All endpoints require authentication (session cookie) and the `vendor` role. Write operations (POST, PATCH, DELETE) are restricted to the organization **owner**; staff members have **read-only** access.

---

## GET /

Retrieve all portfolio items for the current vendor, grouped by service category.

**Response (200):**

```json
{
  "portfolio": {
    "photography": [
      {
        "id": "uuid",
        "vendorProfileId": "profile-id",
        "category": "photography",
        "mediaUrl": "https://...supabase.co/.../photo.jpg",
        "mediaType": "image",
        "caption": "Wedding reception at Hilton",
        "sortOrder": 0,
        "createdAt": "2026-05-01T10:00:00.000Z"
      }
    ],
    "videography": []
  }
}
```

---

## POST /upload-url

Get a presigned URL for direct upload to Supabase Storage. The client uploads directly to this URL with progress tracking.

**Request Body:**

| Field       | Type   | Required | Description                                         |
|-------------|--------|----------|-----------------------------------------------------|
| fileName    | string | Yes      | Original file name (used for extension extraction)   |
| contentType | string | Yes      | MIME type (image/jpeg, image/png, image/webp, video/mp4, video/quicktime) |

**Example Request:**

```json
{
  "fileName": "wedding-photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response (200):**

```json
{
  "signedUrl": "https://...supabase.co/storage/v1/upload/sign/vendor-portfolio/...",
  "publicUrl": "https://...supabase.co/storage/v1/object/public/vendor-portfolio/...",
  "path": "profile-id/uuid.jpg"
}
```

**Upload flow:**
1. Client receives the `signedUrl`
2. Client uploads the file via `PUT` to `signedUrl` with `Content-Type` header
3. Client uses `XMLHttpRequest` for progress tracking
4. After upload completes, client calls `POST /` with the `publicUrl`

---

## POST /

Create a new portfolio item after the media file has been uploaded to storage.

**Request Body:**

| Field     | Type   | Required | Description                               |
|-----------|--------|----------|-------------------------------------------|
| category  | string | Yes      | Service category (e.g. "photography")     |
| mediaUrl  | string | Yes      | Public URL of the uploaded file            |
| mediaType | string | Yes      | "image" or "video"                        |
| caption   | string | No       | Optional caption/description               |

**Example Request:**

```json
{
  "category": "photography",
  "mediaUrl": "https://...supabase.co/storage/v1/object/public/vendor-portfolio/abc/123.jpg",
  "mediaType": "image",
  "caption": "Outdoor ceremony at Lake Langano"
}
```

**Response (201):**

```json
{
  "item": {
    "id": "uuid",
    "vendorProfileId": "profile-id",
    "category": "photography",
    "mediaUrl": "https://...",
    "mediaType": "image",
    "caption": "Outdoor ceremony at Lake Langano",
    "sortOrder": 0,
    "createdAt": "2026-05-01T10:00:00.000Z"
  }
}
```

---

## PATCH /:id

Update caption or sort order of a portfolio item.

**Request Body:**

| Field     | Type           | Required | Description                 |
|-----------|----------------|----------|-----------------------------|
| caption   | string or null | No       | Updated caption             |
| sortOrder | number         | No       | New sort position           |

**Example Request:**

```json
{
  "caption": "Updated description"
}
```

**Response (200):**

```json
{
  "item": { ... }
}
```

**Response (404):**

```json
{ "error": { "message": "Portfolio item not found" } }
```

---

## DELETE /:id

Delete a portfolio item and its associated media file from storage.

**Response (200):**

```json
{ "success": true }
```

**Response (404):**

```json
{ "error": { "message": "Portfolio item not found" } }
```

---

## Storage Bucket

- **Bucket name:** `vendor-portfolio`
- **Visibility:** Public
- **Max file size:** 10 MB
- **Allowed types:** `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`
